import { InvoiceItem } from '../types';

interface LineItemsTableProps {
  items: InvoiceItem[];
}

export default function LineItemsTable({ items }: LineItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Description</th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Qty</th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Unit Price</th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2 text-gray-900 dark:text-white">{item.description}</td>
              <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
              <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">${parseFloat(item.unit_price).toFixed(2)}</td>
              <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">${parseFloat(item.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
