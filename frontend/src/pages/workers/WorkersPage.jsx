import { useState } from 'react'
import { 
  UserPlus, Search, Edit, Lock, Printer, 
  MapPin, CheckCircle2, UserX, Activity, ArrowRight
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MOCK_WORKERS = [
  { id: 1, name: 'Raheem Bux', phone: '0300-1122334', role: 'Worker', activeSince: '2023-01-15', collectedToday: 45000, status: 'active' },
  { id: 2, name: 'Tahir Ali', phone: '0311-9988776', role: 'Worker', activeSince: '2024-03-10', collectedToday: 12000, status: 'active' },
  { id: 3, name: 'Zeeshan', phone: '0333-5566778', role: 'Manager', activeSince: '2022-11-01', collectedToday: 0, status: 'inactive' },
]

const MOCK_CUSTOMERS = [
  { id: 101, name: 'Muhammad Asif', address: 'House 42, St 5, Gulshan', phone: '0300-1234567', dueAmount: 7500, item: 'Honda CD 70' },
  { id: 102, name: 'Ali Hassan', address: 'Shop 12, Main Bazar', phone: '0333-1122334', dueAmount: 25000, item: 'Suzuki Mehran' },
  { id: 103, name: 'Tariq Mehmood', address: 'WAPDA Colony', phone: '0312-9876543', dueAmount: 5000, item: 'Samsung A54' },
]

export default function WorkersPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [addModalOpen, setAddModalOpen] = useState(false)
  
  // Assignment State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [assignedList, setAssignedList] = useState([])
  const [selectedWorker, setSelectedWorker] = useState('')

  const { register, handleSubmit, reset } = useForm()

  const handleAddWorker = (data) => {
    toast.success(`Worker ${data.name} added successfully!`)
    setAddModalOpen(false)
    reset()
  }

  const handleAssign = (customer) => {
    if (!assignedList.find(c => c.id === customer.id)) {
      setAssignedList([...assignedList, customer])
    }
  }

  const removeAssigned = (id) => {
    setAssignedList(assignedList.filter(c => c.id !== id))
  }

  const printCollectionSheet = () => {
    if (assignedList.length === 0 || !selectedWorker) {
      toast.error('Please assign customers and select a worker first.')
      return
    }

    const workerName = MOCK_WORKERS.find(w => w.id === parseInt(selectedWorker))?.name || 'Unknown'

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("KIRAYA ERP", 105, 20, { align: "center" })
    
    doc.setFontSize(12)
    doc.text("DAILY COLLECTION SHEET", 105, 30, { align: "center" })
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Date: ${selectedDate}`, 20, 45)
    doc.text(`Collector Name: ${workerName}`, 130, 45)
    
    doc.setLineWidth(0.5)
    doc.line(20, 50, 190, 50)

    // Table Header
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("#", 20, 60)
    doc.text("Customer", 30, 60)
    doc.text("Address & Phone", 70, 60)
    doc.text("Due Amount", 130, 60)
    doc.text("Collected", 160, 60)
    
    doc.line(20, 63, 190, 63)

    // Table Rows
    doc.setFont("helvetica", "normal")
    let yPos = 70
    let totalDue = 0

    assignedList.forEach((cust, idx) => {
      totalDue += cust.dueAmount
      
      doc.text(`${idx + 1}`, 20, yPos)
      doc.setFont("helvetica", "bold")
      doc.text(cust.name, 30, yPos)
      doc.setFont("helvetica", "normal")
      doc.text(`${cust.item}`, 30, yPos + 5)
      
      const splitAddress = doc.splitTextToSize(`${cust.address} | ${cust.phone}`, 50)
      doc.text(splitAddress, 70, yPos)
      
      doc.setFont("helvetica", "bold")
      doc.text(`Rs. ${cust.dueAmount.toLocaleString()}`, 130, yPos)
      doc.setFont("helvetica", "normal")
      
      // Blank boxes for writing
      doc.rect(160, yPos - 3, 25, 6)
      
      yPos += 12
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPos - 4, 190, yPos - 4)
      doc.setDrawColor(0, 0, 0)
    })

    // Total
    yPos += 5
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Expected Total:", 90, yPos)
    doc.text(`Rs. ${totalDue.toLocaleString()}`, 130, yPos)

    // Footer
    doc.setFontSize(10)
    doc.line(20, 270, 70, 270)
    doc.text("Collector Signature", 25, 275)
    
    doc.line(140, 270, 190, 270)
    doc.text("Authorized By (Owner)", 143, 275)

    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <PageWrapper 
      title="Team & Collections" 
      subtitle="Manage your workforce, assign daily routes, and track live progress."
      actions={
        <button 
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={16} /> Add Worker
        </button>
      }
    >
      
      {/* ── Tabs ── */}
      <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-fit mb-6 border border-slate-200">
        <button onClick={() => setActiveTab('list')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Worker List</button>
        <button onClick={() => setActiveTab('assign')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'assign' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Assign Routes</button>
        <button onClick={() => setActiveTab('progress')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'progress' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Activity size={16} className={activeTab === 'progress' ? 'text-blue-600 animate-pulse' : ''} /> Live Progress
        </button>
      </div>

      <div className="animate-fade-in">
        
        {/* ── TAB 1: Worker List ── */}
        {activeTab === 'list' && (
          <div className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Worker Profile</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Active Since</th>
                    <th className="px-6 py-4 text-right">Collections Today</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_WORKERS.map(worker => (
                    <tr key={worker.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{worker.name}</div>
                          <div className="text-xs text-slate-500">{worker.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{worker.role}</td>
                      <td className="px-6 py-4 text-slate-600">{worker.activeSince}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(worker.collectedToday)}</td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={worker.status === 'active' ? 'completed' : 'pending'} label={worker.status} size="sm" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit size={18} /></button>
                          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><UserX size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: Assign Routes ── */}
        {activeTab === 'assign' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Search Customers Area */}
            <div className="erp-card p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Find Customers to Assign</h3>
              <div className="relative mb-6">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, area, or due amount..." 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>

              <div className="space-y-3">
                {MOCK_CUSTOMERS.map(cust => (
                  <div key={cust.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors bg-white">
                    <div>
                      <h4 className="font-bold text-slate-900">{cust.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {cust.address}</p>
                      <p className="text-sm font-black text-red-600 mt-2">{formatCurrency(cust.dueAmount)}</p>
                    </div>
                    <button 
                      onClick={() => handleAssign(cust)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      Add to Route
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Route Assembly */}
            <div className="erp-card flex flex-col h-full bg-slate-50/50">
              <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Current Assignment</h3>
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    {assignedList.length} Selected
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Date</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Assign To Worker</label>
                    <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none">
                      <option value="">-- Select Worker --</option>
                      {MOCK_WORKERS.filter(w => w.role === 'Worker').map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-3 min-h-[300px]">
                {assignedList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ArrowRight size={48} className="mb-4 opacity-50" />
                    <p>Add customers from the left panel.</p>
                  </div>
                ) : (
                  assignedList.map(cust => (
                    <div key={cust.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{cust.name}</div>
                        <div className="text-xs text-slate-500">{cust.item}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-700">{formatCurrency(cust.dueAmount)}</span>
                        <button onClick={() => removeAssigned(cust.id)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <button 
                  onClick={printCollectionSheet}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                  <Printer size={18} /> Save & Print Route Sheet
                </button>
              </div>
            </div>
            
          </div>
        )}

        {/* ── TAB 3: Live Progress ── */}
        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="erp-card p-6 border-t-4 border-t-blue-600">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xl">R</div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Raheem Bux</h3>
                    <p className="text-sm font-medium text-emerald-600 flex items-center gap-1"><Activity size={14} className="animate-pulse" /> Active Now</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Collected</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(45000)}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-medium text-slate-700">
                  <span>Route Completion</span>
                  <span>12 / 20 Customers</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Updates</h4>
                <div className="flex items-center gap-3 text-sm p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <CheckCircle2 size={16} /> <span>Collected <strong>Rs. 5,000</strong> from Ali Hassan</span>
                </div>
                <div className="flex items-center gap-3 text-sm p-2 bg-red-50 text-red-800 rounded-lg">
                  <X size={16} /> <span>Customer Not Home: Tariq Mehmood</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Add Worker Modal ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Add Team Member</h2>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit(handleAddWorker)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name*</label>
                  <input {...register('name')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone*</label>
                  <input {...register('phone')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">CNIC*</label>
                  <input {...register('cnic')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Role</label>
                  <select {...register('role')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                    <option value="worker">Field Worker / Collector</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Lock size={16} className="text-blue-600"/> Login Credentials</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Username*</label>
                    <input {...register('username')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Password*</label>
                    <input type="text" defaultValue="123456" {...register('password')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500" required />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-4">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

    </PageWrapper>
  )
}
