import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Building2, Phone, MapPin, Package, CheckCircle2,
  Wallet, Edit, ArrowUpRight, RefreshCw, X, CreditCard, CalendarDays, Tag, Plus, Trash2, Printer
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import distributorService from '@/services/distributorService'
import { handleApiError } from '@/utils/errorHandler'
import toast from 'react-hot-toast'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '@/lib/axios'
import ConfirmModal from '@/components/ui/ConfirmModal'

const INPUT = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black transition-colors';

export default function DistributorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate]     = useState(() => new Date().toISOString().split('T')[0])
  const [payNotes, setPayNotes]   = useState('')
  const [activeTab, setActiveTab] = useState('supply')

  const [supplyModalOpen, setSupplyModalOpen] = useState(false)
  const [isSupplying, setIsSupplying] = useState(false)

  // Granular supplied items state
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [newItem, setNewItem] = useState({
    brand: '', make: '', model: '', chassisNumber: '', engineNumber: '',
    color: '', dateSupplied: new Date().toISOString().split('T')[0],
    unitPrice: '', quantity: 1
  })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      items: [{ description: '', quantity: 1, unitPrice: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const fetchDetail = async () => {
    setIsLoading(true)
    try {
      const res = await distributorService.getDistributor(id)
      if (res.success) setData(res.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!payAmount || Number(payAmount) <= 0) return
    
    setIsPaying(true)
    try {
      await distributorService.recordPayment(id, {
        amount: Number(payAmount),
        paymentDate: payDate,
        notes: payNotes,
      })
      toast.success('Adayigi record ho gayi!')
      setPayModalOpen(false)
      setPayAmount('')
      setPayNotes('')
      setPayDate(new Date().toISOString().split('T')[0])
      fetchDetail()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsPaying(false)
    }
  }

  const handleSupply = async (formData) => {
    setIsSupplying(true)
    try {
      await distributorService.recordSupply(id, formData)
      toast.success('Supply/Invoice record ho gayi!')
      setSupplyModalOpen(false)
      reset()
      fetchDetail()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSupplying(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newItem.model || !newItem.unitPrice) {
      toast.error('Model aur Qeemat zaroori hain!')
      return
    }
    setIsSavingItem(true)
    try {
      await api.post(`/distributors/${id}/items`, newItem)
      toast.success('Item stock mein shamil ho gaya!')
      setItemModalOpen(false)
      setNewItem({
        brand: '', make: '', model: '', chassisNumber: '', engineNumber: '',
        color: '', dateSupplied: new Date().toISOString().split('T')[0],
        unitPrice: '', quantity: 1
      })
      fetchDetail()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleDeleteItem = (itemId) => {
    setItemToDelete(itemId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return
    try {
      await api.delete(`/distributors/${id}/items/${itemToDelete}`)
      toast.success('Item remove ho gaya!')
      fetchDetail()
    } catch (err) {
      handleApiError(err)
    } finally {
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const handleUpdateItemStatus = async (itemId, status) => {
    try {
      await api.patch(`/distributors/${id}/items/${itemId}/status`, { status })
      toast.success(`Item status: ${status} ho gaya!`)
      fetchDetail()
    } catch (err) {
      handleApiError(err)
    }
  }

  const handlePrintLetter = async (itemId, letterType) => {
    try {
      const res = await api.post('/pdf/distributor-letter', {
        distributorId: id,
        itemId,
        letterType
      }, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (err) {
      toast.error('Letter print karne mein masla hua.')
    }
  }

  if (isLoading) {
    return (
      <PageWrapper title="Distributor Tafseel" breadcrumbs={[{ label: 'Distributors', to: '/distributors' }, { label: 'Loading...' }]}>
        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">Data load ho raha hai...</div>
      </PageWrapper>
    )
  }

  if (!data) {
    return (
      <PageWrapper title="Distributor Tafseel" breadcrumbs={[{ label: 'Distributors', to: '/distributors' }, { label: 'Not Found' }]}>
        <div className="flex justify-center items-center h-64 text-red-500 font-medium">Distributor nahi mila.</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper 
      title={data.companyName}
      breadcrumbs={[{ label: 'Distributors', to: '/distributors' }, { label: data.name }]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
          >
            <Plus size={16} /> Granular Item Likhain
          </button>
          <button 
            onClick={() => setSupplyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-black hover:border-black transition-colors shadow-sm"
          >
            <Package size={16} /> Supply Aayi
          </button>
          <button 
            onClick={() => setPayModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Wallet size={16} /> Adayigi Darj Karein
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Profile & Financials ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="erp-card p-6 relative overflow-hidden bg-white">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-4 relative z-10 shadow-sm font-bold text-2xl">
              {data.companyName.charAt(0)}
            </div>
            <h2 className="text-xl font-black text-slate-900">{data.companyName}</h2>
            <p className="text-sm font-bold text-slate-500 mb-4">{data.name}</p>
            
            <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>{data.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{data.address || 'Address nahi hai'}</span>
              </div>
            </div>
          </div>

          <div className={`erp-card p-6 text-white ${data.financials.balance > 0 ? 'bg-black' : 'bg-emerald-600'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="opacity-70" size={20} /> Baqaya Rakam
            </h3>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <span className="block text-white/60 text-xs uppercase font-bold tracking-wider mb-1">Payable Balance</span>
                <span className="text-3xl font-black">{formatCurrency(data.financials.balance)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Kul Maal</span>
                  <span className="font-bold">{formatCurrency(data.financials.totalSupplied)}</span>
                </div>
                <div>
                  <span className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Kul Adayigi</span>
                  <span className="font-bold">{formatCurrency(data.financials.totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── History & Details ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="erp-card overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {[
                  {id:'supply',label:'Supply History',icon:Package},
                  {id:'items',label:'Supplied Stock',icon:Tag},
                  {id:'payments',label:'Payment History',icon:CreditCard}
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
                      activeTab === t.id ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-black'
                    }`}>
                    <t.icon size={14}/>{t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'supply' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Tareekh</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider">Total Invoice</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider">Baqaya</th>
                    <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.supplyHistory && data.supplyHistory.length > 0 ? (
                    data.supplyHistory.map((supply) => (
                      <tr key={supply._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{formatDate(supply.invoiceDate || supply.createdAt)}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {supply.items.map(i => `${i.quantity}x ${i.description}`).join(', ')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg capitalize">
                            {supply.category || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(supply.totalAmount)}</td>
                        <td className="px-6 py-4 text-right font-bold text-black">{formatCurrency(supply.balance)}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge 
                            status={supply.status === 'paid' ? 'completed' : supply.status === 'partial' ? 'active' : 'pending'} 
                            label={supply.status === 'paid' ? 'Paid' : supply.status === 'partial' ? 'Partial' : 'Pending'} 
                            size="sm" 
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Abhi tak koi supply history nahi hai.</td></tr>
                  )}
                </tbody>
              </table>
              )}

              {activeTab === 'items' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider">Item Details</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider">Chassis / Engine</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider">Price (PKR)</th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.suppliedItems && data.suppliedItems.length > 0 ? (
                    data.suppliedItems.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.brand} {item.model}</div>
                          <div className="text-xs text-slate-400">Make: {item.make || '—'}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <div>C: {item.chassisNumber || '—'}</div>
                          <div>E: {item.engineNumber || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.color || '—'}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.status === 'In-Stock' ? 'bg-emerald-100 text-emerald-700' :
                            item.status === 'Sold' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Update status dropdown */}
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateItemStatus(item._id, e.target.value)}
                              className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                            >
                              <option value="In-Stock">In-Stock</option>
                              <option value="Sold">Sold</option>
                              <option value="Returned">Returned</option>
                            </select>

                            {/* Print letter options */}
                            <button
                              onClick={() => handlePrintLetter(item._id, 'purchase')}
                              title="Purchase Letter"
                              className="p-1 text-slate-600 hover:text-black hover:bg-slate-100 rounded"
                            >
                              <Printer size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              title="Remove Item"
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Abhi tak koi item register nahi hai.</td></tr>
                  )}
                </tbody>
              </table>
              )}

              {activeTab === 'payments' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Adayigi Tareekh</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider">Rakam</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.paymentHistory && data.paymentHistory.length > 0 ? (
                    data.paymentHistory.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400"/>
                          {formatDate(p.paymentDate || p.date || p.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-black">{formatCurrency(p.amount)}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{p.notes || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Abhi tak koi adayigi record nahi hai.</td></tr>
                  )}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Adayigi Record Karein</h2>
              <button onClick={() => setPayModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Adayigi Ki Rakam (PKR) *</label>
                <input 
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-lg font-black"
                  placeholder="Rakam darj karein..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Adayigi Ki Tareekh *</label>
                <div className="relative">
                  <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes (Ikhtyari)</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-sm"
                  placeholder="Koi zaroori baat..."
                />
              </div>
              <button 
                type="submit"
                disabled={isPaying}
                className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {isPaying ? 'Processing...' : 'Adayigi Darj Karein'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Supply Modal ── */}
      {supplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-slate-900">Nayi Supply (Invoice) Darj Karein</h2>
              <button onClick={() => { setSupplyModalOpen(false); reset() }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleSupply)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-end p-4 bg-white border border-slate-200 rounded-xl relative group">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tafseel (Item Name)</label>
                      <input
                        {...register(`items.${index}.description`, { required: true })}
                        placeholder="Maslan: Honda CD70 / Samsung Fridge"
                        className={INPUT}
                      />
                    </div>
                    <div className="w-28 shrink-0">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                      <select {...register(`items.${index}.category`)} className={INPUT}>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="electronics">Electronics</option>
                        <option value="car">Car</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="w-24 shrink-0">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tadaad</label>
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                        className={INPUT}
                      />
                    </div>
                    <div className="w-32 shrink-0">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Qeemat (1 Pcs)</label>
                      <input
                        type="number"
                        {...register(`items.${index}.unitPrice`, { required: true, min: 1 })}
                        className={INPUT}
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                  className="w-full py-2 bg-white border border-dashed border-slate-300 text-slate-600 font-bold rounded-xl hover:border-black hover:text-black transition-colors"
                >
                  + Aur Samaan Shamil Karein
                </button>
              </div>
              <div className="p-5 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  disabled={isSupplying}
                  className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isSupplying ? 'Processing...' : 'Invoice Save Karein'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Granular Item Modal ── */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-slate-900">Granular Item (Stock Entry) Likhain</h2>
              <button onClick={() => setItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Brand (Maslan: Honda / Yamaha)</label>
                    <input
                      type="text"
                      value={newItem.brand}
                      onChange={e => setNewItem({ ...newItem, brand: e.target.value })}
                      placeholder="e.g. Honda"
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Make</label>
                    <input
                      type="text"
                      value={newItem.make}
                      onChange={e => setNewItem({ ...newItem, make: e.target.value })}
                      placeholder="e.g. CD70"
                      className={INPUT}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Model Name *</label>
                  <input
                    type="text"
                    required
                    value={newItem.model}
                    onChange={e => setNewItem({ ...newItem, model: e.target.value })}
                    placeholder="Maslan: 2026 Black Deluxe"
                    className={INPUT}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chassis Number</label>
                    <input
                      type="text"
                      value={newItem.chassisNumber}
                      onChange={e => setNewItem({ ...newItem, chassisNumber: e.target.value })}
                      placeholder="Chassis No..."
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Engine Number</label>
                    <input
                      type="text"
                      value={newItem.engineNumber}
                      onChange={e => setNewItem({ ...newItem, engineNumber: e.target.value })}
                      placeholder="Engine No..."
                      className={INPUT}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Color (Rang)</label>
                    <input
                      type="text"
                      value={newItem.color}
                      onChange={e => setNewItem({ ...newItem, color: e.target.value })}
                      placeholder="Maslan: Lal (Red)"
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Date Supplied</label>
                    <input
                      type="date"
                      value={newItem.dateSupplied}
                      onChange={e => setNewItem({ ...newItem, dateSupplied: e.target.value })}
                      className={INPUT}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">UnitPrice (PKR Qeemat) *</label>
                    <input
                      type="number"
                      required
                      value={newItem.unitPrice}
                      onChange={e => setNewItem({ ...newItem, unitPrice: e.target.value })}
                      placeholder="Qeemat..."
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Quantity (Tadaad)</label>
                    <input
                      type="number"
                      min={1}
                      value={newItem.quantity}
                      onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                      className={INPUT}
                    />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isSavingItem ? 'Saving...' : 'Stock Save Karein'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Remove Supplied Item"
        message="Kya aap waqai is item ko remove karna chahte hain? (Are you sure you want to remove this item?)"
        confirmLabel="Remove Karein"
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </PageWrapper>
  )
}
