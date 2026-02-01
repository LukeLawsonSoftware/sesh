import {
  EEventProcessingStatus,
  IProcessedEvent,
  IStoredEvent,
} from "./types/event";

export async function processEvent(
  storedEvent: IStoredEvent,
): Promise<IProcessedEvent> {
  try {
    return {
      ...storedEvent,
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString(),
      status: EEventProcessingStatus.COMPLETED,
    };
  } catch (error) {
    return {
      ...storedEvent,
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString(),
      status: EEventProcessingStatus.FAILED,
    };
  }
}
