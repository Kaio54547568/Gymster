import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { createMemberComplaint, createMemberServiceFeedback, getMemberFeedbackPortalData } from '../../../services/memberEngagementApi';
import Section from '../components/Section';

function RateServiceOld() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">Rate Service</h1>
      <Section title="Send Feedback">
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="rounded-xl border border-[#EF233C]/30 p-3 text-[#EF233C]">
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
          </div>
          <textarea className="min-h-40 w-full rounded-xl border border-white/10 bg-[#222] p-4 text-sm text-white outline-none focus:border-[#EF233C]/50" placeholder="Share your feedback..." />
          <button className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white">Submit Feedback</button>
        </div>
      </Section>
    </div>
  );
}

export default function RateServicePage() {
  type ServiceType = 'Overall Service' | 'Trainer' | 'Workout Session' | 'Equipment' | 'Facilities' | 'Customer Support';
  type FeedbackStatus = 'Submitted' | 'In Review' | 'Resolved' | 'Rejected';
  type ComplaintStatus = 'Submitted' | 'In Review' | 'Resolved' | 'Rejected';

  const serviceTypes: ServiceType[] = ['Overall Service', 'Trainer', 'Workout Session', 'Equipment', 'Facilities', 'Customer Support'];
  const complaintTypes = ['Trainer', 'Workout Session', 'Equipment', 'Facilities', 'Overall Service', 'Customer Support'];
  const ratingLabels = ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
  const ratingCriteria = ['Trainer attitude', 'Training quality', 'Equipment condition', 'Cleanliness', 'Staff support'];
  const [trainerTargets, setTrainerTargets] = useState<string[]>([]);
  const [recentSessions, setRecentSessions] = useState<string[]>([]);
  const [equipmentRooms, setEquipmentRooms] = useState<string[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<Array<{ target: string; date: string; rating: number; comment: string; status: FeedbackStatus; response?: string }>>([]);
  const [recentComplaints, setRecentComplaints] = useState<Array<{ type: string; target: string; date: string; description: string; status: ComplaintStatus; response?: string }>>([]);
  const [loadMessage, setLoadMessage] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [relatedTarget, setRelatedTarget] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ type: '', target: '', description: '' });

  const isLowRating = overallRating > 0 && overallRating <= 2;
  const canSubmit = Boolean(serviceType && overallRating && (!isLowRating || comment.trim().length > 0));

  const loadFeedbackData = async () => {
    const { data, error } = await getMemberFeedbackPortalData();
    if (error || !data) {
      setLoadMessage('Feedback data could not be loaded.');
      return;
    }
    setLoadMessage('');
    setTrainerTargets(data.trainers || []);
    setRecentSessions(data.sessions || []);
    setEquipmentRooms(data.equipmentRooms || []);
    setRecentFeedback(data.feedback || []);
    setRecentComplaints(data.complaints || []);
  };

  useEffect(() => {
    void loadFeedbackData();
    window.addEventListener('gymster:feedback-updated', loadFeedbackData);
    return () => window.removeEventListener('gymster:feedback-updated', loadFeedbackData);
  }, []);

  const submitFeedback = async () => {
    const { error } = await createMemberServiceFeedback({
      serviceType,
      rating: overallRating,
      comment,
      target: relatedTarget,
    });
    if (error) {
      setSubmitMessage('Feedback could not be saved.');
      return;
    }
    setSubmitMessage('Feedback saved.');
    setServiceType('');
    setRelatedTarget('');
    setOverallRating(0);
    setCriteriaRatings({});
    setComment('');
    await loadFeedbackData();
  };

  const submitComplaint = async () => {
    const { error } = await createMemberComplaint(complaintForm);
    if (error) {
      setSubmitMessage('Complaint could not be saved.');
      return;
    }
    setSubmitMessage('Complaint saved.');
    setComplaintForm({ type: '', target: '', description: '' });
    setShowComplaintModal(false);
    await loadFeedbackData();
  };

  const getTargets = () => {
    if (serviceType === 'Trainer') return trainerTargets;
    if (serviceType === 'Workout Session') return recentSessions;
    if (serviceType === 'Equipment') return equipmentRooms;
    return [];
  };

  const getComplaintTargets = () => {
    if (complaintForm.type === 'Trainer') return trainerTargets;
    if (complaintForm.type === 'Workout Session') return recentSessions;
    if (complaintForm.type === 'Equipment') return equipmentRooms;
    if (complaintForm.type === 'Facilities') return ['Locker Room', 'Shower Area', 'Parking Area', 'Reception'];
    if (complaintForm.type === 'Customer Support') return ['Front desk', 'Hotline', 'Billing support'];
    if (complaintForm.type === 'Overall Service') return ['Gymster service experience'];
    return [];
  };

  const getFeedbackBadgeClass = (status: FeedbackStatus) => {
    if (status === 'Submitted') return 'bg-[#EF233C]/15 text-[#EF233C] ring-1 ring-[#EF233C]/25';
    if (status === 'In Review') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
    if (status === 'Resolved') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
    return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
  };

  const targetOptions = getTargets();
  const complaintTargets = getComplaintTargets();
  const canSendComplaint = Boolean(complaintForm.type && complaintForm.target && complaintForm.description.trim());

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Rate Service</h1>
        <p className="mt-1 text-sm text-white/50">Share your experience so Gymster can improve your training journey.</p>
      </div>
      {loadMessage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{loadMessage}</div>}
      {submitMessage && <div className="rounded-2xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">{submitMessage}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Section title="Send Feedback">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-white">Service type</label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {serviceTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setServiceType(type);
                      setRelatedTarget('');
                    }}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                      serviceType === type ? 'border-[#EF233C] bg-[#EF233C]/10 text-white' : 'border-white/8 bg-[#222] text-white/65 hover:border-[#EF233C]/40 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {targetOptions.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  {serviceType === 'Trainer' ? 'Select trainer' : serviceType === 'Workout Session' ? 'Select recent session' : 'Select equipment / room'}
                </label>
                <select
                  value={relatedTarget}
                  onChange={(event) => setRelatedTarget(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
                >
                  <option value="">Choose an option</option>
                  {targetOptions.map((target) => (
                    <option key={target} value={target}>{target}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-bold text-white">Overall rating</label>
                {overallRating > 0 && <span className="text-sm font-bold text-[#EF233C]">{overallRating} {ratingLabels[overallRating - 1]}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      overallRating >= star ? 'border-[#EF233C] bg-[#EF233C]/15 text-[#EF233C]' : 'border-white/10 bg-[#222] text-white/45 hover:text-white'
                    }`}
                  >
                    <Star className={`h-5 w-5 ${overallRating >= star ? 'fill-current' : ''}`} />
                    <span>{star}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-white">Rating criteria</label>
              <div className="grid gap-3 md:grid-cols-2">
                {ratingCriteria.map((criteria) => (
                  <div key={criteria} className="rounded-xl border border-white/8 bg-[#222] p-4">
                    <div className="mb-3 text-sm font-bold text-white">{criteria}</div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCriteriaRatings((current) => ({ ...current, [criteria]: star }))}
                          className={`rounded-lg p-1.5 ${Number(criteriaRatings[criteria] ?? 0) >= star ? 'text-[#EF233C]' : 'text-white/25 hover:text-white/60'}`}
                          aria-label={`${criteria} ${star} stars`}
                        >
                          <Star className={`h-4 w-4 ${Number(criteriaRatings[criteria] ?? 0) >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between gap-3">
                <label className="text-sm font-bold text-white" htmlFor="feedback-comment">Tell us more</label>
                <span className={`text-xs font-bold ${comment.length > 500 ? 'text-red-300' : 'text-white/40'}`}>{comment.length}/500</span>
              </div>
              <textarea
                id="feedback-comment"
                className="min-h-40 w-full rounded-xl border border-white/10 bg-[#222] p-4 text-sm text-white outline-none focus:border-[#EF233C]/50"
                placeholder="Tell us more about your experience..."
                maxLength={500}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              {isLowRating && !comment.trim() && (
                <p className="mt-2 text-xs font-bold text-amber-300">Feedback text is required for 1 or 2 star ratings.</p>
              )}
            </div>

            <button
              className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              type="button"
              disabled={!canSubmit}
              onClick={submitFeedback}
            >
              Submit Feedback
            </button>
            <button
              className="rounded-xl border border-[#EF233C]/35 bg-[#EF233C]/10 px-5 py-3 text-sm font-bold text-[#EF233C] transition hover:bg-[#EF233C]/20"
              type="button"
              onClick={() => setShowComplaintModal(true)}
            >
              Send Complaint
            </button>
          </div>
        </Section>

        <div className="grid min-h-[720px] gap-6">
          <Section title="My Recent Feedback">
            <div className="max-h-[320px] space-y-4 overflow-y-auto pr-1">
              {recentFeedback.map((feedback) => (
                <article key={`${feedback.target}-${feedback.date}`} className="rounded-2xl border border-white/8 bg-[#222] p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-white">{feedback.target}</h3>
                      <p className="mt-1 text-xs text-white/45">{feedback.date}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${getFeedbackBadgeClass(feedback.status)}`}>{feedback.status}</span>
                  </div>
                  <div className="mb-3 flex gap-1 text-[#EF233C]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${feedback.rating >= star ? 'fill-current' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-white/65">{feedback.comment}</p>
                  {feedback.response && (
                    <div className="mt-3 rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-3 text-sm text-white/70">
                      <span className="font-bold text-[#EF233C]">Gym response: </span>{feedback.response}
                    </div>
                  )}
                </article>
              ))}
              {!recentFeedback.length && <div className="rounded-2xl border border-white/8 bg-[#222] p-6 text-center text-sm font-bold text-white/45">No feedback yet.</div>}
            </div>
          </Section>

          <Section title="My Recent Complaints">
            <div className="max-h-[320px] space-y-4 overflow-y-auto pr-1">
              {recentComplaints.map((complaint) => (
                <article key={`${complaint.type}-${complaint.date}`} className="rounded-2xl border border-white/8 bg-[#222] p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-white">{complaint.type}</h3>
                      <p className="mt-1 text-xs text-white/45">{complaint.target} - {complaint.date}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${getFeedbackBadgeClass(complaint.status)}`}>{complaint.status}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/65">{complaint.description}</p>
                  {complaint.response && (
                    <div className="mt-3 rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-3 text-sm text-white/70">
                      <span className="font-bold text-[#EF233C]">Staff response: </span>{complaint.response}
                    </div>
                  )}
                </article>
              ))}
              {!recentComplaints.length && <div className="rounded-2xl border border-white/8 bg-[#222] p-6 text-center text-sm font-bold text-white/45">No complaints yet.</div>}
            </div>
          </Section>
        </div>
      </div>

      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[#EF233C]/30 bg-[#111] p-6 shadow-2xl shadow-black/50">
            <div className="mb-5">
              <h2 className="text-3xl font-black text-white">Send Complaint</h2>
              <p className="mt-1 text-sm text-white/50">Use this for serious issues that need staff review.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white">Complaint type</label>
                <select
                  value={complaintForm.type}
                  onChange={(event) => setComplaintForm({ type: event.target.value, target: '', description: complaintForm.description })}
                  className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
                >
                  <option value="">Choose complaint type</option>
                  {complaintTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white">Related target</label>
                <select
                  value={complaintForm.target}
                  onChange={(event) => setComplaintForm({ ...complaintForm, target: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
                  disabled={!complaintForm.type}
                >
                  <option value="">Choose related target</option>
                  {complaintTargets.map((target) => <option key={target} value={target}>{target}</option>)}
                </select>
              </div>

              <div>
                <div className="mb-2 flex justify-between gap-3">
                  <label className="text-sm font-bold text-white" htmlFor="complaint-description">Description</label>
                  <span className="text-xs font-bold text-white/40">{complaintForm.description.length}/500</span>
                </div>
                <textarea
                  id="complaint-description"
                  value={complaintForm.description}
                  onChange={(event) => setComplaintForm({ ...complaintForm, description: event.target.value })}
                  maxLength={500}
                  placeholder="Describe the serious issue..."
                  className="min-h-36 w-full rounded-xl border border-white/10 bg-[#222] p-4 text-sm text-white outline-none focus:border-[#EF233C]/50"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!canSendComplaint}
                onClick={submitComplaint}
                className="flex-1 rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                Submit Complaint
              </button>
              <button type="button" onClick={() => setShowComplaintModal(false)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
