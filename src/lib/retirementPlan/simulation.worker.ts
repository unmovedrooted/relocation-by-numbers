import { simulateHousehold, type HouseholdSimulationRequest } from "./monteCarlo";
import type { TimelineInput } from "./timeline";

export type SimulationResponse =
  | { type: "progress"; completed: number }
  | { type: "result"; result: ReturnType<typeof simulateHousehold> }
  | { type: "error"; message: string };

self.onmessage = (event: MessageEvent<{ input: TimelineInput; request: HouseholdSimulationRequest }>) => {
  const send = (message: SimulationResponse) => self.postMessage(message);
  try {
    const result = simulateHousehold(event.data.input, event.data.request, completed => {
      if (completed % 5 === 0 || completed === event.data.request.paths) send({ type: "progress", completed });
    });
    send({ type: "result", result });
  } catch (error) {
    send({ type: "error", message: error instanceof RangeError ? error.message : "Simulation could not complete. Check the supported scenario assumptions." });
  }
};
