import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, Plus, Eye, Edit, Truck, Building2, RefreshCw, X, Tag
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency } from '@/lib/utils'
import distributorService from '@/services/distributorService'
import { handleApiError } from '@/utils/errorHandler'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { SkeletonTable } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { formatPhone } from '@/utils/formatters'

const INPUT = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black transition-colors';

export default function DistributorsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [stats, setStats] = useState({ totalDistributors: 0, totalOwed: 0, totalSupplied: 0 })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  
  const fetchDistributors = async () => {
    setIsLoading(true)
    try {
      const [distRes, statsRes] = await Promise.all([
        distributorService.getDistributors({ search }),
        distributorService.getStats()
      ])
      if (distRes.success) setData(distRes.data)
      if (statsRes.success) setStats(statsRes.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDistributors()
  }, [search])

  const CATEGORIES = [
    { id: 'all',         label: 'Sab' },
    { id: 'motorcycle',  label: '🏍️ Motorcycle' },
    { id: 'electronics', label: '📺 Electronics' },
    { id: 'car',         label: '🚗 Car' },
    { id: 'other',       label: 'Other' },
  ]

  const filteredData = categoryFilter === 'all'
    ? data
    : data.filter(d => d.category === categoryFilter)

  const pg = usePagination(filteredData, 10)

  const handleAddDistributor = async (formData) => {
    setIsSubmitting(true)
    try {
      await distributorService.createDistributor(formData)
      toast.success('Naya distributor add ho gaya!')
      setAddModalOpen(false)
      reset()
      fetchDistributors()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageWrapper 
      title="Distributors (Maal Denay Walay)" 
      subtitle="Apne suppliers aur unki adayigiyon ka hisaab rakhen."
      actions={
        <button 
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus size={16} /> Naya Distributor
        </button>
      }
    >
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Kul Distributors</p>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalDistributors}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"><Truck size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Baqaya Rakam (Payable)</p>
            <h3 className="text-2xl font-black text-black">{formatCurrency(stats.totalOwed)}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"><Building2 size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Kul Maal Ki Keemat</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalSupplied)}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"><Truck size={20} /></div>
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              categoryFilter === cat.id
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-600 border-slate-200 hover:border-black hover:text-black'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Naam ya company se search karein..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={fetchDistributors}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:border-black hover:text-black text-slate-500 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="bg-white"><SkeletonTable rows={5} cols={5} /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Company Tafseel</th>
                  <th className="px-6 py-4">Rabta</th>
                  <th className="px-6 py-4 text-center">Category</th>
                  <th className="px-6 py-4 text-center">Kul Maal (Value)</th>
                  <th className="px-6 py-4 text-right">Baqaya (Payable)</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-slate-100">
                {pg.total === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">Koi distributor nahi mila.</td>
                  </tr>
                ) : (
                  pg.paginated.map(row => (
                    <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{row.companyName}</div>
                        <div className="text-xs text-slate-500">Address: {row.address || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{row.name}</div>
                        <div className="text-xs text-slate-500">{row.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                          row.category === 'motorcycle' ? 'bg-amber-100 text-amber-700' :
                          row.category === 'electronics' ? 'bg-blue-100 text-blue-700' :
                          row.category === 'car' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {row.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-700">
                        <span className="bg-slate-100 px-3 py-1 rounded-full">{formatCurrency(row.totalSupplied)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold ${row.balance > 0 ? 'text-black' : 'text-slate-400'}`}>
                          {formatCurrency(row.balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => navigate(`/distributors/${row._id}`)}
                            className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-colors"
                            title="Profile Dekhen"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <Pagination {...pg} onPageChange={pg.setPage} label="distributors" />
      </div>

      {/* ── Add Distributor Modal ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-slate-900">Naya Distributor Add Karein</h2>
              <button onClick={() => { setAddModalOpen(false); reset() }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleAddDistributor)} className="flex flex-col">
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company Name *</label>
                  <input
                    {...register('companyName', { required: 'Company Name zaroori hai' })}
                    className={INPUT}
                    placeholder="Haider Electronics"
                  />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contact Person *</label>
                  <input
                    {...register('name', { required: 'Naam zaroori hai' })}
                    className={INPUT}
                    placeholder="Ali Raza"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone *</label>
                  <input
                    {...register('phone', { 
                      required: 'Phone zaroori hai',
                      onChange: (e) => {
                        e.target.value = formatPhone(e.target.value)
                      }
                    })}
                    className={INPUT}
                    placeholder="0300-1234567"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Address</label>
                  <input {...register('address')} className={INPUT} placeholder="Market Name, City" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category (Product Type) *</label>
                  <select {...register('category', { required: true })} className={INPUT}>
                    <option value="">-- Category Chunyein --</option>
                    <option value="motorcycle">🏍️ Motorcycle</option>
                    <option value="electronics">📺 Electronics</option>
                    <option value="car">🚗 Car</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Distributor Banao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
