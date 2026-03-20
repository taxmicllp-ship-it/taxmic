import PDFDocument from 'pdfkit';
import { getStorageProvider } from '../../../shared/storage/storage.factory';

interface LineItem {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  amount: number | string;
}

interface InvoiceData {
  id: string;
  number: number;
  issue_date: Date | string;
  due_date?: Date | string | null;
  subtotal_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  notes?: string | null;
  invoice_items: LineItem[];
  client?: { name: string } | null;
}
interface FirmSettings {
  invoice_prefix?: string | null;
  invoice_terms?: string | null;
  invoice_footer?: string | null;
  currency?: string | null;
}

function fmt(amount: number | string): string {
  return parseFloat(String(amount)).toFixed(2);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export async function generateInvoicePdf(
  invoice: InvoiceData,
  firmSettings: FirmSettings,
  firmName: string
): Promise<string> {
  const prefix = firmSettings.invoice_prefix ?? 'INV-';
  const invoiceLabel = `${prefix}${String(invoice.number).padStart(4, '0')}`;
  const storageKey = `invoices/${invoice.id}/invoice-${invoice.number}.pdf`;

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(firmName, 50, 50);
    doc.fontSize(10).font('Helvetica').moveDown(0.5);

    // Invoice label + dates
    doc.fontSize(16).font('Helvetica-Bold').text(invoiceLabel, { align: 'right' });
    doc.fontSize(10).font('Helvetica')
      .text(`Issue Date: ${fmtDate(invoice.issue_date)}`, { align: 'right' })
      .text(`Due Date: ${fmtDate(invoice.due_date)}`, { align: 'right' });

    doc.moveDown(1);

    // Bill to
    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
    doc.fontSize(10).font('Helvetica').text(invoice.client?.name ?? 'Client');

    doc.moveDown(1.5);

    // Line items table header
    const colX = { desc: 50, qty: 300, price: 380, amount: 460 };
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', colX.desc, doc.y, { continued: false });
    const headerY = doc.y - 14;
    doc.text('Qty', colX.qty, headerY);
    doc.text('Unit Price', colX.price, headerY);
    doc.text('Amount', colX.amount, headerY);

    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.3);

    // Line items
    doc.font('Helvetica').fontSize(10);
    for (const item of invoice.invoice_items) {
      const rowY = doc.y;
      doc.text(item.description, colX.desc, rowY, { width: 240 });
      doc.text(String(item.quantity), colX.qty, rowY);
      doc.text(`$${fmt(item.unit_price)}`, colX.price, rowY);
      doc.text(`$${fmt(item.amount)}`, colX.amount, rowY);
      doc.moveDown(0.5);
    }

    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.5);

    // Totals
    const totalsX = 380;
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', totalsX, doc.y, { continued: false });
    doc.text(`$${fmt(invoice.subtotal_amount)}`, colX.amount, doc.y - 14);

    doc.text('Tax:', totalsX, doc.y);
    doc.text(`$${fmt(invoice.tax_amount)}`, colX.amount, doc.y - 14);

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Total:', totalsX, doc.y);
    doc.text(`$${fmt(invoice.total_amount)}`, colX.amount, doc.y - 14);

    doc.moveDown(2);

    // Notes
    if (invoice.notes) {
      doc.font('Helvetica-Bold').fontSize(10).text('Notes:');
      doc.font('Helvetica').fontSize(10).text(invoice.notes);
      doc.moveDown(1);
    }

    // Terms
    if (firmSettings.invoice_terms) {
      doc.font('Helvetica-Bold').fontSize(10).text('Payment Terms:');
      doc.font('Helvetica').fontSize(10).text(firmSettings.invoice_terms);
      doc.moveDown(1);
    }

    // Footer
    if (firmSettings.invoice_footer) {
      doc.fontSize(9).font('Helvetica').fillColor('gray')
        .text(firmSettings.invoice_footer, 50, 720, { align: 'center', width: 510 });
    }

    doc.end();
  });

  const storage = getStorageProvider();
  await storage.upload(storageKey, buffer, 'application/pdf');

  return storageKey;
}
