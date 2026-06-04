import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { fetchTrainersFromSupabase } from '../../../services/trainerApi';
import Section from '../components/Section';
import { useMemberTrainingRequests } from '../hooks/useMemberTrainingRequests';

export default function TrainerListPage() {
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [trainerLoadMessage, setTrainerLoadMessage] = useState('');
  const { requests: memberRequests, isLoadingRequests, requestLoadMessage } = useMemberTrainingRequests();
  const trackedRequests = memberRequests.filter((request) => ['Pending Approval', 'Accepted', 'Declined', 'Completed'].includes(request.statusLabel) || ['Pending Approval', 'Accepted', 'Declined', 'Completed'].includes(request.status) || ['pending_pt_approval', 'accepted', 'approved', 'declined', 'completed'].includes(request.rawStatus || request.status));
  const declinedRequests = trackedRequests.filter((request) => request.status === 'declined' || request.statusLabel === 'Declined' || request.status === 'Declined' || request.rawStatus === 'declined');
  const notifications: any[] = [];

  useEffect(() => {
    let isMounted = true;
    fetchTrainersFromSupabase().then(({ data, error }) => {
      if (!isMounted) return;
      setAvailableTrainers(data.filter((trainer: any) => trainer.currentActiveMembers < trainer.maxActiveMembers));
      setTrainerLoadMessage(error ? 'Trainer list could not be loaded.' : '');
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">Trainers</h1>
      {trainerLoadMessage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{trainerLoadMessage}</div>}
      {(isLoadingRequests || requestLoadMessage || trackedRequests.length > 0 || notifications.length > 0) && (
        <Section title="Trainer Request Status">
          {isLoadingRequests && <div className="mb-3 rounded-xl border border-white/8 bg-[#222] p-4 text-sm font-bold text-white/45">Loading trainer request status...</div>}
          {requestLoadMessage && !isLoadingRequests && <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{requestLoadMessage}</div>}
          <div className="grid gap-3 lg:grid-cols-2">
            {trackedRequests.filter((request) => request.status !== 'declined' && request.statusLabel !== 'Declined' && request.status !== 'Declined' && request.rawStatus !== 'declined').slice(0, 2).map((request) => (
              <div key={request.id} className="rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4">
                <div className="text-sm font-black text-[#EF233C]">{request.statusLabel || request.status}</div>
                <div className="mt-1 text-sm text-white/70">{request.trainerName} request for {request.preferredSchedule || 'selected schedule'}.</div>
                <div className="mt-2 text-xs text-white/45">Created: {request.createdDate || 'Recently'}</div>
              </div>
            ))}
            {declinedRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="text-sm font-black text-amber-300">{request.type === 'reschedule' ? 'Reschedule declined' : 'Assignment declined'}</div>
                <div className="mt-1 text-sm text-white/70">{request.trainerName} declined the request.</div>
                {request.declineReason && <div className="mt-2 text-xs text-white/50">Reason: {request.declineReason}</div>}
                <div className="mt-3 text-xs font-bold text-[#EF233C]">Please choose another trainer or another schedule.</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {availableTrainers.map((trainer) => (
          <div key={trainer.name} className="rounded-2xl border border-white/8 bg-[#181818] p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EF233C]/15 font-black text-[#EF233C]">
              {trainer.name.split(' ').slice(-2).map((part) => part[0]).join('')}
            </div>
            <div className="mt-4 text-lg font-bold text-white">{trainer.name}</div>
            <div className="mt-1 text-sm text-white/50">{trainer.specialty}</div>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/65">
              <span><Star className="mr-1 inline h-4 w-4 text-[#EF233C]" />{trainer.rating}</span>
              <span>{trainer.currentActiveMembers}/{trainer.maxActiveMembers} active members</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${Math.round((trainer.currentActiveMembers / trainer.maxActiveMembers) * 100)}%` }} />
            </div>
            <button className="mt-5 w-full rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white">View Profile</button>
          </div>
        ))}
      </div>
    </div>
  );
}
