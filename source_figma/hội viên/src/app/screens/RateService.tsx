import React from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { FeedbackForm } from '../components/FeedbackForm';
import { PastReviewList } from '../components/PastReviewList';

export const RateService: React.FC = () => {
  return (
    <>
      <MemberHeader
        title="Đánh giá dịch vụ"
        subtitle="Chia sẻ trải nghiệm để giúp chúng tôi cải thiện dịch vụ"
      />

      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <FeedbackForm />
          <PastReviewList />
        </div>
      </div>
    </>
  );
};
