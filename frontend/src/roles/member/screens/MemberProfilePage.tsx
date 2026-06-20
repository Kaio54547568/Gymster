import AccountProfile from '../../shared/AccountProfile';
import { useSupabaseUserProfile } from '../../shared/useSupabaseUserProfile';

export default function MemberProfilePage() {
  const { profile, isLoading, errorMessage } = useSupabaseUserProfile('member');

  return (
    <>
      {(isLoading || errorMessage) && (
        <div className="px-6 pt-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#181818] p-4 text-sm font-bold text-white/55">
            {isLoading ? 'Loading profile...' : errorMessage}
          </div>
        </div>
      )}
      <AccountProfile
        title="Member Profile"
        subtitle="Member Account"
        firstName={profile.firstName}
        lastName={profile.lastName}
        roleLabel={profile.roleLabel}
        dob={profile.dob || ''}
        headline={profile.headline}
        email={profile.email}
        phone={profile.phone}
        initials={profile.initials}
        avatarUrl={profile.avatarUrl}
        memberCode={(profile as any).memberCode}
        occupation={(profile as any).occupation}
        address={(profile as any).address}
      />
    </>
  );
}
