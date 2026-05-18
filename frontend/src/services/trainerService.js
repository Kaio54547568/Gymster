const TRAINERS_KEY = "gymster_trainers";
const TRAINING_REQUESTS_KEY = "gymster_training_requests";
const MEMBER_NOTIFICATIONS_KEY = "gymster_member_training_notifications";

const seedTrainers = [
  {
    id: "PT001",
    name: "Nguyen Van Nam",
    specialty: "Strength Training",
    rating: 4.8,
    experience: "5 years",
    maxActiveMembers: 12,
    currentActiveMembers: 9,
  },
  {
    id: "PT002",
    name: "Tran Minh Duc",
    specialty: "Weight Loss, Cardio, HIIT",
    rating: 4.7,
    experience: "4 years",
    maxActiveMembers: 10,
    currentActiveMembers: 10,
  },
  {
    id: "PT003",
    name: "Le Hoang An",
    specialty: "Yoga, Mobility, Recovery",
    rating: 4.9,
    experience: "6 years",
    maxActiveMembers: 14,
    currentActiveMembers: 7,
  },
];

const seedRequests = [
  {
    id: "REQ-001",
    type: "assignment",
    memberId: "MEM006",
    memberName: "David Nguyen",
    trainerId: "PT001",
    trainerName: "Nguyen Van Nam",
    preferredSchedule: "May 24, 2026 - 18:00",
    status: "Pending PT Approval",
    declineReason: "",
    createdDate: "2026-05-16",
  },
  {
    id: "REQ-002",
    type: "reschedule",
    memberId: "MEM001",
    memberName: "Nguyen Van A",
    trainerId: "PT001",
    trainerName: "Nguyen Van Nam",
    currentSchedule: "May 18, 2026 - 18:00",
    preferredSchedule: "May 19, 2026 - 19:00",
    status: "Pending",
    declineReason: "",
    createdDate: "2026-05-16",
  },
  {
    id: "REQ-003",
    type: "assignment",
    memberId: "MEM007",
    memberName: "Minh Tran",
    trainerId: "PT002",
    trainerName: "Tran Minh Duc",
    preferredSchedule: "May 21, 2026 - 19:00",
    status: "Declined",
    declineReason: "Trainer capacity is full this week.",
    createdDate: "2026-05-14",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readStorage(key, seed) {
  if (!canUseStorage()) return seed;
  const stored = window.localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  window.localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function writeStorage(key, value) {
  if (canUseStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export function getTrainers() {
  return readStorage(TRAINERS_KEY, seedTrainers);
}

export function getAvailableTrainers() {
  return getTrainers().filter((trainer) => trainer.currentActiveMembers < trainer.maxActiveMembers);
}

export function isTrainerFull(trainerId) {
  const trainer = getTrainers().find((item) => item.id === trainerId);
  return Boolean(trainer && trainer.currentActiveMembers >= trainer.maxActiveMembers);
}

export function getTrainingRequests() {
  return readStorage(TRAINING_REQUESTS_KEY, seedRequests);
}

export function updateTrainingRequest(id, updates) {
  const requests = getTrainingRequests();
  const nextRequests = requests.map((request) => (request.id === id ? { ...request, ...updates } : request));
  writeStorage(TRAINING_REQUESTS_KEY, nextRequests);

  const updated = nextRequests.find((request) => request.id === id);
  if (updated && updates.status === "Declined") {
    const notifications = getMemberTrainingNotifications();
    writeStorage(MEMBER_NOTIFICATIONS_KEY, [
      {
        id: `NOTE-${Date.now()}`,
        memberId: updated.memberId,
        title: updated.type === "reschedule" ? "Reschedule request declined" : "Trainer assignment declined",
        message: `${updated.trainerName} declined the request.${updates.declineReason ? ` Reason: ${updates.declineReason}` : ""}`,
        createdDate: new Date().toISOString().slice(0, 10),
      },
      ...notifications,
    ]);
  }

  return nextRequests;
}

export function getMemberTrainingNotifications() {
  return readStorage(MEMBER_NOTIFICATIONS_KEY, [
    {
      id: "NOTE-001",
      memberId: "MEM007",
      title: "Trainer assignment declined",
      message: "Tran Minh Duc declined the request. Reason: Trainer capacity is full this week.",
      createdDate: "2026-05-14",
    },
  ]);
}
