/**
 * export.js — PDF and Excel export utilities.
 *
 * jsPDF, jspdf-autotable, and xlsx are heavy libraries (~500 kB combined).
 * They are loaded on-demand via dynamic import() so they are never included
 * in the initial page bundle — they are fetched only when the user clicks an
 * Export button.
 */

export async function exportReportPdf(title, report) {
  // Dynamically import jsPDF and autoTable only when needed
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();

  // Header block
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('JILE ELECTRONICS', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title.toUpperCase(), 14, 23);

  const dateStr = `${new Date(report.from).toLocaleDateString()} - ${new Date(report.to).toLocaleDateString()}`;
  doc.text(`Period: ${dateStr}`, 130, 23);

  autoTable(doc, {
    startY: 35,
    head: [['Financial / Operational Metric', 'Value']],
    body: [
      ['Sales Revenue', `$${Number(report.sales).toLocaleString()}`],
      ['Purchases Cost', `$${Number(report.purchases).toLocaleString()}`],
      ['Stock In (Units)', report.stockIn],
      ['Stock Out (Units)', report.stockOut],
      ['Operating Expenses', `$${Number(report.expenses).toLocaleString()}`],
      ['Customer Debt Payments Received', `$${Number(report.customerPayments).toLocaleString()}`],
      ['Total Customer Debt Outstanding', `$${Number(report.customerDebt).toLocaleString()}`],
      ['Gross Profit', `$${Number(report.grossProfit).toLocaleString()}`],
      ['Net Profit', `$${Number(report.netProfit).toLocaleString()}`],
      ['Total Completed Transactions', report.transactions],
    ],
    headStyles: { fillColor: [2, 118, 199], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const finalY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Generated automatically by JILE Electronics Management System.', 14, finalY);

  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export async function exportReportExcel(title, report) {
  // Dynamically import xlsx only when needed
  const XLSX = await import('xlsx');

  const ws = XLSX.utils.json_to_sheet([
    {
      Report: title,
      From: new Date(report.from).toLocaleDateString(),
      To: new Date(report.to).toLocaleDateString(),
      Sales: report.sales,
      Purchases: report.purchases,
      StockIn: report.stockIn,
      StockOut: report.stockOut,
      Expenses: report.expenses,
      CustomerPayments: report.customerPayments,
      CustomerDebt: report.customerDebt,
      GrossProfit: report.grossProfit,
      NetProfit: report.netProfit,
      Transactions: report.transactions,
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
}
