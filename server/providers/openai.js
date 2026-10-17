import { fail } from "../core/validation.js";
export async function openai({ model, messages, system, key, fetchImpl }) {
  const response = await fetchImpl(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    },
  );
  if (!response.ok)
    fail(
      `AI-leverantören svarade med fel ${response.status}. Kontrollera anslutning och API-nyckel.`,
      502,
    );
  const result = await response.json();
  const answer = result.choices?.[0]?.message?.content;
  if (!answer) fail("AI-leverantören gav inget textsvar.", 502);
  return {
    answer,
    inputTokens: result.usage?.prompt_tokens,
    outputTokens: result.usage?.completion_tokens,
  };
}
