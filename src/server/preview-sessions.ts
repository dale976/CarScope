import { randomUUID } from 'node:crypto';
import type { BuyingReport } from '../shared/report';
import type { DataMode } from '../shared/preview';
import { AppError } from './errors';
import type { ProviderVehicleDetails } from './provider';

type MockSession = { mode: 'mock'; registration: string; report: BuyingReport };
type LiveSession = {
  mode: 'live';
  registration: string;
  details: ProviderVehicleDetails;
  previewData: ProviderVehicleDetails;
};
export type NewPreviewSession = MockSession | LiveSession;
export type PreviewSession = NewPreviewSession & {
  createdAt: number;
  inflight?: Promise<BuyingReport>;
};

export interface PreviewSessionStore {
  create(session: NewPreviewSession): Promise<string>;
  complete(
    id: string,
    mode: DataMode,
    registration: string,
    work: (session: PreviewSession) => Promise<BuyingReport>,
  ): Promise<BuyingReport>;
}

export function createMemoryPreviewSessionStore(
  options: { now?: () => number; ttlMs?: number } = {},
): PreviewSessionStore {
  const now = options.now ?? Date.now;
  const ttlMs = options.ttlMs ?? 1_800_000;
  const sessions = new Map<string, PreviewSession>();

  const read = (id: string, mode: DataMode, registration: string) => {
    const session = sessions.get(id);
    if (!session)
      throw new AppError(
        'PREVIEW_EXPIRED',
        410,
        'Preview expired or unavailable. Identify the vehicle again.',
      );
    if (now() - session.createdAt > ttlMs) {
      sessions.delete(id);
      throw new AppError('PREVIEW_EXPIRED', 410, 'Preview expired. Identify the vehicle again.');
    }
    if (session.mode !== mode || session.registration !== registration)
      throw new AppError(
        'PREVIEW_MISMATCH',
        409,
        'Preview does not match this registration or data mode.',
      );
    return session;
  };

  return {
    async create(session) {
      const id = randomUUID();
      sessions.set(id, { ...session, createdAt: now() });
      return id;
    },
    async complete(id, mode, registration, work) {
      const session = read(id, mode, registration);
      if (session.inflight) return session.inflight;
      const pending = work(session).then(
        (report) => {
          sessions.delete(id);
          return report;
        },
        (error) => {
          session.inflight = undefined;
          throw error;
        },
      );
      session.inflight = pending;
      return pending;
    },
  };
}
