import type { Env } from "../../env";
import type { Session } from "../../dos/index";
import { ISessionState } from "./types/state";

export async function getSessionState(
  env: Env,
  sessionId: string,
): Promise<ISessionState> {
  const { stub } = getSessionStub(env, sessionId);
  const doResponse = await stub.fetch("https://session/state", {
    method: "GET",
  });
  const payload = (await doResponse.json()) as ISessionState;
  return payload;
}

function getSessionStub(
  env: Env,
  sessionId: string,
): { stub: DurableObjectStub<Session> } {
  const id = env.SESSIONS.idFromName(sessionId);
  const stub = env.SESSIONS.get(id);
  return { stub };
}
