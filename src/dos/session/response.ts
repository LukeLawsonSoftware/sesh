import {
  EEventProcessingStatus,
  IStoredEvent,
} from "../../libs/event/types/event";

const BASE_HEADERS = {
  "Content-Type": "application/json",
};

export function buildResponse(event: IStoredEvent): Response {
  // if the event is still processing, return 202
  if (event.status === EEventProcessingStatus.PROCESSING) {
    return new Response(JSON.stringify(event), {
      status: 202,
      headers: BASE_HEADERS,
    });
  }

  return new Response(JSON.stringify(event), { headers: BASE_HEADERS });
}
