import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MemberHeader } from '../components/MemberHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Star, Users, Award, Calendar } from 'lucide-react';
import { trainers } from '../data/mockData';

export const TrainerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('intro');

  const trainer = trainers.find((t) => t.id === Number(id));

  if (!trainer) {
    return (
      <>
        <MemberHeader title="Không tìm thấy huấn luyện viên" />
        <div className="p-8">
          <p className="text-gray-400">Huấn luyện viên không tồn tại.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <MemberHeader title="Chi tiết huấn luyện viên" />

      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Trainer Profile */}
          <div className="bg-card border border-white/10 rounded-xl p-8">
            <div className="flex items-start gap-6 mb-6">
              <img
                src={trainer.avatar}
                alt={trainer.name}
                className="w-32 h-32 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold text-white">{trainer.name}</h2>
                  <StatusBadge status={trainer.availability} />
                </div>
                <p className="text-gray-400 mb-4">{trainer.specialty}</p>

                <div className="grid grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{trainer.rating}</p>
                      <p className="text-xs text-gray-400">Đánh giá</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{trainer.students}</p>
                      <p className="text-xs text-gray-400">Học viên</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{trainer.experience} năm</p>
                      <p className="text-xs text-gray-400">Kinh nghiệm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                disabled={trainer.availability === 'Kín lịch'}
                onClick={() => navigate('/my-schedule')}
                className={`flex-1 px-6 py-3 rounded-lg transition-colors font-medium ${
                  trainer.availability === 'Kín lịch'
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                Đặt lịch với HLV
              </button>
              <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium">
                Chọn HLV
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
            <div className="flex border-b border-white/10">
              {[
                { id: 'intro', label: 'Giới thiệu' },
                { id: 'experience', label: 'Kinh nghiệm' },
                { id: 'certs', label: 'Chứng chỉ' },
                { id: 'schedule', label: 'Lịch trống' },
                { id: 'reviews', label: 'Đánh giá' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'intro' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Giới thiệu</h3>
                  <p className="text-gray-300 leading-relaxed">{trainer.bio}</p>
                </div>
              )}

              {activeTab === 'experience' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Kinh nghiệm</h3>
                  <ul className="space-y-3">
                    {trainer.experienceDetails.map((exp, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-gray-300">{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'certs' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Chứng chỉ</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {trainer.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-white font-medium mb-1">{cert.name}</p>
                            <p className="text-sm text-gray-400">
                              {cert.issuer} - {cert.year}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Lịch trống</h3>
                  {trainer.schedule.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {trainer.schedule.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-4"
                        >
                          <Calendar className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-white font-medium">{slot.day}</p>
                            <p className="text-sm text-gray-400">{slot.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Hiện tại không có lịch trống</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Đánh giá từ học viên</h3>
                  <div className="space-y-4">
                    {trainer.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white font-medium">{review.author}</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-300 mb-2">{review.comment}</p>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/trainers')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    </>
  );
};
