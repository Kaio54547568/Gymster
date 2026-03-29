export const dashboardStats = {
  totalMembers: 248,
  activePackages: 187,
  totalEquipment: 96,
  staffCount: 18,
  monthlyRevenue: 128500000,
  pendingFeedback: 7,
};

export const members = [
  {
    id: "MB001",
    name: "Nguyen Van A",
    phone: "0901234567",
    packageName: "6 tháng",
    joinDate: "2026-01-10",
    status: "Active",
  },
  {
    id: "MB002",
    name: "Tran Thi B",
    phone: "0912345678",
    packageName: "VIP",
    joinDate: "2026-02-05",
    status: "Expired",
  },
  {
    id: "MB003",
    name: "Le Van C",
    phone: "0988888888",
    packageName: "1 năm",
    joinDate: "2026-02-20",
    status: "Active",
  },
];

export const equipments = [
  {
    id: "EQ001",
    name: "Máy chạy bộ",
    quantity: 8,
    importedDate: "2025-11-01",
    warranty: "24 tháng",
    status: "Good",
  },
  {
    id: "EQ002",
    name: "Ghế đẩy ngực",
    quantity: 4,
    importedDate: "2025-09-15",
    warranty: "18 tháng",
    status: "Maintenance",
  },
  {
    id: "EQ003",
    name: "Tạ đơn",
    quantity: 30,
    importedDate: "2025-10-10",
    warranty: "12 tháng",
    status: "Good",
  },
];

export const staffs = [
  {
    id: "ST001",
    name: "Pham Thu Ha",
    role: "Nhân viên quản lý",
    shift: "08:00 - 17:00",
    performance: "Good",
  },
  {
    id: "ST002",
    name: "Do Minh Quan",
    role: "PT",
    shift: "14:00 - 22:00",
    performance: "Excellent",
  },
  {
    id: "ST003",
    name: "Nguyen Hai Nam",
    role: "CSKH",
    shift: "09:00 - 18:00",
    performance: "Average",
  },
];

export const feedbacks = [
  {
    id: "FB001",
    memberName: "Nguyen Van A",
    target: "Thiết bị",
    content: "Máy chạy bộ khu A hoạt động chưa ổn định.",
    status: "Pending",
  },
  {
    id: "FB002",
    memberName: "Tran Thi B",
    target: "Nhân viên",
    content: "Nhân viên hỗ trợ rất nhiệt tình.",
    status: "Resolved",
  },
  {
    id: "FB003",
    memberName: "Le Van C",
    target: "Cơ sở vật chất",
    content: "Khu locker cần sạch hơn.",
    status: "Pending",
  },
];

export const revenueData = [
  { period: "Jan", revenue: 95000000 },
  { period: "Feb", revenue: 102000000 },
  { period: "Mar", revenue: 128500000 },
];