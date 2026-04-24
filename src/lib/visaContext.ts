// lib/visaContext.ts
export type VisaContext = {
  icon: string
  program: string
  highlight?: string
  notes: string
  estimatedFee: number
  region: "Caribbean" | "Central America" | "South America" | "Europe" | "Asia"
}

export const VISA_CONTEXT: Record<string, VisaContext> = {
  PA: { region: "Central America", icon: "🇵🇦", ... },
  CR: { region: "Central America", icon: "🇨🇷", ... },
  CO: { region: "South America",   icon: "🇨🇴", ... },
  MX: { region: "Central America", icon: "🇲🇽", ... },
  // Caribbean entries go here too
  DO: { region: "Caribbean", icon: "🇩🇴", ... },
  // etc.
}

export function getVisaContext(code: string): VisaContext | undefined {
  return VISA_CONTEXT[code]
}