import React from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { ProfileForm } from '../components/ProfileForm';

export const Profile: React.FC = () => {
  return (
    <>
      <MemberHeader
        title="Thông tin cá nhân"
        subtitle="Quản lý thông tin tài khoản của bạn"
      />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <ProfileForm />
        </div>
      </div>
    </>
  );
};
