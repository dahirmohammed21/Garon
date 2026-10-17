import { fail } from "../core/validation.js";
export async function anthropic({ model, messages, system, key, fetchImpl }) {
  const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(60000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 1024, system, messages }),
  });
  if (!response.ok)
    fail(
      `AI-leverantören svarade med fel ${response.status}. Kontrollera anslutning och API-nyckel.`,
      502,
    );
  const result = await response.json();
  const answer = result.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
  if (!answer) fail("AI-leverantören gav inget textsvar.", 502);
  return {
    answer,
    inputTokens: result.usage?.input_tokens,
    outputTokens: result.usage?.output_tokens,
  };
}
