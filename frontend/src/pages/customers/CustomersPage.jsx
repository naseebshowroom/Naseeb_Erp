import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, User, Users, Edit, Filter, ChevronRight, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import PageWrapper from '@/components/ui/PageWrapper';
import DataTable from '@/components/ui/DataTable';
import { SkeletonTable } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import Pagination from '@/components/ui/Pagination';
import customerService from '@/services/customerService';
import api from '@/lib/axios';

const columnHelper = createColumnHelper();

// Simple useDebounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, pages: 1 });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customers`, {
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setData(res.data.data);
        setPaginationInfo(res.data.pagination);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Gahakon ka record load nahi ho saka');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const columns = useMemo(() => [
    columnHelper.accessor('fullName', {
      header: 'Gahak (Customer)',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              {info.getValue()?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900">{info.getValue()}</p>
              <p className="text-xs text-slate-500">{row.phone}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('cnic', {
      header: 'CNIC',
      cell: (info) => <span className="text-slate-600 font-mono text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('activeCategories', {
      header: 'Category',
      cell: (info) => {
        const cats = info.getValue() || [];
        if (cats.length === 0) return <span className="text-slate-400 italic text-xs">-</span>;
        
        return (
          <div className="flex flex-wrap gap-1">
            {cats.map(cat => (
              <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-slate-200 bg-white text-slate-700">
                {cat}
              </span>
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor('city', {
      header: 'Shehar (City)',
      cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(`/customers/${row._id}`)} 
              className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors"
            >
              View Profile
            </button>
            <button 
              onClick={() => navigate(`/customers/${row._id}/edit`)} 
              className="p-1.5 text-slate-400 hover:text-black rounded transition-colors"
            >
              <Edit size={16} />
            </button>
          </div>
        );
      },
    }),
  ], [navigate]);

  return (
    <PageWrapper
      title="Gahak Records (Customers)"
      subtitle="Tamaam gahakon ki list aur unke khatey (Master Ledger)."
      actions={
        <Link to="/installments/new" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-slate-800 shadow-sm transition-all">
          <PlusCircle size={16} /> Naya Khata
        </Link>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Quick Stats Tabs */}
        {[
          { id: 'all', label: 'All Customers', icon: Users, color: 'text-slate-600' },
          { id: 'active', label: 'Active', icon: Activity, color: 'text-blue-600' },
          { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
          { id: 'defaulted', label: 'Defaulted', icon: AlertCircle, color: 'text-red-600' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              statusFilter === tab.id 
                ? 'border-black bg-slate-50' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
               <tab.icon size={20} className={tab.color} />
               <span className="font-semibold text-sm text-slate-800">{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="erp-card overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Naam, CNIC, ya phone se talash karein..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="md:ml-auto text-sm text-slate-500 flex items-center font-medium">
            Total: {paginationInfo.total} Records
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchCustomers} />
        ) : isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data}
              isLoading={false}
              emptyTitle="Koi gahak nahi mila"
              emptyIcon="👥"
            />
            {paginationInfo.pages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-white flex justify-center">
                <Pagination 
                  currentPage={page} 
                  totalPages={paginationInfo.pages} 
                  onPageChange={setPage} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
