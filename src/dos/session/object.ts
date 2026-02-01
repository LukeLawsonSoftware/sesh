import { DurableObject } from "cloudflare:workers";
import { SessionStateKeys } from "./keys";
import {
  EEventProcessingStatus,
  IClientSentEvent,
  IStoredEvent,
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
      const eventData = (await request.json()) as IClientSentEvent;

      const { isClaimed, storedEvent } = await this.ctx.storage.transaction<{
        isClaimed: boolean;
        storedEvent: IStoredEvent;
      }>(async (tx) => {
        const seenKey = `${SessionStateKeys.IDEMPOTENCY_BASE}${eventData.idempotencyKey}`;
        const previouslySeenEventId = await tx.get<string>(seenKey);

        // Event already received
        if (previouslySeenEventId) {
          const previouslySeenEvent = await tx.get<IStoredEvent>(
            `${SessionStateKeys.EVENT_BASE}${previouslySeenEventId}`,
          );
          if (
            previouslySeenEvent?.status === EEventProcessingStatus.COMPLETED
          ) {
            return { isClaimed: true, storedEvent: previouslySeenEvent };
          }
          if (
            previouslySeenEvent?.status === EEventProcessingStatus.PROCESSING
          ) {
            return {
              isClaimed: true,
              storedEvent: previouslySeenEvent,
            };
          }
        }

        // New event
        const newEventId = crypto.randomUUID();
        const newEvent: IStoredEvent = {
          sentAt: eventData.sentAt,
          idempotencyKey: eventData.idempotencyKey,
          eventId: newEventId,
          receivedAt: new Date().toISOString(),
          status: EEventProcessingStatus.PROCESSING,
        };
        await tx.put(seenKey, newEventId);
        await tx.put(`${SessionStateKeys.EVENT_BASE}${newEventId}`, newEvent);
        return { isClaimed: false, storedEvent: newEvent };
      });

      const eventKey = `${SessionStateKeys.EVENT_BASE}${storedEvent.eventId}`;

      if (isClaimed) {
        if (
          storedEvent?.status === EEventProcessingStatus.COMPLETED ||
          storedEvent?.status === EEventProcessingStatus.PROCESSING
        ) {
          return buildResponse(storedEvent);
        }
      }

      const processedEvent = await processEvent(storedEvent);
      await this.ctx.storage.transaction(async (tx) => {
        const current = await tx.get<IStoredEvent>(eventKey);
        if (!current || current.status === EEventProcessingStatus.COMPLETED)
          return;
        await tx.put(eventKey, processedEvent);
      });

      return buildResponse(processedEvent);
    }

    return new Response("Not found", { status: 404 });
  }
}
