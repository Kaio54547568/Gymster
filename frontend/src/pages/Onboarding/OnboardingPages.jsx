import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  CheckCircle,
  CreditCard,
  Dumbbell,
  QrCode,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import { getCurrentUser, setCurrentUser } from "../../services/authService";
import {
  createMemberPackage,
  updateMemberPackageStatus,
  updateMemberPackageTrainer,
  assignTrainerToMember,
} from "../../services/memberPackageApi";
import { fetchPackagesFromSupabase } from "../../services/packageApi";
import { createPayment } from "../../services/paymentApi";
import { fetchTrainersFromSupabase } from "../../services/trainerApi";
import { createNotification } from "../../services/notificationApi";
import { getTrainers } from "../../services/trainerService";
import {
  createTrainingRequest,
  getTrainingRequestById,
  updateTrainingRequestStatus,
} from "../../services/trainingRequestApi";
import { createWorkoutSessionsForSchedule } from "../../services/workoutSessionApi";
import { activateMemberAccount } from "../../services/userApi";
import {
  ACCOUNT_STATUSES,
  fixedScheduleOptions,
  individualScheduleOptions,
  formatVnd,
  getOnboardingState,
  saveOnboardingState,
} from "../../services/onboardingService";

const dashboardPath = "/member";
const paymentMethods = ["Cash", "Bank Transfer", "Credit Card", "E-Wallet"];

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + Number(months || 0));
  return nextDate;
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function getPackageDurationMonths(pkg) {
  if (pkg?.durationMonths) return Number(pkg.durationMonths);
  const match = String(pkg?.duration || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function PageShell({ children }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050607] via-[#0a0b0d] to-[#050607] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-[0.04]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#EF233C]/35 bg-[#120f10] shadow-[0_0_24px_rgba(239,35,60,0.35)]">
            <img src="/assets/brand/gymster-icon.svg" alt="Gymster" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-wide">Gymster</div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Member Onboarding</div>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-black text-white md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{subtitle}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-white/8 bg-[#181818]/95 shadow-[0_24px_70px_rgba(0,0,0,0.35)] ${className}`}>
      {title ? (
        <div className="border-b border-white/8 px-5 py-4">
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border border-[#EF233C]/35 bg-[#EF233C]/10 px-5 py-3 text-sm font-black text-[#ff6b7a] transition hover:bg-[#EF233C]/20 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const className =
    status === ACCOUNT_STATUSES.Active
      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25"
      : status === ACCOUNT_STATUSES.Cancelled
        ? "bg-red-500/15 text-red-300 ring-1 ring-red-400/25"
        : status === ACCOUNT_STATUSES.PendingPayment
          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"
          : "bg-[#EF233C]/15 text-[#ff6b7a] ring-1 ring-[#EF233C]/25";

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function Stepper({ state }) {
  if (state.accountStatus === ACCOUNT_STATUSES.PendingOnboarding && !state.selectedPackage) {
    return (
      <Panel>
        <div className="grid gap-3 md:grid-cols-3">
          {["Account Created", "Staff Review", "Account Activated"].map((step, index) => {
            const active = index === 1;
            return (
              <div key={step} className={`rounded-xl border p-4 ${active ? "border-[#EF233C] bg-[#EF233C]/10" : "border-white/8 bg-white/[0.03]"}`}>
                <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${index === 0 ? "bg-[#EF233C] text-white" : "bg-white/10 text-white/55"}`}>
                  {index === 0 ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <div className={`text-sm font-black ${active || index === 0 ? "text-white" : "text-white/45"}`}>{step}</div>
              </div>
            );
          })}
        </div>
      </Panel>
    );
  }

  const hasPt = Boolean(state.selectedPackage?.hasPersonalTrainer || state.selectedTrainer || state.trainingRequest);
  const steps = hasPt
    ? ["Account Created", "Choose Package", "Choose Trainer", "PT Approval", "Payment", "Activated"]
    : ["Account Created", "Choose Package", "Payment", "Activated"];
  const activeStep = getActiveStep(state, steps, hasPt);

  return (
    <Panel>
      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
        {steps.map((step, index) => {
          const complete = index < activeStep || state.accountStatus === ACCOUNT_STATUSES.Active;
          const active = index === activeStep && state.accountStatus !== ACCOUNT_STATUSES.Active;
          return (
            <div key={step} className={`rounded-xl border p-4 ${active ? "border-[#EF233C] bg-[#EF233C]/10" : "border-white/8 bg-white/[0.03]"}`}>
              <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${complete ? "bg-[#EF233C] text-white" : "bg-white/10 text-white/55"}`}>
                {complete ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <div className={`text-sm font-black ${active || complete ? "text-white" : "text-white/45"}`}>{step}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function getActiveStep(state, steps, hasPt) {
  if (state.accountStatus === ACCOUNT_STATUSES.Active) return steps.length - 1;
  if (state.accountStatus === ACCOUNT_STATUSES.PendingPayment) return hasPt ? 4 : 2;
  if (state.accountStatus === ACCOUNT_STATUSES.PendingPTApproval) return 3;
  if (state.selectedTrainer) return 2;
  if (state.selectedPackage) return 1;
  return 0;
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-t border-white/8 py-3 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right font-bold text-white">{value}</span>
    </div>
  );
}

function useOnboardingState() {
  const [state, setState] = useState(() => getOnboardingState());
  const save = (updates) => {
    const nextState = saveOnboardingState(updates);
    setState(nextState);
    return nextState;
  };
  return [state, save];
}

export function MemberOnboardingRoute({ children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (String(currentUser.role || "").toLowerCase() !== "member") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function RegistrationStatusPage() {
  const navigate = useNavigate();
  const [state, save] = useOnboardingState();
  const [isSyncingRequest, setIsSyncingRequest] = useState(false);
  const status = state.accountStatus;
  const isNewAccountPending = status === ACCOUNT_STATUSES.PendingOnboarding && !state.selectedPackage;

  const statusMessage = {
    PendingOnboarding: isNewAccountPending
      ? "Your account has been created and is waiting for staff review. You will be able to continue once the account is approved."
      : "Your account has been created. Please choose a package to continue.",
    PendingPTApproval: "Your request has been sent to the trainer. Please wait for approval.",
    PendingPayment: "Please complete your payment to activate your account.",
    Active: "Your membership is active.",
    Cancelled: "Your onboarding request was cancelled. Please choose a package to continue.",
  }[status];

  useEffect(() => {
    let isMounted = true;

    if (!state.trainingRequestId) {
      return () => {
        isMounted = false;
      };
    }

    getTrainingRequestById(state.trainingRequestId).then(({ data }) => {
      if (!isMounted || !data) {
        return;
      }

      save({
        trainingRequest: {
          ...state.trainingRequest,
          ...data,
        },
      });
    });

    return () => {
      isMounted = false;
    };
  }, [state.trainingRequestId]);

  const updateRequestStatus = async (nextStatus, nextAccountStatus, declineReason = "") => {
    const localRequest = state.trainingRequest
      ? { ...state.trainingRequest, status: nextStatus, declineReason }
      : null;

    if (!state.trainingRequestId) {
      save({
        accountStatus: nextAccountStatus,
        trainingRequest: localRequest,
      });
      return;
    }

    setIsSyncingRequest(true);
    const { data, error } = await updateTrainingRequestStatus(state.trainingRequestId, nextStatus, declineReason);
    setIsSyncingRequest(false);

    save({
      accountStatus: error ? nextAccountStatus : nextAccountStatus,
      trainingRequest: data || localRequest,
    });
  };

  return (
    <PageShell>
      <PageHeader
        title={isNewAccountPending ? "Account Pending Review" : "Complete Your Membership"}
        subtitle={
          isNewAccountPending
            ? "Your Gymster account is created. Staff will verify the registration before your member setup continues."
            : "Your account has been created. Complete your membership setup to unlock the Member Portal."
        }
      />

      <div className="space-y-5">
        <Stepper state={state} />

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Onboarding Status">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm leading-6 text-white/65">{statusMessage}</p>
                {state.trainingRequest?.declineReason ? (
                  <p className="mt-2 text-sm font-bold text-red-300">Reason: {state.trainingRequest.declineReason}</p>
                ) : null}
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="flex flex-wrap gap-3">
              {status === ACCOUNT_STATUSES.PendingOnboarding && !isNewAccountPending && (
                <PrimaryButton onClick={() => navigate("/onboarding/packages")}>Choose Package</PrimaryButton>
              )}
              {status === ACCOUNT_STATUSES.Cancelled && (
                <PrimaryButton onClick={() => navigate("/onboarding/packages")}>Choose Package</PrimaryButton>
              )}
              {status === ACCOUNT_STATUSES.Cancelled && state.selectedPackage?.hasPersonalTrainer && (
                <SecondaryButton onClick={() => navigate("/onboarding/trainers")}>Choose Another Trainer</SecondaryButton>
              )}
              {status === ACCOUNT_STATUSES.PendingPTApproval && (
                <>
                  <SecondaryButton onClick={() => navigate("/onboarding/trainers")}>Change Trainer</SecondaryButton>
                  <SecondaryButton
                    onClick={() =>
                      updateRequestStatus("cancelled", ACCOUNT_STATUSES.Cancelled, "Cancelled by member.")
                    }
                    disabled={isSyncingRequest}
                  >
                    Cancel Request
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={() =>
                      updateRequestStatus("accepted", ACCOUNT_STATUSES.PendingPayment)
                    }
                    disabled={isSyncingRequest}
                  >
                    Simulate Trainer Accept
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() =>
                      updateRequestStatus(
                        "declined",
                        ACCOUNT_STATUSES.Cancelled,
                        "Trainer is not available for the selected schedule.",
                      )
                    }
                    disabled={isSyncingRequest}
                  >
                    Simulate Trainer Decline
                  </SecondaryButton>
                </>
              )}
              {status === ACCOUNT_STATUSES.PendingPayment && (
                <PrimaryButton onClick={() => navigate("/onboarding/payment")}>Proceed to Payment</PrimaryButton>
              )}
              {status === ACCOUNT_STATUSES.Active && (
                <PrimaryButton onClick={() => navigate(dashboardPath)}>Go to Dashboard</PrimaryButton>
              )}
            </div>
          </Panel>

          <Panel title="Account Summary">
            <DetailRow label="Account status" value={state.accountStatus} />
            <DetailRow label="Selected package" value={state.selectedPackage?.name} />
            <DetailRow label="Selected trainer" value={state.selectedTrainer?.name} />
            <DetailRow label="Selected schedule" value={state.selectedSchedule} />
            <DetailRow label="Training request status" value={state.trainingRequest?.status} />
            <DetailRow label="Decline reason" value={state.trainingRequest?.declineReason} />
            <DetailRow label="Payment status" value={state.payment?.paymentStatus} />
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

export function PackageSelectionPage() {
  const navigate = useNavigate();
  const [, save] = useOnboardingState();
  const [packages, setPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packageLoadError, setPackageLoadError] = useState("");
  const [hasNoSupabasePackages, setHasNoSupabasePackages] = useState(false);
  const [isSelectingPackage, setIsSelectingPackage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchPackagesFromSupabase().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setPackages([]);
        setPackageLoadError("Package list could not be loaded.");
        setHasNoSupabasePackages(true);
      } else if (data.length === 0) {
        setPackages([]);
        setPackageLoadError("");
        setHasNoSupabasePackages(true);
      } else {
        setPackages(data);
        setPackageLoadError("");
        setHasNoSupabasePackages(false);
      }

      setIsLoadingPackages(false);
    }).catch((error) => {
      if (!isMounted) {
        return;
      }

      console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load packages:", error);
      setPackages([]);
      setPackageLoadError("Package list could not be loaded.");
      setHasNoSupabasePackages(true);
      setIsLoadingPackages(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectPackage = async (pkg) => {
    const currentUser = getCurrentUser();
    const nextAccountStatus = pkg.hasPersonalTrainer ? ACCOUNT_STATUSES.PendingOnboarding : ACCOUNT_STATUSES.PendingPayment;
    const nextLocalMemberPackage = {
      memberPackageId: null,
      packageId: pkg.id,
      packageName: pkg.name,
      status: pkg.hasPersonalTrainer ? "pending_pt_approval" : "pending_payment",
      remainingSessions: pkg.sessionLimitValue ?? null,
    };

    setIsSelectingPackage(true);
    const { data, error } = await createMemberPackage({
      memberId: currentUser?.memberId || currentUser?.id,
      memberEmail: currentUser?.email || "",
      packageId: pkg.id,
      status: pkg.hasPersonalTrainer ? "pending_pt_approval" : "pending_payment",
      remainingSessions: pkg.sessionLimitValue ?? null,
    });
    setIsSelectingPackage(false);

    save({
      accountStatus: nextAccountStatus,
      selectedPackage: pkg,
      selectedTrainer: null,
      selectedSchedule: "",
      memberPackageId: data?.memberPackageId || null,
      memberPackage: data || nextLocalMemberPackage,
      memberPackageSyncError: error ? "Member package could not be created." : "",
      trainingRequest: null,
      payment: null,
    });

    navigate(pkg.hasPersonalTrainer ? "/onboarding/trainers" : "/onboarding/payment");
  };

  return (
    <PageShell>
      <PageHeader title="Choose Package" subtitle="Select the membership package that fits your training plan." />

      {isLoadingPackages ? (
        <Panel className="mb-5">
          <div className="p-5 text-sm font-bold text-white/65">Loading packages...</div>
        </Panel>
      ) : null}

      {packageLoadError ? (
        <Panel className="mb-5 border-[#EF233C]/35 bg-[#2a1115]/90">
          <div className="p-5 text-sm font-bold text-red-100">{packageLoadError}</div>
        </Panel>
      ) : null}

      {!packageLoadError && hasNoSupabasePackages && !isLoadingPackages ? (
        <Panel className="mb-5">
          <div className="p-5 text-sm font-bold text-white/60">No packages found.</div>
        </Panel>
      ) : null}

      {!isLoadingPackages ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl border border-white/8 bg-[#181818]/95 p-5 transition hover:border-[#EF233C]/45 hover:bg-[#211317]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EF233C]/15 text-[#ff6b7a]">
                  {pkg.hasPersonalTrainer ? <UserCheck className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/65">{pkg.type}</span>
              </div>
              <h2 className="text-xl font-black text-white">{pkg.name}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-white/55">{pkg.description}</p>
              <div className="mt-4 space-y-2 text-sm text-white/65">
                <div>Duration: <span className="font-bold text-white">{pkg.duration}</span></div>
                <div>Session limit: <span className="font-bold text-white">{pkg.sessionLimit}</span></div>
                <div>Personal trainer: <span className="font-bold text-white">{pkg.hasPersonalTrainer ? "Included" : "Not included"}</span></div>
              </div>
              <div className="mt-5 text-2xl font-black text-[#EF233C]">{formatVnd(pkg.price)}</div>
              <div className="mt-5 grid gap-2">
                <PrimaryButton className="w-full" disabled={isSelectingPackage} onClick={() => selectPackage(pkg)}>
                  {isSelectingPackage ? "Selecting..." : "Select Package"}
                </PrimaryButton>
                <SecondaryButton className="w-full">View Details</SecondaryButton>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}

export function TrainerSelectionPage() {
  const navigate = useNavigate();
  const [state, save] = useOnboardingState();
  const [trainers, setTrainers] = useState(() => getTrainers());
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);
  const [trainerLoadError, setTrainerLoadError] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState(state.selectedTrainer?.id || "");
  const sessionsPerWeek = state.selectedPackage?.sessionsPerWeek || 1;
  const [selectedSlots, setSelectedSlots] = useState(() => {
    if (state.selectedSchedule) {
      return state.selectedSchedule.split("&").map(s => s.trim()).filter(Boolean);
    }
    return [];
  });
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  const isScheduleValid = useMemo(() => {
    if (sessionsPerWeek === 2) {
      if (selectedSlots.length !== 2) return false;
      const dayOfWeekMap = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      };
      const getDayFromSlot = (slot) => dayOfWeekMap[slot.split(",")[0].trim().toLowerCase()];
      const day1 = getDayFromSlot(selectedSlots[0]);
      const day2 = getDayFromSlot(selectedSlots[1]);
      if (day1 === undefined || day2 === undefined) return false;
      if (day1 === day2) return false;
      const diff = Math.abs(day1 - day2);
      return diff !== 1 && diff !== 6;
    }
    return selectedSlots.length === 1;
  }, [selectedSlots, sessionsPerWeek]);

  const selectedTrainer = trainers.find((trainer) => trainer.id === selectedTrainerId);
  const canConfirm = Boolean(selectedTrainer && isScheduleValid && selectedTrainer.currentActiveMembers < selectedTrainer.maxActiveMembers);

  useEffect(() => {
    let isMounted = true;

    fetchTrainersFromSupabase().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setTrainers([]);
        setTrainerLoadError("Trainer list could not be loaded.");
      } else if (data.length === 0) {
        setTrainers([]);
        setTrainerLoadError("");
      } else {
        setTrainers(data);
        setTrainerLoadError("");
      }

      setIsLoadingTrainers(false);
    }).catch((error) => {
      if (!isMounted) {
        return;
      }

      console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load trainers:", error);
      setTrainers([]);
      setTrainerLoadError("Trainer list could not be loaded.");
      setIsLoadingTrainers(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!state.selectedPackage?.hasPersonalTrainer) {
    return <Navigate to="/onboarding/packages" replace />;
  }

  const confirmTrainer = async () => {
    const currentUser = getCurrentUser();
    const finalScheduleString = selectedSlots.join(" & ");
    const request = {
      requestId: `REQ-${Date.now()}`,
      memberId: state.memberId || currentUser?.id || "MOCK-MEMBER",
      memberEmail: currentUser?.email || "",
      trainerId: selectedTrainer.id,
      packageId: state.selectedPackage.id,
      memberPackageId: state.memberPackageId,
      requestedSchedule: finalScheduleString,
      status: ACCOUNT_STATUSES.PendingPTApproval,
      declineReason: "",
      createdAt: new Date().toISOString(),
    };

    setIsCreatingRequest(true);
    if (state.memberPackageId) {
      await updateMemberPackageTrainer(state.memberPackageId, selectedTrainer.id);
    }

    const { data, error } = await createTrainingRequest(request);
    setIsCreatingRequest(false);

    const nextRequest = data || request;

    save({
      accountStatus: ACCOUNT_STATUSES.PendingPTApproval,
      selectedTrainer,
      selectedSchedule: finalScheduleString,
      memberPackage: state.memberPackage
        ? { ...state.memberPackage, trainerId: selectedTrainer.id, status: state.memberPackage.status || "pending_pt_approval" }
        : null,
      trainingRequestId: data?.requestId || null,
      trainingRequest: nextRequest,
      trainingRequestSyncError: error ? "Training request could not be created." : "",
      payment: null,
    });
    navigate("/onboarding/status");
  };

  return (
    <PageShell>
      <PageHeader title="Choose Trainer" subtitle="Select an available trainer and a fixed schedule for your PT package." />

      {isLoadingTrainers ? (
        <Panel className="mb-5">
          <div className="p-5 text-sm font-bold text-white/65">Loading trainers...</div>
        </Panel>
      ) : null}

      {trainerLoadError ? (
        <Panel className="mb-5 border-[#EF233C]/35 bg-[#2a1115]/90">
          <div className="p-5 text-sm font-bold text-red-100">{trainerLoadError}</div>
        </Panel>
      ) : null}

      {!trainerLoadError && trainers.length === 0 && !isLoadingTrainers ? (
        <Panel className="mb-5">
          <div className="p-5 text-sm font-bold text-white/60">No trainers found.</div>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {!isLoadingTrainers ? <div className="grid gap-5 md:grid-cols-2">
          {trainers.map((trainer) => {
            const isFull = trainer.currentActiveMembers >= trainer.maxActiveMembers;
            const isSelected = selectedTrainerId === trainer.id;
            const visibleScheduleSlots = trainer.availableSlots?.length ? trainer.availableSlots : fixedScheduleOptions;
            const initials = trainer.name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("");
            const capacityPercent = trainer.maxActiveMembers > 0
              ? Math.min(100, Math.round((trainer.currentActiveMembers / trainer.maxActiveMembers) * 100))
              : 0;
            return (
              <button
                key={trainer.id}
                className={`rounded-2xl border p-5 text-left transition ${
                  isSelected ? "border-[#EF233C] bg-[#EF233C]/10" : "border-white/8 bg-[#181818]/95 hover:border-[#EF233C]/45"
                } ${isFull ? "opacity-60" : ""}`}
                disabled={isFull}
                type="button"
                onClick={() => setSelectedTrainerId(trainer.id)}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EF233C]/15 text-lg font-black text-[#ff6b7a]">
                    {initials}
                  </div>
                  <span className="flex items-center gap-1 text-sm font-bold text-[#ff6b7a]">
                    <Star className="h-4 w-4 fill-current" /> {trainer.rating}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{trainer.name}</h2>
                <p className="mt-1 text-sm text-white/50">{trainer.specialty}</p>
                <div className="mt-4 space-y-2 text-sm text-white/65">
                  <div>Active members: <span className="font-bold text-white">{trainer.currentActiveMembers}/{trainer.maxActiveMembers}</span></div>
                  <div>Available schedule slots:</div>
                  <ul className="space-y-1 text-xs text-white/50">
                    {visibleScheduleSlots.map((slot) => <li key={slot}>- {slot}</li>)}
                  </ul>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${capacityPercent}%` }} />
                </div>
                {isFull ? <p className="mt-3 text-xs font-black text-red-300">This trainer is currently full.</p> : null}
              </button>
            );
          })}
        </div> : null}

        <Panel title={sessionsPerWeek === 2 ? "Chọn 2 buổi tập PT/tuần" : "Chọn lịch tập PT/tuần"}>
          <div className="space-y-3">
            <p className="text-xs text-white/55">
              {sessionsPerWeek === 2 
                ? "Gói VIP yêu cầu chọn 2 buổi tập khác ngày nhau và không liền kề." 
                : "Chọn 1 buổi tập hàng tuần làm lịch cố định."}
            </p>
            {individualScheduleOptions.map((slot) => {
              const isSelected = selectedSlots.includes(slot);
              return (
                <button
                  key={slot}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                    isSelected ? "border-[#EF233C] bg-[#EF233C]/10 text-white" : "border-white/8 bg-[#222] text-white/60 hover:border-[#EF233C]/45"
                  }`}
                  type="button"
                  onClick={() => {
                    if (sessionsPerWeek === 2) {
                      if (selectedSlots.includes(slot)) {
                        setSelectedSlots(selectedSlots.filter(s => s !== slot));
                      } else {
                        if (selectedSlots.length < 2) {
                          setSelectedSlots([...selectedSlots, slot]);
                        } else {
                          setSelectedSlots([selectedSlots[1], slot]);
                        }
                      }
                    } else {
                      setSelectedSlots([slot]);
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span>{slot}</span>
                    {isSelected && (
                      <span className="text-xs font-black text-[#EF233C] uppercase tracking-wider bg-[#EF233C]/15 px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            
            {sessionsPerWeek === 2 && selectedSlots.length === 2 && !isScheduleValid && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-200 leading-5">
                ⚠ Vui lòng chọn 2 buổi tập khác ngày nhau và không liền kề (ví dụ: Thứ Hai và Thứ Tư, tránh Thứ Hai và Thứ Ba).
              </div>
            )}
            
            <PrimaryButton className="mt-3 w-full" disabled={!canConfirm || isCreatingRequest} onClick={confirmTrainer}>
              {isCreatingRequest ? "Creating Request..." : "Confirm Trainer and Schedule"}
            </PrimaryButton>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

export function OnboardingPaymentPage() {
  const navigate = useNavigate();
  const [state, save] = useOnboardingState();
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  if (!state.selectedPackage) {
    return <Navigate to="/onboarding/packages" replace />;
  }

  const completePayment = async () => {
    const transactionCode = `GYMSTER-${Date.now()}`;
    const paymentDate = new Date().toISOString();
    const currentUser = getCurrentUser();
    const payment = {
      paymentId: `PAY-${Date.now()}`,
      paymentMethod,
      paymentStatus: "Paid",
      amount: state.selectedPackage.price,
      paidAt: paymentDate,
      paymentDate,
      transactionCode,
    };

	    setIsCreatingPayment(true);
	    setPaymentError("");

	    const demoStartDate = toDateInputValue(new Date(paymentDate));
	    const demoEndDate = toDateInputValue(addMonths(new Date(paymentDate), getPackageDurationMonths(state.selectedPackage)));
	    const demoRemainingSessions = state.selectedPackage.sessionLimitValue ?? state.memberPackage?.remainingSessions ?? null;
	    let resolvedMemberPackageId = state.memberPackageId || state.memberPackage?.memberPackageId;
    let activeMemberId = state.memberId || currentUser?.memberId || currentUser?.member_id;

	    if (!resolvedMemberPackageId) {
	      const createdPackage = await createMemberPackage({
	        memberId: state.memberId || currentUser?.memberId || currentUser?.member_id,
	        memberEmail: currentUser?.email || "",
	        packageId: state.selectedPackage.id,
	        trainerId: state.selectedTrainer?.id || null,
	        status: "pending_payment",
	        remainingSessions: demoRemainingSessions,
	      });

	      if (createdPackage.error || !createdPackage.data?.memberPackageId) {
	        setPaymentError("Package could not be created for this payment.");
	        setIsCreatingPayment(false);
	        return;
	      }

	      resolvedMemberPackageId = createdPackage.data.memberPackageId;
        activeMemberId = createdPackage.data.memberId || activeMemberId;
	    }

	    const { data, error } = await createPayment({
	      memberId: activeMemberId,
	      memberEmail: currentUser?.email || "",
	      packageId: state.selectedPackage.id,
	      memberPackageId: resolvedMemberPackageId,
      trainingRequestId: state.trainingRequestId,
      amount: state.selectedPackage.price,
      paymentMethod,
      paymentDate,
      transactionCode,
	      transferContent: `GYMSTER ${state.selectedPackage.id}`,
	    });

	    if (error) {
	      setPaymentError("Payment could not be saved.");
	      setIsCreatingPayment(false);
	      return;
	    }

	    if (state.trainingRequestId && (state.trainingRequest?.status === "accepted" || state.trainingRequest?.status === "Approved")) {
      await updateTrainingRequestStatus(state.trainingRequestId, "completed");
    }

	    const startDate = demoStartDate;
	    const endDate = demoEndDate;
	    const memberPackageId = resolvedMemberPackageId;
	    const remainingSessions = demoRemainingSessions;
    let activatedMemberPackage = null;

	    if (memberPackageId) {
	      const { data: memberPackageData, error: packageUpdateError } = await updateMemberPackageStatus(memberPackageId, "active", {
	        start_date: startDate,
	        end_date: endDate,
	        remaining_sessions: remainingSessions,
	        used_sessions: 0,
	      });
	      if (packageUpdateError) {
	        setPaymentError("Payment was saved, but package information could not be activated.");
	        setIsCreatingPayment(false);
	        return;
	      }
	      activatedMemberPackage = memberPackageData;
	    }

	    const activationResult = await activateMemberAccount(currentUser);
	    if (!activationResult.ok) {
	      setPaymentError(activationResult.message || "Payment was saved, but the account could not be activated.");
	      setIsCreatingPayment(false);
	      return;
	    }
	    if (activationResult.user) {
	      setCurrentUser(activationResult.user);
	    }

	    let workoutSessions = [];
    activeMemberId = activatedMemberPackage?.memberId
      || activeMemberId
      || activationResult.user?.memberId
      || activationResult.user?.member_id;
    const memberDisplayName = activationResult.user?.fullName
      || activationResult.user?.full_name
      || currentUser?.fullName
      || currentUser?.full_name
      || currentUser?.username
      || "Th\u00e0nh vi\u00ean m\u1edbi";

    if (state.selectedPackage.hasPersonalTrainer && state.selectedTrainer && state.selectedSchedule) {
      // Create trainer assignment in trainer_assignments table
      await assignTrainerToMember(activeMemberId, state.selectedTrainer.id, "Assigned during onboarding registration");

      // Notify the trainer
      if (state.selectedTrainer.userId) {
        await createNotification({
          userId: state.selectedTrainer.userId,
          notificationType: "system",
          title: "H\u1ed9i vi\u00ean m\u1edbi \u0111\u0103ng k\u00fd",
          message: `B\u1ea1n c\u00f3 h\u1ed9i vi\u00ean m\u1edbi \u0111\u0103ng k\u00fd g\u00f3i t\u1eadp: ${memberDisplayName}`,
          actionType: "new_pt_member",
          actionPayload: {
            memberId: activeMemberId,
            packageId: state.selectedPackage.id,
            packageName: state.selectedPackage.name,
            trainerId: state.selectedTrainer.id,
          },
        });
      }

      const { data: createdSessions } = await createWorkoutSessionsForSchedule({
        memberId: activeMemberId,
        memberEmail: currentUser?.email || "",
        trainerId: state.selectedTrainer.id,
        packageId: state.selectedPackage.id,
        memberPackageId,
        selectedSchedule: state.selectedSchedule,
        startDate,
        endDate,
      });
      workoutSessions = createdSessions;

      await createNotification({
        notificationType: "system",
        title: "Thông tin PT của bạn",
        message: [
          `PT: ${state.selectedTrainer.name}`,
          state.selectedTrainer.specialty ? `Chuyên môn: ${state.selectedTrainer.specialty}` : "",
          state.selectedTrainer.rating ? `Đánh giá: ${state.selectedTrainer.rating}/5` : "",
          state.selectedSchedule ? `Lịch tập: ${state.selectedSchedule}` : "",
        ].filter(Boolean).join(" | "),
      });
    }

    setIsCreatingPayment(false);

    if (error) {
      setPaymentError("Payment could not be saved.");
    }

    const savedPayment = data || payment;

    save({
      accountStatus: ACCOUNT_STATUSES.Active,
      paymentId: data?.paymentId || null,
      payment: savedPayment,
      memberPackage: activatedMemberPackage || {
        memberPackageId,
        packageId: state.selectedPackage.id,
        packageName: state.selectedPackage.name,
        status: "Active",
        startDate,
        endDate,
        remainingSessions,
        activatedAt: paymentDate,
      },
      trainingRequest: state.trainingRequest ? { ...state.trainingRequest, status: "completed" } : null,
      workoutSessions,
    });
    navigate("/onboarding/success");
  };

  return (
    <PageShell>
      <PageHeader title="Complete Payment" subtitle="Complete payment information." />

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Panel title="Payment Details">
          <DetailRow label="Selected package" value={state.selectedPackage.name} />
          <DetailRow label="Package price" value={formatVnd(state.selectedPackage.price)} />
          <DetailRow label="Selected trainer" value={state.selectedTrainer?.name} />
          <DetailRow label="Selected schedule" value={state.selectedSchedule} />
          <DetailRow label="Total amount" value={formatVnd(state.selectedPackage.price)} />
        </Panel>

        <Panel title="Payment Method">
          {paymentError ? (
            <div className="mb-4 rounded-xl border border-[#EF233C]/35 bg-[#2a1115]/90 p-4 text-sm font-bold text-red-100">
              {paymentError}
            </div>
          ) : null}

          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
                  paymentMethod === method ? "border-[#EF233C] bg-[#EF233C]/10 text-white" : "border-white/8 bg-[#222] text-white/60 hover:border-[#EF233C]/45"
                }`}
                type="button"
                onClick={() => setPaymentMethod(method)}
              >
                <CreditCard className="h-4 w-4 text-[#ff6b7a]" />
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === "Bank Transfer" ? (
            <div className="mt-5 rounded-2xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-4">
              <div className="mb-3 text-sm font-black text-white">QR Payment</div>
              <DetailRow label="Bank name" value="Gymster Bank" />
              <DetailRow label="Account number" value="8888 2026 0517" />
              <DetailRow label="Transfer content" value={`GYMSTER ${state.selectedPackage.id}`} />
              <DetailRow label="Amount" value={formatVnd(state.selectedPackage.price)} />
              <div className="mt-4 flex h-44 items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/25">
                <div className="text-center">
                  <QrCode className="mx-auto h-16 w-16 text-white/45" />
                  <div className="mt-2 text-xs font-bold text-white/45">Payment QR code</div>
                </div>
              </div>
            </div>
          ) : null}

          <PrimaryButton className="mt-5 w-full" disabled={isCreatingPayment} onClick={completePayment}>
            {isCreatingPayment ? "Creating Payment..." : "Simulate Payment Success"}
          </PrimaryButton>
        </Panel>
      </div>
    </PageShell>
  );
}

export function OnboardingSuccessPage() {
  const navigate = useNavigate();
  const [state] = useOnboardingState();

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <Panel>
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-black text-white">Your membership has been activated successfully.</h1>
            <p className="mt-3 text-sm text-white/55">You can now access the Member Portal.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/8 bg-[#222] p-5">
            <DetailRow label="Selected package" value={state.selectedPackage?.name} />
            <DetailRow label="Trainer" value={state.selectedTrainer?.name} />
            <DetailRow label="Schedule" value={state.selectedSchedule} />
            <DetailRow label="Payment status" value={state.payment?.paymentStatus || "Paid"} />
          </div>

          <PrimaryButton className="mt-6 w-full" onClick={() => navigate(dashboardPath)}>Go to Dashboard</PrimaryButton>
        </Panel>
      </div>
    </PageShell>
  );
}
