import { parseGymsterIntent, createClaudeMessage, isMissingAnthropicApiKey } from "./claudeService.js";
import {
  cancelBooking,
  createBooking,
  createReview,
  getMembership,
  getMakeupBalance,
  getUserSchedule,
  updateReview,
} from "./aiActionService.js";

const CONFIRMATION_INTENTS = new Set(["create_booking", "cancel_booking", "create_review", "update_review"]);
const CONFIRMATION_WORDS = ["xác nhận", "xac nhan", "đồng ý", "dong y", "ok", "okay", "đúng rồi", "dung roi", "yes"];
const CANCEL_WORDS = ["hủy", "huỷ", "huy", "cancel", "không", "khong"];

const GYM_OPEN_TIME = "08:00";
const GYM_CLOSE_TIME = "20:00";
const ACTION_REDIRECT_URLS = {
  create_booking: null,
  cancel_booking: "/member/my-schedule",
  create_review: "/member/rate-service",
  update_review: "/member/rate-service",
};

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
  const isoMatch = normalizedDateText.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (
      parsed.getFullYear() === Number(isoMatch[1])
      && parsed.getMonth() === Number(isoMatch[2]) - 1
      && parsed.getDate() === Number(isoMatch[3])
    ) return parsed;
  }

  const dayOnlyMatch = normalizedDateText.match(/\b(?:ngay\s*)?(\d{1,2})\b/i);
  let match = normalizedDateText.match(/(?:ngay\s*)?(\d{1,2})\s*(?:\/|-|thang\s+)(\d{1,2})(?:\s*(?:\/|-|nam\s+)(\d{2,4}))?/i);
  if (!match) {
    match = normalizedDateText.match(/ng\S*\s+(\d{1,2})\s+\S{2,12}\s+(\d{1,2})(?:\s+\S{2,12}\s+(\d{2,4}))?/i);
  }
  if (!match && dayOnlyMatch && normalizedDateText.includes("ngay")) {
    const now = new Date();
    match = [dayOnlyMatch[0], dayOnlyMatch[1], String(now.getMonth() + 1), String(now.getFullYear())];
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

function addHours(time, hours) {
  const [hour, minute] = String(time || GYM_OPEN_TIME).split(":").map(Number);
  return `${String(Math.min(23, (hour || 8) + hours)).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
}

function minutesFromTime(time) {
  const [hour, minute] = String(time || "").slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function isWithinGymHours(startTime, endTime = addHours(startTime, 1)) {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  const open = minutesFromTime(GYM_OPEN_TIME);
  const close = minutesFromTime(GYM_CLOSE_TIME);
  return start !== null && end !== null && start >= open && end <= close && start < end;
}

function isConfirmation(message) {
  const normalized = normalizeVietnamese(message);
  return CONFIRMATION_WORDS.some((word) => normalized.includes(normalizeVietnamese(word)));
}

function isCancellation(message) {
  const normalized = normalizeVietnamese(message);
  return CANCEL_WORDS.some((word) => normalized.includes(normalizeVietnamese(word)));
}

function isExplicitCancelRequest(message) {
  const normalized = normalizeVietnamese(message);
  return ["huy", "cancel"].some((word) => normalized.includes(word));
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
    if (!isWithinGymHours(time)) {
      return { ok: false, reply: "Phòng gym chỉ mở từ 08:00 đến 20:00. Bạn vui lòng chọn giờ tập trong khung này." };
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

  if (intent === "view_makeup_balance") {
    return { ok: true, data: {} };
  }

  return { ok: false, reply: "Tôi chưa hiểu yêu cầu này. Bạn có thể nói rõ hơn không?" };
}

function confirmationReply(action) {
  const data = action.data || {};
  if (action.name === "create_booking") return `Bạn xác nhận muốn gửi yêu cầu đặt lịch bù với PT vào ${data.date} lúc ${data.time} không? AI sẽ kiểm tra số buổi bù còn lại và gửi yêu cầu cho PT, chưa tạo lịch ngay.`;
  if (action.name === "cancel_booking") return `Bạn xác nhận muốn hủy lịch tập ngày ${data.date} không?`;
  if (action.name === "create_review") return `Bạn xác nhận muốn đánh giá buổi tập ${data.date} ${data.rating} sao với nội dung "${data.comment}" không?`;
  if (action.name === "update_review") return `Bạn xác nhận muốn cập nhật đánh giá thành ${data.rating} sao với nội dung "${data.comment}" không?`;
  return "Bạn xác nhận muốn thực hiện thao tác này không?";
}

function successReply(action, result) {
  const data = action.data || {};
  if (action.name === "create_booking") return `Đã gửi yêu cầu đặt lịch bù với PT vào ${data.date} lúc ${data.time}. PT sẽ nhận thông báo để đồng ý hoặc từ chối. Lịch chỉ được tạo sau khi PT xác nhận.`;
  if (action.name === "cancel_booking") return `Đã hủy lịch tập ngày ${data.date}.`;
  if (action.name === "create_review") return `Đã lưu đánh giá ${data.rating} sao của bạn.`;
  if (action.name === "update_review") return `Đã cập nhật đánh giá của bạn.`;
  if (action.name === "view_membership") return result ? `Gói tập hiện tại: ${result.packageName}, trạng thái ${result.status}, còn ${result.remainingSessions ?? "-"} buổi.` : "Bạn chưa có gói tập đang hoạt động.";
  if (action.name === "view_schedule") return result.length ? `Bạn có ${result.length} buổi tập trong khoảng đã chọn.` : "Không có lịch tập trong khoảng đã chọn.";
  if (action.name === "view_makeup_balance") return `Trong tháng ${result.month}/${result.year}, bạn đã hủy ${result.fixedScheduleCancelCount} lịch tập cố định. Theo quy định, bạn được bù tối đa ${result.maxMakeupAllowed} buổi/tháng. Bạn đã sử dụng ${result.usedMakeupCount} buổi, hiện còn ${result.remainingMakeupCount} buổi bù.`;
  return "Đã thực hiện xong.";
}

function affectedIdForResult(action, result) {
  if (!result) return null;
  if (action.name === "create_booking" || action.name === "cancel_booking") {
    return result.sessionId || result.requestId || result.trainingRequestId || result.workout_session_id || result.session_id || null;
  }
  if (action.name === "create_review" || action.name === "update_review") {
    return result.feedback_id || result.feedbackId || null;
  }
  return null;
}

function successResponse(action, result, extra = {}) {
  return {
    type: "success",
    reply: successReply(action, result),
    action: action.name,
    redirectUrl: ACTION_REDIRECT_URLS[action.name] || null,
    affectedId: affectedIdForResult(action, result),
    result,
    ...extra,
  };
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
    case "view_makeup_balance":
      return getMakeupBalance(user);
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
      return { type: "cancelled", reply: "Thao tác đã được từ chối." };
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
          if (!isWithinGymHours(data.time)) {
            return {
              type: "question",
              reply: "Phòng gym chỉ mở từ 08:00 đến 20:00. Bạn vui lòng chọn giờ tập trong khung này.",
              pendingAction: { ...pendingAction, data: { ...data, time: null } },
              parsed,
            };
          }
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

      if (pendingAction.name === "cancel_booking") {
        const parsedDate = resolveDate(parsed.entities.date_text);
        const data = {
          ...currentData,
          date: currentData.date || (parsedDate && typeof parsedDate !== "object" ? parsedDate : null),
        };

        if (data.date) {
          const action = { name: "cancel_booking", data };
          return {
            type: "confirmation_required",
            reply: confirmationReply(action),
            pendingAction: action,
            parsed,
          };
        }

        return {
          type: "question",
          reply: "Ban muon huy lich tap ngay nao?",
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
      return successResponse(pendingAction, result);
    } catch (error) {
      return { type: "error", reply: error.message || "Không thể thực hiện thao tác." };
    }
  }

async function handleGeneralGymQuery(message) {
  if (isMissingAnthropicApiKey()) {
    return {
      type: "success",
      reply: "Quy định phòng tập Gymster:\n" +
             "- Phải đăng ký đổi/hủy lịch trước giờ tập ít nhất 2 giờ để được cộng buổi tập bù.\n" +
             "- Số buổi tập bù tối đa được nhận trong mỗi tháng là 2 buổi.\n" +
             "- Đăng ký buổi tập bù yêu cầu số dư buổi bù khả dụng của bạn lớn hơn 0.\n" +
             "- Giờ hoạt động của phòng tập từ 08:00 đến 20:00 hàng ngày.",
      action: "unknown",
      redirectUrl: null,
      result: null,
    };
  }

  const systemPrompt = `You are a helpful gym receptionist assistant for the Gymster fitness app.
Answer user questions in Vietnamese about Gymster's gym policies, schedules, package registration, and makeup session rules.

Gymster's Policies & Rules:
1. Giờ hoạt động (Gym Hours): 08:00 - 20:00 hàng ngày.
2. Buổi bù (Makeup PT Session Rules):
   - Hội viên có thể đăng ký buổi tập bù với PT (makeup_pt_session) nếu còn số buổi bù khả dụng (availableMakeupBalance > 0).
   - Số buổi bù tối đa nhận được trong tháng (monthlyLimit) là 2 buổi.
   - Để nhận được buổi bù, hội viên phải yêu cầu Hủy lịch (cancel_booking) hoặc Đổi lịch (reschedule) trước ít nhất 2 giờ so với giờ tập dự kiến.
   - Hủy lịch trễ (dưới 2 tiếng): Không được cộng buổi bù (history ghi nhận Hủy trễ dưới 2 tiếng và nhận 0 buổi bù).
   - Đổi lịch trễ (dưới 2 tiếng): Nếu PT duyệt đổi lịch, buổi tập mới sẽ tiêu tốn 1 buổi bù của hội viên, và buổi cũ bị tính trễ nên không được cộng lại buổi bù nào (mất 1 buổi bù).
   - Đổi lịch hợp lệ (trước 2 tiếng): Được cộng 1 buổi bù cho buổi cũ, và khi PT duyệt thì trừ 1 buổi bù cho buổi mới (net change = 0).
   - Khi PT từ chối yêu cầu đổi lịch (reject reschedule): Không có thay đổi nào về số buổi bù.
3. Các gói tập PT VIP: gói tập VIP hỗ trợ 2 buổi tập PT một tuần (các ngày không được quá gần nhau hoặc trùng nhau).

Keep answers concise, polite, clear, and in Vietnamese. Avoid listing technical JSON parameters.`;

  try {
    const response = await createClaudeMessage({
      prompt: message,
      system: systemPrompt,
      maxTokens: 500,
    });
    return {
      type: "success",
      reply: response.text,
      action: "unknown",
      redirectUrl: null,
      result: null,
    };
  } catch (error) {
    return {
      type: "success",
      reply: "Rất tiếc, tôi đang gặp lỗi kết nối. Hãy hỏi lại sau nhé!",
      action: "unknown",
      redirectUrl: null,
      result: null,
    };
  }
}

export async function handleAiChat({ message, pendingAction, user }) {
  if (!user?.id && !user?.userId && !user?.user_id && !user?.email) {
    return { type: "error", reply: "Bạn cần đăng nhập trước khi dùng AI Assistant." };
  }

  if (pendingAction) {
    if (isCancellation(message)) {
      return { type: "cancelled", reply: "Thao tác đã được từ chối." };
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
          if (!isWithinGymHours(data.time)) {
            return {
              type: "question",
              reply: "Phòng gym chỉ mở từ 08:00 đến 20:00. Bạn vui lòng chọn giờ tập trong khung này.",
              pendingAction: { ...pendingAction, data: { ...data, time: null } },
              parsed,
            };
          }
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

      if (pendingAction.name === "cancel_booking") {
        const parsedDate = resolveDate(parsed.entities.date_text);
        const data = {
          ...currentData,
          date: currentData.date || (parsedDate && typeof parsedDate !== "object" ? parsedDate : null),
        };

        if (data.date) {
          const action = { name: "cancel_booking", data };
          return {
            type: "confirmation_required",
            reply: confirmationReply(action),
            pendingAction: action,
            parsed,
          };
        }

        return {
          type: "question",
          reply: "Ban muon huy lich tap ngay nao?",
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
      return successResponse(pendingAction, result);
    } catch (error) {
      return { type: "error", reply: error.message || "Không thể thực hiện thao tác." };
    }
  }

  let parsed = await parseGymsterIntent(message);
  if (isExplicitCancelRequest(message)) {
    parsed = { ...parsed, intent: "cancel_booking" };
  }

  if (parsed.intent === "unknown") {
    return handleGeneralGymQuery(message);
  }

  const requirement = requiredDataForIntent(parsed.intent, parsed.entities);
  if (!requirement.ok) {
    return {
      type: "question",
      reply: requirement.reply,
      pendingAction: requirement.pendingAction || (parsed.intent === "cancel_booking" ? { status: "collecting", name: "cancel_booking", data: {} } : null),
      parsed,
    };
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
    return successResponse(action, result, { parsed });
  } catch (error) {
    return { type: "error", reply: error.message || "Không thể thực hiện thao tác.", parsed };
  }
}
