import { getCurrentUser, getUsers, saveUsers, setCurrentUser } from "./authService";

export const ONBOARDING_STORAGE_KEY = "gymster_onboarding_state";

export const ACCOUNT_STATUSES = {
  PendingOnboarding: "PendingOnboarding",
  PendingPTApproval: "PendingPTApproval",
  PendingPayment: "PendingPayment",
  Active: "Active",
  Cancelled: "Cancelled",
};

export const fixedScheduleOptions = [
  "Monday / Wednesday / Friday, 18:00 - 19:00",
  "Tuesday / Thursday, 19:00 - 20:00",
  "Saturday / Sunday, 07:00 - 08:00",
];

export const individualScheduleOptions = [
  "Monday, 18:00 - 19:00",
  "Tuesday, 19:00 - 20:00",
  "Wednesday, 18:00 - 19:00",
  "Thursday, 19:00 - 20:00",
  "Friday, 18:00 - 19:00",
  "Saturday, 07:00 - 08:00",
  "Sunday, 07:00 - 08:00",
];

const defaultState = {
  memberId: null,
  accountStatus: ACCOUNT_STATUSES.PendingOnboarding,
  selectedPackage: null,
  selectedTrainer: null,
  selectedSchedule: "",
  memberPackageId: null,
  trainingRequestId: null,
  trainingRequest: null,
  paymentId: null,
  payment: null,
  memberPackage: null,
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getCurrentMemberId(currentUser) {
  return currentUser?.memberId || currentUser?.member_id || null;
}

export function formatVnd(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} VND`;
}

export function getOnboardingState() {
  const currentUser = getCurrentUser();
  const currentMemberId = getCurrentMemberId(currentUser);

  if (!canUseStorage()) {
    return {
      ...defaultState,
      memberId: currentMemberId,
      accountStatus: currentUser?.accountStatus || ACCOUNT_STATUSES.Active,
    };
  }

  const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!stored) {
    const seededState = {
      ...defaultState,
      memberId: currentMemberId,
      accountStatus: currentUser ? currentUser.accountStatus || ACCOUNT_STATUSES.Active : defaultState.accountStatus,
    };
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(seededState));
    return seededState;
  }

  const parsed = JSON.parse(stored);
  if (currentMemberId && parsed.memberId !== currentMemberId) {
    const seededState = {
      ...defaultState,
      memberId: currentMemberId,
      accountStatus: currentUser.accountStatus || ACCOUNT_STATUSES.Active,
    };
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(seededState));
    return seededState;
  }

  return { ...defaultState, ...parsed };
}

export function saveOnboardingState(updates) {
  const currentUser = getCurrentUser();
  const nextState = { ...getOnboardingState(), memberId: getCurrentMemberId(currentUser), ...updates };

  if (canUseStorage()) {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(nextState));
  }

  if (String(currentUser?.role || "").toLowerCase() === "member" && updates.accountStatus) {
    setCurrentUser({ ...currentUser, accountStatus: updates.accountStatus });
    saveUsers(
      getUsers().map((user) =>
        user.id === currentUser.id ? { ...user, accountStatus: updates.accountStatus } : user,
      ),
    );
  }

  return nextState;
}

export function resetOnboardingState() {
  const currentUser = getCurrentUser();
  const nextState = {
    ...defaultState,
    memberId: getCurrentMemberId(currentUser),
    accountStatus: currentUser?.accountStatus || defaultState.accountStatus,
  };

  if (canUseStorage()) {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
}
