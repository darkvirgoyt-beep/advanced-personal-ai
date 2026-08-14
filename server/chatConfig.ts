export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export const DEFAULT_NOVA_SYSTEM_PROMPT = `You are Nova AI, an accurate, practical, and privacy-conscious personal AI assistant. Help users think, create, learn, build, and solve problems. Give direct, useful answers, state important assumptions, and format technical material clearly. Do not claim to have performed actions you have not actually performed. Treat credentials and personal information as private.`;

export const DEFAULT_BUILT_IN_MODEL = "gpt-5-mini";
export const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
export const DEFAULT_HUGGING_FACE_MODEL = "Qwen/Qwen2.5-7B-Instruct";
export const MAX_CONTEXT_TURNS = 24;

function clean(value: string | undefined) {
  return value?.trim() || undefined;
}

export function getNovaChatConfiguration() {
  return {
    systemPrompt: clean(process.env.NOVA_SYSTEM_PROMPT) ?? DEFAULT_NOVA_SYSTEM_PROMPT,
    builtInModel: clean(process.env.NOVA_LLM_MODEL) ?? DEFAULT_BUILT_IN_MODEL,
    openRouterModel: clean(process.env.NOVA_OPENROUTER_MODEL) ?? DEFAULT_OPENROUTER_MODEL,
    huggingFaceModel: clean(process.env.NOVA_HUGGINGFACE_MODEL) ?? DEFAULT_HUGGING_FACE_MODEL,
  };
}

export function buildChatContext(history: ChatTurn[]) {
  const configuration = getNovaChatConfiguration();
  const priorTurns = history
    .filter(turn => (turn.role === "user" || turn.role === "assistant") && turn.content.trim().length > 0)
    .slice(-MAX_CONTEXT_TURNS)
    .map(turn => ({ role: turn.role, content: turn.content.trim() }));

  return [{ role: "system" as const, content: configuration.systemPrompt }, ...priorTurns];
}
