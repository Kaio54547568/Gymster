import { useState } from 'react';
import { History, Search, AlertCircle, Calendar, User } from 'lucide-react';

interface SearchDTO {
  keyword: string;
  fromDate: string;
  toDate: string;
}

interface UsageHistory {
  historyId: string;
  memberId: string;
  memberName: string;
  usageDate: string;
  usageTime: string;
  serviceType: string;
  trainerName: string;
  note: string;
}

interface Member {
  memberId: string;
  fullName: string;
  phoneNum: string;
}

export function ViewHistoryUI() {
  const [searchData, setSearchData] = useState<SearchDTO>({
    keyword: '',
    fromDate: '',
    toDate: ''
  });

  const [searchResults, setSearchResults] = useState<UsageHistory[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allMembers: Member[] = [
    { memberId: 'M00123', fullName: 'Nguyễn Hoàng Anh', phoneNum: '0901234567' },
    { memberId: 'M00124', fullName: 'Trần Minh Đức', phoneNum: '0902345678' },
    { memberId: 'M00125', fullName: 'Lê Thị Mai', phoneNum: '0903456789' },
    { memberId: 'M00126', fullName: 'Phạm Văn Long', phoneNum: '0904567890' },
    { memberId: 'M00127', fullName: 'Hoàng Thị Hương', phoneNum: '0905678901' }
  ];

  const mockHistory: UsageHistory[] = [
    {
      historyId: 'HIS001',
      memberId: 'M00123',
      memberName: 'Nguyễn Hoàng Anh',
      usageDate: '2026-05-06',
      usageTime: '06:30',
      serviceType: 'Gym Floor',
      trainerName: 'Self-training',
      note: 'Upper body workout'
    },
    {
      historyId: 'HIS002',
      memberId: 'M00123',
      memberName: 'Nguyễn Hoàng Anh',
      usageDate: '2026-05-05',
      usageTime: '18:00',
      serviceType: 'Personal Training',
      trainerName: 'PT Minh Tuấn',
      note: 'Leg day session'
    },
    {
      historyId: 'HIS003',
      memberId: 'M00124',
      memberName: 'Trần Minh Đức',
      usageDate: '2026-05-05',
      usageTime: '07:00',
      serviceType: 'Group Class - Yoga',
      trainerName: 'PT Lan Anh',
      note: ''
    },
    {
      historyId: 'HIS004',
      memberId: 'M00125',
      fullName: 'Lê Thị Mai',
      memberName: 'Lê Thị Mai',
      usageDate: '2026-05-04',
      usageTime: '19:00',
      serviceType: 'Group Class - Zumba',
      trainerName: 'PT Hương',
      note: 'Cardio session'
    },
    {
      historyId: 'HIS005',
      memberId: 'M00126',
      memberName: 'Phạm Văn Long',
      usageDate: '2026-05-03',
      usageTime: '07:30',
      serviceType: 'Gym Floor',
      trainerName: 'Self-training',
      note: 'Core workout'
    }
  ];

  const filteredMembers = allMembers.filter(member =>
    member.fullName.toLowerCase().includes(searchData.keyword.toLowerCase()) ||
    member.memberId.toLowerCase().includes(searchData.keyword.toLowerCase()) ||
    member.phoneNum.includes(searchData.keyword)
  );

  const handleSelectMember = (member: Member) => {
    setSearchData({ ...searchData, keyword: member.fullName });
    setShowSuggestions(false);
  };

  const validateSearch = (): boolean => {
    if (!searchData.keyword.trim() && !searchData.fromDate && !searchData.toDate) {
      setError('Vui lòng nhập tên hội viên hoặc chọn khoảng thời gian');
      return false;
    }

    if (searchData.fromDate && searchData.toDate) {
      const from = new Date(searchData.fromDate);
      const to = new Date(searchData.toDate);
      if (from > to) {
        setError('Ngày bắt đầu không được sau ngày kết thúc');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSearch = () => {
    if (!validateSearch()) {
      return;
    }

    let results = mockHistory.filter(item => {
      const matchKeyword = !searchData.keyword.trim() ||
        item.memberName.toLowerCase().includes(searchData.keyword.toLowerCase()) ||
        item.memberId.toLowerCase().includes(searchData.keyword.toLowerCase()) ||
        item.serviceType.toLowerCase().includes(searchData.keyword.toLowerCase());

      const matchFromDate = !searchData.fromDate ||
        new Date(item.usageDate) >= new Date(searchData.fromDate);

      const matchToDate = !searchData.toDate ||
        new Date(item.usageDate) <= new Date(searchData.toDate);

      return matchKeyword && matchFromDate && matchToDate;
    });

    setSearchResults(results);
    setSearched(true);
    setShowSuggestions(false);
  };

  const handleCancel = () => {
    setSearchData({ keyword: '', fromDate: '', toDate: '' });
    setSearchResults([]);
    setSearched(false);
    setError('');
    setShowSuggestions(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative h-[280px] overflow-hidden bg-black -mx-6 -mt-6 mb-6">
          <img
            src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBjbGFzcyUyMGdyb3VwfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Gym Activity"
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
          <div className="relative h-full flex items-center px-6">
            <div className="max-w-7xl mx-auto w-full">
              <div>
                <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">QUẢN LÝ HOẠT ĐỘNG</p>
                <h1 className="text-6xl font-black tracking-tight mb-4">
                  <span className="text-primary">LỊCH SỬ</span>
                  <br />
                  <span className="text-white">SỬ DỤNG</span>
                </h1>
                <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                  Tra cứu lịch sử sử dụng dịch vụ của hội viên, theo dõi hoạt động tập luyện, buổi PT và các lớp học nhóm.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Tiêu Chí Tìm Kiếm</h3>

          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tên Hội Viên
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                <input
                  type="text"
                  value={searchData.keyword}
                  onChange={(e) => {
                    setSearchData({ ...searchData, keyword: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Nhập tên, mã hội viên hoặc số điện thoại..."
                  className="w-full bg-input pl-10 pr-4 py-3 rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />

                {/* Autocomplete Suggestions */}
                {showSuggestions && searchData.keyword && filteredMembers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-primary rounded-xl shadow-[0_0_40px_rgba(255,0,0,0.4)] max-h-80 overflow-y-auto z-50">
                    {filteredMembers.slice(0, 5).map((member) => (
                      <button
                        key={member.memberId}
                        onClick={() => handleSelectMember(member)}
                        className="w-full p-4 hover:bg-primary/10 transition-colors text-left border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-destructive rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{member.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              Mã: {member.memberId} • SĐT: {member.phoneNum}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Từ Ngày
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={searchData.fromDate}
                    onChange={(e) => setSearchData({ ...searchData, fromDate: e.target.value })}
                    className="w-full bg-input pl-10 pr-4 py-3 rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Đến Ngày
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={searchData.toDate}
                    onChange={(e) => setSearchData({ ...searchData, toDate: e.target.value })}
                    className="w-full bg-input pl-10 pr-4 py-3 rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={handleSearch}
                className="flex-1 bg-gradient-to-r from-primary to-destructive text-white px-6 py-3 rounded-lg font-medium hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-all"
              >
                Tìm Kiếm
              </button>
              <button
                onClick={handleCancel}
                className="px-8 py-3 border border-border hover:bg-secondary rounded-lg transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold">
                Kết Quả Tìm Kiếm ({searchResults.length})
              </h3>
            </div>

            {searchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left px-6 py-4 font-medium">Ngày Sử Dụng</th>
                      <th className="text-left px-6 py-4 font-medium">Giờ</th>
                      <th className="text-left px-6 py-4 font-medium">Hội Viên</th>
                      <th className="text-left px-6 py-4 font-medium">Loại Dịch Vụ</th>
                      <th className="text-left px-6 py-4 font-medium">HLV</th>
                      <th className="text-left px-6 py-4 font-medium">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((item, index) => (
                      <tr
                        key={item.historyId}
                        className={`border-b border-border hover:bg-secondary/20 transition-colors ${
                          index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium">
                          {new Date(item.usageDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{item.usageTime}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{item.memberName}</p>
                            <p className="text-sm text-muted-foreground font-mono">{item.memberId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                            {item.serviceType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{item.trainerName}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Không Tìm Thấy Kết Quả</h3>
                <p className="text-muted-foreground">Thử điều chỉnh tiêu chí tìm kiếm của bạn</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
