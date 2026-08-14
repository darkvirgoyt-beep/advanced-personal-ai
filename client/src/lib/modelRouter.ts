import type { ChatModelOption } from "./chatModelOptions";

export type NovaOperatingMode = "fast" | "reasoning" | "coding" | "creative" | "learning" | "gaming" | "research" | "productivity";

export type ModelRecommendation = {
  option: ChatModelOption | undefined;
  reason: string;
};

const MODEL_PREFERENCES: Record<NovaOperatingMode, RegExp[]> = {
  fast: [/instant/i, /flash/i],
  reasoning: [/nemotron/i, /\bpro\b/i, /70b/i],
  coding: [/nemotron/i, /\bpro\b/i, /70b/i],
  creative: [/\bpro\b/i, /flash/i, /70b/i],
  learning: [/flash/i, /70b/i],
  gaming: [/70b/i, /flash/i],
  research: [/nemotron/i, /\bpro\b/i, /70b/i],
  productivity: [/instant/i, /flash/i, /70b/i],
};

const MODE_REASON: Record<NovaOperatingMode, string> = {
  fast: "Prioritizes low-latency options for quick iteration.",
  reasoning: "Prioritizes configured reasoning-capable options when available.",
  coding: "Prioritizes stronger analysis-oriented options for implementation work.",
  creative: "Prioritizes capable options for long-form creative work.",
  learning: "Prioritizes balanced options for clear, iterative explanations.",
  gaming: "Prioritizes balanced options for practical game analysis and design.",
  research: "Prioritizes configured reasoning-capable options for evidence-aware briefs.",
  productivity: "Prioritizes responsive options for planning and next actions.",
};

export function recommendChatModel(mode: NovaOperatingMode, options: ChatModelOption[]): ModelRecommendation {
  const eligible = options.filter(option => option.group !== "unavailable");
  const preferred = MODEL_PREFERENCES[mode];
  const option = preferred
    .map(pattern => eligible.find(candidate => pattern.test(`${candidate.value} ${candidate.label}`)))
    .find((candidate): candidate is ChatModelOption => Boolean(candidate)) || eligible[0];
  return { option, reason: MODE_REASON[mode] };
}

export type LocalModelPerformance = {
  attempts: number;
  successes: number;
  failures: number;
  lastDurationMs: number | null;
  lastModelLabel: string | null;
};

export const EMPTY_LOCAL_MODEL_PERFORMANCE: LocalModelPerformance = {
  attempts: 0,
  successes: 0,
  failures: 0,
  lastDurationMs: null,
  lastModelLabel: null,
};

export function recordLocalModelOutcome(
  current: LocalModelPerformance,
  outcome: { modelLabel: string; durationMs: number; succeeded: boolean },
): LocalModelPerformance {
  return {
    attempts: current.attempts + 1,
    successes: current.successes + (outcome.succeeded ? 1 : 0),
    failures: current.failures + (outcome.succeeded ? 0 : 1),
    lastDurationMs: Math.max(0, Math.round(outcome.durationMs)),
    lastModelLabel: outcome.modelLabel,
  };
}
