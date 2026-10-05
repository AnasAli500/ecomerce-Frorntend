import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { money, formatDateTime } from '../../utils/format';

export default function SaleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const printRef = useRef(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Sale deleted');
      navigate('/sales');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  useEffect(() => {
    api.get(`/sales/${id}`).then((res) => setSale(res.data.data.sale));
    api.get('/settings').then((res) => setSettings(res.data.data.settings));
  }, [id]);

  if (!sale) return <Spinner />;

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header Branding
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(settings?.storeName || 'JILE ELECTRONICS', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL SALES RECEIPT', 14, 25);

    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice #: ${sale.invoiceNumber}`, 140, 15);
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`, 140, 22);

    // Customer & Store Details
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('STORE INFO', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(settings?.storeName || 'JILE Electronics', 14, 48);
    doc.text(settings?.address || 'Maka Al Mukarama Road, Mogadishu', 14, 54);
    doc.text(`Phone: ${settings?.phone || '+252 61 000 0000'}`, 14, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFO', 120, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.customer?.name || 'Walk-in Customer', 120, 48);
    doc.text(`Phone: ${sale.customer?.phone || 'N/A'}`, 120, 54);
    doc.text(`Status: ${sale.paymentStatus}`, 120, 60);

    // Items Table
    autoTable(doc, {
      startY: 68,
      head: [['Product Name', 'SKU', 'Qty', 'Unit Price', 'Discount', 'Total']],
      body: sale.items.map((i) => [
        i.productName,
        i.sku || '-',
        i.quantity,
        `$${i.sellingPrice.toFixed(2)}`,
        `$${i.discount.toFixed(2)}`,
        `$${i.lineTotal.toFixed(2)}`,
      ]),
      headStyles: { fillColor: [2, 118, 199], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
    });

    const y = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: $${sale.subtotal.toFixed(2)}`, 140, y);
    doc.text(`Discount: $${sale.discount.toFixed(2)}`, 140, y + 6);
    doc.setFontSize(12);
    doc.setTextColor(2, 118, 199);
    doc.text(`Final Total: $${sale.total.toFixed(2)}`, 140, y + 14);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(`Amount Paid: $${sale.paid.toFixed(2)}`, 140, y + 22);
    doc.text(`Remaining Debt: $${sale.debt.toFixed(2)}`, 140, y + 28);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for shopping with JILE Electronics!', 14, y + 36);

    doc.save(`Receipt_${sale.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with actions */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/sales"
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Back to Sales History</span>
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={18} />
            <span>Print Receipt</span>
          </button>
          <button onClick={downloadPDF} className="btn-secondary">
            <Download size={18} />
            <span>Download PDF</span>
          </button>
          <Link
            to={`/sales/${id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <Pencil size={16} />
            <span>Edit Sale</span>
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 transition-colors"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Container */}
      <div
        ref={printRef}
        className="print-area mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {/* Receipt Header */}
        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-2 ring-brand-500/20">
                <img src="/logo.png" alt="JILE Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-1">
                  <span className="text-rose-600">JILE</span>
                  <span className="text-brand-600 dark:text-brand-400">ELECTRONICS</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {settings?.address || 'Maka Al Mukarama Road, Mogadishu'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phone: {settings?.phone || '+252 61 000 0000'} | Email: {settings?.email || 'info@jileelectronics.com'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Sales Receipt</p>
              <p className="text-lg font-black text-brand-600 dark:text-brand-400">{sale.invoiceNumber}</p>
              <p className="text-xs text-slate-500">{formatDateTime(sale.date)}</p>
              <div className="mt-2">
                <Badge status={sale.paymentStatus}>{sale.paymentStatus}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Transaction Info */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Details</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {sale.customer?.name || 'Walk-in Customer'}
            </p>
            <p className="text-xs text-slate-500">{sale.customer?.phone || 'No phone recorded'}</p>
            <p className="text-xs text-slate-500">{sale.customer?.address || ''}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Status</p>
            <div className="mt-1 flex items-center sm:justify-end gap-1 text-sm font-bold">
              {Math.max(Math.max(sale.items.reduce((s, i) => s + i.lineTotal, 0) - (sale.discount || 0), 0) - sale.paid, 0) <= 0 ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={16} /> Fully Paid
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle size={16} /> Debt Balance: {money(Math.max(Math.max(sale.items.reduce((s, i) => s + i.lineTotal, 0) - (sale.discount || 0), 0) - sale.paid, 0))}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Processed by: {sale.createdBy?.name || 'Admin'}</p>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 font-bold dark:border-slate-800">
                <th className="py-3 px-2">Item Description</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Price</th>
                <th className="py-3 px-2 text-right">Discount</th>
                <th className="py-3 px-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sale.items.map((i) => (
                <tr key={i._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-2">
                    <p className="font-bold text-slate-900 dark:text-white">{i.productName}</p>
                    {i.sku && <p className="text-[11px] font-mono text-slate-400">SKU: {i.sku}</p>}
                  </td>
                  <td className="py-3.5 px-2 text-center font-semibold">{i.quantity}</td>
                  <td className="py-3.5 px-2 text-right">{money(i.sellingPrice)}</td>
                  <td className="py-3.5 px-2 text-right text-rose-500">
                    {i.discount > 0 ? `-${money(i.discount)}` : '$0.00'}
                  </td>
                  <td className="py-3.5 px-2 text-right font-bold text-slate-900 dark:text-white">
                    {money(i.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Footer */}
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex-1 text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Terms & Conditions</p>
            <p>1. Returns accepted within 7 days with original receipt.</p>
            <p>2. Warranty valid according to manufacturer policy.</p>
            <p className="pt-2 font-semibold text-brand-600 dark:text-brand-400">Thank you for choosing JILE Electronics!</p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Gross amount - shown only when there are item discounts */}
            {sale.items.some((i) => i.discount > 0) && (
              <div className="flex justify-between text-slate-400 dark:text-slate-500 text-xs">
                <span>Gross Amount:</span>
                <span>{money(sale.items.reduce((s, i) => s + i.sellingPrice * i.quantity, 0))}</span>
              </div>
            )}
            {/* Per-item discounts */}
            {sale.items.some((i) => i.discount > 0) && (
              <div className="flex justify-between text-rose-500">
                <span>Item Discounts:</span>
                <span>-{money(sale.items.reduce((s, i) => s + (i.discount || 0), 0))}</span>
              </div>
            )}
            {/* Subtotal = sum of lineTotals */}
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-semibold">
              <span>Subtotal:</span>
              <span>{money(sale.items.reduce((s, i) => s + i.lineTotal, 0))}</span>
            </div>
            {/* Order-level discount */}
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Order Discount:</span>
                <span>-{money(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Final Total:</span>
              <span className="text-brand-600 dark:text-brand-400">
                {money(Math.max(sale.items.reduce((s, i) => s + i.lineTotal, 0) - (sale.discount || 0), 0))}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold pt-1">
              <span>Amount Paid:</span>
              <span>{money(sale.paid)}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Remaining Debt:</span>
              <span>
                {Math.max(Math.max(sale.items.reduce((s, i) => s + i.lineTotal, 0) - (sale.discount || 0), 0) - sale.paid, 0) > 0 ? (
                  money(Math.max(Math.max(sale.items.reduce((s, i) => s + i.lineTotal, 0) - (sale.discount || 0), 0) - sale.paid, 0))
                ) : (
                  <span className="text-emerald-600">$0.00 ✓</span>
                )}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <Trash2 size={20} className="text-rose-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delete Sale</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete <strong>{sale.invoiceNumber}</strong>? This will reverse all stock movements and customer balances. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
