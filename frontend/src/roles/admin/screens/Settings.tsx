import AccountSettings from '../../shared/AccountSettings';
import { useSupabaseUserProfile } from '../../shared/useSupabaseUserProfile';

export default function Settings() {
  const { profile } = useSupabaseUserProfile('admin');

  return (
    <AccountSettings
      eyebrow="Owner Account"
      title="Settings"
      description="Manage owner-level preferences, password, display mode, language, and contact information for the gym account."
      accountName={profile.fullName || 'Admin'}
      roleLabel={profile.roleLabel || 'Gym Owner'}
      primaryEmail={profile.email || ''}
      phoneNumber={profile.phone || ''}
    />
  );
}
