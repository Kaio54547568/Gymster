import AccountSettings from '../../shared/AccountSettings';
import { useSupabaseUserProfile } from '../../shared/useSupabaseUserProfile';

export function Settings() {
  const { profile } = useSupabaseUserProfile('staff');

  return (
    <AccountSettings
      eyebrow="Staff Account"
      title="Settings"
      description="Manage notification preferences, password, display mode, language, and contact information for the staff account."
      accountName={profile.fullName || 'Staff'}
      roleLabel={profile.roleLabel || 'Management Staff'}
      primaryEmail={profile.email || ''}
      phoneNumber={profile.phone || ''}
    />
  );
}
