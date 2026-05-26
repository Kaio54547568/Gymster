import { useEffect, useState } from 'react';
import { Bell, Edit2, Eye, EyeOff, Globe, Lock, Mail, Moon, Phone, Shield, Sun, X } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../../services/authService';
import { updateCurrentUserContactInfo, updateCurrentUserPassword } from '../../services/userProfileApi';
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

type PasswordFieldProps = {
  label: string;
  value: string;
  visible: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
};

function PasswordField({ label, value, visible, disabled, onChange, onToggleVisible }: PasswordFieldProps) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-white/55">
      {label}
      <div className="relative mt-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter password"
          className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 pr-11 text-sm text-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-55 focus:border-[#EF233C]/60"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-[#EF233C] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

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
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [mainEmail, setMainEmail] = useState(primaryEmail);
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [phone, setPhone] = useState(phoneNumber);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    setMainEmail(primaryEmail);
  }, [primaryEmail]);

  useEffect(() => {
    setPhone(phoneNumber);
  }, [phoneNumber]);

  const addEmail = () => {
    const email = newEmail.trim();
    if (!email || !isEditingContact) return;
    setExtraEmails((current) => [...current, email]);
    setNewEmail('');
  };

  const resetPasswordFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVisiblePasswords({});
  };

  const togglePasswordEdit = () => {
    setIsEditingPassword((current) => {
      if (current) resetPasswordFields();
      return !current;
    });
  };

  const toggleContactEdit = () => {
    setIsEditingContact((current) => {
      if (current) {
        setMainEmail(primaryEmail);
        setPhone(phoneNumber);
        setNewEmail('');
        setExtraEmails([]);
      }
      return !current;
    });
  };

  const updatePassword = () => {
    setPasswordMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }

    updateCurrentUserPassword(getCurrentUser(), currentPassword, newPassword).then((result) => {
      setPasswordMessage(result.message);
      if (result.ok) {
        resetPasswordFields();
        setIsEditingPassword(false);
      }
    });
  };

  const saveContactInfo = () => {
    setContactMessage('');

    updateCurrentUserContactInfo(getCurrentUser(), { email: mainEmail, phone }).then((result) => {
      setContactMessage(result.message);
      if (result.ok) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setCurrentUser({
            ...currentUser,
            email: mainEmail,
            phone,
            phone_number: phone,
          });
        }
        setIsEditingContact(false);
      }
    });
  };

  const toggleVisible = (key: string) => {
    setVisiblePasswords((current) => ({ ...current, [key]: !current[key] }));
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
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-6 py-5">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[#EF233C]" />
              <h2 className="text-lg font-bold text-white">Change Password</h2>
            </div>
            <button
              type="button"
              onClick={togglePasswordEdit}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-[#EF233C]/50 hover:text-[#EF233C]"
              aria-label={isEditingPassword ? 'Cancel password edit' : 'Edit password'}
            >
              {isEditingPassword ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </button>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              visible={Boolean(visiblePasswords.current)}
              disabled={!isEditingPassword}
              onChange={setCurrentPassword}
              onToggleVisible={() => toggleVisible('current')}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              visible={Boolean(visiblePasswords.new)}
              disabled={!isEditingPassword}
              onChange={setNewPassword}
              onToggleVisible={() => toggleVisible('new')}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              visible={Boolean(visiblePasswords.confirm)}
              disabled={!isEditingPassword}
              onChange={setConfirmPassword}
              onToggleVisible={() => toggleVisible('confirm')}
            />
            <div className="md:col-span-3">
              <button
                type="button"
                disabled={!isEditingPassword}
                onClick={updatePassword}
                className="rounded-xl border border-[#EF233C]/40 px-5 py-3 text-sm font-bold text-[#EF233C] transition-colors hover:bg-[#EF233C]/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 disabled:hover:bg-transparent"
              >
                Update Password
              </button>
              {passwordMessage && <p className="mt-3 text-xs font-semibold text-white/55">{passwordMessage}</p>}
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
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-6 py-5">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#EF233C]" />
              <h2 className="text-lg font-bold text-white">Contact info</h2>
            </div>
            <button
              type="button"
              onClick={toggleContactEdit}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-[#EF233C]/50 hover:text-[#EF233C]"
              aria-label={isEditingContact ? 'Cancel contact edit' : 'Edit contact info'}
            >
              {isEditingContact ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </button>
          </div>
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-white/8 bg-[#222] p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                <Mail className="h-4 w-4 text-[#EF233C]" />
                Email addresses
              </div>
              <label className="text-xs font-bold uppercase tracking-wide text-white/55">
                Primary email
                <input
                  value={mainEmail}
                  disabled={!isEditingContact}
                  onChange={(event) => setMainEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#EF233C]/60"
                />
              </label>
              <div className="mt-3 space-y-2">
                {extraEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between rounded-lg bg-[#181818] px-3 py-2 text-sm text-white">
                    <span>{email}</span>
                    <button type="button" disabled={!isEditingContact} className="text-xs font-semibold text-[#EF233C] disabled:cursor-not-allowed disabled:text-white/30" onClick={() => setExtraEmails((current) => current.filter((item) => item !== email))}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input disabled={!isEditingContact} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Add email address" className="flex-1 rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#EF233C]/60" />
                <button type="button" disabled={!isEditingContact} className="rounded-xl border border-[#EF233C]/40 px-5 py-3 text-sm font-bold text-[#EF233C] hover:bg-[#EF233C]/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 disabled:hover:bg-transparent" onClick={addEmail}>Add</button>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#222] p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                <Phone className="h-4 w-4 text-[#EF233C]" />
                Phone numbers
              </div>
              <input disabled={!isEditingContact} value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#EF233C]/60" />
            </div>

            <button type="button" disabled={!isEditingContact} onClick={saveContactInfo} className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#990000] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30">
              Save Contact Info
            </button>
            {contactMessage && <p className="text-xs font-semibold text-white/55">{contactMessage}</p>}
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
