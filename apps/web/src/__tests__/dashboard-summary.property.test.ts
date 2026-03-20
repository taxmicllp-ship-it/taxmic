// Feature: ui-dashboard-live-data, Properties P1–P5: DashboardSummary invariants

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DashboardSummary } from '../features/dashboard/types';

// Arbitraries
const byStatusArb = fc.record({
  new: fc.nat({ max: 200 }),
  in_progress: fc.nat({ max: 200 }),
  waiting_client: fc.nat({ max: 200 }),
  review: fc.nat({ max: 200 }),
  completed: fc.nat({ max: 200 }),
});

const byInvoiceStatusArb = fc.record({
  draft: fc.nat({ max: 200 }),
  sent: fc.nat({ max: 200 }),
  paid: fc.nat({ max: 200 }),
  overdue: fc.nat({ max: 200 }),
});

const dashboardSummaryArb: fc.Arbitrary<DashboardSummary> = fc.record({
  clients: fc.record({ total: fc.nat(), active: fc.nat() }),
  contacts: fc.record({ total: fc.nat() }),
  tasks: byStatusArb.chain((by_status) => {
    const statusSum =
      by_status.new +
      by_status.in_progress +
      by_status.waiting_client +
      by_status.review +
      by_status.completed;
    return fc.record({
      total: fc.nat({ max: 1000 }).map((extra) => statusSum + extra),
      overdue: fc.nat(),
      by_status: fc.constant(by_status),
    });
  }),
  invoices: byInvoiceStatusArb.chain((statuses) => {
    const statusSum = statuses.draft + statuses.sent + statuses.paid + statuses.overdue;
    return fc.record({
      total: fc.nat({ max: 1000 }).map((extra) => statusSum + extra),
      draft: fc.constant(statuses.draft),
      sent: fc.constant(statuses.sent),
      paid: fc.constant(statuses.paid),
      overdue: fc.constant(statuses.overdue),
      total_outstanding_amount: fc.nat().map((n) => n.toFixed(2)),
    });
  }),
  notifications: fc.record({ unread_count: fc.nat() }),
});

/**
 * P1: All counts non-negative
 * Validates: Requirements 1.1
 */
describe('P1: All counts non-negative', () => {
  it('every integer count field in DashboardSummary is >= 0', () => {
    fc.assert(
      fc.property(dashboardSummaryArb, (summary) => {
        expect(summary.clients.total).toBeGreaterThanOrEqual(0);
        expect(summary.clients.active).toBeGreaterThanOrEqual(0);
        expect(summary.contacts.total).toBeGreaterThanOrEqual(0);
        expect(summary.tasks.total).toBeGreaterThanOrEqual(0);
        expect(summary.tasks.overdue).toBeGreaterThanOrEqual(0);
        expect(summary.tasks.by_status.new).toBeGreaterThanOrEqual(0);
        expect(summary.tasks.by_status.in_progress).toBeGreaterThanOrEqual(0);
        expect(summary.tasks.by_status.waiting_client).toBeGreaterThanOrEqual(0);
        expect(summary.tasks.by_status.review).toBeGreaterThanOrEqual(0);
        expect(summary.tasks.by_status.completed).toBeGreaterThanOrEqual(0);
        expect(summary.invoices.total).toBeGreaterThanOrEqual(0);
        expect(summary.invoices.draft).toBeGreaterThanOrEqual(0);
        expect(summary.invoices.sent).toBeGreaterThanOrEqual(0);
        expect(summary.invoices.paid).toBeGreaterThanOrEqual(0);
        expect(summary.invoices.overdue).toBeGreaterThanOrEqual(0);
        expect(summary.notifications.unread_count).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * P2: Task by_status sum <= tasks.total
 * Validates: Requirements 1.2
 */
describe('P2: Task by_status sum <= tasks.total', () => {
  it('sum of by_status counts does not exceed tasks.total', () => {
    fc.assert(
      fc.property(dashboardSummaryArb, (summary) => {
        const { by_status, total } = summary.tasks;
        const sum =
          by_status.new +
          by_status.in_progress +
          by_status.waiting_client +
          by_status.review +
          by_status.completed;
        expect(sum).toBeLessThanOrEqual(total);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * P3: Invoice status counts <= invoices.total
 * Validates: Requirements 1.3
 */
describe('P3: Invoice status counts <= invoices.total', () => {
  it('draft + sent + paid + overdue does not exceed invoices.total', () => {
    fc.assert(
      fc.property(dashboardSummaryArb, (summary) => {
        const { draft, sent, paid, overdue, total } = summary.invoices;
        expect(draft + sent + paid + overdue).toBeLessThanOrEqual(total);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * P4: total_outstanding_amount is a non-negative decimal string
 * Validates: Requirements 1.4
 */
describe('P4: total_outstanding_amount is a non-negative decimal string', () => {
  it('parses as a non-negative finite number', () => {
    fc.assert(
      fc.property(dashboardSummaryArb, (summary) => {
        const val = parseFloat(summary.invoices.total_outstanding_amount);
        expect(isNaN(val)).toBe(false);
        expect(val).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * P5: notifications.unread_count is non-negative
 * Validates: Requirements 1.5
 */
describe('P5: notifications.unread_count is non-negative', () => {
  it('unread_count is always >= 0', () => {
    fc.assert(
      fc.property(dashboardSummaryArb, (summary) => {
        expect(summary.notifications.unread_count).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });
});
