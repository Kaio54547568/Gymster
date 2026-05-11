import AccountProfile from '../../shared/AccountProfile';

export default function Profile() {
  return (
    <AccountProfile
      title="Owner Profile"
      subtitle="Owner Account"
      firstName="Owner"
      lastName="Gymster"
      roleLabel="Gym Owner"
      dob="1988-01-01"
      headline="Managing gym operations, staff performance, memberships, and business growth."
      email="owner@gymster.vn"
      phone="0900 111 222"
      initials="OW"
    />
  );
}
