import { useState } from 'react'
import { 
  LogOut, MapPin, CheckCircle2, XCircle, 
  Wallet, Clock, Navigation
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MY_ROUTE = [
  { id: 1, name: 'Muhammad Asif', address: 'House 42, St 5, Mohalla Gulshan', phone: '0300-1234567', item: 'Honda CD 70', dueAmount: 7500, status: 'pending' },
  { id: 2, name: 'Ali Hassan', address: 'Shop 12, Main Bazar', phone: '0333-1122334', item: 'Suzuki Mehran', dueAmount: 25000, status: 'pending' },
  { id: 3, name: 'Tariq Mehmood', address: 'WAPDA Colony', phone: '0312-9876543', item: 'Samsung A54', dueAmount: 5000, status: 'pending' },
]

export default function WorkerDashboard() {
  const [route, setRoute] = useState(MY_ROUTE)
  const [activeModal, setActiveModal] = useState(null)
  const [selectedCust, setSelectedCust] = useState(null)
  
  const { register, handleSubmit, reset } = useForm()

  const openPaymentModal = (cust) => {
    setSelectedCust(cust)
    reset({ amount: cust.dueAmount })
    setActiveModal('collect')
  }

  const handleCollect = (data) => {
    const amount = parseFloat(data.amount)
    setRoute(route.map(c => c.id === selectedCust.id ? { ...c, status: 'collected', amountCollected: amount } : c))
    toast.success(`Collected ${formatCurrency(amount)} from ${selectedCust.name}`)
    setActiveModal(null)
  }

  const markNotHome = (id) => {
    setRoute(route.map(c => c.id === id ? { ...c, status: 'not_home' } : c))
    toast.error('Marked as Not Home.')
  }

  const pendingCount = route.filter(c => c.status === 'pending').length
  const completedCount = route.length - pendingCount

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-inter selection:bg-blue-200">
      
      {/* ── Mobile Friendly Header ── */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">R</div>
            <div>
              <h2 className="font-bold">Raheem Bux</h2>
              <p className="text-xs text-slate-400">Field Worker</p>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <span className="text-xs text-slate-400 block mb-1">Remaining</span>
            <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <span className="text-xs text-slate-400 block mb-1">Completed</span>
            <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* ── Daily Route List ── */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4 pb-24">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Today's Route</h3>
        
        {route.map((cust, idx) => (
          <div key={cust.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 transition-all ${
            cust.status === 'collected' ? 'border-l-emerald-500 opacity-60' : 
            cust.status === 'not_home' ? 'border-l-red-500 opacity-60' : 
            'border-l-blue-600'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg leading-none">{cust.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{cust.item}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Due</span>
                <span className="font-black text-blue-700 text-lg">{formatCurrency(cust.dueAmount)}</span>
              </div>
            </div>

            <div className="my-3 py-3 border-y border-slate-100 flex flex-col gap-1 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{cust.address}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <a href={`tel:${cust.phone}`} className="text-blue-600 font-medium hover:underline">{cust.phone}</a>
              </div>
            </div>

            {cust.status === 'pending' ? (
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => openPaymentModal(cust)}
                  className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  <Wallet size={18} /> Collect
                </button>
                <button 
                  onClick={() => markNotHome(cust.id)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition-all"
                >
                  <XCircle size={18} /> Not Home
                </button>
              </div>
            ) : cust.status === 'collected' ? (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 border border-emerald-200">
                <CheckCircle2 size={18} /> Collected {formatCurrency(cust.amountCollected)}
              </div>
            ) : (
              <div className="bg-red-50 text-red-800 p-3 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 border border-red-200">
                <XCircle size={18} /> Marked Not Home
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Collect Modal (Mobile Optimized) ── */}
      {activeModal === 'collect' && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-slate-500 text-sm">Customer</p>
              <h3 className="text-2xl font-black text-slate-900">{selectedCust.name}</h3>
            </div>

            <form onSubmit={handleSubmit(handleCollect)}>
              <div className="space-y-2 mb-8">
                <label className="text-sm font-bold text-slate-700 block text-center uppercase tracking-wider">Amount Received (PKR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-2xl">Rs.</span>
                  <input 
                    type="number" 
                    {...register('amount')}
                    className="w-full pl-16 pr-4 py-4 bg-slate-50 border-2 border-emerald-200 rounded-2xl text-3xl font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors text-center"
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/30">
                Confirm Collection
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
