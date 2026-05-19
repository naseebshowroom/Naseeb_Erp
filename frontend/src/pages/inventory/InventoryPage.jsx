import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, Package, Bike,
  Smartphone, AlertTriangle, CheckCircle2, X, Clock,
  RefreshCw, TrendingDown, ShoppingCart, Tag, Car, Monitor, Refrigerator, Box
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency, formatDate } from '@/lib/utils'
import inventoryService from '@/services/inventoryService'
import { handleApiError } from '@/utils/errorHandler'
import api from '@/lib/axios'
import Pagination, { usePagination } from '@/components/ui/Pagination'

// ── Tabs configuration in Roman Urdu ──────────────────────────
const TABS_CONFIG = [
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'car', label: 'Gari', icon: Car },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'ac', label: 'AC', icon: Box },
  { id: 'lcd', label: 'LCD / TV', icon: Monitor },
  { id: 'washing_machine', label: 'Washing Machine', icon: Box },
  { id: 'fridge', label: 'Fridge', icon: Refrigerator },
  { id: 'electronics', label: 'Electronics (Baqi)', icon: Smartphone },
  { id: 'other', label: 'Kuch Aur', icon: Tag }
]

// ── Status helpers ────────────────────────────────────────────
const STATUS_MAP = {
  available:      { label: 'Dastiyab',      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  on_installment: { label: 'Qist Par',      cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  sold:           { label: 'Bik Gaya',      cls: 'bg-slate-100 text-slate-500 border-slate-200' },
}

function StockBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.sold
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${s.cls}`}>{s.label}</span>
  )
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{label}</p>
        <h3 className={`text-2xl font-black ${color}`}>{value ?? '—'}</h3>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color === 'text-slate-900' ? 'bg-slate-100 text-slate-500' : color === 'text-emerald-600' ? 'bg-emerald-50 text-emerald-600' : color === 'text-blue-600' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
        <Icon size={20} />
      </div>
    </div>
  )
}

// ── Field helper ──────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const INPUT_CLS = "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"

// ── Main Page ──────────────────────────────────────────────────
export default function InventoryPage() {
  const [activeTab, setActiveTab]     = useState('motorcycle')
  const [items, setItems]             = useState([])
  const [stats, setStats]             = useState(null)
  const [alerts, setAlerts]           = useState([])
  const [isLoading, setIsLoading]     = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch]           = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const pg = usePagination(items, 15)

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { category: 'motorcycle', qty: 1 }
  })
  const isVehicleModal = ['motorcycle', 'car'].includes(watch('category'))
  const isVehicleTab = ['motorcycle', 'car'].includes(activeTab)

  // ── Data fetching ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [invRes, statsRes, alertsRes] = await Promise.all([
        inventoryService.getInventory({ category: activeTab, search: search || undefined }),
        inventoryService.getStats(),
        inventoryService.getAlerts(),
      ])
      if (invRes.success)    setItems(invRes.data)
      if (statsRes.success)  setStats(statsRes.data)
      if (alertsRes.success) setAlerts(alertsRes.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, search])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  // ── Submit add stock ─────────────────────────────────────────
  const handleAddStock = async (data) => {
    setIsSubmitting(true)
    try {
      let finalElecType = data.elecType || '';
      if (['mobile', 'ac', 'lcd', 'washing_machine', 'fridge'].includes(data.category)) {
        const mapping = {
          mobile: 'Mobile Phone',
          ac: 'Air Conditioner',
          lcd: 'LCD / TV',
          washing_machine: 'Washing Machine',
          fridge: 'Refrigerator'
        };
        finalElecType = mapping[data.category];
      }
      const payload = {
        category: data.category,
        company:  data.company || data.brand || '',
        model:    data.model,
        color:    data.color || '',
        engineNo: data.engineNo || '',
        chassisNo: data.chassisNo || '',
        serialNo:  data.serialNo || '',
        purchasePrice: Number(data.purchasePrice) || 0,
        distributor:   data.distributor || '',
        elecType:      finalElecType,
        qty:           data.qty || 1,
      }
      await inventoryService.addInventory(payload)
      toast.success('Stock kamyabi se add ho gaya!')
      setAddModalOpen(false)
      reset()
      fetchData()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStats = stats ? stats[activeTab] : null
  const activeTabConfig = TABS_CONFIG.find(t => t.id === activeTab) || TABS_CONFIG[0]
  const ActiveIcon = activeTabConfig.icon

  return (
    <PageWrapper
      title="Inventory (Maal Ka Hisaab)"
      subtitle="Apne maal ka poora hisaab rakhen — dastiyab, qist par, aur bik chuka saman."
      actions={
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Naya Maal Daalen
        </button>
      }
    >
      <div className="space-y-6">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Package}       label="Kul Maal"      value={currentStats?.total}          color="text-slate-900"   />
          <StatCard icon={CheckCircle2}  label="Dastiyab"      value={currentStats?.available}      color="text-emerald-600" />
          <StatCard icon={ActiveIcon}    label="Qist Par"      value={currentStats?.onInstallment}  color="text-blue-600"    />
          <StatCard icon={TrendingDown}  label="Bik Gaya"      value={currentStats?.completed}      color="text-slate-400"   />
        </div>

        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── Main Table ── */}
          <div className="flex-1 erp-card overflow-hidden">
            {/* Table toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Tab switcher */}
              <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto gap-1">
                {TABS_CONFIG.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon size={14} /> {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Maal search karein..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  onClick={fetchData}
                  className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-48 text-slate-500 font-medium animate-pulse">
                  Maal load ho raha hai...
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                  <Package size={40} className="opacity-30" />
                  <p className="font-medium">Koi maal nahi mila</p>
                  <p className="text-sm">"Naya Maal Daalen" button se stock shamil karein</p>
                </div>
              ) : isVehicleTab ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{activeTab === 'car' ? 'Gari' : 'Motorcycle'}</th>
                      <th className="px-6 py-4">Engine / Chassis</th>
                      <th className="px-6 py-4">Gahak</th>
                      <th className="px-6 py-4">Keemat</th>
                      <th className="px-6 py-4">Haisiyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pg.paginated.map(row => (
                      <tr key={row._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{row.company} {row.model}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Rang: {row.color || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-slate-700 text-xs">{row.engineNo || '—'}</div>
                          <div className="font-mono text-xs text-slate-400">{row.chassisNo || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {row.customerName
                            ? <span className="font-medium text-blue-600">{row.customerName}</span>
                            : <span className="text-slate-400 italic text-xs">Assign nahi hua</span>
                          }
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {formatCurrency(row.purchasePrice)}
                        </td>
                        <td className="px-6 py-4">
                          <StockBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Qisam</th>
                      <th className="px-6 py-4">Samaan</th>
                      <th className="px-6 py-4">Serial No</th>
                      <th className="px-6 py-4">Gahak</th>
                      <th className="px-6 py-4">Keemat</th>
                      <th className="px-6 py-4">Haisiyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pg.paginated.map(row => (
                      <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">
                            <Tag size={11} /> {row.elecType || row.company || 'Kuch Aur'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{row.company} {row.model}</div>
                          <div className="text-xs text-slate-500">Rang: {row.color || '—'}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 text-xs">{row.serialNo || '—'}</td>
                        <td className="px-6 py-4">
                          {row.customerName
                            ? <span className="font-medium text-blue-600">{row.customerName}</span>
                            : <span className="text-slate-400 italic text-xs">Assign nahi hua</span>
                          }
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {formatCurrency(row.purchasePrice)}
                        </td>
                        <td className="px-6 py-4">
                          <StockBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination {...pg} onPageChange={pg.setPage} label="items" />
          </div>

          {/* ── Stock Alerts ── */}
          <div className="w-full xl:w-72 shrink-0 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 px-1">
              <AlertTriangle className="text-amber-500" size={18} /> Stock Alerts
            </h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-3">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <p className="font-medium">Sab theek hai! Koi low-stock alert nahi.</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border text-sm ${
                      alert.type === 'low_stock'
                        ? 'bg-red-50 border-red-100 text-red-800'
                        : 'bg-blue-50 border-blue-100 text-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.type === 'low_stock'
                        ? <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
                        : <Clock size={18} className="shrink-0 mt-0.5 text-blue-500" />
                      }
                      <p className="font-medium leading-snug">{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick summary pills */}
            {stats && (
              <div className="mt-4 p-4 erp-card space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mujmooi Khulasa</h4>
                {TABS_CONFIG.map(tab => {
                  const total = stats[tab.id]?.total || 0;
                  if (total === 0) return null;
                  return (
                    <div key={tab.id} className="flex justify-between text-sm py-2 border-b border-slate-100">
                      <span className="text-slate-500">{tab.label}</span>
                      <span className="font-bold text-slate-900">{total}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm py-2">
                  <span className="text-slate-500 font-bold">Kul Maal</span>
                  <span className="font-black text-blue-600">
                    {Object.values(stats).reduce((acc, curr) => acc + (curr.total || 0), 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Stock Modal ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Naya Maal Daalen</h2>
                  <p className="text-xs text-slate-500">Inventory mein naya stock shamil karein</p>
                </div>
              </div>
              <button
                onClick={() => { setAddModalOpen(false); reset() }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleAddStock)} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Category */}
              <Field label="Qisam (Category)">
                <select
                  {...register('category')}
                  className={INPUT_CLS}
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Gari (Car)</option>
                  <option value="mobile">Mobile (Mobile Phone)</option>
                  <option value="ac">AC (Air Conditioner)</option>
                  <option value="lcd">TV / LCD</option>
                  <option value="washing_machine">Washing Machine</option>
                  <option value="fridge">Fridge (Refrigerator)</option>
                  <option value="other">Kuch Aur (Other)</option>
                </select>
              </Field>

              {isVehicleModal ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Company *">
                    <input {...register('company', { required: true })} placeholder="Honda" className={INPUT_CLS} />
                  </Field>
                  <Field label="Model *">
                    <input {...register('model', { required: true })} placeholder="CD 70" className={INPUT_CLS} />
                  </Field>
                  <Field label="Rang (Color)">
                    <input {...register('color')} placeholder="Red" className={INPUT_CLS} />
                  </Field>
                  <Field label="Distributor">
                    <input {...register('distributor')} placeholder="Ali Traders" className={INPUT_CLS} />
                  </Field>
                  <Field label="Engine Number">
                    <input {...register('engineNo')} placeholder="E-12345" className={`${INPUT_CLS} font-mono`} />
                  </Field>
                  <Field label="Chassis Number">
                    <input {...register('chassisNo')} placeholder="C-98765" className={`${INPUT_CLS} font-mono`} />
                  </Field>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Brand *">
                    <input {...register('brand', { required: true })} placeholder="Samsung" className={INPUT_CLS} />
                  </Field>
                  <Field label="Model *">
                    <input {...register('model', { required: true })} placeholder="Galaxy A54" className={INPUT_CLS} />
                  </Field>
                  <Field label="Rang (Color)">
                    <input {...register('color')} placeholder="Black" className={INPUT_CLS} />
                  </Field>
                  <Field label="Tadaad (Qty)">
                    <input
                      type="number"
                      min={1}
                      {...register('qty')}
                      className={INPUT_CLS}
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Serial No / IMEI">
                      <input {...register('serialNo')} placeholder="SN-00123" className={`${INPUT_CLS} font-mono`} />
                    </Field>
                  </div>
                </div>
              )}

              {/* Purchase Price */}
              <div className="pt-4 border-t border-slate-100">
                <Field label="Khareed Keemat (PKR) *">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      {...register('purchasePrice', { required: true })}
                      placeholder="0"
                      className={`${INPUT_CLS} pl-10`}
                    />
                  </div>
                </Field>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><RefreshCw size={16} className="animate-spin" /> Save ho raha hai...</>
                ) : (
                  <><ShoppingCart size={16} /> Inventory Mein Shamil Karein</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
