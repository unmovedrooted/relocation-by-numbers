import { searchMaxSustainableSpending, type SpendingSearchRequest } from "./spendingSearch";
import type { TimelineInput } from "./timeline";

export type SpendingSearchWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "result"; result: ReturnType<typeof searchMaxSustainableSpending> }
  | { type: "error"; message: string };

self.onmessage = (event: MessageEvent<{ input: TimelineInput; request: SpendingSearchRequest }>) => {
  const send = (message: SpendingSearchWorkerResponse) => self.postMessage(message);
  try {
    const result = searchMaxSustainableSpending(event.data.input, event.data.request,
      (completed, total) => send({ type: "progress", completed, total }));
    send({ type: "result", result });
  } catch (error) {
    send({ type: "error", message: error instanceof RangeError ? error.message : "Spending search could not complete. Check the supported scenario assumptions." });
  }
};
