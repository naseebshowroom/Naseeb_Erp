import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Smartphone, Car, Truck, Monitor, Box, Refrigerator } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import PageWrapper from '@/components/ui/PageWrapper';
import DataTable from '@/components/ui/DataTable';
import { SkeletonTable } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import Pagination from '@/components/ui/Pagination';
import { useInstallments } from '@/hooks/useInstallments';
import { formatDate, formatCurrency } from '@/utils/dateUtils';

const columnHelper = createColumnHelper();

const CATEGORY_LABELS = {
  mobile: 'Mobile', ac: 'Air Conditioner', lcd: 'LCD/TV',
  washing_machine: 'Washing Machine', fridge: 'Fridge',
  motorcycle: 'Motorcycle', car: 'Car', other: 'Other',
};

const CATEGORY_ICONS = {
  all: Box,
  mobile: Smartphone,
  motorcycle: Truck, // using Truck as generic bike/vehicle
  car: Car,
  ac: Box,
  lcd: Monitor,
  fridge: Refrigerator,
  washing_machine: Box,
  other: Box
};

export default function InstallmentsPage() {
  const navigate = useNavigate();
  const {
    installments, pagination, isLoading, error, refetch,
    search, setSearch, category, setCategory, status, setStatus, page, setPage
  } = useInstallments();

  const columns = useMemo(() => [
    columnHelper.accessor('customer.fullName', {
      header: 'Gahak (Customer)',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
            {info.getValue()?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{info.getValue() || 'Unknown'}</p>
            <p className="text-xs text-slate-500">{info.row.original.customer?.phone || 'No Phone'}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Samaan (Item)',
      cell: (info) => {
        const cat = info.getValue();
        const Icon = CATEGORY_ICONS[cat] || Box;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
               <Icon size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-800">{CATEGORY_LABELS[cat] || cat}</p>
              <p className="text-xs text-slate-500">{info.row.original.brand} {info.row.original.model}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('remainingAmount', {
      header: 'Baqaya (Remaining)',
      cell: (info) => <span className="font-black text-red-600">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('perInstallmentAmount', {
      header: 'Har Qist (Per Installment)',
      cell: (info) => <span className="font-bold text-slate-900">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('scheduleType', {
      header: 'Tareeqa',
      cell: (info) => <span className="capitalize font-bold text-slate-600 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Haisiyat',
      cell: (info) => {
        const s = info.getValue();
        const map = {
          active: 'bg-emerald-100 text-emerald-800',
          overdue: 'bg-red-100 text-red-800',
          completed: 'bg-blue-100 text-blue-800',
          near_completion: 'bg-amber-100 text-amber-800',
        };
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${map[s] || 'bg-slate-100'}`}>{s?.replace('_', ' ')}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: (info) => (
        <button onClick={() => navigate(`/installments/${info.row.original._id}`)} className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors">
          View
        </button>
      ),
    }),
  ], [navigate]);

  return (
    <PageWrapper
      title="Khatey (Installments)"
      subtitle="Tamam chalu, mukammal, aur late khata jaat ki tafseel."
      actions={
        <Link to="/installments/new" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-slate-800 shadow-sm transition-all">
          <Plus size={16} /> Naya Khata
        </Link>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[{ id: '', label: 'Sab' }, ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }))].map(cat => {
           const Icon = CATEGORY_ICONS[cat.id] || Box;
           return (
             <button
               key={cat.id}
               onClick={() => setCategory(cat.id)}
               className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                 category === cat.id 
                   ? 'border-black bg-slate-50 shadow-sm' 
                   : 'border-slate-200 bg-white hover:border-slate-300'
               }`}
             >
               <Icon size={20} className={`mb-2 ${category === cat.id ? 'text-blue-600' : 'text-slate-500'}`} />
               <span className={`text-[10px] font-bold text-center leading-tight uppercase tracking-wider ${category === cat.id ? 'text-slate-900' : 'text-slate-500'}`}>{cat.label}</span>
             </button>
           )
        })}
      </div>

      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Gahak ya samaan talash karein..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black cursor-pointer">
            <option value="">Tamam Haisiyat</option>
            <option value="active">Chalu (Active)</option>
            <option value="overdue">Late (Overdue)</option>
            <option value="completed">Mukammal (Completed)</option>
          </select>

          <div className="md:ml-auto text-sm text-slate-500 flex items-center font-medium">
            Total: {pagination.total} Khatey
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={installments}
              isLoading={false}
              emptyTitle="Koi khata nahi mila"
              emptyIcon="📋"
            />
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-white flex justify-center">
                <Pagination 
                  currentPage={page} 
                  totalPages={pagination.pages} 
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
