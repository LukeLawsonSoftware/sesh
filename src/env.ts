import type { Session as SessionDO } from "./dos/session";

export interface Env {
  SESSIONS: DurableObjectNamespace<SessionDO>;
  ASSETS: Fetcher;
}
