export async function askClaude(prompt, options = {}) {
  const response = await fetch("/api/claude/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      system: options.system,
      model: options.model,
      maxTokens: options.maxTokens,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Claude request failed.");
  }

  return data;
}

export async function exampleClaudeRequest() {
  return askClaude("Create a 3-day beginner workout plan.", {
    system: "You are a concise fitness assistant for Gymster users.",
    maxTokens: 800,
  });
}
