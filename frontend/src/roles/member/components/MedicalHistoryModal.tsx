import { useEffect, useState } from 'react';
import { HeartPulse, X } from 'lucide-react';
import { getCurrentMemberMedicalHistory, submitCurrentMemberMedicalHistory } from '../../../services/medicalHistoryApi';
import { getCurrentUser } from '../../../services/authService';

type Props = {
  onClose: () => void;
};

export default function MedicalHistoryModal({ onClose }: Props) {
  const [form, setForm] = useState({
    conditions: '',
    injuries: '',
    allergies: '',
    medications: '',
    emergencyNotes: '',
    clearanceStatus: 'unspecified',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    void getCurrentMemberMedicalHistory(getCurrentUser()).then(({ data }) => {
      if (!mounted || !data) return;
      setForm({
        conditions: data.condition_name || '',
        injuries: data.injury_notes || '',
        allergies: data.allergies || '',
        medications: data.medications || '',
        emergencyNotes: data.emergency_notes || '',
        clearanceStatus: data.clearance_status || 'unspecified',
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    setIsSaving(true);
    const { error } = await submitCurrentMemberMedicalHistory(form, getCurrentUser());
    setIsSaving(false);
    if (error) {
      setMessage(error.message || 'Medical history could not be submitted.');
      return;
    }
    setMessage('Medical history submitted successfully.');
    window.setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.8)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EF233C]/15 text-[#EF233C]">
              <HeartPulse className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Complete medical history</h2>
              <p className="mt-1 text-sm text-white/50">Share relevant information so your trainer can prepare a safe workout plan.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ['Existing conditions', 'conditions'],
            ['Current injuries', 'injuries'],
            ['Allergies', 'allergies'],
            ['Medications', 'medications'],
          ].map(([label, field]) => (
            <label key={field} className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">{label}</span>
              <textarea
                value={form[field as keyof typeof form]}
                onChange={(event) => update(field as keyof typeof form, event.target.value)}
                rows={4}
                placeholder="Leave blank when there is nothing to report"
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none transition focus:border-[#EF233C]/60"
              />
            </label>
          ))}
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Emergency and safety notes</span>
            <textarea value={form.emergencyNotes} onChange={(event) => update('emergencyNotes', event.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none transition focus:border-[#EF233C]/60" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Training clearance</span>
            <select value={form.clearanceStatus} onChange={(event) => update('clearanceStatus', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60">
              <option value="unspecified">Not specified</option>
              <option value="cleared">Cleared for training</option>
              <option value="restricted">Training restrictions apply</option>
              <option value="not_cleared">Not cleared for training</option>
            </select>
          </label>
        </div>

        {message && <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-white/70">{message}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/65 hover:text-white">Cancel</button>
          <button type="button" disabled={isSaving} onClick={submit} className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930] disabled:opacity-60">
            {isSaving ? 'Submitting...' : 'Submit medical history'}
          </button>
        </div>
      </div>
    </div>
  );
}
