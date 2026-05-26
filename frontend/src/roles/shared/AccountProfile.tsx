import { useEffect, useRef, useState } from 'react';
import { Camera, Edit2, Mail, Phone, Save, User, X } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../../services/authService';
import { updateCurrentUserProfile, uploadCurrentUserAvatar } from '../../services/userProfileApi';

type AccountProfileProps = {
  title: string;
  subtitle: string;
  firstName: string;
  lastName: string;
  roleLabel: string;
  dob: string;
  headline: string;
  email: string;
  phone: string;
  initials: string;
  avatarUrl?: string;
};

export default function AccountProfile({
  title,
  subtitle,
  firstName: initialFirstName,
  lastName: initialLastName,
  roleLabel,
  dob: initialDob,
  headline: initialHeadline,
  email,
  phone,
  initials,
  avatarUrl: initialAvatarUrl = '',
}: AccountProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [dob, setDob] = useState(initialDob);
  const [headline, setHeadline] = useState(initialHeadline);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const displayTitle = [firstName, lastName].filter(Boolean).join(' ').trim() || title;

  useEffect(() => {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setDob(initialDob);
    setHeadline(initialHeadline);
  }, [initialFirstName, initialLastName, initialDob, initialHeadline]);

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  const fieldClass = `mt-2 w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none transition-colors ${
    editing ? 'focus:border-[#EF233C]/60' : 'cursor-not-allowed opacity-70'
  }`;

  const cancelEdit = () => {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setDob(initialDob);
    setHeadline(initialHeadline);
    setStatusMessage('');
    setEditing(false);
  };

  const saveProfile = async () => {
    setStatusMessage('');
    const result = await updateCurrentUserProfile(getCurrentUser(), {
      firstName,
      lastName,
      dob,
      headline,
    });

    setStatusMessage(result.message);

    if (result.ok) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          firstName,
          lastName,
          fullName: [firstName, lastName].filter(Boolean).join(' ').trim(),
          dob,
          date_of_birth: dob,
        });
      }
      setEditing(false);
    }
  };

  const uploadAvatar = async (file?: File) => {
    if (!file) return;

    setIsUploadingAvatar(true);
    setStatusMessage('');
    const result = await uploadCurrentUserAvatar(getCurrentUser(), file);
    setIsUploadingAvatar(false);
    setStatusMessage(result.message);

    if (result.ok && result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      const currentUser = getCurrentUser();
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          avatarUrl: result.avatarUrl,
          avatar_url: result.avatarUrl,
        });
      }
    }
  };

  return (
    <div className="min-h-full px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-[#EF233C]/20 bg-[#0c1014]/90 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#EF233C]">{subtitle}</p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[#EF233C]/25 bg-[#EF233C]/15 text-3xl font-black text-[#EF233C] shadow-[0_20px_50px_rgba(239,35,60,0.18)]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`${displayTitle} avatar`} className="h-full w-full rounded-3xl object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => uploadAvatar(event.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#EF233C] text-white shadow-lg shadow-[#EF233C]/30 disabled:cursor-not-allowed disabled:bg-white/20"
                  aria-label="Upload avatar"
                >
                  {isUploadingAvatar ? <span className="text-xs font-black">...</span> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight text-white">{displayTitle}</h1>
                <p className="mt-2 text-sm font-semibold text-[#EF233C]">{roleLabel}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{headline}</p>
              </div>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/5" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white hover:bg-[#990000]" onClick={saveProfile}>
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            ) : (
              <button className="flex items-center gap-2 rounded-xl border border-[#EF233C]/40 px-4 py-3 text-sm font-bold text-[#EF233C] hover:bg-[#EF233C]/10" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          {statusMessage && <p className="mt-4 text-xs font-semibold text-white/55">{statusMessage}</p>}
        </div>

        <section className="rounded-2xl border border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3 border-b border-white/8 px-6 py-5">
            <User className="h-5 w-5 text-[#EF233C]" />
            <h2 className="text-lg font-bold text-white">Personal Information</h2>
          </div>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wide text-white/55">
              First name
              <input className={fieldClass} value={firstName} disabled={!editing} onChange={(event) => setFirstName(event.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-white/55">
              Last name
              <input className={fieldClass} value={lastName} disabled={!editing} onChange={(event) => setLastName(event.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-white/55">
              Role
              <input className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white opacity-70" value={roleLabel} disabled />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-white/55">
              Dob
              <input type="date" className={fieldClass} value={dob} disabled={!editing} onChange={(event) => setDob(event.target.value)} />
            </label>
            <label className="md:col-span-2 text-xs font-bold uppercase tracking-wide text-white/55">
              Headlines
              <textarea className={`${fieldClass} min-h-28 resize-none`} value={headline} disabled={!editing} onChange={(event) => setHeadline(event.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#181818] p-6">
          <h2 className="text-lg font-bold text-white">Contact info</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#222] p-4 text-sm text-white/75">
              <Mail className="h-4 w-4 text-[#EF233C]" />
              {email}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#222] p-4 text-sm text-white/75">
              <Phone className="h-4 w-4 text-[#EF233C]" />
              {phone}
            </div>
          </div>
          <p className="mt-3 text-xs text-white/45">Email and phone number are edited in Settings.</p>
        </section>
      </div>
    </div>
  );
}
