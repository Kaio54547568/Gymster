import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { PackageCard } from '../components/PackageCard';
import { packages } from '../data/mockData';

export const BuyPackage: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const filteredPackages = packages.filter((pkg) => {
    if (filter === 'all') return true;
    if (filter === 'gym') return pkg.type.includes('Gym');
    if (filter === 'yoga') return pkg.type.includes('Yoga');
    if (filter === 'pt') return pkg.hasPT;
    return true;
  });

  return (
    <>
      <MemberHeader
        title="Mua gói tập"
        subtitle="Chọn gói tập phù hợp với mục tiêu của bạn"
      />

      <div className="p-8">
        {/* Filters */}
        <div className="mb-6 flex gap-3">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'gym', label: 'Gym' },
            { value: 'yoga', label: 'Yoga' },
            { value: 'pt', label: 'Có PT' }
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

        {/* Packages Grid */}
        <div className="grid grid-cols-2 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard key={pkg.planCode} package={pkg} />
          ))}
        </div>
      </div>
    </>
  );
};
