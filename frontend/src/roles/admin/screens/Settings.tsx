import AccountSettings from '../../shared/AccountSettings';

export default function Settings() {
  return (
    <AccountSettings
      eyebrow="Owner Account"
      title="Settings"
      description="Manage owner-level preferences, password, display mode, language, and contact information for the gym account."
      accountName="Owner"
      roleLabel="Gym Owner"
      primaryEmail="owner@gymster.vn"
      phoneNumber="0900 111 222"
    />
  );
}
