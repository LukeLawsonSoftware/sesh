import { DurableObject } from "cloudflare:workers";

// Durable Object
export class Session extends DurableObject {
  async fetch(request: Request) {
    const url = new URL(request.url);

    let createdAt = await this.ctx.storage.get<string>("createdAt");
    if (!createdAt) {
      createdAt = new Date().toISOString();
      await this.ctx.storage.put("createdAt", createdAt);
      await this.ctx.storage.put("requests", 0);
    }

    if (url.pathname === "/state") {
      const createdAt = await this.ctx.storage.get<string>("createdAt");
      const requests = (await this.ctx.storage.get<number>("requests")) || 0;
      await this.ctx.storage.put("requests", requests + 1);
      return new Response(
        JSON.stringify({
          createdAt,
          requests: requests + 1,
        }),
        { headers: { "Content-Type": "application/json; charset=utf-8" } },
      );
    }

    return new Response("Not found", { status: 404 });
  }
}
