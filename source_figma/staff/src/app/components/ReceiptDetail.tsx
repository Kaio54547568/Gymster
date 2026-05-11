import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, FileText, Printer, Download, Mail } from 'lucide-react';

export function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const receipt = {
    receiptId: id || 'RCP12345678',
    memberId: 'M00123',
    memberName: 'Nguyễn Hoàng Anh',
    packageName: 'Gói VIP Elite',
    newStartDate: '2026-02-15',
    newEndDate: '2026-08-15',
    amountPaid: 12000000,
    paymentMethod: 'Bank Transfer',
    transactionDate: '2026-02-15 10:30:45',
    staffName: 'Nguyễn Staff'
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-card border border-primary rounded-xl p-8 shadow-[0_0_50px_rgba(255,0,0,0.2)]">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-destructive rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.4)]">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Payment Receipt</h1>
                  <p className="text-sm text-muted-foreground">GYM MANAGER SYSTEM</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Receipt ID</p>
              <p className="text-xl font-bold font-mono text-primary">{receipt.receiptId}</p>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Member ID</p>
                <p className="font-medium font-mono">{receipt.memberId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Member Name</p>
                <p className="font-medium">{receipt.memberName}</p>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-6 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Package Purchased</p>
              <p className="text-xl font-bold text-primary mb-4">{receipt.packageName}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(receipt.newStartDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(receipt.newEndDate).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium">{receipt.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transaction Date</p>
                <p className="font-medium">{new Date(receipt.transactionDate).toLocaleString('vi-VN')}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg">Amount Paid</p>
                <p className="text-3xl font-bold text-primary">{receipt.amountPaid.toLocaleString('vi-VN')} VND</p>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>Processed by: {receipt.staffName}</p>
                <p>Status: <span className="text-primary">Paid</span></p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-border">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-all">
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-all">
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => navigate('/members')}
              className="px-4 py-3 border border-border hover:bg-secondary rounded-lg transition-all"
            >
              Close
            </button>
          </div>

          <div className="mt-6 p-4 bg-secondary/20 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground text-center">
              This is an official receipt from GYM MANAGER SYSTEM. For any inquiries, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
