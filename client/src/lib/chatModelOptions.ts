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
  latency: string;
  price: string;
  priceDetail: string;
  estimate: boolean;
};

type ModelIndicator = Pick<ChatModelOption, "latency" | "price" | "priceDetail" | "estimate">;

const PROVIDER_DEFAULT_INDICATOR: ModelIndicator = {
  latency: "Provider-dependent latency",
  price: "Price not published",
  priceDetail: "Check the provider dashboard for your account rate.",
  estimate: false,
};

const MODEL_INDICATORS: Record<string, ModelIndicator> = {
  "llama-3.1-8b-instant": {
    latency: "Fast · 560 tokens/sec",
    price: "$0.05 in / $0.08 out per 1M",
    priceDetail: "Published Groq rate per million tokens.",
    estimate: true,
  },
  "llama-3.3-70b-versatile": {
    latency: "Fast · 280 tokens/sec",
    price: "$0.59 in / $0.79 out per 1M",
    priceDetail: "Published Groq rate per million tokens.",
    estimate: true,
  },
  "gemma2-9b-it": {
    latency: "Provider-dependent latency",
    price: "Price not published",
    priceDetail: "This legacy Groq option has no current public rate in the listed model catalog.",
    estimate: false,
  },
  "mixtral-8x7b-32768": {
    latency: "Provider-dependent latency",
    price: "Price not published",
    priceDetail: "This legacy Groq option has no current public rate in the listed model catalog.",
    estimate: false,
  },
  "gemini-2.5-flash": {
    latency: "Low-latency / fast",
    price: "$0.09 in / $0.75 out per 1M",
    priceDetail: "Provider-published Kie rate estimate per million tokens.",
    estimate: true,
  },
  "gemini-2.5-pro": {
    latency: "Reasoning / variable",
    price: "$0.38 in / $3.00 out per 1M",
    priceDetail: "Provider-published Kie rate estimate per million tokens.",
    estimate: true,
  },
  "nvidia/nemotron-3-ultra-550b-a55b": {
    latency: "Reasoning / variable",
    price: "$0.50 in / $2.20 out per 1M",
    priceDetail: "Published OpenRouter rate per million tokens.",
    estimate: true,
  },
};

function indicatorFor(modelName: string): ModelIndicator {
  return MODEL_INDICATORS[modelName] || PROVIDER_DEFAULT_INDICATOR;
}

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
    options.push(...GROQ_CHAT_MODELS.map(value => {
      const indicator = indicatorFor(value);
      return {
        value,
        label: `${value} · ${indicator.latency} · ${indicator.price}`,
        group: "groq" as const,
        ...indicator,
      };
    }));
  }

  options.push(...models
    .filter(model => model.isActive === "true" && model.hasApiKey)
    .map(model => {
      const indicator = indicatorFor(model.modelName);
      return {
        value: `custom:${model.id}`,
        label: `${model.name} · ${indicator.latency} · ${indicator.price}`,
        group: "configured" as const,
        ...indicator,
      };
    }));

  if (activeModel && !options.some(option => option.value === activeModel)) {
    options.push({
      value: activeModel,
      label: "Unavailable saved model · provider information unavailable",
      group: "unavailable",
      latency: "Unavailable",
      price: "Unavailable",
      priceDetail: "Reconfigure this model in Models before using it.",
      estimate: false,
    });
  }

  return options;
}
