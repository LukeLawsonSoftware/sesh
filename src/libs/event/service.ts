import { SessionStateKeys } from "../../dos/session/keys";
import {
  EEventProcessingStatus,
  IProcessedEvent,
  IReceivedEvent,
} from "./types/event";

export async function processEvent(
  event: IReceivedEvent,
  context: DurableObjectState,
): Promise<IProcessedEvent> {
  try {
    return {
      ...event,
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString(),
      status: EEventProcessingStatus.COMPLETED,
    };
  } catch (error) {
    return {
      ...event,
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString(),
      status: EEventProcessingStatus.FAILED,
    };
  }
}
