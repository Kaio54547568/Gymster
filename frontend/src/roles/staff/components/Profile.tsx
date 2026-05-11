import AccountProfile from '../../shared/AccountProfile';

export function Profile() {
  return (
    <AccountProfile
      title="Staff Profile"
      subtitle="Staff Account"
      firstName="Staff"
      lastName="Nguyễn"
      roleLabel="Management Staff"
      dob="1995-05-12"
      headline="Supporting daily gym operations, member services, payment workflows, and equipment issue handling."
      email="staff@gymmanager.vn"
      phone="0909 123 456"
      initials="NS"
    />
  );
}
