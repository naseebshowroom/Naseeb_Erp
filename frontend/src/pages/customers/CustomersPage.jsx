import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { createColumnHelper } from '@tanstack/react-table';
import PageWrapper from '@/components/ui/PageWrapper';
import DataTable from '@/components/ui/DataTable';
import { SkeletonTable, ErrorState } from '@/components/ui/Skeleton';
import { useCustomers } from '@/hooks/useCustomers';
import { formatDate, formatCurrency } from '@/utils/dateUtils';
import customerService from '@/services/customerService';
import { handleApiError } from '@/utils/errorHandler';

const columnHelper = createColumnHelper();

export default function CustomersPage() {
  const navigate = useNavigate();
  const { customers, pagination, isLoading, error, refetch, search, setSearch, status, setStatus, page, setPage } = useCustomers();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Soft-delete ${name}? Their records will be preserved.`)) return;
    setDeletingId(id);
    try {
      await customerService.deleteCustomer(id);
      toast.success(`${name} removed successfully.`);
      refetch();
    } catch (err) {
      handleApiError(err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('photo', {
      header: '',
      enableSorting: false,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center overflow-hidden shrink-0">
            {row.photo ? <img src={row.photo} alt={row.fullName} className="w-full h-full object-cover" /> : row.fullName?.charAt(0)}
          </div>
        );
      },
    }),
    columnHelper.accessor('fullName', {
      header: 'Customer',
      cell: (info) => (
        <div>
          <p className="font-bold text-slate-900">{info.getValue()}</p>
          <p className="text-xs text-slate-500">{info.row.original.cnic}</p>
        </div>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor('activeInstallments', {
      header: 'Active Plans',
      cell: (info) => <span className="font-bold text-blue-600">{info.getValue() ?? 0}</span>,
    }),
    columnHelper.accessor('remainingBalance', {
      header: 'Remaining Balance',
      cell: (info) => <span className="font-bold text-slate-900">{formatCurrency(info.getValue() ?? 0)}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const s = info.getValue();
        const colors = { active: 'bg-emerald-100 text-emerald-800', completed: 'bg-blue-100 text-blue-800', defaulted: 'bg-red-100 text-red-800' };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${colors[s] || 'bg-slate-100 text-slate-800'}`}>{s}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(`/customers/${row._id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} /></button>
            <button onClick={() => navigate(`/customers/${row._id}/edit`)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit size={16} /></button>
            <button onClick={() => handleDelete(row._id, row.fullName)} disabled={deletingId === row._id} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40"><Trash2 size={16} /></button>
          </div>
        );
      },
    }),
  ], [navigate, deletingId]);

  return (
    <PageWrapper
      title="Customers"
      subtitle="Manage your complete customer database."
      actions={
        <Link to="/customers/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-sm">
          <UserPlus size={16} /> Add Customer
        </Link>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="erp-card overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, CNIC, phone..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
            <div className="sm:ml-auto text-sm text-slate-500 flex items-center font-medium">
              {pagination.total} customers found
            </div>
          </div>

          <DataTable
            columns={columns}
            data={customers}
            isLoading={isLoading}
            pageCount={pagination.pages}
            pagination={{ pageIndex: page - 1, pageSize: 10 }}
            onPaginate={({ pageIndex }) => setPage(pageIndex + 1)}
            emptyTitle="No customers found"
            emptyIcon="👥"
          />
        </div>
      )}
    </PageWrapper>
  );
}
