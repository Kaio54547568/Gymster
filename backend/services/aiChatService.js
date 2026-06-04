import { parseGymsterIntent } from "./claudeService.js";
import {
  cancelBooking,
  createBooking,
  createReview,
  getMembership,
  getUserSchedule,
  updateReview,
} from "./aiActionService.js";

const CONFIRMATION_INTENTS = new Set(["create_booking", "cancel_booking", "create_review", "update_review"]);
const CONFIRMATION_WORDS = ["xác nhận", "xac nhan", "đồng ý", "dong y", "ok", "okay", "đúng rồi", "dung roi", "yes"];
const CANCEL_WORDS = ["hủy", "huỷ", "huy", "cancel", "không", "khong"];

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function nextWeekdayDate(dayIndex) {
  const now = new Date();
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const diff = (dayIndex - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
}

function parseVietnameseDate(normalizedDateText) {
  let match = normalizedDateText.match(/(?:ngay\s*)?(\d{1,2})\s*(?:\/|-|thang\s+)(\d{1,2})(?:\s*(?:\/|-|nam\s+)(\d{2,4}))?/i);
  if (!match) {
    match = normalizedDateText.match(/ng\S*\s+(\d{1,2})\s+\S{2,12}\s+(\d{1,2})(?:\s+\S{2,12}\s+(\d{2,4}))?/i);
  }
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : new Date().getFullYear();
  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null;
  }

  return parsed;
}

function resolveDate(dateText) {
  const normalized = normalizeVietnamese(dateText);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!normalized) return null;
  const numericDate = parseVietnameseDate(normalized);
  if (numericDate) return toDateValue(numericDate);
  if (normalized.includes("hom nay")) return toDateValue(today);
  if (normalized.includes("ngay mai")) return toDateValue(new Date(today.getTime() + 24 * 60 * 60 * 1000));
  if (normalized.includes("tuan nay")) return { startDate: toDateValue(today), endDate: toDateValue(new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)) };

  const weekdayMap = [
    ["chu nhat", 0],
    ["thu 2", 1],
    ["thu hai", 1],
    ["thu 3", 2],
    ["thu ba", 2],
    ["thu 4", 3],
    ["thu tu", 3],
    ["thu 5", 4],
    ["thu nam", 4],
    ["thu 6", 5],
    ["thu sau", 5],
    ["thu 7", 6],
    ["thu bay", 6],
  ];
  const found = weekdayMap.find(([label]) => normalized.includes(label));
  if (found) return toDateValue(nextWeekdayDate(found[1]));

  const parsed = new Date(dateText);
  return Number.isNaN(parsed.getTime()) ? null : toDateValue(parsed);
}

function resolveScheduleRange(entities) {
  const date = resolveDate(entities.date_text);
  if (date && typeof date === "object") return date;
  if (date) return { startDate: date, endDate: date };

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: toDateValue(start), endDate: toDateValue(end) };
}

function normalizeTime(time) {
  const match = String(time || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isConfirmation(message) {
  const normalized = normalizeVietnamese(message);
  return CONFIRMATION_WORDS.some((word) => normalized.includes(normalizeVietnamese(word)));
}

function isCancellation(message) {
  const normalized = normalizeVietnamese(message);
  return CANCEL_WORDS.some((word) => normalized.includes(normalizeVietnamese(word)));
}

function requiredDataForIntent(intent, entities) {
  if (intent === "create_booking") {
    const date = resolveDate(entities.date_text);
    const time = normalizeTime(entities.time);
    const partialBookingData = {
      date: date && typeof date !== "object" ? date : null,
      time,
      note: entities.note || null,
    };
    if (!date || typeof date === "object" || !time) {
      if (date && typeof date !== "object" && !time) {
        return { ok: false, reply: "Bạn muốn đặt lịch lúc mấy giờ?", pendingAction: { status: "collecting", name: "create_booking", data: partialBookingData } };
        return { ok: false, reply: "Bạn muốn đặt lịch lúc mấy giờ?" };
      }
      if ((!date || typeof date === "object") && time) {
        return { ok: false, reply: "Bạn muốn đặt lịch vào ngày nào?", pendingAction: { status: "collecting", name: "create_booking", data: partialBookingData } };
        return { ok: false, reply: "Bạn muốn đặt lịch vào ngày nào?" };
      }
      return { ok: false, reply: "Bạn muốn đặt lịch vào ngày nào và lúc mấy giờ?" };
    }
    return { ok: true, data: { date, time, note: entities.note || null } };
  }

  if (intent === "cancel_booking") {
    const date = resolveDate(entities.date_text);
    if (!date || typeof date === "object") {
      return { ok: false, reply: "Bạn muốn hủy lịch tập ngày nào?" };
    }
    return { ok: true, data: { date } };
  }

  if (intent === "create_review" || intent === "update_review") {
    const rating = Number(entities.rating);
    const date = resolveDate(entities.date_text || entities.session_text) || toDateValue(new Date());
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !entities.comment) {
      return { ok: false, reply: "Bạn muốn đánh giá buổi tập nào và nội dung đánh giá là gì?" };
    }
    return { ok: true, data: { date, rating, comment: entities.comment, targetType: entities.target_type || "trainer" } };
  }

  if (intent === "view_schedule") {
    return { ok: true, data: resolveScheduleRange(entities) };
  }

  if (intent === "view_membership") {
    return { ok: true, data: {} };
  }

  return { ok: false, reply: "Tôi chưa hiểu yêu cầu này. Bạn có thể nói rõ hơn không?" };
}

function confirmationReply(action) {
  const data = action.data || {};
  if (action.name === "create_booking") return `Bạn xác nhận muốn đặt lịch tập vào ${data.date} lúc ${data.time} không?`;
  if (action.name === "cancel_booking") return `Bạn xác nhận muốn hủy lịch tập ngày ${data.date} không?`;
  if (action.name === "create_review") return `Bạn xác nhận muốn đánh giá buổi tập ${data.date} ${data.rating} sao với nội dung "${data.comment}" không?`;
  if (action.name === "update_review") return `Bạn xác nhận muốn cập nhật đánh giá thành ${data.rating} sao với nội dung "${data.comment}" không?`;
  return "Bạn xác nhận muốn thực hiện thao tác này không?";
}

function successReply(action, result) {
  const data = action.data || {};
  if (action.name === "create_booking") return `Đã đặt lịch tập cho bạn vào ${data.date} lúc ${data.time}.`;
  if (action.name === "cancel_booking") return `Đã hủy lịch tập ngày ${data.date}.`;
  if (action.name === "create_review") return `Đã lưu đánh giá ${data.rating} sao của bạn.`;
  if (action.name === "update_review") return `Đã cập nhật đánh giá của bạn.`;
  if (action.name === "view_membership") return result ? `Gói tập hiện tại: ${result.packageName}, trạng thái ${result.status}, còn ${result.remainingSessions ?? "-"} buổi.` : "Bạn chưa có gói tập đang hoạt động.";
  if (action.name === "view_schedule") return result.length ? `Bạn có ${result.length} buổi tập trong khoảng đã chọn.` : "Không có lịch tập trong khoảng đã chọn.";
  return "Đã thực hiện xong.";
}

async function executeAction(user, action) {
  switch (action.name) {
    case "create_booking":
      return createBooking(user, action.data);
    case "cancel_booking":
      return cancelBooking(user, action.data);
    case "view_schedule":
      return getUserSchedule(user, action.data);
    case "create_review":
      return createReview(user, action.data);
    case "update_review":
      return updateReview(user, action.data);
    case "view_membership":
      return getMembership(user);
    default:
      throw new Error("Unsupported AI action.");
  }
}

export async function handleAiChat({ message, pendingAction, user }) {
  if (!user?.id && !user?.userId && !user?.user_id && !user?.email) {
    return { type: "error", reply: "Bạn cần đăng nhập trước khi dùng AI Assistant." };
  }

  if (pendingAction) {
    if (isCancellation(message)) {
      return { type: "cancelled", reply: "Đã hủy thao tác đang chờ xác nhận." };
    }
    if (pendingAction.status === "collecting") {
      const parsed = await parseGymsterIntent(message);
      const currentData = pendingAction.data || {};

      if (pendingAction.name === "create_booking") {
        const parsedDate = resolveDate(parsed.entities.date_text);
        const parsedTime = normalizeTime(parsed.entities.time);
        const data = {
          ...currentData,
          date: currentData.date || (parsedDate && typeof parsedDate !== "object" ? parsedDate : null),
          time: currentData.time || parsedTime,
          note: currentData.note || parsed.entities.note || null,
        };

        if (data.date && data.time) {
          const action = { name: "create_booking", data };
          return {
            type: "confirmation_required",
            reply: confirmationReply(action),
            pendingAction: action,
            parsed,
          };
        }

        return {
          type: "question",
          reply: data.date ? "Bạn muốn đặt lịch lúc mấy giờ?" : "Bạn muốn đặt lịch vào ngày nào?",
          pendingAction: { ...pendingAction, data },
          parsed,
        };
      }
    }
    if (!isConfirmation(message)) {
      return {
        type: "confirmation_required",
        reply: confirmationReply(pendingAction),
        pendingAction,
      };
    }

    try {
      const result = await executeAction(user, pendingAction);
      return { type: "success", reply: successReply(pendingAction, result), result };
    } catch (error) {
      return { type: "error", reply: error.message || "Không thể thực hiện thao tác." };
    }
  }

  const parsed = await parseGymsterIntent(message);
  const requirement = requiredDataForIntent(parsed.intent, parsed.entities);
  if (!requirement.ok) {
    return { type: "question", reply: requirement.reply, pendingAction: requirement.pendingAction || null, parsed };
  }

  const action = { name: parsed.intent, data: requirement.data };
  if (CONFIRMATION_INTENTS.has(parsed.intent)) {
    return {
      type: "confirmation_required",
      reply: confirmationReply(action),
      pendingAction: action,
      parsed,
    };
  }

  try {
    const result = await executeAction(user, action);
    return { type: "success", reply: successReply(action, result), result, parsed };
  } catch (error) {
    return { type: "error", reply: error.message || "Không thể thực hiện thao tác.", parsed };
  }
}
