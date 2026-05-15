import { useState } from 'react'
import { 
  Search, Filter, Plus, Package, Bike, 
  Smartphone, AlertTriangle, CheckCircle2, X, Clock
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MOCK_MOTO = [
  { id: 1, company: 'Honda', model: 'CD 70', color: 'Red', engineNo: 'E-12345', chassisNo: 'C-98765', customer: 'Muhammad Asif', status: 'on_installment', date: '2026-05-01' },
  { id: 2, company: 'Yamaha', model: 'YBR 125', color: 'Black', engineNo: 'E-55555', chassisNo: 'C-44444', customer: null, status: 'available', date: '2026-05-10' },
  { id: 3, company: 'United', model: 'US 70', color: 'Red', engineNo: 'E-11111', chassisNo: 'C-22222', customer: 'Ali Hassan', status: 'completed', date: '2025-01-15' },
]

const MOCK_ELEC = [
  { id: 101, category: 'Air Conditioner', brand: 'Haier', model: '1.5 Ton Inverter', serialNo: 'SN-00123', price: 110000, customer: 'Sana Bibi', status: 'on_installment' },
  { id: 102, category: 'Mobile', brand: 'Samsung', model: 'Galaxy A54', serialNo: 'IMEI-987654321', price: 105000, customer: null, status: 'available' },
]

const MOCK_ALERTS = [
  { id: 1, type: 'completion', message: 'Honda CD 70 (Tariq) is completing in 2 installments. Stock will free up.' },
  { id: 2, type: 'low_stock', message: 'Low Stock Warning: 0 Washing Machines available in inventory.' },
]

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('motorcycles')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { category: 'motorcycle' } })

  const isMotoModal = watch('category') === 'motorcycle'

  const handleAddStock = (data) => {
    toast.success('Stock added successfully!')
    setAddModalOpen(false)
    reset()
  }

  // Summary Cards Data
  const summaryMoto = { total: 45, onInstallment: 28, completed: 12, available: 5 }
  const summaryElec = { total: 120, onInstallment: 85, completed: 25, available: 10 }
  const currentSummary = activeTab === 'motorcycles' ? summaryMoto : summaryElec

  return (
    <PageWrapper 
      title="Inventory Management" 
      subtitle="Track physical stock, assign items, and monitor availability."
      actions={
        <button 
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Stock
        </button>
      }
    >
      <div className="space-y-6">
        
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Received</p>
              <h3 className="text-2xl font-black text-slate-900">{currentSummary.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Package size={20} /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Available</p>
              <h3 className="text-2xl font-black text-emerald-600">{currentSummary.available}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 size={20} /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">On Installment</p>
              <h3 className="text-2xl font-black text-blue-600">{currentSummary.onInstallment}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Bike size={20} /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Completed</p>
              <h3 className="text-2xl font-black text-slate-400">{currentSummary.completed}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><CheckCircle2 size={20} /></div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* ── Main Tables Area ── */}
          <div className="flex-1 erp-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('motorcycles')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'motorcycles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Bike size={16} /> Motorcycles
                </button>
                <button
                  onClick={() => setActiveTab('electronics')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'electronics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Smartphone size={16} /> Electronics
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search inventory..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                  <Filter size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'motorcycles' ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Bike Details</th>
                      <th className="px-6 py-4">Engine / Chassis</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Date Added</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_MOTO.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{row.company} {row.model}</div>
                          <div className="text-xs text-slate-500">Color: {row.color}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-slate-700">{row.engineNo}</div>
                          <div className="font-mono text-xs text-slate-500">{row.chassisNo}</div>
                        </td>
                        <td className="px-6 py-4">
                          {row.customer ? <span className="font-medium text-blue-600 hover:underline cursor-pointer">{row.customer}</span> : <span className="text-slate-400 italic">Not Assigned</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{formatDate(row.date)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status === 'on_installment' ? 'active' : row.status === 'available' ? 'completed' : 'pending'} label={row.status.replace('_', ' ')} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4">Serial No</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_ELEC.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{row.category}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{row.brand} {row.model}</div>
                          <div className="text-xs text-slate-500">Purchase: {formatCurrency(row.price)}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">{row.serialNo}</td>
                        <td className="px-6 py-4">
                          {row.customer ? <span className="font-medium text-blue-600 hover:underline cursor-pointer">{row.customer}</span> : <span className="text-slate-400 italic">Not Assigned</span>}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status === 'on_installment' ? 'active' : row.status === 'available' ? 'completed' : 'pending'} label={row.status.replace('_', ' ')} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Stock Alerts ── */}
          <div className="w-full xl:w-80 shrink-0 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 px-1">
              <AlertTriangle className="text-amber-500" size={18} /> Stock Alerts
            </h3>
            <div className="space-y-3">
              {MOCK_ALERTS.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border text-sm ${
                  alert.type === 'low_stock' 
                    ? 'bg-red-50 border-red-100 text-red-800' 
                    : 'bg-blue-50 border-blue-100 text-blue-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {alert.type === 'low_stock' ? <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" /> : <Clock size={18} className="shrink-0 mt-0.5 text-blue-500" />}
                    <p className="font-medium leading-snug">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Add Stock Modal ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Add New Stock</h2>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit(handleAddStock)} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inventory Category</label>
                <select {...register('category')} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium">
                  <option value="motorcycle">Motorcycle</option>
                  <option value="electronics">Electronics (Mobile, AC, TV, etc)</option>
                </select>
              </div>

              {isMotoModal ? (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Company</label>
                    <input {...register('company')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="Honda" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Model</label>
                    <input {...register('model')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="CD 70" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Color</label>
                    <input {...register('color')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Distributor*</label>
                    <select {...register('distributor')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                      <option>Ali Traders</option>
                      <option>Zafar Autos</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Engine Number</label>
                    <input {...register('engineNo')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Chassis Number</label>
                    <input {...register('chassisNo')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Product Type</label>
                    <select {...register('elecType')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                      <option>Mobile Phone</option>
                      <option>Air Conditioner</option>
                      <option>LCD / TV</option>
                      <option>Washing Machine</option>
                      <option>Refrigerator</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Brand</label>
                    <input {...register('brand')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Model</label>
                    <input {...register('model')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Serial Number / IMEI</label>
                    <input {...register('serialNo')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Quantity</label>
                    <input type="number" defaultValue={1} {...register('qty')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Purchase Price (PKR)</label>
                  <input type="number" {...register('purchasePrice')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="0" />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                Save to Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
