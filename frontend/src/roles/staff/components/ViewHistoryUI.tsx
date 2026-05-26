import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Search, User } from 'lucide-react';
import { getStaffUsageHistory } from '../../../services/staffOperationsApi';
import { useLanguage } from '../../shared/LanguageContext';

interface SearchDTO {
  keyword: string;
  fromDate: string;
  toDate: string;
}

interface UsageHistory {
  historyId: string;
  memberId: string;
  memberName: string;
  phoneNum: string;
  usageDate: string;
  usageTime: string;
  serviceType: string;
  trainerName: string;
  note: string;
}

const COPY = {
  en: {
    eyebrow: 'Member Activity',
    titleA: 'USAGE',
    titleB: 'HISTORY',
    subtitle: 'Tra c?u l?ch s? d?ng d?ch v?, bu?i t?p, PT v? l??t v?o ph?ng t?p.',
    criteria: 'Search Criteria',
    memberLabel: 'Member',
    keyword: 'Enter member name, ID, phone, or service type...',
    from: 'From Date',
    to: 'To Date',
    search: 'Search',
    cancel: 'Cancel',
    required: 'Enter a member keyword or select a date range.',
    dateInvalid: 'From date cannot be after to date.',
    warning: 'Some usage history could not be loaded.',
    loading: 'Loading usage history...',
    results: 'Search Results',
    noResults: 'No Results Found',
    adjust: 'Try adjusting your search criteria',
  },
  vi: {
    eyebrow: 'Hoạt động hội viên',
    titleA: 'LỊCH SỬ',
    titleB: 'SỬ DỤNG',
    subtitle: 'Tra cứu lịch sử dùng dịch vụ, buổi tập, PT và lượt vào phòng tập từ h\u1ec7 th\u1ed1ng.',
    criteria: 'Tiêu chí tìm kiếm',
    memberLabel: 'Hội viên',
    keyword: 'Nhập tên, mã, số điện thoại hoặc loại dịch vụ...',
    from: 'Từ ngày',
    to: 'Đến ngày',
    search: 'Tìm kiếm',
    cancel: 'Hủy',
    required: 'Nhập từ khóa hội viên hoặc chọn khoảng ngày.',
    dateInvalid: 'Ngày bắt đầu không được sau ngày kết thúc.',
    warning: 'Một số lịch sử sử dụng không tải được từ h\u1ec7 th\u1ed1ng.',
    loading: 'Đang tải lịch sử sử dụng...',
    results: 'Kết quả tìm kiếm',
    noResults: 'Không tìm thấy kết quả',
    adjust: 'Hãy thử điều chỉnh tiêu chí tìm kiếm',
  },
};

export function ViewHistoryUI() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const [searchData, setSearchData] = useState<SearchDTO>({ keyword: '', fromDate: '', toDate: '' });
  const [historyRows, setHistoryRows] = useState<UsageHistory[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      const result = await getStaffUsageHistory();
      if (result.error) {
        setWarning(copy.warning);
        setHistoryRows([]);
      } else {
        setWarning('');
        setHistoryRows(result.data);
      }
      setLoading(false);
    }

    void loadHistory();
  }, []);

  const memberSuggestions = useMemo(() => {
    const byId = new Map<string, UsageHistory>();
    historyRows.forEach((row) => {
      if (!byId.has(row.memberId)) byId.set(row.memberId, row);
    });
    const query = searchData.keyword.toLowerCase();
    return [...byId.values()].filter((member) =>
      member.memberName.toLowerCase().includes(query) ||
      member.memberId.toLowerCase().includes(query) ||
      member.phoneNum.includes(searchData.keyword)
    );
  }, [historyRows, searchData.keyword]);

  const searchResults = useMemo(() => {
    if (!searched) return [];
    const query = searchData.keyword.toLowerCase();
    return historyRows.filter((item) => {
      const matchKeyword = !query ||
        item.memberName.toLowerCase().includes(query) ||
        item.memberId.toLowerCase().includes(query) ||
        item.phoneNum.includes(searchData.keyword) ||
        item.serviceType.toLowerCase().includes(query);
      const matchFromDate = !searchData.fromDate || new Date(item.usageDate) >= new Date(searchData.fromDate);
      const matchToDate = !searchData.toDate || new Date(item.usageDate) <= new Date(searchData.toDate);
      return matchKeyword && matchFromDate && matchToDate;
    });
  }, [historyRows, searched, searchData]);

  const handleSearch = () => {
    if (!searchData.keyword.trim() && !searchData.fromDate && !searchData.toDate) {
      setError(copy.required);
      return;
    }
    if (searchData.fromDate && searchData.toDate && new Date(searchData.fromDate) > new Date(searchData.toDate)) {
      setError(copy.dateInvalid);
      return;
    }
    setError('');
    setSearched(true);
    setShowSuggestions(false);
  };

  const handleCancel = () => {
    setSearchData({ keyword: '', fromDate: '', toDate: '' });
    setSearched(false);
    setError('');
    setShowSuggestions(false);
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="-mx-6 -mt-6 mb-6 relative h-[280px] overflow-hidden bg-black">
          <img
            src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBjbGFzcyUyMGdyb3VwfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Gym Activity"
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60" />
          <div className="relative flex h-full items-center px-6">
            <div className="mx-auto w-full max-w-7xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">{copy.eyebrow}</p>
              <h1 className="mb-4 text-6xl font-black tracking-tight">
                <span className="text-primary">{copy.titleA}</span>
                <br />
                <span className="text-white">{copy.titleB}</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-white/70">{copy.subtitle}</p>
            </div>
          </div>
        </div>

        {warning && <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-300">{warning}</div>}

        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold">{copy.criteria}</h3>
          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">{copy.memberLabel}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchData.keyword}
                  onChange={(event) => {
                    setSearchData({ ...searchData, keyword: event.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={copy.keyword}
                  className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
                />
                {showSuggestions && searchData.keyword && memberSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border-2 border-primary bg-card shadow-[0_0_40px_rgba(255,0,0,0.4)]">
                    {memberSuggestions.slice(0, 5).map((member) => (
                      <button
                        key={member.memberId}
                        onClick={() => {
                          setSearchData({ ...searchData, keyword: member.memberName });
                          setShowSuggestions(false);
                        }}
                        className="w-full border-b border-border p-4 text-left transition-colors last:border-0 hover:bg-primary/10"
                      >
                        <p className="font-bold">{member.memberName}</p>
                        <p className="text-sm text-muted-foreground">{member.memberId} - {member.phoneNum || '-'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                {copy.from}
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input type="date" value={searchData.fromDate} onChange={(event) => setSearchData({ ...searchData, fromDate: event.target.value })} className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 outline-none focus:border-primary" />
                </div>
              </label>
              <label className="block text-sm font-medium">
                {copy.to}
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input type="date" value={searchData.toDate} onChange={(event) => setSearchData({ ...searchData, toDate: event.target.value })} className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 outline-none focus:border-primary" />
                </div>
              </label>
            </div>

            <div className="flex gap-4 pt-2">
              <button onClick={handleSearch} className="flex-1 rounded-lg bg-gradient-to-r from-primary to-destructive px-6 py-3 font-medium text-white transition-all hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]">{copy.search}</button>
              <button onClick={handleCancel} className="rounded-lg border border-border px-8 py-3 transition-all hover:bg-secondary">{copy.cancel}</button>
            </div>
          </div>
        </div>

        {loading && <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">{copy.loading}</div>}

        {searched && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border p-6">
              <h3 className="text-lg font-bold">{copy.results} ({searchResults.length})</h3>
            </div>
            {searchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      {['Date', 'Time', 'Member', 'Service Type', 'Trainer', 'Note'].map((heading) => (
                        <th key={heading} className="px-6 py-4 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((item, index) => (
                      <tr key={item.historyId} className={`border-b border-border transition-colors hover:bg-secondary/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'}`}>
                        <td className="px-6 py-4 font-medium">{new Date(item.usageDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-6 py-4 text-muted-foreground">{item.usageTime || '-'}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{item.memberName}</p>
                          <p className="font-mono text-sm text-muted-foreground">{item.memberId}</p>
                        </td>
                        <td className="px-6 py-4"><span className="rounded-full bg-primary/20 px-3 py-1 text-sm text-primary">{item.serviceType}</span></td>
                        <td className="px-6 py-4 text-muted-foreground">{item.trainerName || '-'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">{copy.noResults}</h3>
                <p className="text-muted-foreground">{copy.adjust}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
