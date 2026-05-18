import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { TrainerCard } from '../components/TrainerCard';
import { Search } from 'lucide-react';
import { trainers } from '../data/mockData';

export const Trainers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch =
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialty.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'available' && trainer.availability === 'Còn lịch trống') ||
      trainer.specialty.toLowerCase().includes(filter);

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <MemberHeader
        title="Huấn luyện viên"
        subtitle="Chọn huấn luyện viên phù hợp với mục tiêu của bạn"
      />

      <div className="p-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm huấn luyện viên theo tên hoặc chuyên môn..."
              className="w-full bg-input-background border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'available', label: 'Còn lịch trống' },
              { value: 'gym', label: 'Gym' },
              { value: 'yoga', label: 'Yoga' },
              { value: 'cardio', label: 'Cardio' }
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  filter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trainers Grid */}
        <div className="grid grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>

        {filteredTrainers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Không tìm thấy huấn luyện viên phù hợp</p>
          </div>
        )}
      </div>
    </>
  );
};
