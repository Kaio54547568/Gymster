import { useState } from 'react';
import { Link } from 'react-router';
import { Search, Filter, Eye, Edit, RefreshCw, UserX, ChevronDown } from 'lucide-react';

interface Member {
  memberId: string;
  fullName: string;
  phoneNum: string;
  citizenId: string;
  status: 'Active' | 'Expired' | 'Disabled';
  currentPackage: string;
  expirationDate: string;
}

export function MemberList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const members: Member[] = [
    {
      memberId: 'M00123',
      fullName: 'Nguyễn Hoàng Anh',
      phoneNum: '0912345678',
      citizenId: '001234567890',
      status: 'Active',
      currentPackage: 'VIP Elite',
      expirationDate: '2026-08-15'
    },
    {
      memberId: 'M00124',
      fullName: 'Trần Minh Đức',
      phoneNum: '0987654321',
      citizenId: '098765432100',
      status: 'Active',
      currentPackage: 'Premium 6 tháng',
      expirationDate: '2026-07-20'
    },
    {
      memberId: 'M00125',
      fullName: 'Lê Quốc Bảo',
      phoneNum: '0901234567',
      citizenId: '012345678901',
      status: 'Expired',
      currentPackage: 'Gym 3 tháng',
      expirationDate: '2026-04-30'
    },
    {
      memberId: 'M00126',
      fullName: 'Phạm Thị Mai',
      phoneNum: '0909876543',
      citizenId: '098765123456',
      status: 'Active',
      currentPackage: 'PT Personal',
      expirationDate: '2026-06-10'
    },
    {
      memberId: 'M00127',
      fullName: 'Võ Văn Nam',
      phoneNum: '0923456789',
      citizenId: '023456789012',
      status: 'Active',
      currentPackage: 'Premium 6 tháng',
      expirationDate: '2026-09-01'
    },
    {
      memberId: 'M00128',
      fullName: 'Hoàng Thị Lan',
      phoneNum: '0934567890',
      citizenId: '034567890123',
      status: 'Expired',
      currentPackage: 'Gym 3 tháng',
      expirationDate: '2026-03-15'
    }
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phoneNum.includes(searchTerm);

    const matchesFilter = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      Active: 'bg-primary/20 text-primary border-primary/30',
      Expired: 'bg-destructive/20 text-destructive border-destructive/30',
      Disabled: 'bg-muted text-muted-foreground border-muted'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1762744829792-55562e8b873a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxhdGhsZXRpYyUyMGZpdG5lc3MlMjB0cmFpbmluZ3xlbnwxfHx8fDE3NzgwODM0MTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Boxing Training"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div>
              <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">QUẢN LÝ HỘI VIÊN</p>
              <h1 className="text-6xl font-black tracking-tight mb-4">
                <span className="text-primary">DANH SÁCH</span>
                <br />
                <span className="text-white">HỘI VIÊN</span>
              </h1>
              <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                Quản lý toàn bộ thông tin hội viên, tra cứu lịch sử hoạt động, theo dõi trạng thái gói tập và kiểm soát quyền truy cập hệ thống.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Filters */}
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="w-full bg-input pl-10 pr-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-gradient-to-r from-primary to-destructive text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]'
                    : 'bg-input hover:bg-secondary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('Active')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  statusFilter === 'Active'
                    ? 'bg-gradient-to-r from-primary to-destructive text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]'
                    : 'bg-input hover:bg-secondary'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('Expired')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  statusFilter === 'Expired'
                    ? 'bg-gradient-to-r from-primary to-destructive text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]'
                    : 'bg-input hover:bg-secondary'
                }`}
              >
                Expired
              </button>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 font-medium">Member ID</th>
                  <th className="text-left px-6 py-4 font-medium">Full Name</th>
                  <th className="text-left px-6 py-4 font-medium">Phone</th>
                  <th className="text-left px-6 py-4 font-medium">Citizen ID</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Current Package</th>
                  <th className="text-left px-6 py-4 font-medium">Expiration</th>
                  <th className="text-left px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr
                    key={member.memberId}
                    className={`border-b border-border hover:bg-secondary/20 transition-colors ${
                      index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-primary">{member.memberId}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{member.fullName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{member.phoneNum}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-sm">{member.citizenId}</td>
                    <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                    <td className="px-6 py-4">{member.currentPackage}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(member.expirationDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/members/${member.memberId}`}
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors group"
                          title="View Detail"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </Link>
                        <button
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors group"
                          title="Edit Member"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </button>
                        <Link
                          to={`/renew-package/${member.memberId}`}
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors group"
                          title="Renew Package"
                        >
                          <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </Link>
                        <button
                          className="p-2 hover:bg-destructive/20 rounded-lg transition-colors group"
                          title="Disable Member"
                        >
                          <UserX className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredMembers.length} of {members.length} members
        </div>
      </div>
      </div>
    </div>
  );
}
