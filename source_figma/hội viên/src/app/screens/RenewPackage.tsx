import React from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { RenewalForm } from '../components/RenewalForm';

export const RenewPackage: React.FC = () => {
  return (
    <>
      <MemberHeader
        title="Gia hạn gói tập"
        subtitle="Gia hạn để tiếp tục hành trình rèn luyện của bạn"
      />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <RenewalForm />
        </div>
      </div>
    </>
  );
};
