export const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";

export const GROQ_CHAT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
] as const;

export type ConfiguredChatModel = {
  id: number;
  name: string;
  modelName: string;
  isActive: string;
  hasApiKey: boolean;
};

export type ChatModelOption = {
  value: string;
  label: string;
  group: "groq" | "configured" | "unavailable";
};

export function buildChatModelOptions({
  hasGroqKey,
  models,
  activeModel,
}: {
  hasGroqKey: boolean;
  models: ConfiguredChatModel[];
  activeModel: string;
}): ChatModelOption[] {
  const options: ChatModelOption[] = [];
  if (hasGroqKey) {
    options.push(...GROQ_CHAT_MODELS.map(value => ({ value, label: value, group: "groq" as const })));
  }

  options.push(...models
    .filter(model => model.isActive === "true" && model.hasApiKey)
    .map(model => ({
      value: `custom:${model.id}`,
      label: `${model.name} · ${model.modelName}`,
      group: "configured" as const,
    })));

  if (activeModel && !options.some(option => option.value === activeModel)) {
    options.push({ value: activeModel, label: "Unavailable saved model", group: "unavailable" });
  }

  return options;
}
