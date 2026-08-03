const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function openAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatCompletion(options: {
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = openAIModel();
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.2,
      messages: options.messages,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI request failed (${res.status})`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return { text, model };
}
