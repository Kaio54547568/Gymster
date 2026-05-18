import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { ProfileForm } from '../components/ProfileForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';

type Tab = 'profile' | 'password';

export const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs = [
    { id: 'profile' as Tab, label: 'Thông tin cá nhân' },
    { id: 'password' as Tab, label: 'Đổi mật khẩu' }
  ];

  return (
    <>
      <MemberHeader
        title="Tài khoản cá nhân"
        subtitle="Quản lý thông tin tài khoản và bảo mật"
      />

      <div className="p-8">
        {/* Tabs */}
        <div className="bg-card border border-white/10 rounded-xl mb-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-white bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'profile' && <ProfileForm />}
          {activeTab === 'password' && <ChangePasswordForm />}
        </div>
      </div>
    </>
  );
};
