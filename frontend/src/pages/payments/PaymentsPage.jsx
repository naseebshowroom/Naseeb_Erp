import { useState, useEffect } from 'react'
import { 
  Search, Filter, Calendar as CalendarIcon, 
  CheckCircle2, Clock, AlertCircle, X,
  Printer, Download, Tag
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import PageWrapper from '@/components/ui/PageWrapper'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { SkeletonTable } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/axios'
import ReceiptButton from '@/components/payments/ReceiptButton'
import CollectPaymentModal from '@/components/payments/CollectPaymentModal'
import { useAuthStore } from '@/store/authStore'

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const customerIdParam = searchParams.get('customerId')
  const { user: currentUser } = useAuthStore()

  const [activeTab, setActiveTab] = useState('due')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [dueData, setDueData] = useState([])
  const [overdueData, setOverdueData] = useState([])
  const [collectedData, setCollectedData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal States
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(null)

  const fetchVasooliData = async () => {
    try {
      setLoading(true)
      const [vasooliRes, collectedRes] = await Promise.all([
        api.get('/installments/vasooli'),
        api.get('/payments')
      ]);

      const allVasooli = vasooliRes.data.data || [];
      setDueData(allVasooli.filter(v => v.isDueToday));
      setOverdueData(allVasooli.filter(v => !v.isDueToday && v.cumulativeDue > 0));
      
      setCollectedData(collectedRes.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Data fetch karne mein masla aya');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVasooliData()
  }, [])

  useEffect(() => {
    if (customerIdParam) {
      const fetchCustomerAndOpen = async () => {
        try {
          const res = await api.get(`/customers/${customerIdParam}`);
          if (res.data.success && res.data.data) {
            setSelectedPayment(res.data.data);
            setSelectedInstallmentId(null);
            setCollectModalOpen(true);
          } else {
            toast.error('Gahak nahi mila');
          }
        } catch {
          toast.error('Gahak ke khate load karne mein masla aya');
        }
      };
      fetchCustomerAndOpen();
      setSearchParams({}, { replace: true });
    }
  }, [customerIdParam]);

  const categories = [
    { id: 'all', label: 'Sab Samaan' },
    { id: 'motorcycle', label: 'Motorcycle' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'electronics', label: 'Electronics (AC/Fridge/LCD)' },
    { id: 'car', label: 'Car' },
  ]

  const filterData = (data) => {
    return data.filter(item => {
      // Handle different nesting for Installments (due) vs Payments (collected)
      const customerName = item.customer?.fullName?.toLowerCase() || '';
      const customerCnic = item.customer?.cnic || '';
      const itemCat = item.category || item.installment?.category || '';

      const searchMatch = !searchQuery || 
        customerName.includes(searchQuery.toLowerCase()) || 
        customerCnic.includes(searchQuery);

      let catMatch = true;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'electronics') {
          catMatch = ['ac', 'lcd', 'washing_machine', 'fridge'].includes(itemCat);
        } else {
          catMatch = itemCat === selectedCategory;
        }
      }
      return searchMatch && catMatch;
    })
  }

  const filteredDue = filterData(dueData)
  const filteredOverdue = filterData(overdueData)
  const filteredCollected = filterData(collectedData)

  const tabs = [
    { id: 'due', label: "Aaj Ki Vasooli", count: filteredDue.length },
    { id: 'overdue', label: 'Pichla Baqaya', count: filteredOverdue.length, danger: true },
    { id: 'collected', label: 'Aaj Ki Jama Shuda', count: filteredCollected.length },
  ]

  const openCollectModal = (payment) => {
    const cust = payment.customer || payment;
    setSelectedPayment(cust);
    setSelectedInstallmentId(payment._id || payment.installment?._id || null);
    setCollectModalOpen(true);
  }



  const PaginatedTable = ({ data, isCollectionTab, onCollect }) => {
    const pg = usePagination(data, 15)

    return (
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Gahak (Customer)</th>
              <th className="px-6 py-4">Samaan (Product)</th>
              {isCollectionTab ? (
                <>
                  <th className="px-6 py-4 text-right">Mili Hui Rakam</th>
                  <th className="px-6 py-4">Receipt No</th>
                  <th className="px-6 py-4">Collector</th>
                  <th className="px-6 py-4 text-center">Receipt</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 text-right">Baqaya Rakam</th>
                  <th className="px-6 py-4 text-right">Kul Vasooli Amount</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pg.paginated.map((row) => (
              <tr key={row._id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors">
                    {row.customer?.fullName}
                  </div>
                  {!isCollectionTab && <div className="text-xs text-slate-500">{row.customer?.cnic}</div>}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="font-medium text-slate-900">
                    {isCollectionTab ? (row.installment?.brand + ' ' + row.installment?.model) : (row.brand + ' ' + row.model)}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">{isCollectionTab ? row.installment?.category : row.category}</div>
                </td>
                
                {isCollectionTab ? (
                  <>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(row.amount)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">{row.receiptNumber || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.collectedBy?.fullName || row.collectorName || row.receivedBy?.name || 'Admin'}</td>
                    <td className="px-6 py-4 text-center">
                      <ReceiptButton
                        paymentId={row._id}
                        paymentStatus="paid"
                        receiptNumber={row.receiptNumber || 'RCP'}
                        variant="icon"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{formatCurrency(row.remainingAmount)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-black text-slate-900">{formatCurrency(row.cumulativeDue)}</div>
                      {row.daysOverdue > 0 && (
                        <div className="text-xs font-bold text-red-500 flex items-center justify-end gap-1 mt-1">
                          <AlertCircle size={12} /> {row.daysOverdue} din late
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onCollect(row)}
                        className="px-4 py-1.5 text-sm font-bold text-white bg-black rounded hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        Vasooli
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {isCollectionTab && data.length > 0 && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
            <span className="font-medium text-slate-600">Aaj Ki Kul Jama:</span>
            <span className="text-xl font-black text-emerald-600">
              {formatCurrency(data.reduce((sum, item) => sum + item.amount, 0))}
            </span>
          </div>
        )}
        
        <Pagination {...pg} onPageChange={pg.setPage} label={isCollectionTab ? 'payments' : 'khatey'} />
      </div>
    )
  }

  const renderTable = (dataToRender, isCollectionTab = false) => {
    if (loading) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <SkeletonTable rows={5} cols={isCollectionTab ? 5 : 4} />
        </div>
      );
    }

    if (dataToRender.length === 0) {
      return (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl">
          <CheckCircle2 size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Sab Clear Hai!</h3>
          <p className="text-sm text-slate-500">Is list mein koi data nahi.</p>
        </div>
      )
    }

    return <PaginatedTable data={dataToRender} isCollectionTab={isCollectionTab} onCollect={openCollectModal} />
  }

  return (
    <PageWrapper 
      title="Vasooli (Payments)" 
      subtitle="Aaj ki vasooli, pichla baqaya, aur jama shuda rakam."
    >
      <div className="space-y-6">
        
        {/* ── Top Filters & Tabs ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? tab.danger 
                      ? 'bg-red-50 text-red-700 ring-1 ring-red-200' 
                      : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? tab.danger ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Gahak ka naam ya CNIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48" 
              />
            </div>
          </div>
        </div>

        {/* ── Table Area ── */}
        <div className="animate-fade-in">
          {activeTab === 'due' && renderTable(filteredDue)}
          {activeTab === 'overdue' && renderTable(filteredOverdue)}
          {activeTab === 'collected' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <Printer size={16} /> Daily Sheet Print Karein
                </button>
              </div>
              {renderTable(filteredCollected, true)}
            </div>
          )}
        </div>
      </div>

      <CollectPaymentModal
        isOpen={collectModalOpen}
        onClose={() => {
          setCollectModalOpen(false)
          setSelectedPayment(null)
          setSelectedInstallmentId(null)
        }}
        customer={selectedPayment}
        preSelectedInstallmentId={selectedInstallmentId}
        currentUser={currentUser}
        onPaymentSuccess={() => {
          fetchVasooliData()
        }}
      />
    </PageWrapper>
  )
}
