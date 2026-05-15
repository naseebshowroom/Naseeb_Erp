import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  User, Phone, MapPin, Briefcase, FileText, 
  CreditCard, Wallet, Image as ImageIcon, 
  Edit, Printer, ChevronRight, Activity, Calendar
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const CUSTOMER_DATA = {
  id: 1,
  name: 'Muhammad Asif',
  fatherName: 'Ghulam Rasool',
  cnic: '34201-1234567-1',
  phone: '0300-1234567',
  altPhone: '0311-7654321',
  address: 'House 42, Street 5, Mohalla Gulshan',
  city: 'Vehari',
  status: 'active',
  registeredDate: '2025-11-15',
  
  guarantor1: {
    name: 'Ali Traders',
    cnic: '34201-9988776-5',
    phone: '0301-2233445',
    address: 'Shop 12, Main Bazar, Vehari',
    businessType: 'Electronics Shop',
  },
  
  guarantor2: {
    name: 'Zafar Iqbal',
    cnic: '34201-5544332-1',
    phone: '0333-6677889',
    address: 'WAPDA Colony, Vehari',
    department: 'WAPDA',
    designation: 'Line Superintendent',
  },

  installments: [
    { id: 101, item: 'Honda CD 70', status: 'active', total: 210000, paid: 92500, remaining: 87500, nextDue: '2026-06-01' },
    { id: 102, item: 'Samsung 32" TV', status: 'completed', total: 45000, paid: 45000, remaining: 0, nextDue: null },
  ],
  
  payments: [
    { id: 501, date: '2026-05-01', amount: 15000, item: 'Honda CD 70', collector: 'Raheem Bux', receipt: 'REC-0501' },
    { id: 502, date: '2026-04-01', amount: 15000, item: 'Honda CD 70', collector: 'Raheem Bux', receipt: 'REC-0401' },
    { id: 503, date: '2025-12-10', amount: 4500, item: 'Samsung 32" TV', collector: 'Office', receipt: 'REC-1210' },
  ]
}

export default function CustomerProfile() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const customer = CUSTOMER_DATA // In reality, fetch by id

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'installments', label: 'Installments', icon: CreditCard },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'documents', label: 'Documents', icon: FileText },
  ]

  return (
    <PageWrapper 
      title="Customer Profile" 
      breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: customer.name }]}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={16} /> Print
          </button>
          <Link to={`/customers/${customer.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Edit size={16} /> Edit Profile
          </Link>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* ── Left Sidebar: Profile Summary ── */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="erp-card p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-50 to-white"></div>
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-sm border border-slate-100 relative z-10 mb-4">
              <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                {customer.name.charAt(0)}
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 relative z-10">{customer.name}</h2>
            <p className="text-sm text-slate-500 mb-3">{customer.cnic}</p>
            <StatusBadge status={customer.status} />
            
            <div className="w-full mt-6 space-y-3 text-sm text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{customer.address}, {customer.city}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span>Registered: {formatDate(customer.registeredDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="erp-card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Quick Stats</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Active Plans</span>
              <span className="font-bold text-slate-900">2</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-bold text-emerald-600">{formatCurrency(137500)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Remaining</span>
              <span className="font-bold text-red-600">{formatCurrency(87500)}</span>
            </div>
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="flex-1 erp-card flex flex-col min-h-[600px] overflow-hidden">
          
          {/* Tabs Header */}
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'border-blue-600 text-blue-600 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8 flex-1 bg-white">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Father's Name</span> <span className="font-medium text-slate-900">{customer.fatherName}</span></div>
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Alternate Phone</span> <span className="font-medium text-slate-900">{customer.altPhone || 'N/A'}</span></div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Briefcase size={16} className="text-blue-600" /> Guarantor 1 (Business)
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{customer.guarantor1.name}</span></p>
                      <p><span className="text-slate-500">CNIC:</span> {customer.guarantor1.cnic}</p>
                      <p><span className="text-slate-500">Phone:</span> {customer.guarantor1.phone}</p>
                      <p><span className="text-slate-500">Business:</span> {customer.guarantor1.businessType}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <User size={16} className="text-blue-600" /> Guarantor 2 (Govt)
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{customer.guarantor2.name}</span></p>
                      <p><span className="text-slate-500">CNIC:</span> {customer.guarantor2.cnic}</p>
                      <p><span className="text-slate-500">Phone:</span> {customer.guarantor2.phone}</p>
                      <p><span className="text-slate-500">Dept:</span> {customer.guarantor2.department} ({customer.guarantor2.designation})</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INSTALLMENTS TAB */}
            {activeTab === 'installments' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-900">Installment Plans</h3>
                  <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Add New Plan <ChevronRight size={16} />
                  </button>
                </div>
                
                {customer.installments.map(inst => (
                  <div key={inst.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{inst.item}</h4>
                        <p className="text-xs text-slate-500 mt-1">Plan ID: #INST-{inst.id}</p>
                      </div>
                      <StatusBadge status={inst.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="bg-slate-50 p-3 rounded-lg"><span className="text-slate-500 block text-xs">Total Price</span><span className="font-semibold text-slate-900">{formatCurrency(inst.total)}</span></div>
                      <div className="bg-slate-50 p-3 rounded-lg"><span className="text-slate-500 block text-xs">Paid</span><span className="font-semibold text-emerald-600">{formatCurrency(inst.paid)}</span></div>
                      <div className="bg-slate-50 p-3 rounded-lg"><span className="text-slate-500 block text-xs">Remaining</span><span className="font-semibold text-red-600">{formatCurrency(inst.remaining)}</span></div>
                      <div className="bg-slate-50 p-3 rounded-lg"><span className="text-slate-500 block text-xs">Next Due</span><span className="font-semibold text-amber-600">{inst.nextDue ? formatDate(inst.nextDue) : '-'}</span></div>
                    </div>
                    
                    <div className="flex justify-end border-t border-slate-100 pt-3">
                      <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View Schedule →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <div className="animate-fade-in">
                <h3 className="text-base font-bold text-slate-900 mb-4">Payment History</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Receipt</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Collector</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-900">{formatDate(payment.date)}</td>
                          <td className="px-4 py-3 text-blue-600 font-medium">{payment.receipt}</td>
                          <td className="px-4 py-3 text-slate-600">{payment.item}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-3 text-slate-500">{payment.collector}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="animate-fade-in">
                <h3 className="text-base font-bold text-slate-900 mb-6">Customer Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Mock document cards */}
                  {[
                    { title: 'Customer Photo', type: 'Profile Image' },
                    { title: 'CNIC Front', type: 'Identity Document' },
                    { title: 'CNIC Back', type: 'Identity Document' },
                  ].map((doc, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl overflow-hidden group">
                      <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                        <ImageIcon size={40} className="text-slate-300" />
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button className="bg-white text-slate-900 font-medium px-4 py-2 rounded-lg text-sm shadow-sm">View Image</button>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                        <p className="text-xs text-slate-500">{doc.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
