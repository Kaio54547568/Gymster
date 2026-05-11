import { useState } from 'react';
import { Bell, Globe, Lock, Mail, Moon, Phone, Shield, Sun } from 'lucide-react';
import { useAppearance } from './AppearanceContext';
import { useLanguage, type AppLanguage } from './LanguageContext';

type AccountSettingsProps = {
  eyebrow: string;
  title: string;
  description: string;
  accountName: string;
  roleLabel: string;
  primaryEmail: string;
  phoneNumber: string;
};

export default function AccountSettings({
  eyebrow,
  title,
  description,
  accountName,
  roleLabel,
  primaryEmail,
  phoneNumber,
}: AccountSettingsProps) {
  const { darkMode, setDarkMode } = useAppearance();
  const { language, setLanguage } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mainEmail, setMainEmail] = useState(primaryEmail);
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [phone, setPhone] = useState(phoneNumber);

  const addEmail = () => {
    const email = newEmail.trim();
    if (!email) return;
    setExtraEmails((current) => [...current, email]);
    setNewEmail('');
  };

  return (
    <div className="min-h-full px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-[#EF233C]/20 bg-[#0c1014]/90 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#EF233C]">{eyebrow}</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white">{accountName}</span>
            <span className="rounded-full border border-[#EF233C]/25 bg-[#EF233C]/10 px-4 py-2 font-semibold text-[#EF233C]">{roleLabel}</span>
          </div>
        </div>

        <section className="rounded-2xl border border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3 border-b border-white/8 px-6 py-5">
            <Bell className="h-5 w-5 text-[#EF233C]" />
            <h2 className="text-lg font-bold text-white">Notification Preferences</h2>
          </div>
          <div className="space-y-3 p-6">
            {[
              ['Email Notifications', 'Receive important account and operation updates via email'],
              ['Membership Expiring Alerts', 'Alert when member packages are about to expire'],
              ['Payment Completed', 'Notify when payments are successfully processed'],
            ].map(([label, desc], index) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-white/8 bg-[#222] p-4">
                <div>
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <div className="mt-1 text-xs text-white/45">{desc}</div>
                </div>
                <button type="button" className={`relative h-7 w-14 shrink-0 rounded-full transition-all ${index !== 2 ? 'bg-[#EF233C]' : 'bg-white/10'}`}>
                  <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${index !== 2 ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3 border-b border-white/8 px-6 py-5">
            <Lock className="h-5 w-5 text-[#EF233C]" />
            <h2 className="text-lg font-bold text-white">Change Password</h2>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3">
            {[
              ['Current Password', currentPassword, setCurrentPassword],
              ['New Password', newPassword, setNewPassword],
              ['Confirm New Password', confirmPassword, setConfirmPassword],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="text-xs font-bold uppercase tracking-wide text-white/55">
                {label as string}
                <input
                  type="password"
                  value={value as string}
                  onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#EF233C]/60"
                />
              </label>
            ))}
            <div className="md:col-span-3">
              <button type="button" className="rounded-xl border border-[#EF233C]/40 px-5 py-3 text-sm font-bold text-[#EF233C] transition-colors hover:bg-[#EF233C]/10">
                Update Password
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3 border-b border-white/8 px-6 py-5">
            {darkMode ? <Moon className="h-5 w-5 text-[#EF233C]" /> : <Sun className="h-5 w-5 text-[#2563EB]" />}
            <h2 className="text-lg font-bold text-white">Display</h2>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <div className="text-sm font-semibold text-white">Dark mode</div>
              <div className="mt-1 text-xs text-white/45">Turn off to use the light interface with blue as the primary color.</div>
            </div>
            <button type="button" onClick={() => setDarkMode(!darkMode)} className={`relative h-8 w-16 shrink-0 rounded-full transition-all ${darkMode ? 'bg-[#EF233C]' : 'bg-[#2563EB]'}`}>
              <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-8' : 'translate-x-0'}`} />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3 border-b border-white/8 px-6 py-5">
            <Globe className="h-5 w-5 text-[#EF233C]" />
            <h2 className="text-lg font-bold text-white">Language Preferences</h2>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {[
              { code: 'en', name: 'English', helper: 'Use English across the system' },
              { code: 'vi', name: 'Tiếng Việt', helper: 'Sử dụng tiếng Việt cho toàn hệ thống' },
            ].map((item) => (
              <button
                type="button"
                key={item.code}
                onClick={() => setLanguage(item.code as AppLanguage)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  language === item.code
                    ? 'border-[#EF233C] bg-[#EF233C]/10 text-[#EF233C]'
                    : 'border-white/8 bg-[#222] text-white hover:border-[#EF233C]/40'
                }`}
              >
                <div className="text-sm font-bold">{item.name}</div>
                <div className="mt-1 text-xs text-white/45">{item.helper}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3 border-b border-white/8 px-6 py-5">
            <Mail className="h-5 w-5 text-[#EF233C]" />
            <h2 className="text-lg font-bold text-white">Contact info</h2>
          </div>
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-white/8 bg-[#222] p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                <Mail className="h-4 w-4 text-[#EF233C]" />
                Email addresses
              </div>
              <label className="text-xs font-bold uppercase tracking-wide text-white/55">
                Primary email
                <input value={mainEmail} onChange={(event) => setMainEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60" />
              </label>
              <div className="mt-3 space-y-2">
                {extraEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between rounded-lg bg-[#181818] px-3 py-2 text-sm text-white">
                    <span>{email}</span>
                    <button type="button" className="text-xs font-semibold text-[#EF233C]" onClick={() => setExtraEmails((current) => current.filter((item) => item !== email))}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Add email address" className="flex-1 rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60" />
                <button type="button" className="rounded-xl border border-[#EF233C]/40 px-5 py-3 text-sm font-bold text-[#EF233C] hover:bg-[#EF233C]/10" onClick={addEmail}>Add</button>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#222] p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                <Phone className="h-4 w-4 text-[#EF233C]" />
                Phone numbers
              </div>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60" />
            </div>

            <button type="button" className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#990000]">
              Save Contact Info
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-6">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EF233C]/15">
              <Shield className="h-6 w-6 text-[#EF233C]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Account Permissions</h3>
              <p className="mt-1 text-sm leading-6 text-white/65">
                Permission changes are managed by the system administrator. Contact support if this account needs a role update.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
