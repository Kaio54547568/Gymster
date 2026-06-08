import { parseStaffIntent } from "./staffClaudeService.js";
import {
  extendMemberPackage,
  findMember,
  getMemberPackage,
  getPackageExtensionHistory,
} from "./staffAiActionService.js";

const CONFIRMATION_WORDS = ["xác nhận", "xac nhan", "đồng ý", "dong y", "ok", "okay", "đúng rồi", "dung roi", "yes"];
const CANCEL_WORDS = ["hủy", "huỷ", "huy", "cancel", "không", "khong"];

function normalizeVietnamese(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function isAllowedStaffUser(user) {
  const role = normalizeVietnamese(user?.role || user?.sourceRole || "");
  const sourceRole = normalizeVietnamese(user?.sourceRole || "");
  return ["staff", "admin", "owner"].includes(role) || ["staff", "admin", "owner"].includes(sourceRole);
}

function staffUserId(user) {
  return user?.userId || user?.user_id || user?.id || null;
}

function isConfirmation(message) {
  const normalized = normalizeVietnamese(message);
  return CONFIRMATION_WORDS.some((word) => normalized.includes(normalizeVietnamese(word)));
}

function isCancellation(message) {
  const normalized = normalizeVietnamese(message);
  return CANCEL_WORDS.some((word) => normalized.includes(normalizeVietnamese(word)));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function packageInfoReply(member, memberPackage, history = []) {
  if (!memberPackage) {
    return [
      `Hội viên: ${member.fullName}`,
      `Mã hội viên: ${member.memberCode}`,
      member.phone ? `SĐT: ${member.phone}` : null,
      member.email ? `Email: ${member.email}` : null,
      "Hiện chưa có gói tập.",
    ].filter(Boolean).join("\n");
  }

  const historyText = history.length
    ? history.slice(0, 3).map((item) => `- ${formatDate(String(item.createdAt || "").slice(0, 10))}: ${item.status || "renew"}`).join("\n")
    : "Chưa có lịch sử gia hạn.";

  return [
    `Hội viên: ${member.fullName}`,
    `Mã hội viên: ${member.memberCode}`,
    member.phone ? `SĐT: ${member.phone}` : null,
    member.email ? `Email: ${member.email}` : null,
    `Gói hiện tại: ${memberPackage.packageName}`,
    `Ngày bắt đầu: ${formatDate(memberPackage.startDate)}`,
    `Ngày hết hạn: ${formatDate(memberPackage.endDate)}`,
    `Số ngày còn lại: ${memberPackage.daysRemaining ?? "-"}`,
    `Trạng thái gói: ${memberPackage.statusLabel}`,
    `Lịch sử gia hạn:\n${historyText}`,
  ].filter(Boolean).join("\n");
}

function confirmationReply(action) {
  const data = action.data || {};
  return `Bạn xác nhận muốn gia hạn gói của ${data.memberName} thêm ${data.months} tháng, từ ngày hết hạn hiện tại ${formatDate(data.oldExpiredAt)} thành ${formatDate(data.newExpiredAt)} không?`;
}

function successReply(action, result) {
  const data = action.data || {};
  return `Đã gia hạn thành công. Gói của ${data.memberName} hiện hết hạn vào ngày ${formatDate(result.newExpiredAt)}.`;
}

function addMonthsToDate(value, months) {
  const date = new Date(`${value}T00:00:00`);
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < day) date.setDate(0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayValue() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function resolveExtensionPreview(memberPackage, months) {
  const oldExpiredAt = memberPackage?.endDate || null;
  const end = oldExpiredAt ? new Date(`${oldExpiredAt}T00:00:00`) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const baseDate = end && !Number.isNaN(end.getTime()) && end >= now ? oldExpiredAt : todayValue();
  return {
    oldExpiredAt,
    newExpiredAt: addMonthsToDate(baseDate, months),
  };
}

async function buildCheckPackageResponse(memberQuery) {
  if (!memberQuery) {
    return {
      type: "question",
      reply: "Bạn muốn kiểm tra gói của hội viên nào? Vui lòng nhập mã hội viên, email hoặc số điện thoại.",
      intent: "check_member_package",
    };
  }

  const member = await findMember(memberQuery);
  if (!member) {
    return {
      type: "question",
      reply: "Không tìm thấy hội viên này. Bạn có thể nhập mã hội viên, email hoặc số điện thoại không?",
      intent: "check_member_package",
    };
  }

  const memberPackage = await getMemberPackage(member.memberId);
  const history = await getPackageExtensionHistory(member.memberId);
  return {
    type: "success",
    reply: packageInfoReply(member, memberPackage, history),
    intent: "check_member_package",
    data: { member, memberPackage, history },
  };
}

async function buildExtendPackageResponse(memberQuery, months) {
  if (!memberQuery) {
    return {
      type: "question",
      reply: "Bạn muốn gia hạn gói cho hội viên nào? Vui lòng nhập mã hội viên, email hoặc số điện thoại.",
      intent: "extend_member_package",
    };
  }

  const parsedMonths = Number(months);
  if (!Number.isInteger(parsedMonths) || parsedMonths <= 0) {
    return {
      type: "question",
      reply: "Bạn muốn gia hạn thêm bao nhiêu tháng?",
      intent: "extend_member_package",
      pendingAction: { status: "collecting", name: "extend_member_package", data: { memberQuery } },
    };
  }
  if (parsedMonths > 24) {
    return {
      type: "error",
      reply: "Không thể gia hạn quá 24 tháng trong một lần.",
      intent: "extend_member_package",
    };
  }

  const member = await findMember(memberQuery);
  if (!member) {
    return {
      type: "question",
      reply: "Không tìm thấy hội viên này. Bạn có thể nhập mã hội viên, email hoặc số điện thoại không?",
      intent: "extend_member_package",
    };
  }

  const memberPackage = await getMemberPackage(member.memberId);
  if (!memberPackage) {
    return {
      type: "error",
      reply: `Hội viên ${member.fullName} chưa có gói tập để gia hạn.`,
      intent: "extend_member_package",
      data: { member },
    };
  }

  const preview = resolveExtensionPreview(memberPackage, parsedMonths);
  const action = {
    name: "extend_member_package",
    data: {
      memberId: member.memberId,
      memberName: member.fullName,
      memberCode: member.memberCode,
      months: parsedMonths,
      oldExpiredAt: preview.oldExpiredAt,
      newExpiredAt: preview.newExpiredAt,
    },
  };

  return {
    type: "confirmation_required",
    reply: confirmationReply(action),
    intent: "extend_member_package",
    pendingAction: action,
    data: action.data,
  };
}

export async function handleStaffAiChat({ message, pendingAction, user }) {
  if (!isAllowedStaffUser(user)) {
    return { type: "error", reply: "Chỉ staff hoặc admin được dùng Staff AI.", intent: "unknown" };
  }

  if (pendingAction) {
    if (isCancellation(message)) {
      return { type: "cancelled", reply: "Thao tác đã được từ chối.", intent: pendingAction.name };
    }

    if (pendingAction.status === "collecting") {
      const parsed = await parseStaffIntent(message);
      const data = {
        ...(pendingAction.data || {}),
        memberQuery: pendingAction.data?.memberQuery || parsed.entities.memberQuery,
        months: pendingAction.data?.months || parsed.entities.months,
      };
      return buildExtendPackageResponse(data.memberQuery, data.months);
    }

    if (!isConfirmation(message)) {
      return {
        type: "confirmation_required",
        reply: confirmationReply(pendingAction),
        intent: pendingAction.name,
        pendingAction,
        data: pendingAction.data,
      };
    }

    if (pendingAction.name !== "extend_member_package") {
      return { type: "error", reply: "Staff AI không hỗ trợ thao tác này.", intent: "unknown" };
    }

    const result = await extendMemberPackage(pendingAction.data.memberId, pendingAction.data.months, staffUserId(user));
    return {
      type: "success",
      reply: successReply(pendingAction, result),
      intent: "extend_member_package",
      data: result,
    };
  }

  const parsed = await parseStaffIntent(message);
  if (parsed.intent === "check_member_package") {
    const result = await buildCheckPackageResponse(parsed.entities.memberQuery);
    return { ...result, parsed };
  }
  if (parsed.intent === "extend_member_package") {
    const result = await buildExtendPackageResponse(parsed.entities.memberQuery, parsed.entities.months);
    return { ...result, parsed };
  }

  return {
    type: "question",
    reply: "Staff AI chỉ hỗ trợ kiểm tra gói hội viên và gia hạn gói hội viên. Bạn có thể nhập mã hội viên, email hoặc số điện thoại.",
    intent: "unknown",
    parsed,
  };
}
