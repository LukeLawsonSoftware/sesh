export interface ISentEvent {
  idempotencyKey: string;
  sentAt: string;
}

export enum EEventProcessingStatus {
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface IReceivedEvent extends ISentEvent {
  eventId: string;
  receivedAt: string;
  status: EEventProcessingStatus;
}

export interface IProcessedEvent extends IReceivedEvent {
  processingStartedAt: string;
  processingCompletedAt: string;
}
