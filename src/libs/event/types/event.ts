export interface IClientSentEvent {
  idempotencyKey: string;
  sentAt: string;
}

export enum EEventProcessingStatus {
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface IStoredEvent extends IClientSentEvent {
  eventId: string;
  receivedAt: string;
  status: EEventProcessingStatus;
}

export interface IProcessedEvent extends IStoredEvent {
  processingStartedAt: string;
  processingCompletedAt: string;
}
