import { createClaudeMessage } from "./claudeService.js";

const STAFF_INTENTS = ["check_member_package", "extend_member_package", "unknown"];

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
    .toLowerCase();
}

function normalizeStaffIntentResult(value) {
  const intent = STAFF_INTENTS.includes(value?.intent) ? value.intent : "unknown";
  const confidence = Number(value?.confidence);
  const rawMonths = value?.entities?.months;
  const months = rawMonths === null || rawMonths === undefined || rawMonths === "" ? null : Number(rawMonths);

  return {
    intent,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    entities: {
      memberQuery: value?.entities?.memberQuery ? String(value.entities.memberQuery).trim() : null,
      months: Number.isInteger(months) && months > 0 ? months : null,
    },
  };
}

function cleanMemberQuery(message, intent) {
  let query = String(message || "");
  query = query.replace(/\b\d+\s*(?:tháng|thang|month|months)\b/gi, " ");
  query = query.replace(/\b(?:thêm|them|gia hạn|gia han|kiểm tra|kiem tra|gói|goi|hội viên|hoi vien|member|package|renew|extend|check|của|cua|mã|ma)\b/gi, " ");
  if (intent === "extend_member_package") {
    query = query.replace(/\b(?:thêm|them)\b/gi, " ");
  }
  return query.replace(/\s+/g, " ").trim() || null;
}

function fallbackParseStaffIntent(message) {
  const normalized = normalizeVietnamese(message);
  const monthsMatch = normalized.match(/(\d{1,2})\s*(?:thang|month|months)/i);
  const months = monthsMatch ? Number(monthsMatch[1]) : null;
  const isExtend = normalized.includes("gia han") || normalized.includes("renew") || normalized.includes("extend");
  const isCheck = normalized.includes("kiem tra") || normalized.includes("xem") || normalized.includes("goi") || normalized.includes("package");
  const intent = isExtend ? "extend_member_package" : isCheck ? "check_member_package" : "unknown";

  return normalizeStaffIntentResult({
    intent,
    confidence: intent === "unknown" ? 0.2 : 0.65,
    entities: {
      memberQuery: cleanMemberQuery(message, intent),
      months,
    },
  });
}

export async function parseStaffIntent(message) {
  const prompt = `
You are an intent parser for Gymster Staff AI.
Return ONLY valid JSON. No markdown, no prose.

Allowed intents:
- check_member_package
- extend_member_package
- unknown

Staff AI only supports member package operations. Do not return booking, cancellation, review, workout, or member self-service intents.

Extract:
- memberQuery: member name, member code, email, or phone number.
- months: positive integer months for extension, else null.

User message: ${JSON.stringify(message)}

JSON shape:
{
  "intent": "check_member_package",
  "confidence": 0.95,
  "entities": {
    "memberQuery": "HV001",
    "months": null
  }
}`;

  try {
    const result = await createClaudeMessage({
      prompt,
      system: "You parse Gymster staff messages into strict JSON. Never execute actions.",
      maxTokens: 500,
    });
    const parsed = normalizeStaffIntentResult(safeParseJson(result.text));
    const fallback = fallbackParseStaffIntent(message);

    if (parsed.intent === "unknown" && fallback.intent !== "unknown") return fallback;
    return {
      ...parsed,
      entities: {
        memberQuery: parsed.entities.memberQuery || fallback.entities.memberQuery,
        months: parsed.entities.months || fallback.entities.months,
      },
    };
  } catch (error) {
    console.warn("[Staff Claude Intent Parser] Falling back to local parser:", error.message);
    return fallbackParseStaffIntent(message);
  }
}
