import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Eye, Edit, AlertCircle } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import PageWrapper from '@/components/ui/PageWrapper';
import DataTable from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/dateUtils';
import installmentService from '@/services/installmentService';

const columnHelper = createColumnHelper();

export default function CustomersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchOverdue = async () => {
    setIsLoading(true);
    try {
      const res = await installmentService.getOverdue();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch recovery data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const columns = useMemo(() => [
    columnHelper.accessor('customer.fullName', {
      header: 'Gahak ka Naam',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div>
            <p className="font-bold text-slate-900">{info.getValue() || 'N/A'}</p>
            <p className="text-xs text-slate-500">{row.customer?.phone || ''}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor('category', {
      header: 'Samaan',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div>
            <p className="font-bold text-slate-700 capitalize">{info.getValue()}</p>
            <p className="text-xs text-slate-500">{row.brand} {row.model}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor('perInstallmentAmount', {
      header: 'Qist Amount',
      cell: (info) => <span className="font-bold text-red-600">{formatCurrency(info.getValue() ?? 0)}</span>,
    }),
    columnHelper.accessor('daysOverdue', {
      header: 'Din Oopar',
      cell: (info) => {
        const days = info.getValue() || 0;
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <AlertCircle size={14} /> {days} Din
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Amal (Actions)',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(`/installments/${row._id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View Installment"><Eye size={16} /></button>
            <button onClick={() => navigate(`/installments/${row._id}/edit`)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit Installment"><Edit size={16} /></button>
          </div>
        );
      },
    }),
  ], [navigate]);

  // Client-side search since we fetched all overdue
  const filteredData = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter(item => 
      item.customer?.fullName?.toLowerCase().includes(lower) ||
      item.customer?.phone?.includes(lower) ||
      item.customer?.cnic?.includes(lower) ||
      item.category?.toLowerCase().includes(lower) ||
      item.brand?.toLowerCase().includes(lower)
    );
  }, [data, search]);

  return (
    <PageWrapper
      title="Vasooli / Khata"
      subtitle="Baqaya qiston ki wasooli ka record (Overdue Recoveries)."
      actions={
        <Link to="/installments/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-sm">
          <PlusCircle size={16} /> Naya Khata
        </Link>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={fetchOverdue} />
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
                placeholder="Naam, CNIC, ya phone se talash karein..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <div className="sm:ml-auto text-sm text-slate-500 flex items-center font-medium">
              Kul {filteredData.length} records
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            emptyTitle="Koi wasooli baqi nahi"
            emptyIcon="✅"
          />
        </div>
      )}
    </PageWrapper>
  );
}
