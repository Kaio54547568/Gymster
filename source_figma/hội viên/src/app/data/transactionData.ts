export const transactions = [
  {
    transactionId: 'GD20260512001',
    receiptId: 'BL0008',
    date: '12/05/2026',
    time: '19:30',
    type: 'Gia hạn gói',
    packageName: 'Gói Gym 6 tháng',
    packageCode: 'GYM6M',
    amount: 3000000,
    originalAmount: 3000000,
    discount: 0,
    promoCode: '',
    paymentMethod: 'Chuyển khoản ngân hàng',
    status: 'Thành công',
    confirmedBy: 'Nhân viên Lan',
    startDate: '12/05/2026',
    endDate: '12/11/2026',
    notes: ''
  },
  {
    transactionId: 'GD20260410002',
    receiptId: 'BL0007',
    date: '10/04/2026',
    time: '14:20',
    type: 'Mua gói mới',
    packageName: 'Gói Gym 6 tháng',
    packageCode: 'GYM6M',
    amount: 3000000,
    originalAmount: 3000000,
    discount: 0,
    promoCode: '',
    paymentMethod: 'Tiền mặt',
    status: 'Thành công',
    confirmedBy: 'Nhân viên Hoa',
    startDate: '10/04/2026',
    endDate: '10/10/2026',
    notes: ''
  },
  {
    transactionId: 'GD20260305003',
    receiptId: 'BL0006',
    date: '05/03/2026',
    time: '10:15',
    type: 'Chuyển gói',
    packageName: 'Gói VIP có PT',
    packageCode: 'VIPPT3M',
    amount: 2000000,
    originalAmount: 2000000,
    discount: 0,
    promoCode: '',
    paymentMethod: 'Ví điện tử',
    status: 'Chờ xác nhận',
    confirmedBy: '',
    startDate: '05/03/2026',
    endDate: '05/06/2026',
    notes: 'Đang chờ xác nhận thanh toán'
  }
];

export const gymInfo = {
  name: 'GYM PRO FITNESS CENTER',
  address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
  phone: '028 1234 5678',
  email: 'support@gympro.vn',
  website: 'www.gympro.vn'
};

export const bankInfo = {
  bankName: 'Vietcombank',
  accountName: 'GYM CENTER',
  accountNumber: '0123456789',
  branch: 'Chi nhánh TP.HCM'
};
