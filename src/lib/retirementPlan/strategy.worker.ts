import {evaluateBracketStrategies,type StrategyRequest} from "./bracketStrategies";
import type {TimelineInput} from "./timeline";
export type StrategyWorkerResponse = {type:"progress";completed:number}|{type:"result";result:ReturnType<typeof evaluateBracketStrategies>}|{type:"error";message:string};
self.onmessage=(event:MessageEvent<{input:TimelineInput;request:StrategyRequest}>)=>{
  const send=(message:StrategyWorkerResponse)=>self.postMessage(message);
  try { const result=evaluateBracketStrategies(event.data.input,event.data.request,completed=>send({type:"progress",completed}));send({type:"result",result}); }
  catch(error){send({type:"error",message:error instanceof Error?error.message:"Strategy evaluation failed."});}
};
