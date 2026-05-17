import { useState, useEffect } from 'react'
import { 
  Search, Filter, Calendar as CalendarIcon, 
  CheckCircle2, Clock, AlertCircle, X,
  Printer, Download, Tag
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import PageWrapper from '@/components/ui/PageWrapper'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { SkeletonTable } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/axios'

export default function PaymentsPage() {
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
  const [customerInstallments, setCustomerInstallments] = useState([])
  
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [lastReceipt, setLastReceipt] = useState(null)

  const { register, handleSubmit, reset } = useForm()
  const [collectedBy, setCollectedBy] = useState('')

  const fetchVasooliData = async () => {
    try {
      setLoading(true)
      const [vasooliRes, collectedRes] = await Promise.all([
        api.get('/installments/vasooli'),
        api.get('/payments/collected-today')
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

  const openCollectModal = async (payment) => {
    setSelectedPayment(payment)
    setCollectedBy('')
    setCustomerInstallments([])
    
    // Fetch all active installments for this customer to allow switching
    const customerId = payment.customer?._id || payment.customer;
    try {
      const res = await api.get(`/installments?customer=${customerId}`);
      if (res.data.success) {
        // Filter out deleted and completed ones
        setCustomerInstallments(res.data.data.filter(i => i.status !== 'completed' && !i.isDeleted));
      }
    } catch (err) {
      console.error('Customer installments fetch error:', err);
    }

    reset({
      amount: Math.round(payment.cumulativeDue || payment.perInstallmentAmount || 0),
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      notes: ''
    })
    setCollectModalOpen(true)
  }

  const handleCollect = async (data, printReceipt = false) => {
    const amountNum = parseFloat(data.amount)
    if (!amountNum || amountNum <= 0) { toast.error('Rakam darj karein'); return }

    // Safely extract IDs — vasooli items are installment records
    const installmentId = selectedPayment._id
    const customerId    = selectedPayment.customer?._id || selectedPayment.customer

    // Find the next pending slot from the schedule
    const nextSlot = selectedPayment.paymentSchedule?.find(s => s.status === 'pending');

    try {
      const response = await api.post('/payments', {
        installment:   installmentId,
        customer:      customerId,
        amount:        amountNum,
        scheduleEntryId: nextSlot?._id,
        paymentDate:   data.date,
        paymentMode:   data.paymentMode,
        notes:         data.notes,
        collectorName: collectedBy || 'Owner',
      });

      const newPayment = response.data.data;
      toast.success(`Vasooli darj ho gayi — ${formatCurrency(amountNum)}`);
      setCollectModalOpen(false)
      fetchVasooliData();

      if (printReceipt) {
        setLastReceipt({
          receiptNo: newPayment.receiptNumber || `RCP-${new Date().getTime()}`,
          customer:  selectedPayment.customer?.fullName || selectedPayment.customer,
          cnic:      selectedPayment.customer?.cnic || '',
          product:   `${selectedPayment.brand || ''} ${selectedPayment.model || ''}`.trim(),
          amount:    amountNum,
          remaining: (selectedPayment.remainingAmount || 0) - amountNum,
          date:      data.date,
          collectedBy: collectedBy || 'Owner',
        });
        setReceiptModalOpen(true)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Payment save karne mein error aya');
    }
  }

  const generatePDF = (receipt, action = 'download') => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("NASEEB AUTOS & SHOWROOM", 105, 20, { align: "center" })
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Naseeb Market, Main Bazar", 105, 28, { align: "center" })
    doc.text("Phone: 030-00000000", 105, 34, { align: "center" })
    
    doc.setLineWidth(0.5)
    doc.line(20, 40, 190, 40)
    
    // Receipt Details
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("PAYMENT RECEIPT", 105, 52, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Receipt No: ${receipt.receiptNo}`, 20, 70)
    doc.text(`Date: ${formatDate(receipt.date)}`, 140, 70)
    
    doc.text(`Customer: ${receipt.customer}`, 20, 85)
    doc.text(`CNIC: ${receipt.cnic}`, 140, 85)
    
    doc.text(`Product: ${receipt.product}`, 20, 100)
    
    // Financials box
    doc.setFillColor(248, 250, 252)
    doc.rect(20, 115, 170, 40, 'F')
    
    doc.setFont("helvetica", "bold")
    doc.text("Mili Hui Rakam:", 30, 130)
    doc.setFontSize(16)
    doc.setTextColor(5, 150, 105) 
    doc.text(`Rs. ${Math.round(receipt.amount).toLocaleString()}`, 80, 130)
    
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    doc.text("Baqaya Rakam:", 30, 145)
    doc.text(`Rs. ${Math.round(receipt.remaining).toLocaleString()}`, 80, 145)

    // Footer signatures
    doc.line(30, 220, 80, 220)
    doc.text("Customer Signature", 35, 230)
    
    doc.line(130, 220, 180, 220)
    doc.text("Authorized Signature", 132, 230)

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text("Thank you for your business. Please keep this receipt for your records.", 105, 270, { align: "center" })

    if (action === 'print') {
      doc.autoPrint()
      window.open(doc.output('bloburl'), '_blank')
    } else {
      doc.save(`${receipt.receiptNo}-${receipt.customer.replace(' ', '')}.pdf`)
    }
  }

  const PaginatedTable = ({ data, isCollectionTab, onCollect }) => {
    const pg = usePagination(data, 15)

    return (
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
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
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.receiptNumber || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{row.collectorName || row.receivedBy?.name || 'Admin'}</td>
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

      {/* ── Collect Payment Modal ── */}
      {collectModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Vasooli (Collect Payment)</h2>
              <button onClick={() => setCollectModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="text-sm text-slate-500 mb-1">Gahak (Customer)</div>
                  <div className="font-bold text-slate-900">{selectedPayment.customer?.fullName}</div>
                  
                  <div className="mt-3 space-y-1">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Item Chunyein (Select Item)</label>
                    {customerInstallments.length > 1 ? (
                      <select 
                        className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-sm font-medium text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={selectedPayment._id}
                        onChange={(e) => {
                          const newInst = customerInstallments.find(i => i._id === e.target.value);
                          if (newInst) {
                            setSelectedPayment(newInst);
                            // Also update the suggested amount to the new item's installment amount
                            reset({
                              ...getValues(),
                              amount: Math.round(newInst.perInstallmentAmount || 0)
                            });
                          }
                        }}
                      >
                        {customerInstallments.map(inst => (
                          <option key={inst._id} value={inst._id}>
                            {inst.brand} {inst.model} ({inst.category})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm font-medium text-blue-700">{selectedPayment.brand} {selectedPayment.model}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Mili Hui Rakam (PKR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rs.</span>
                    <input 
                      type="number" 
                      {...register('amount', { required: true })}
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Baqaya rakam khud update ho jaye gi.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tareekh (Date)</label>
                    <input type="date" {...register('date')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Payment Mode</label>
                    <select {...register('paymentMode')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="cash">Cash (Naqd)</option>
                      <option value="bank">Bank / Transfer</option>
                      <option value="other">Other (Digar)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kisne Wasool Ki (Collected By)</label>
                  <input
                    type="text"
                    value={collectedBy}
                    onChange={e => setCollectedBy(e.target.value)}
                    placeholder="Naam darj karein (e.g. Naseeb, Worker Ali)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Notes / Remarks</label>
                  <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" placeholder="Koi zaroori baat..."></textarea>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={handleSubmit((data) => handleCollect(data, true))}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex justify-center items-center gap-2"
                >
                  <Printer size={18} /> Confirm & Print Receipt
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit((data) => handleCollect(data, false))}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Confirm (No Receipt)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receipt Preview Modal ── */}
      {receiptModalOpen && lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-100 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Receipt Preview</h2>
              <button onClick={() => setReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-200 flex-1 flex justify-center">
              <div className="bg-white w-full max-w-[400px] shadow-sm aspect-[1/1.4] p-8 flex flex-col relative print-area">
                <div className="text-center mb-6">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">NASEEB AUTOS &amp; SHOWROOM</h1>
                  <p className="text-[10px] text-slate-500 mt-1">Naseeb Market, Main Bazar</p>
                  <p className="text-[10px] text-slate-500">Phone: 030-00000000</p>
                </div>
                
                <div className="border-b border-slate-800 pb-4 mb-4 text-center">
                  <h2 className="text-sm font-bold tracking-widest text-slate-800">PAYMENT RECEIPT</h2>
                </div>
                
                <div className="space-y-2 text-xs mb-6">
                  <div className="flex justify-between"><span className="text-slate-500">Receipt No:</span><span className="font-mono font-bold">{lastReceipt.receiptNo}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tareekh:</span><span className="font-medium">{formatDate(lastReceipt.date)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Gahak:</span><span className="font-bold">{lastReceipt.customer}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Samaan:</span><span className="font-medium">{lastReceipt.product}</span></div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-8">
                  <div className="text-center mb-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mili Hui Rakam</div>
                  <div className="text-center text-xl font-black text-slate-900">Rs. {Math.round(lastReceipt.amount).toLocaleString()}</div>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-xs">
                    <span className="text-slate-500">Baqaya Rakam:</span>
                    <span className="font-bold">Rs. {Math.round(lastReceipt.remaining).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-8 text-center text-[10px]">
                  <div>
                    <div className="border-t border-slate-400 pt-2 text-slate-600">Gahak Ke Dastkhat</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-2 text-slate-600">Dukan Ke Dastkhat</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setReceiptModalOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => generatePDF(lastReceipt, 'download')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download size={18} /> Download PDF
              </button>
              <button 
                onClick={() => generatePDF(lastReceipt, 'print')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Printer size={18} /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
