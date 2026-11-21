import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportView } from '../src/client/report/ReportView';
import { createReportApi } from '../src/server/api';
import { readConfig } from '../src/server/config';
import { createDvlaClient } from '../src/server/dvla/client';
import { createDvsaClient } from '../src/server/dvsa/client';
import { createOfficialPreview } from '../src/server/official-preview';
import { generateSandboxReport } from '../src/server/sandbox-report';

test('connected journey spans official clients, bound session, three VDG packages and report rendering', async () => {
  const calls: string[] = [];
  const fetcher = async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    calls.push(
      url.hostname === 'uk.api.vehicledataglobal.com'
        ? url.searchParams.get('packagename')!
        : url.hostname,
    );
    if (url.hostname === 'login.microsoftonline.com')
      return Response.json({ access_token: 'token', expires_in: 3600 });
    if (url.hostname === 'driver-vehicle-licensing.api.gov.uk')
      return Response.json({
        registrationNumber: 'YJ22ACU',
        make: 'LOTUS',
        taxStatus: 'Taxed',
        taxDueDate: '2027-06-01',
        motStatus: 'Valid',
        motExpiryDate: '2027-05-10',
        yearOfManufacture: 2022,
      });
    if (url.hostname === 'history.mot.api.gov.uk')
      return Response.json({
        registration: 'YJ22ACU',
        make: 'LOTUS',
        model: 'EXIGE',
        motTests: [
          {
            completedDate: '2026-04-24T12:00:00',
            testResult: 'PASSED',
            expiryDate: '2027-05-10',
            odometerValue: '8541',
            odometerUnit: 'MI',
            odometerResultType: 'READ',
            defects: [],
          },
        ],
      });
    if (
      url.hostname === 'uk.api.vehicledataglobal.com' &&
      url.searchParams.get('packagename') !== 'CarScopeFree'
    )
      return Response.json({
        Results:
          url.searchParams.get('packagename') === 'VDICheck'
            ? {
                FinanceDetails: { FinanceRecordList: [] },
                MiaftrDetails: { WriteOffRecordList: [] },
                PncDetails: { IsStolen: false },
              }
            : {},
      });
    throw new Error('Unexpected paid preview or destination');
  };
  const dvla = createDvlaClient({ environment: 'production', apiKey: 'private-dvla' }, { fetcher });
  const dvsa = createDvsaClient(
    {
      clientId: 'client',
      clientSecret: 'private-dvsa',
      apiKey: 'private-api',
      scope: 'https://tapi.dvsa.gov.uk/.default',
      tokenUrl:
        'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789abc/oauth2/v2.0/token',
    },
    { fetcher },
  );
  const api = createReportApi({
    config: readConfig({
      CARSCOPE_DATA_MODE: 'connected',
      VDG_SANDBOX_ENABLED: 'true',
      VDG_API_KEY: 'private-vdg',
    }),
    identifyOfficial: createOfficialPreview({
      dvla: dvla.lookup,
      dvsa: dvsa.lookup,
      testData: false,
    }),
    completeOfficial: (registration, preview) =>
      generateSandboxReport(registration, preview, { apiKey: 'private-vdg', fetcher }),
  });
  const post = (path: string, body: unknown) =>
    api(
      new Request(`http://localhost${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  const previewResponse = await post('/api/report-preview', { registration: 'yj22 acu' });
  expect(previewResponse.status).toBe(200);
  const preview = await previewResponse.json();
  expect(calls).toHaveLength(3);
  const input = { registration: 'YJ22ACU', previewId: preview.previewId };
  const reportResponse = await post('/api/report-generate', input);
  expect(reportResponse.status).toBe(200);
  const report = await reportResponse.json();
  expect(calls.slice(3).sort()).toEqual(['TyreDetails', 'VDICheck', 'ValuationDetails']);
  expect(report.vehicle.mileage).toBe(8541);
  expect(report.tax.status).toBe('taxed');
  const html = renderToStaticMarkup(<ReportView report={report} />);
  expect(html).toContain('VDG sandbox');
  expect(html).toContain('LOTUS EXIGE');
  expect(html).toContain('8,541');
  expect(html).toContain('Tax due 1 Jun 2027');
  expect(html).not.toContain('Current through');
  expect(JSON.stringify(report)).not.toContain('private-');
  expect((await post('/api/report-generate', input)).status).toBe(200);
  expect(calls).toHaveLength(6);
});
