import { invokeLLM } from "./_core/llm";
import {
  buildChatContext,
  getNovaChatConfiguration,
  type ChatTurn,
} from "./chatConfig";

type ProviderName = "builtin" | "openrouter" | "huggingface";

type StreamCallback = (token: string) => void;

type ProviderResult = {
  provider: ProviderName;
  content: string;
};

function providerOrder(): ProviderName[] {
  const requested = process.env.NOVA_LLM_PROVIDER?.trim().toLowerCase();
  const preferred: ProviderName = requested === "builtin" || requested === "openrouter" || requested === "huggingface"
    ? requested
    : process.env.OPENROUTER_API_KEY
      ? "openrouter"
      : "builtin";

  const available: ProviderName[] = [preferred];
  if (preferred !== "builtin") available.push("builtin");
  if (process.env.HUGGINGFACE_API_KEY && preferred !== "huggingface") available.push("huggingface");
  if (process.env.OPENROUTER_API_KEY && preferred !== "openrouter") available.push("openrouter");
  return Array.from(new Set(available));
}

async function emitFallbackStream(content: string, onToken: StreamCallback) {
  const chunks = content.match(/.{1,32}(?:\s|$)|.{1,32}/g) ?? [content];
  for (const chunk of chunks) {
    onToken(chunk);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

async function streamSseCompletion(args: {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  onToken: StreamCallback;
  extraHeaders?: Record<string, string>;
}) {
  const response = await fetch(args.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.apiKey}`,
      ...args.extraHeaders,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new Error(`Provider request failed (${response.status}): ${detail.slice(0, 240)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  const consumeLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") return;
    try {
      const parsed = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
      const token = parsed.choices?.[0]?.delta?.content;
      if (typeof token === "string" && token.length > 0) {
        content += token;
        args.onToken(token);
      }
    } catch {
      // Ignore non-JSON SSE control frames.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(line => consumeLine(line.replace(/\r$/, "")));
    if (done) break;
  }
  if (buffer) consumeLine(buffer.replace(/\r$/, ""));
  if (!content.trim()) throw new Error("Provider returned no completion content");
  return content;
}

async function streamBuiltIn(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  onToken: StreamCallback
) {
  const configuration = getNovaChatConfiguration();
  const result = await invokeLLM({ model: configuration.builtInModel, messages });
  const rawContent = result.choices[0]?.message.content;
  const content = typeof rawContent === "string"
    ? rawContent
    : rawContent?.map(part => part.type === "text" ? part.text : "").join("") ?? "";
  if (!content.trim()) throw new Error("Built-in model returned no completion content");
  await emitFallbackStream(content, onToken);
  return content;
}

export async function streamNovaCompletion(history: ChatTurn[], onToken: StreamCallback): Promise<ProviderResult> {
  const messages = buildChatContext(history);
  const configuration = getNovaChatConfiguration();
  const failures: string[] = [];

  for (const provider of providerOrder()) {
    try {
      if (provider === "openrouter") {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OpenRouter is not configured");
        const content = await streamSseCompletion({
          endpoint: "https://openrouter.ai/api/v1/chat/completions",
          apiKey,
          model: configuration.openRouterModel,
          messages,
          onToken,
        });
        return { provider, content };
      }

      if (provider === "huggingface") {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) throw new Error("Hugging Face is not configured");
        const content = await streamSseCompletion({
          endpoint: "https://router.huggingface.co/v1/chat/completions",
          apiKey,
          model: configuration.huggingFaceModel,
          messages,
          onToken,
        });
        return { provider, content };
      }

      const content = await streamBuiltIn(messages, onToken);
      return { provider, content };
    } catch (error) {
      failures.push(`${provider}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  throw new Error(`No configured AI provider completed the response. ${failures.join(" | ")}`);
}
