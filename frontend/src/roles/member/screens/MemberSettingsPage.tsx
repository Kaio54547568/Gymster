import AccountSettings from '../../shared/AccountSettings';
import { useSupabaseUserProfile } from '../../shared/useSupabaseUserProfile';

export default function MemberSettingsPage() {
  const { profile } = useSupabaseUserProfile('member');

  return (
    <AccountSettings
      eyebrow="Member Account"
      title="Settings"
      description="Manage notification preferences, password, display mode, language, and contact information for the member account."
      accountName={profile.fullName || 'Member'}
      roleLabel={profile.roleLabel || 'Gym Member'}
      primaryEmail={profile.email || ''}
      phoneNumber={profile.phone || ''}
    />
  );
}
