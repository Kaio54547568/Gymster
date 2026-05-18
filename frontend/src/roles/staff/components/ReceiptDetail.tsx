import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, FileText, Printer, Download, Mail } from 'lucide-react';
import { getInvoiceById } from '../../../services/invoiceApi';
import { getPaymentById } from '../../../services/paymentApi';

const fallbackReceipt = {
  receiptId: 'RCP12345678',
  memberId: 'M00123',
  memberName: 'Nguyen Van A',
  packageName: 'VIP Elite Package',
  newStartDate: '2026-02-15',
  newEndDate: '2026-08-15',
  amountPaid: 12000000,
  paymentMethod: 'Bank Transfer',
  transactionDate: '2026-02-15T10:30:45',
  staffName: 'Gymster Staff',
  status: 'Paid',
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB');
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB');
}

function formatMethod(value: string) {
  return String(value || 'Payment')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

export function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState({ ...fallbackReceipt, receiptId: id || fallbackReceipt.receiptId });
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      if (!id) return;

      const invoiceResult = await getInvoiceById(id);
      if (!isMounted) return;

      if (!invoiceResult.error && invoiceResult.data) {
        const invoice = invoiceResult.data;
        setReceipt({
          receiptId: invoice.invoiceNumber || invoice.invoiceId,
          memberId: invoice.memberId || '-',
          memberName: invoice.memberName || 'Member',
          packageName: invoice.packageName || 'Membership package',
          newStartDate: invoice.issuedAt || fallbackReceipt.newStartDate,
          newEndDate: invoice.dueAt || invoice.issuedAt || fallbackReceipt.newEndDate,
          amountPaid: invoice.amount || 0,
          paymentMethod: formatMethod(invoice.paymentMethod || 'invoice'),
          transactionDate: invoice.paidAt || invoice.issuedAt || new Date().toISOString(),
          staffName: 'Gymster Staff',
          status: invoice.statusLabel || 'Issued',
        });
        setLoadMessage('');
        return;
      }

      const paymentResult = await getPaymentById(id);
      if (!isMounted) return;

      if (!paymentResult.error && paymentResult.data) {
        const payment = paymentResult.data;
        setReceipt({
          receiptId: payment.transactionCode || payment.paymentId,
          memberId: payment.memberId || '-',
          memberName: payment.memberName || 'Member',
          packageName: payment.packageName || 'Membership package',
          newStartDate: payment.paymentDate || fallbackReceipt.newStartDate,
          newEndDate: payment.paymentDate || fallbackReceipt.newEndDate,
          amountPaid: payment.amount || 0,
          paymentMethod: formatMethod(payment.paymentMethod),
          transactionDate: payment.paymentDate || new Date().toISOString(),
          staffName: 'Gymster Staff',
          status: payment.paymentStatusLabel || 'Paid',
        });
        setLoadMessage('');
        return;
      }

      setLoadMessage('Receipt data could not be loaded from Supabase. Demo receipt data is shown temporarily.');
    }

    loadReceipt();

    return () => {
      isMounted = false;
    };
  }, [id]);

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
          {loadMessage && (
            <div className="mb-6 rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-sm font-semibold text-amber-300">
              {loadMessage}
            </div>
          )}

          <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-destructive rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.4)]">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Payment Receipt</h1>
                  <p className="text-sm text-muted-foreground">GYMSTER</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Receipt ID</p>
              <p className="text-xl font-bold font-mono text-primary">{receipt.receiptId}</p>
            </div>
          </div>

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
                  <p className="font-medium">{formatDate(receipt.newStartDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(receipt.newEndDate)}</p>
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
                <p className="font-medium">{formatDateTime(receipt.transactionDate)}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg">Amount Paid</p>
                <p className="text-3xl font-bold text-primary">{formatVnd(receipt.amountPaid)}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>Processed by: {receipt.staffName}</p>
                <p>Status: <span className="text-primary">{receipt.status}</span></p>
              </div>
            </div>
          </div>

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
              onClick={() => navigate('/staff/members')}
              className="px-4 py-3 border border-border hover:bg-secondary rounded-lg transition-all"
            >
              Close
            </button>
          </div>

          <div className="mt-6 p-4 bg-secondary/20 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground text-center">
              This is an official receipt from GYMSTER. For any inquiries, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
