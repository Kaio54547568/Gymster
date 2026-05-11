import AccountSettings from '../../shared/AccountSettings';

export function Settings() {
  return (
    <AccountSettings
      eyebrow="Staff Account"
      title="Settings"
      description="Manage notification preferences, password, display mode, language, and contact information for the staff account."
      accountName="Nguyễn Staff"
      roleLabel="Management Staff"
      primaryEmail="staff@gymmanager.vn"
      phoneNumber="0909 123 456"
    />
  );
}
