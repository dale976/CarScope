import { randomUUID } from 'node:crypto';
import type { DataMode, VehiclePreview } from '../shared/preview';
import type { BuyingReport } from '../shared/report';
import { AppError } from './errors';

type MockSession = { mode: 'mock'; registration: string; report: BuyingReport };
type OfficialSession = { mode: 'official'; registration: string; preview: VehiclePreview };
export type NewPreviewSession = MockSession | OfficialSession;
export type PreviewSession = NewPreviewSession & {
  createdAt: number;
  inflight?: Promise<BuyingReport>;
  result?: BuyingReport;
  failed?: { error: unknown };
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
    if (now() - session.createdAt >= ttlMs) {
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
      for (const [id, entry] of sessions) if (now() - entry.createdAt >= ttlMs) sessions.delete(id);
      const id = randomUUID();
      sessions.set(id, {
        ...session,
        ...(session.mode === 'official' ? { preview: { ...session.preview, previewId: id } } : {}),
        createdAt: now(),
      } as PreviewSession);
      return id;
    },
    async complete(id, mode, registration, work) {
      const session = read(id, mode, registration);
      if (session.result) return session.result;
      if (session.failed) throw session.failed.error;
      if (session.inflight) return session.inflight;
      const pending = work(session).then(
        (report) => {
          if (session.mode === 'official') session.result = report;
          else sessions.delete(id);
          return report;
        },
        (error) => {
          session.inflight = undefined;
          if (session.mode === 'official') session.failed = { error };
          throw error;
        },
      );
      session.inflight = pending;
      return pending;
    },
  };
}
