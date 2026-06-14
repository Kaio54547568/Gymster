import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Edit2, Eye, EyeOff, Globe, Lock, Mail, Moon, Phone, Shield, Sun, X } from 'lucide-react';
import ThemeToggle from '../../components/theme/ThemeToggle';
import { getCurrentUser, setCurrentUser } from '../../services/authService';
import { getCurrentUserSettings, updateCurrentUserContactInfo, updateCurrentUserPassword, updateCurrentUserSettings } from '../../services/userProfileApi';
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
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
};

type NotificationPreferenceKey = 'emailNotifications' | 'membershipExpiringAlerts' | 'paymentCompletedNotifications';

const notificationPreferenceOptions: Array<{ key: NotificationPreferenceKey; label: string; desc: string }> = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    desc: 'Receive important account and operation updates via email',
  },
  {
    key: 'membershipExpiringAlerts',
    label: 'Membership Expiring Alerts',
    desc: 'Alert when member packages are about to expire',
  },
  {
    key: 'paymentCompletedNotifications',
    label: 'Payment Completed',
    desc: 'Notify when payments are successfully processed',
  },
];

function PasswordField({ label, value, visible, placeholder, error, onChange, onToggleVisible }: PasswordFieldProps) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-white/55">
      {label}
      <div className="relative mt-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-[#222] px-4 py-3 pr-11 text-sm text-white outline-none transition-colors focus:border-[#EF233C]/60 ${
            error ? 'border-[#EF233C]/70' : 'border-white/10'
          }`}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-[#EF233C]"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold normal-case tracking-normal text-[#EF233C]">{error}</p>}
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
  const { darkMode } = useAppearance();
  const { language, setLanguage } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [mainEmail, setMainEmail] = useState(primaryEmail);
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [phone, setPhone] = useState(phoneNumber);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordToast, setPasswordToast] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState<Record<NotificationPreferenceKey, boolean>>({
    emailNotifications: true,
    membershipExpiringAlerts: true,
    paymentCompletedNotifications: false,
  });

  useEffect(() => {
    setMainEmail(primaryEmail);
  }, [primaryEmail]);

  useEffect(() => {
    setPhone(phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserSettings(getCurrentUser()).then((result) => {
      if (!isMounted || !result.data) return;
      setNotificationPrefs({
        emailNotifications: Boolean(result.data.emailNotifications),
        membershipExpiringAlerts: Boolean(result.data.membershipExpiringAlerts),
        paymentCompletedNotifications: Boolean(result.data.paymentCompletedNotifications),
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
    setPasswordErrors({});
  };

  const openPasswordModal = () => {
    setPasswordMessage('');
    resetPasswordFields();
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (isUpdatingPassword) return;
    setIsPasswordModalOpen(false);
    setPasswordMessage('');
    resetPasswordFields();
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
    const nextErrors: Record<string, string> = {};

    if (!currentPassword) {
      nextErrors.current = 'Current password is required.';
    }
    if (!newPassword) {
      nextErrors.new = 'New password is required.';
    } else if (newPassword.length < 8) {
      nextErrors.new = 'New password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      nextErrors.confirm = 'Please confirm your new password.';
    } else if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirm = 'Confirm password must match the new password.';
    }

    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsUpdatingPassword(true);
    updateCurrentUserPassword(getCurrentUser(), currentPassword, newPassword)
      .then((result) => {
        if (result.ok) {
          setPasswordToast('Password updated successfully');
          window.setTimeout(() => setPasswordToast(''), 3500);
          resetPasswordFields();
          setIsPasswordModalOpen(false);
          return;
        }
        setPasswordMessage(result.message || 'Password could not be updated.');
      })
      .catch(() => {
        setPasswordMessage('Password could not be updated.');
      })
      .finally(() => {
        setIsUpdatingPassword(false);
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

  const saveNotificationPreferences = (nextPrefs: Record<NotificationPreferenceKey, boolean>) => {
    setNotificationMessage('Saving settings...');
    updateCurrentUserSettings(getCurrentUser(), nextPrefs).then((result) => {
      setNotificationMessage(result.ok ? 'Settings saved.' : result.message);
    });
  };

  const toggleNotificationPreference = (key: NotificationPreferenceKey) => {
    setNotificationPrefs((current) => {
      const nextPrefs = { ...current, [key]: !current[key] };
      saveNotificationPreferences(nextPrefs);
      return nextPrefs;
    });
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
            {notificationPreferenceOptions.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-[#222] p-4">
                <div>
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <div className="mt-1 text-xs text-white/45">{desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotificationPreference(key)}
                  className={`relative h-7 w-14 shrink-0 rounded-full transition-all ${notificationPrefs[key] ? 'bg-[#EF233C]' : 'bg-white/10'}`}
                  aria-pressed={notificationPrefs[key]}
                  aria-label={label}
                >
                  <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${notificationPrefs[key] ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
            {notificationMessage && <p className="text-xs font-semibold text-white/55">{notificationMessage}</p>}
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
              onClick={openPasswordModal}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-[#EF233C]/50 hover:text-[#EF233C]"
              aria-label="Edit password"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
          {passwordToast && (
            <div className="flex items-center gap-3 px-6 py-4 text-sm font-semibold text-[#D1FAE5]">
              <CheckCircle className="h-5 w-5 text-[#22C55E]" />
              {passwordToast}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3 border-b border-white/8 px-6 py-5">
            {darkMode ? <Moon className="h-5 w-5 text-[#EF233C]" /> : <Sun className="h-5 w-5 text-[#EF233C]" />}
            <h2 className="text-lg font-bold text-white">Display</h2>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <div className="text-sm font-semibold text-white">Dark mode</div>
              <div className="mt-1 text-xs text-white/45">Switch between Gymster dark and light themes.</div>
            </div>
            <ThemeToggle showLabel />
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

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closePasswordModal}>
          <div className="w-full max-w-md rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-6 shadow-[0_0_50px_rgba(239,35,60,0.22)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-white">Change Password</h2>
              <button type="button" onClick={closePasswordModal} className="rounded-lg p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                visible={Boolean(visiblePasswords.current)}
                placeholder="Enter current password"
                error={passwordErrors.current}
                onChange={setCurrentPassword}
                onToggleVisible={() => toggleVisible('current')}
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                visible={Boolean(visiblePasswords.new)}
                placeholder="Enter new password"
                error={passwordErrors.new}
                onChange={setNewPassword}
                onToggleVisible={() => toggleVisible('new')}
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                visible={Boolean(visiblePasswords.confirm)}
                placeholder="Confirm new password"
                error={passwordErrors.confirm}
                onChange={setConfirmPassword}
                onToggleVisible={() => toggleVisible('confirm')}
              />
            </div>

            {passwordMessage && <p className="mt-4 rounded-xl border border-[#EF233C]/30 bg-[#EF233C]/10 px-4 py-3 text-xs font-semibold text-white">{passwordMessage}</p>}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closePasswordModal} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-[#EF233C]/40 hover:bg-white/5">
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingPassword}
                onClick={updatePassword}
                className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#990000] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
