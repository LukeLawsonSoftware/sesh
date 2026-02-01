import type { Session as SessionDO } from "./dos/session/object";

export interface Env {
  SESSIONS: DurableObjectNamespace<SessionDO>;
  ASSETS: Fetcher;
}
