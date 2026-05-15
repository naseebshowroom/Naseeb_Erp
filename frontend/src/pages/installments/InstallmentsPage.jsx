import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import PageWrapper from '@/components/ui/PageWrapper';
import DataTable from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/Skeleton';
import { useInstallments } from '@/hooks/useInstallments';
import { formatDate, formatCurrency } from '@/utils/dateUtils';

const columnHelper = createColumnHelper();

const CATEGORY_LABELS = {
  mobile: 'Mobile', ac: 'Air Conditioner', lcd: 'LCD/TV',
  washing_machine: 'Washing Machine', fridge: 'Fridge',
  motorcycle: 'Motorcycle', car: 'Car', other: 'Other',
};

export default function InstallmentsPage() {
  const navigate = useNavigate();
  const {
    installments, pagination, isLoading, error, refetch,
    search, setSearch, category, setCategory, status, setStatus, page, setPage
  } = useInstallments();

  const columns = useMemo(() => [
    columnHelper.accessor('customer.fullName', {
      header: 'Customer',
      cell: (info) => (
        <div>
          <p className="font-bold text-slate-900">{info.getValue()}</p>
          <p className="text-xs text-slate-500">{info.row.original.customer?.phone}</p>
        </div>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Item',
      cell: (info) => (
        <div>
          <p className="font-medium text-slate-800">{CATEGORY_LABELS[info.getValue()] || info.getValue()}</p>
          <p className="text-xs text-slate-500">{info.row.original.brand} {info.row.original.model}</p>
        </div>
      ),
    }),
    columnHelper.accessor('remainingAmount', {
      header: 'Remaining',
      cell: (info) => <span className="font-bold text-slate-900">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('perInstallmentAmount', {
      header: 'Per Installment',
      cell: (info) => <span className="font-bold text-blue-600">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('scheduleType', {
      header: 'Schedule',
      cell: (info) => <span className="capitalize font-medium text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const s = info.getValue();
        const map = {
          active: 'bg-emerald-100 text-emerald-800',
          overdue: 'bg-red-100 text-red-800',
          completed: 'bg-blue-100 text-blue-800',
          near_completion: 'bg-amber-100 text-amber-800',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[s] || 'bg-slate-100'}`}>{s?.replace('_', ' ')}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: (info) => (
        <button onClick={() => navigate(`/installments/${info.row.original._id}`)} className="text-xs font-bold text-blue-600 hover:underline">
          View →
        </button>
      ),
    }),
  ], [navigate]);

  return (
    <PageWrapper
      title="Installments"
      subtitle="Track all active, completed, and overdue installment plans."
      actions={
        <Link to="/installments/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-sm">
          <Plus size={16} /> New Installment
        </Link>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="erp-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, brand, model..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none">
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            data={installments}
            isLoading={isLoading}
            pageCount={pagination.pages}
            pagination={{ pageIndex: page - 1, pageSize: 10 }}
            onPaginate={({ pageIndex }) => setPage(pageIndex + 1)}
            emptyTitle="No installments found"
            emptyIcon="📋"
          />
        </div>
      )}
    </PageWrapper>
  );
}
