import React from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { ChangePasswordForm } from '../components/ChangePasswordForm';

export const ChangePassword: React.FC = () => {
  return (
    <>
      <MemberHeader
        title="Đổi mật khẩu"
        subtitle="Cập nhật mật khẩu để bảo mật tài khoản"
      />

      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
};
