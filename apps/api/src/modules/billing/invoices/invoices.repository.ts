import { prisma } from '@repo/database';
import { CreateInvoiceDto, UpdateInvoiceDto, ListInvoicesQuery, InvoiceTotals } from './invoices.types';

const invoiceInclude = {
  invoice_items: { orderBy: { sort_order: 'asc' as const } },
  payments: { orderBy: { created_at: 'desc' as const } },
  client: { select: { name: true, email: true } },
};

class InvoicesRepository {
  async getNextNumber(firmId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ get_next_invoice_number: number }]>`
      SELECT get_next_invoice_number(${firmId}::uuid)
    `;
    return result[0].get_next_invoice_number;
  }

  async create(firmId: string, data: CreateInvoiceDto, number: number, totals: InvoiceTotals) {
    return prisma.$transaction(async (tx) => {
      return tx.invoices.create({
        data: {
          firm_id: firmId,
          client_id: data.client_id,
          number,
          status: 'draft',
          issue_date: new Date(data.issue_date),
          due_date: data.due_date ? new Date(data.due_date) : null,
          subtotal_amount: totals.subtotal_amount,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          notes: data.notes ?? null,
          invoice_items: {
            create: data.items.map((item, idx) => ({
              description: item.description,
              quantity: parseFloat(item.quantity),
              unit_price: parseFloat(item.unit_price),
              amount: parseFloat(item.quantity) * parseFloat(item.unit_price),
              sort_order: item.sort_order ?? idx,
            })),
          },
        },
        include: invoiceInclude,
      });
    });
  }

  async findById(firmId: string, invoiceId: string) {
    return prisma.invoices.findFirst({
      where: { id: invoiceId, firm_id: firmId, deleted_at: null },
      include: invoiceInclude,
    });
  }

  async findAll(firmId: string, query: ListInvoicesQuery) {
    const { status, client_id, due_date, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { firm_id: firmId, deleted_at: null };
    if (status) where.status = status;
    if (client_id) where.client_id = client_id;
    if (due_date) where.due_date = new Date(due_date);

    const [data, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: invoiceInclude,
      }),
      prisma.invoices.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(firmId: string, invoiceId: string, data: UpdateInvoiceDto, totals?: InvoiceTotals) {
    return prisma.$transaction(async (tx) => {
      if (data.items !== undefined) {
        await tx.invoice_items.deleteMany({ where: { invoice_id: invoiceId } });
        await tx.invoice_items.createMany({
          data: data.items.map((item, idx) => ({
            invoice_id: invoiceId,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
            amount: parseFloat(item.quantity) * parseFloat(item.unit_price),
            sort_order: item.sort_order ?? idx,
          })),
        });
      }

      return tx.invoices.update({
        where: { id: invoiceId, firm_id: firmId },
        data: {
          ...(data.client_id !== undefined && { client_id: data.client_id }),
          ...(data.issue_date !== undefined && { issue_date: new Date(data.issue_date) }),
          ...(data.due_date !== undefined && { due_date: data.due_date ? new Date(data.due_date) : null }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(totals && {
            subtotal_amount: totals.subtotal_amount,
            tax_amount: totals.tax_amount,
            total_amount: totals.total_amount,
          }),
        },
        include: invoiceInclude,
      });
    });
  }

  async updateStatus(firmId: string, invoiceId: string, patch: {
    status?: string;
    sent_at?: Date | null;
    paid_at?: Date | null;
    pdf_url?: string | null;
    paid_amount?: number;
  }) {
    return prisma.invoices.update({
      where: { id: invoiceId, firm_id: firmId },
      data: patch as any,
      include: invoiceInclude,
    });
  }

  async findByClient(firmId: string, clientId: string) {
    return prisma.invoices.findMany({
      where: { firm_id: firmId, client_id: clientId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: invoiceInclude,
    });
  }

  async softDelete(firmId: string, invoiceId: string) {
    return prisma.invoices.update({
      where: { id: invoiceId, firm_id: firmId },
      data: { deleted_at: new Date() },
    });
  }
}

export const invoicesRepository = new InvoicesRepository();
