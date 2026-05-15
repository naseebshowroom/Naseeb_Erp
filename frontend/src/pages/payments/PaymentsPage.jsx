import { useState } from 'react'
import { 
  Search, Filter, Calendar as CalendarIcon, 
  CheckCircle2, Clock, AlertCircle, X,
  Printer, Download, IndianRupee
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MOCK_DUE = [
  { id: 101, customer: 'Muhammad Asif', cnic: '34201-1234567-1', product: 'Honda CD 70 - Red', dueAmount: 7500, remaining: 87500, dueDate: '2026-05-15', daysOverdue: 0, status: 'pending' },
  { id: 102, customer: 'Ali Hassan', cnic: '36302-1122334-5', product: 'Suzuki Mehran', dueAmount: 25000, remaining: 450000, dueDate: '2026-05-15', daysOverdue: 0, status: 'pending' },
]

const MOCK_OVERDUE = [
  { id: 201, customer: 'Tariq Mehmood', cnic: '36302-9876543-9', product: 'Samsung A54', dueAmount: 5000, remaining: 10000, dueDate: '2026-05-10', daysOverdue: 5, status: 'overdue' },
]

const MOCK_COLLECTED = [
  { id: 301, receiptNo: 'REC-0515-01', customer: 'Sana Bibi', product: 'Haier 1.5T AC', amount: 12000, date: '2026-05-15T09:30:00Z', collector: 'Admin' },
]

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('due')
  const [dueData, setDueData] = useState(MOCK_DUE)
  const [overdueData, setOverdueData] = useState(MOCK_OVERDUE)
  const [collectedData, setCollectedData] = useState(MOCK_COLLECTED)
  
  // Modal States
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [lastReceipt, setLastReceipt] = useState(null)

  const tabs = [
    { id: 'due', label: "Today's Due", count: dueData.length },
    { id: 'overdue', label: 'Overdue', count: overdueData.length, danger: true },
    { id: 'collected', label: 'Collected Today', count: collectedData.length },
    { id: 'all', label: 'All Payments', count: 0 },
  ]

  // Form for Collection Modal
  const { register, handleSubmit, reset } = useForm()

  const openCollectModal = (payment) => {
    setSelectedPayment(payment)
    reset({
      amount: payment.dueAmount,
      date: new Date().toISOString().split('T')[0],
      collector: 'Admin',
      notes: ''
    })
    setCollectModalOpen(true)
  }

  const handleCollect = (data, printReceipt = false) => {
    const amountNum = parseFloat(data.amount)
    
    // Create new receipt record
    const newReceipt = {
      id: Date.now(),
      receiptNo: `REC-0515-${Math.floor(Math.random() * 1000)}`,
      customer: selectedPayment.customer,
      cnic: selectedPayment.cnic,
      product: selectedPayment.product,
      amount: amountNum,
      remaining: selectedPayment.remaining - amountNum,
      date: data.date,
      collector: data.collector,
      notes: data.notes
    }

    // Update States
    setCollectedData([newReceipt, ...collectedData])
    if (activeTab === 'due') {
      setDueData(dueData.filter(p => p.id !== selectedPayment.id))
    } else {
      setOverdueData(overdueData.filter(p => p.id !== selectedPayment.id))
    }

    setCollectModalOpen(false)
    toast.success(`Payment recorded — ${formatCurrency(amountNum)} from ${selectedPayment.customer}`)

    if (printReceipt) {
      setLastReceipt(newReceipt)
      setReceiptModalOpen(true)
    }
  }

  // jsPDF Generation
  const generatePDF = (receipt, action = 'download') => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("KIRAYA ERP", 105, 20, { align: "center" })
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Main Bazar, Kiraya Street, City", 105, 28, { align: "center" })
    doc.text("Phone: 0300-1234567", 105, 34, { align: "center" })
    
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
    doc.text("Amount Received:", 30, 130)
    doc.setFontSize(16)
    doc.setTextColor(5, 150, 105) // emerald-600
    doc.text(`Rs. ${receipt.amount.toLocaleString()}`, 80, 130)
    
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    doc.text("Remaining Balance:", 30, 145)
    doc.text(`Rs. ${receipt.remaining.toLocaleString()}`, 80, 145)

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

  // Tab Content Helper
  const renderTable = (dataToRender, isCollectionTab = false) => {
    if (dataToRender.length === 0) {
      return (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl">
          <CheckCircle2 size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
          <p className="text-sm text-slate-500">No payments to show in this list.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Product</th>
              {isCollectionTab ? (
                <>
                  <th className="px-6 py-4 text-right">Amount Received</th>
                  <th className="px-6 py-4">Receipt No</th>
                  <th className="px-6 py-4">Collector</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Remaining</th>
                  <th className="px-6 py-4 text-right">Due Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataToRender.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors">{row.customer}</div>
                  {!isCollectionTab && <div className="text-xs text-slate-500">{row.cnic}</div>}
                </td>
                <td className="px-6 py-4 text-slate-600">{row.product}</td>
                
                {isCollectionTab ? (
                  <>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(row.amount)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.receiptNo}</td>
                    <td className="px-6 py-4 text-slate-600">{row.collector}</td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{formatDate(row.dueDate)}</div>
                      {row.daysOverdue > 0 ? (
                        <div className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {row.daysOverdue} days late
                        </div>
                      ) : (
                        <div className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                          <Clock size={12} /> Due Today
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{formatCurrency(row.remaining)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-black text-slate-900">{formatCurrency(row.dueAmount)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 lg:opacity-100">
                        <button 
                          className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Skip
                        </button>
                        <button 
                          onClick={() => openCollectModal(row)}
                          className="px-4 py-1.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Collect
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {isCollectionTab && dataToRender.length > 0 && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
            <span className="font-medium text-slate-600">Total Collected Today:</span>
            <span className="text-xl font-black text-emerald-600">
              {formatCurrency(dataToRender.reduce((sum, item) => sum + item.amount, 0))}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <PageWrapper 
      title="Payment Collection" 
      subtitle="Manage daily collections, view overdue payments, and print receipts."
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
            <div className="relative">
              <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* ── Table Area ── */}
        <div className="animate-fade-in">
          {activeTab === 'due' && renderTable(dueData)}
          {activeTab === 'overdue' && renderTable(overdueData)}
          {activeTab === 'collected' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <Printer size={16} /> Print Daily Sheet
                </button>
              </div>
              {renderTable(collectedData, true)}
            </div>
          )}
          {activeTab === 'all' && (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-xl">
              <Search size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Search All Payments</h3>
              <p className="text-sm text-slate-500 mb-6">Use the search bar above to find specific payment records.</p>
              <div className="max-w-md mx-auto relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by receipt no, customer name..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Collect Payment Modal ── */}
      {collectModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Collect Payment</h2>
              <button onClick={() => setCollectModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form>
              <div className="p-6 space-y-5">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="text-sm text-slate-500 mb-1">Customer & Product</div>
                  <div className="font-bold text-slate-900">{selectedPayment.customer}</div>
                  <div className="text-sm font-medium text-blue-700 mt-1">{selectedPayment.product}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Amount Received (PKR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rs.</span>
                    <input 
                      type="number" 
                      {...register('amount')}
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Remaining balance will be updated automatically.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Date</label>
                    <input type="date" {...register('date')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Payment Mode</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" disabled>
                      <option>Cash</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Notes (Optional)</label>
                  <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" placeholder="e.g. Paid by brother"></textarea>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
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
            
            {/* The actual receipt preview (A4 roughly translated to web layout) */}
            <div className="p-8 overflow-y-auto bg-slate-200 flex-1 flex justify-center">
              <div className="bg-white w-full max-w-[400px] shadow-sm aspect-[1/1.4] p-8 flex flex-col relative print-area">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">KIRAYA ERP</h1>
                  <p className="text-[10px] text-slate-500 mt-1">Main Bazar, Kiraya Street, City</p>
                  <p className="text-[10px] text-slate-500">Phone: 0300-1234567</p>
                </div>
                
                <div className="border-b border-slate-800 pb-4 mb-4 text-center">
                  <h2 className="text-sm font-bold tracking-widest text-slate-800">PAYMENT RECEIPT</h2>
                </div>
                
                <div className="space-y-2 text-xs mb-6">
                  <div className="flex justify-between"><span className="text-slate-500">Receipt No:</span><span className="font-mono font-bold">{lastReceipt.receiptNo}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="font-medium">{formatDate(lastReceipt.date)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span className="font-bold">{lastReceipt.customer}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Product:</span><span className="font-medium">{lastReceipt.product}</span></div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-8">
                  <div className="text-center mb-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Amount Received</div>
                  <div className="text-center text-xl font-black text-slate-900">Rs. {lastReceipt.amount.toLocaleString()}</div>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-xs">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className="font-bold">Rs. {lastReceipt.remaining.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-8 text-center text-[10px]">
                  <div>
                    <div className="border-t border-slate-400 pt-2 text-slate-600">Customer Signature</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-2 text-slate-600">Authorized Sign</div>
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
