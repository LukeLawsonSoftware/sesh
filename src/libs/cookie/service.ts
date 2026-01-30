import { SESSION_COOKIE_NAME } from "../../constants";

export function getSessionIdFromRequest(request: Request): string | null {
  const cookies = parseCookieHeader(request.headers.get("Cookie"));
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    let [name, ...valueParts] = part.trim().split("=");
    if (!name) return acc;
    acc[name] = decodeURIComponent(valueParts.join("="));
    return acc;
  }, {});
}

export function buildSessionCookie(
  sessionId: string,
  request: Request,
): string {
  const url = new URL(request.url);
  let parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (url.protocol === "https:") {
    parts.push("Secure");
  }

  return parts.join("; ");
}
