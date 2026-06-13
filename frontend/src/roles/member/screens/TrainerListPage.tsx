import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Star, Users, X } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import { getCurrentMemberPackageForUser } from '../../../services/memberPackageApi';
import { fetchTrainersFromSupabase } from '../../../services/trainerApi';
import Section from '../components/Section';
import { useMemberTrainingRequests } from '../hooks/useMemberTrainingRequests';

type TrainerProfile = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  maxActiveMembers: number;
  currentActiveMembers: number;
  status: string;
  avatarUrl?: string;
  bio?: string;
  availableSlots?: Array<{ day?: string; startTime?: string; endTime?: string }>;
};

function trainerInitials(name = 'PT') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PT';
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function formatSlots(slots: TrainerProfile['availableSlots']) {
  if (!slots?.length) return 'Schedule is updated directly with the trainer.';
  return slots
    .slice(0, 3)
    .map((slot) => `${slot.day || 'Available day'} ${slot.startTime || ''}${slot.endTime ? ` - ${slot.endTime}` : ''}`.trim())
    .join(', ');
}

function isSameTrainer(left?: Partial<TrainerProfile> | null, right?: Partial<TrainerProfile> | null) {
  if (!left || !right) return false;
  if (left.id && right.id && left.id === right.id) return true;
  return Boolean(left.name && right.name && normalizeText(left.name) === normalizeText(right.name));
}

function TrainerCard({
  trainer,
  onViewProfile,
  label,
}: {
  trainer: TrainerProfile;
  onViewProfile: (trainer: TrainerProfile) => void;
  label?: string;
}) {
  const usage = trainer.maxActiveMembers > 0
    ? Math.min(100, Math.round((trainer.currentActiveMembers / trainer.maxActiveMembers) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#EF233C]/15 font-black text-[#EF233C]">
          {trainer.avatarUrl ? <img src={trainer.avatarUrl} alt={trainer.name} className="h-full w-full object-cover" /> : trainerInitials(trainer.name)}
        </div>
        {label && <span className="rounded-full border border-[#EF233C]/30 bg-[#EF233C]/10 px-3 py-1 text-xs font-black text-[#FF9AAB]">{label}</span>}
      </div>
      <div className="mt-4 text-lg font-bold text-white">{trainer.name}</div>
      <div className="mt-1 text-sm text-white/50">{trainer.specialty}</div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/65">
        <span><Star className="mr-1 inline h-4 w-4 text-[#EF233C]" />{trainer.rating || 'N/A'}</span>
        <span><Users className="mr-1 inline h-4 w-4 text-[#EF233C]" />{trainer.currentActiveMembers}/{trainer.maxActiveMembers} active members</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${usage}%` }} />
      </div>
      <button
        type="button"
        onClick={() => onViewProfile(trainer)}
        className="mt-5 w-full rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c91930]"
      >
        View Profile
      </button>
    </div>
  );
}

function TrainerProfileModal({ trainer, onClose }: { trainer: TrainerProfile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.85)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#EF233C]/15 text-xl font-black text-[#EF233C]">
              {trainer.avatarUrl ? <img src={trainer.avatarUrl} alt={trainer.name} className="h-full w-full object-cover" /> : trainerInitials(trainer.name)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{trainer.name}</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">{trainer.specialty}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/50 transition hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Rating</div>
            <div className="mt-2 text-xl font-black text-white"><Star className="mr-2 inline h-5 w-5 text-[#EF233C]" />{trainer.rating || 'N/A'}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Active members</div>
            <div className="mt-2 text-xl font-black text-white">{trainer.currentActiveMembers}/{trainer.maxActiveMembers}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-[#222] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Bio</div>
          <p className="mt-2 text-sm leading-6 text-white/70">{trainer.bio || `${trainer.name} is a Gymster trainer focused on ${trainer.specialty}.`}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-[#222] p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/40">
            <CalendarDays className="h-4 w-4 text-[#EF233C]" />
            Availability
          </div>
          <p className="mt-2 text-sm leading-6 text-white/70">{formatSlots(trainer.availableSlots)}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrainerListPage() {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [currentPackage, setCurrentPackage] = useState<any>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);
  const [trainerLoadMessage, setTrainerLoadMessage] = useState('');
  const { requests: memberRequests, isLoadingRequests } = useMemberTrainingRequests();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchTrainersFromSupabase(),
      getCurrentMemberPackageForUser(getCurrentUser()),
    ]).then(([trainerResult, packageResult]) => {
      if (!isMounted) return;
      setTrainers((trainerResult.data || []).filter((trainer: TrainerProfile) => trainer.status !== 'inactive'));
      setCurrentPackage(packageResult.data || null);
      setTrainerLoadMessage(trainerResult.error ? 'Trainer list could not be loaded.' : '');
    }).catch(() => {
      if (!isMounted) return;
      setTrainers([]);
      setCurrentPackage(null);
      setTrainerLoadMessage('Trainer list could not be loaded.');
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentTrainer = useMemo(() => {
    const hasPtPackage = Boolean(currentPackage?.hasPersonalTrainer || normalizeText(currentPackage?.packageType).includes('pt'));
    const trainerId = currentPackage?.trainerId;
    const trainerName = currentPackage?.trainerName;
    if (!hasPtPackage || (!trainerId && !trainerName)) return null;

    const matchedTrainer = trainers.find((trainer) => (
      (trainerId && trainer.id === trainerId) ||
      (trainerName && normalizeText(trainer.name) === normalizeText(trainerName))
    ));

    return matchedTrainer || {
      id: trainerId || `current-${trainerName}`,
      name: trainerName || 'Current Trainer',
      specialty: 'Personal Training',
      rating: 0,
      maxActiveMembers: 0,
      currentActiveMembers: 0,
      status: 'active',
      bio: 'Trainer assigned to your current PT package.',
      availableSlots: [],
    };
  }, [currentPackage, trainers]);

  const activeRequest = useMemo(() => memberRequests.find((request) => (
    currentTrainer &&
    (request.trainerId === currentTrainer.id || normalizeText(request.trainerName) === normalizeText(currentTrainer.name)) &&
    ['pending_pt_approval', 'accepted', 'approved', 'completed'].includes(String(request.rawStatus || request.status || '').toLowerCase())
  )), [currentTrainer, memberRequests]);

  const otherTrainers = useMemo(() => trainers
    .filter((trainer) => !currentTrainer || !isSameTrainer(trainer, currentTrainer))
    .filter((trainer) => trainer.maxActiveMembers <= 0 || trainer.currentActiveMembers < trainer.maxActiveMembers), [currentTrainer, trainers]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">Trainers</h1>
      {trainerLoadMessage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{trainerLoadMessage}</div>}

      {currentTrainer && (
        <Section title="My PT Trainer">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
            <TrainerCard trainer={currentTrainer} onViewProfile={setSelectedTrainer} label="Current trainer" />
            <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40">PT package</div>
              <div className="mt-2 text-xl font-black text-white">{currentPackage?.packageName || 'Current PT package'}</div>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                <div className="rounded-xl bg-[#222] p-3">
                  <div className="text-white/40">Training schedule</div>
                  <div className="mt-1 font-bold text-white">{formatSlots(currentTrainer.availableSlots)}</div>
                </div>
                <div className="rounded-xl bg-[#222] p-3">
                  <div className="text-white/40">Request status</div>
                  <div className="mt-1 font-bold text-white">
                    {isLoadingRequests ? 'Loading...' : activeRequest?.statusLabel || activeRequest?.status || 'No active request'}
                  </div>
                </div>
                <div className="rounded-xl bg-[#222] p-3">
                  <div className="text-white/40">Remaining sessions</div>
                  <div className="mt-1 font-bold text-white">{currentPackage?.remainingSessions ?? currentPackage?.sessionsTotal ?? 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      <div>
        {currentTrainer && <h2 className="mb-4 text-xl font-black text-white">Other Trainers</h2>}
        <div className="grid gap-5 md:grid-cols-3">
          {otherTrainers.map((trainer) => (
            <TrainerCard key={trainer.id || trainer.name} trainer={trainer} onViewProfile={setSelectedTrainer} />
          ))}
        </div>
        {!otherTrainers.length && (
          <div className="rounded-2xl border border-white/8 bg-[#181818] p-6 text-sm font-bold text-white/45">
            No other available trainers right now.
          </div>
        )}
      </div>

      {selectedTrainer && <TrainerProfileModal trainer={selectedTrainer} onClose={() => setSelectedTrainer(null)} />}
    </div>
  );
}
