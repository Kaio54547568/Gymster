import { getCurrentUser } from "./authService";

export async function sendAiChatMessage(message, pendingAction = null) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      pendingAction,
      user: getCurrentUser(),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.reply || data.error || "AI Assistant request failed.");
  }

  return data;
}
