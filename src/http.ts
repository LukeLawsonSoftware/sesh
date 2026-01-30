import type { Env } from "./env";
import {
  buildSessionCookie,
  getSessionIdFromRequest,
} from "./libs/cookie/index";
import { getSessionState } from "./libs/session/service";

export async function handleRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);

  // Handle session state retrieval
  if (url.pathname === "/session" && request.method === "GET") {
    const sessionId = getSessionIdFromRequest(request);
    const { createdAt, requests } = await getSessionState(env, sessionId);
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
    });
    if (!sessionId) {
      headers.set("Set-Cookie", buildSessionCookie(sessionId, request));
    }

    return new Response(
      JSON.stringify({
        sessionId,
        createdAt,
        requests,
      }),
      { headers },
    );
  }

  // Fallback to static assets
  return env.ASSETS.fetch(request);
}
