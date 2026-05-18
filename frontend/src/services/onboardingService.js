import { getCurrentUser, getUsers, saveUsers, setCurrentUser } from "./authService";

export const ONBOARDING_STORAGE_KEY = "gymster_onboarding_state";

export const ACCOUNT_STATUSES = {
  PendingOnboarding: "PendingOnboarding",
  PendingPTApproval: "PendingPTApproval",
  PendingPayment: "PendingPayment",
  Active: "Active",
  Cancelled: "Cancelled",
};

export const mockPackages = [
  {
    id: "PKG-BASIC-3",
    name: "Basic Gym 3 Months",
    type: "Gym",
    duration: "3 months",
    price: 1500000,
    description: "Full gym floor access with basic onboarding support.",
    sessionLimit: "Unlimited gym access",
    hasPersonalTrainer: false,
  },
  {
    id: "PKG-BASIC-6",
    name: "Basic Gym 6 Months",
    type: "Gym",
    duration: "6 months",
    price: 2800000,
    description: "Longer gym access package with monthly body checks.",
    sessionLimit: "Unlimited gym access",
    hasPersonalTrainer: false,
  },
  {
    id: "PKG-PT-3",
    name: "PT Package 3 Months",
    type: "Personal Training",
    duration: "3 months",
    price: 5200000,
    description: "Guided training plan with fixed weekly PT sessions.",
    sessionLimit: "24 PT sessions",
    hasPersonalTrainer: true,
  },
  {
    id: "PKG-VIP-PT-6",
    name: "VIP PT Package 6 Months",
    type: "VIP Personal Training",
    duration: "6 months",
    price: 9800000,
    description: "Premium personal training package with priority scheduling.",
    sessionLimit: "48 PT sessions",
    hasPersonalTrainer: true,
  },
];

export const fixedScheduleOptions = [
  "Monday / Wednesday / Friday, 18:00 - 19:00",
  "Tuesday / Thursday, 19:00 - 20:00",
  "Saturday / Sunday, 07:00 - 08:00",
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

export function formatVnd(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} VND`;
}

export function getOnboardingState() {
  const currentUser = getCurrentUser();

  if (!canUseStorage()) {
    return {
      ...defaultState,
      memberId: currentUser?.id || null,
      accountStatus: currentUser?.accountStatus || ACCOUNT_STATUSES.Active,
    };
  }

  const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!stored) {
    const seededState = {
      ...defaultState,
      memberId: currentUser?.id || null,
      accountStatus: currentUser ? currentUser.accountStatus || ACCOUNT_STATUSES.Active : defaultState.accountStatus,
    };
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(seededState));
    return seededState;
  }

  const parsed = JSON.parse(stored);
  if (currentUser?.id && parsed.memberId !== currentUser.id) {
    const seededState = {
      ...defaultState,
      memberId: currentUser.id,
      accountStatus: currentUser.accountStatus || ACCOUNT_STATUSES.Active,
    };
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(seededState));
    return seededState;
  }

  return { ...defaultState, ...parsed };
}

export function saveOnboardingState(updates) {
  const currentUser = getCurrentUser();
  const nextState = { ...getOnboardingState(), memberId: currentUser?.id || null, ...updates };

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
  return saveOnboardingState(defaultState);
}
