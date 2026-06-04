import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1024;
const INTENTS = [
  "create_booking",
  "cancel_booking",
  "view_schedule",
  "create_review",
  "update_review",
  "view_membership",
  "unknown",
];

let anthropicClient;

export function isMissingAnthropicApiKey() {
  return !process.env.ANTHROPIC_API_KEY;
}

function getAnthropicClient() {
  if (isMissingAnthropicApiKey()) {
    throw new Error("Missing ANTHROPIC_API_KEY in backend/.env.");
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return anthropicClient;
}

function normalizeMaxTokens(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_TOKENS;
  return Math.min(Math.floor(parsed), 4096);
}

function extractTextContent(content) {
  if (!Array.isArray(content)) return "";

  return content
    .filter((block) => block?.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function createClaudeMessage({ prompt, system, model, maxTokens }) {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: model || DEFAULT_MODEL,
    max_tokens: normalizeMaxTokens(maxTokens),
    system: system || "You are a helpful assistant for the Gymster fitness app.",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return {
    id: message.id,
    model: message.model,
    role: message.role,
    text: extractTextContent(message.content),
    usage: message.usage,
  };
}

function safeParseJson(text) {
  const trimmed = String(text || "").trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const source = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    return JSON.parse(source);
  } catch (error) {
    return null;
  }
}

function normalizeVietnamese(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function normalizeIntentResult(value) {
  const intent = INTENTS.includes(value?.intent) ? value.intent : "unknown";
  const confidence = Number(value?.confidence);

  return {
    intent,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    entities: {
      date_text: value?.entities?.date_text ?? null,
      time: value?.entities?.time ?? null,
      trainer: value?.entities?.trainer ?? null,
      note: value?.entities?.note ?? null,
      rating: value?.entities?.rating ?? null,
      comment: value?.entities?.comment ?? null,
      session_text: value?.entities?.session_text ?? null,
      target_type: value?.entities?.target_type ?? null,
    },
  };
}

function fallbackParseIntent(message) {
  const text = String(message || "").toLowerCase();
  const normalizedText = normalizeVietnamese(message);
  const entities = {
    date_text: null,
    time: null,
    trainer: null,
    note: null,
    rating: null,
    comment: null,
    session_text: null,
    target_type: null,
  };

  const timeMatch = normalizedText.match(/(\d{1,2})(?:h|:)(\d{2})?|(\d{1,2})\s*(?:gio|hour)/i);
  if (timeMatch) {
    const hour = Number(timeMatch[1] || timeMatch[3]);
    const minute = Number(timeMatch[2] || 0);
    if (hour >= 0 && hour <= 23) {
      entities.time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }

  const numericDateMatch = normalizedText.match(/(?:ngay\s*)?(\d{1,2})\s*(?:\/|-|thang\s+)(\d{1,2})(?:\s*(?:\/|-|nam\s+)(\d{2,4}))?/i);
  if (numericDateMatch) {
    entities.date_text = numericDateMatch[0].trim();
  } else {
    const looseDateMatch = normalizedText.match(/ng\S*\s+(\d{1,2})\s+\S{2,12}\s+(\d{1,2})(?:\s+\S{2,12}\s+(\d{2,4}))?/i);
    if (looseDateMatch) {
      entities.date_text = `${looseDateMatch[1]}/${looseDateMatch[2]}${looseDateMatch[3] ? `/${looseDateMatch[3]}` : ""}`;
    }
  }

  const dateWords = [
    "hôm nay",
    "hom nay",
    "ngày mai",
    "ngay mai",
    "thứ 2",
    "thu 2",
    "thu hai",
    "thứ 3",
    "thu 3",
    "thu ba",
    "thứ 4",
    "thu 4",
    "thu tu",
    "thứ 5",
    "thu 5",
    "thu nam",
    "thứ 6",
    "thu 6",
    "thu sau",
    "thứ 7",
    "thu 7",
    "thu bay",
    "chủ nhật",
    "chu nhat",
  ];
  entities.date_text = entities.date_text || dateWords.find((word) => normalizedText.includes(normalizeVietnamese(word))) || null;

  const ratingMatch = text.match(/([1-5])\s*(?:sao|star)/i);
  if (ratingMatch) entities.rating = Number(ratingMatch[1]);

  if (normalizedText.includes("dat") || normalizedText.includes("booking")) {
    return normalizeIntentResult({ intent: "create_booking", confidence: 0.7, entities });
  }
  if (normalizedText.includes("huy") || normalizedText.includes("cancel")) {
    return normalizeIntentResult({ intent: "cancel_booking", confidence: 0.7, entities });
  }
  if (normalizedText.includes("lich") || normalizedText.includes("schedule")) {
    return normalizeIntentResult({ intent: "view_schedule", confidence: 0.65, entities });
  }
  if (normalizedText.includes("danh gia") || normalizedText.includes("review")) {
    entities.comment = message.replace(/đánh giá|danh gia|review|[1-5]\s*(sao|star)/gi, "").trim() || null;
    return normalizeIntentResult({ intent: "create_review", confidence: 0.7, entities });
  }
  if (normalizedText.includes("goi") || normalizedText.includes("membership")) {
    return normalizeIntentResult({ intent: "view_membership", confidence: 0.65, entities });
  }

  if (entities.date_text && entities.time) {
    return normalizeIntentResult({ intent: "create_booking", confidence: 0.55, entities });
  }
  if (entities.date_text) {
    return normalizeIntentResult({ intent: "create_booking", confidence: 0.45, entities });
  }

  return normalizeIntentResult({ intent: "unknown", confidence: 0.2, entities });
}

export async function parseGymsterIntent(message) {
  if (isMissingAnthropicApiKey()) {
    throw new Error("Missing ANTHROPIC_API_KEY in backend/.env.");
  }

  const prompt = `
You are an intent parser for Gymster, a gym management system.
Return ONLY valid JSON. No markdown, no prose.

Supported intents:
- create_booking
- cancel_booking
- view_schedule
- create_review
- update_review
- view_membership
- unknown

Extract entities:
- date_text: original natural language date phrase, e.g. "thứ 2", "ngày mai", "hôm nay"
- time: HH:mm 24-hour string if available, e.g. "08:00"
- trainer: trainer name if mentioned, else null
- note: booking note if mentioned, else null
- rating: integer 1-5 for reviews, else null
- comment: review comment, else null
- session_text: natural reference to session, e.g. "hôm nay", "ngày mai", else null
- target_type: service/trainer/class/equipment/facility/staff if clear, else null

User message: ${JSON.stringify(message)}

JSON shape:
{
  "intent": "create_booking",
  "confidence": 0.95,
  "entities": {
    "date_text": "thứ 2",
    "time": "08:00",
    "trainer": null,
    "note": null,
    "rating": null,
    "comment": null,
    "session_text": null,
    "target_type": null
  }
}`;

  try {
    const result = await createClaudeMessage({
      prompt,
      system: "You parse Gymster user messages into strict JSON. Never execute actions.",
      maxTokens: 700,
    });
    const parsed = normalizeIntentResult(safeParseJson(result.text));
    const fallback = fallbackParseIntent(message);
    if (parsed.intent === "unknown" && fallback.intent !== "unknown") {
      return fallback;
    }

    return {
      ...parsed,
      entities: {
        ...parsed.entities,
        date_text: parsed.entities.date_text || fallback.entities.date_text,
        time: parsed.entities.time || fallback.entities.time,
      },
    };
  } catch (error) {
    console.warn("[Claude Intent Parser] Falling back to local parser:", error.message);
    return fallbackParseIntent(message);
  }
}
