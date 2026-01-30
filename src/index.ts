import { handleRequest } from "./http";
import { Session } from "./dos/index";
import type { Env } from "./env";

export { Session };

// Worker
export default {
  fetch: handleRequest,
} satisfies ExportedHandler<Env>;
