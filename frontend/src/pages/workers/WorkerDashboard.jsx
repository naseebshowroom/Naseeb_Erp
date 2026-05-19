import { useState, useEffect } from 'react'
import { 
  LogOut, MapPin, CheckCircle2, XCircle, 
  Wallet, Phone, Loader2, Sparkles, Navigation, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'
import ReceiptButton from '../../components/payments/ReceiptButton'
import { getItemDisplayName, getItemIcon } from '@/utils/itemHelper'
import CollectPaymentModal from '../../components/payments/CollectPaymentModal'

export default function WorkerDashboard() {
  const { user, logout } = useAuthStore()
  const [route, setRoute] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [selectedCust, setSelectedCust] = useState(null)
  const [preSelectedInstallmentId, setPreSelectedInstallmentId] = useState(null)
  const [latestPayment, setLatestPayment] = useState(null) // Stores last recorded payment for receipt download

  const fetchTodayRoute = async () => {
    if (!user) return
    try {
      setLoading(true)
      const userId = user.id || user._id
      const res = await api.get(`/collections/today?workerId=${userId}`)
      if (res.data && res.data.success) {
        const mapped = res.data.data.map(item => {
          // Identify next pending/missed slot on customer's installment
          const nextSlot = item.installment?.paymentSchedule?.find(
            s => s.status === 'pending' || s.status === 'missed'
          );
          return {
            id: item._id,
            installmentId: item.installment?._id,
            installment: item.installment,
            customer: item.customer,
            scheduleEntryId: nextSlot?._id,
            name: item.customer?.fullName || 'Naseeb Customer',
            address: item.customer?.address || 'Khuzdar, Balochistan',
            phone: item.customer?.phone || '—',
            item: item.installment ? `${item.installment.brand} ${item.installment.model}` : 'No Item Linked',
            dueAmount: item.amountDue || 0,
            status: item.status || 'pending', // 'pending', 'collected', 'missed'
            amountCollected: item.amountCollected || 0
          }
        })
        setRoute(mapped)
      }
    } catch (err) {
      toast.error('Route load karne mein masla hua.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayRoute()
  }, [user])

  const openPaymentModal = (cust) => {
    setSelectedCust(cust.customer)
    setPreSelectedInstallmentId(cust.installmentId)
    setActiveModal('collect')
  }

  const markNotHome = async (id) => {
    try {
      // Optimistic Update
      setRoute(prev => prev.map(c => c.id === id ? { ...c, status: 'missed' } : c))
      toast.error('Ghar par nahi hai mark kiya.')

      const res = await api.patch(`/collections/${id}/status`, {
        status: 'missed',
        notes: 'Customer ghar par nahi mila'
      })

      if (res.data.success) {
        fetchTodayRoute()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      toast.error('Status update karne mein masla hua.')
      fetchTodayRoute() // revert
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Log out ho gaya!')
    } catch (err) {
      toast.error('Logout main masla hua.')
    }
  }

  const pendingCount = route.filter(c => c.status === 'pending').length
  const completedCount = route.length - pendingCount
  const displayName = user?.fullName || user?.name || 'Worker'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-inter text-slate-100 selection:bg-blue-600/30">
      
      {/* ── Premium Glassmorphic Header ── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-5 sticky top-0 z-20 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 text-white animate-pulse">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-wide text-slate-100">{displayName}</h2>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <Sparkles size={11} /> Field Worker
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-3 bg-slate-800/80 hover:bg-red-500/10 hover:text-red-400 rounded-2xl border border-slate-700/50 hover:border-red-500/20 transition-all duration-300 active:scale-95"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-4 border border-amber-500/20 shadow-inner">
            <span className="text-[10px] text-amber-400 block mb-1 font-bold uppercase tracking-wider">Remaining (Baqi)</span>
            <span className="text-3xl font-black text-amber-300 tracking-tight">{pendingCount}</span>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl p-4 border border-emerald-500/20 shadow-inner">
            <span className="text-[10px] text-emerald-400 block mb-1 font-bold uppercase tracking-wider">Completed (Poora)</span>
            <span className="text-3xl font-black text-emerald-300 tracking-tight">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* ── Daily Route List ── */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4 pb-28">
        
        {/* Dynamic Receipt Download Banner */}
        {latestPayment && (
          <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-3xl p-5 border border-blue-500/30 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Printer size={20} />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-extrabold text-white text-sm">Vasooli Kamyab!</h4>
                  <p className="text-xs text-slate-300">Customer ko raseed print kar ke dein:</p>
                </div>
                <ReceiptButton
                  paymentId={latestPayment._id}
                  paymentStatus="paid"
                  receiptNumber={latestPayment.receiptNumber}
                  variant="full"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center px-1 mb-2">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Rozana ka Route</h3>
          <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-full text-slate-400 border border-slate-700 font-bold">Today</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
            <p className="text-sm font-medium">Route loading ho raha hai...</p>
          </div>
        ) : route.length === 0 ? (
          <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-700/50 text-indigo-400">
              <Sparkles size={28} />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Aaj ka kaam mukammal!</h4>
              <p className="text-xs text-slate-500 mt-1">Koi assignment pending nahi hai. (All clean!)</p>
            </div>
          </div>
        ) : (
          route.map((cust, idx) => (
            <div 
              key={cust.id} 
              className={`bg-slate-900/60 backdrop-blur-md rounded-3xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden transition-all duration-300 ${
                cust.status === 'collected' ? 'opacity-50 border-emerald-500/20' : 
                cust.status === 'missed' ? 'opacity-50 border-red-500/20' : 
                'hover:border-slate-700 hover:shadow-indigo-500/5'
              }`}
            >
              {/* Highlight bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                cust.status === 'collected' ? 'bg-emerald-500' : 
                cust.status === 'missed' ? 'bg-red-500' : 
                'bg-indigo-500'
              }`} />

              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 border border-slate-700/50">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-100 text-lg leading-tight tracking-wide">{cust.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400/80 mt-1 uppercase tracking-wide bg-indigo-500/5 px-2.5 py-0.5 rounded-lg border border-indigo-500/10 inline-flex">
                      {cust.installment ? (
                        <>
                          {getItemIcon(cust.installment.category, 12)}
                          <span>{getItemDisplayName(cust.installment)}</span>
                        </>
                      ) : (
                        <span>No Item Linked</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-extrabold">Qist Due</span>
                  <span className="font-black text-indigo-400 text-lg">{formatCurrency(cust.dueAmount)}</span>
                </div>
              </div>

              {/* Contact info & address */}
              <div className="my-4 py-4 border-y border-slate-800/80 flex flex-col gap-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-snug text-slate-300 font-medium">{cust.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-emerald-400 shrink-0" />
                  <a href={`tel:${cust.phone}`} className="text-emerald-400 font-bold hover:underline tracking-wide">
                    {cust.phone}
                  </a>
                </div>
              </div>

              {/* Status Action Buttons */}
              {cust.status === 'pending' ? (
                <div className="flex gap-3 pt-1">
                  <button 
                    onClick={() => openPaymentModal(cust)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 shadow-lg shadow-emerald-950/20 text-sm"
                  >
                    <Wallet size={16} /> Collect (Vasool)
                  </button>
                  <button 
                    onClick={() => markNotHome(cust.id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 border border-slate-700/50 text-sm"
                  >
                    <XCircle size={16} /> Not Home
                  </button>
                </div>
              ) : cust.status === 'collected' ? (
                <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-2xl text-center text-sm font-extrabold flex items-center justify-center gap-2 border border-emerald-500/20 animate-fade-in">
                  <CheckCircle2 size={16} /> Rs. {cust.amountCollected} Vasool Ho Gaye
                </div>
              ) : (
                <div className="bg-red-500/10 text-red-400 p-3.5 rounded-2xl text-center text-sm font-extrabold flex items-center justify-center gap-2 border border-red-500/20 animate-fade-in">
                  <XCircle size={16} /> Customer Ghar Par Nahi Tha
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CollectPaymentModal
        isOpen={activeModal === 'collect'}
        onClose={() => {
          setActiveModal(null)
          setSelectedCust(null)
          setPreSelectedInstallmentId(null)
        }}
        customer={selectedCust}
        preSelectedInstallmentId={preSelectedInstallmentId}
        currentUser={user}
        onPaymentSuccess={(result) => {
          if (result && result.payment) {
            setLatestPayment(result.payment)
          }
          fetchTodayRoute()
        }}
      />
    </div>
  )
}
