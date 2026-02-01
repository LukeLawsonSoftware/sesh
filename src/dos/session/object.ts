import { DurableObject } from "cloudflare:workers";
import { SessionStateKeys } from "./keys";
import {
  EEventProcessingStatus,
  ISentEvent,
  IReceivedEvent,
  IProcessedEvent,
} from "../../libs/event/types/event";
import { processEvent } from "../../libs/event/service";
import { buildResponse } from "./response";

// Durable Object
export class Session extends DurableObject {
  private createdAt: string | null = null;

  async fetch(request: Request) {
    const url = new URL(request.url);

    // Init.
    if (!this.createdAt) {
      const { createdAt } = await this.ctx.storage.transaction(async (tx) => {
        let createdAt = await tx.get<string>(SessionStateKeys.CREATED_AT);
        if (!createdAt) {
          createdAt = new Date().toISOString();
          await tx.put({
            [SessionStateKeys.CREATED_AT]: createdAt,
            [SessionStateKeys.REQUESTS]: 0,
          });
        }
        return { createdAt };
      });
      this.createdAt = createdAt;
    }

    // Receive events
    if (url.pathname === "/event") {
      const eventData = (await request.json()) as ISentEvent;

      const { isClaimed, received } = await this.ctx.storage.transaction<{
        isClaimed: boolean;
        received: IReceivedEvent;
      }>(async (tx) => {
        const seenKey = `${SessionStateKeys.IDEMPOTENCY_BASE}${eventData.idempotencyKey}`;
        const previouslySeenEventId = await tx.get<string>(seenKey);

        // Event already received
        if (previouslySeenEventId) {
          const previouslySeenEvent = await tx.get<IReceivedEvent>(
            `${SessionStateKeys.EVENT_BASE}${previouslySeenEventId}`,
          );
          if (
            previouslySeenEvent?.status === EEventProcessingStatus.COMPLETED
          ) {
            return { isClaimed: true, received: previouslySeenEvent };
          }
          if (
            previouslySeenEvent?.status === EEventProcessingStatus.PROCESSING
          ) {
            return {
              isClaimed: true,
              received: previouslySeenEvent,
            };
          }
        }

        // New event
        const newEventId = crypto.randomUUID();
        const newEvent: IReceivedEvent = {
          sentAt: eventData.sentAt,
          idempotencyKey: eventData.idempotencyKey,
          eventId: newEventId,
          receivedAt: new Date().toISOString(),
          status: EEventProcessingStatus.PROCESSING,
        };
        await tx.put(seenKey, newEventId);
        await tx.put(`${SessionStateKeys.EVENT_BASE}${newEventId}`, newEvent);
        return { isClaimed: false, received: newEvent };
      });

      if (isClaimed) {
        if (
          received?.status === EEventProcessingStatus.COMPLETED ||
          received?.status === EEventProcessingStatus.PROCESSING
        ) {
          return buildResponse(received);
        }
      }

      const eventKey = `${SessionStateKeys.EVENT_BASE}${received.eventId}`;
      const processedEvent = await processEvent(received, this.ctx);
      await this.ctx.storage.transaction(async (tx) => {
        await tx.put(eventKey, processedEvent);
      });

      return buildResponse(processedEvent);
    }

    return new Response("Not found", { status: 404 });
  }
}
