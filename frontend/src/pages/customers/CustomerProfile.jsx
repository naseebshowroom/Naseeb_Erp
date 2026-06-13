import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, Phone, MapPin, Briefcase, FileText, 
  CreditCard, Wallet, Image as ImageIcon, 
  Edit, Printer, ChevronRight, Activity, Calendar, Users, Plus
} from 'lucide-react';
import PageWrapper from '@/components/ui/PageWrapper';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import ErrorState from '@/components/ui/ErrorState';
import api from '@/lib/axios';
import CollectPaymentModal from '@/components/payments/CollectPaymentModal';
import { useAuthStore } from '@/store/authStore';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment modal state
  const [payModalOpen, setPayModalOpen]             = useState(false);
  const [selectedInstallmentObj, setSelectedInstallmentObj] = useState(null);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Gahak ka record nahi mila.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  if (isLoading) {
    return (
      <PageWrapper title="Customer Profile" breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: 'Loading...' }]}>
        <div className="flex justify-center items-center h-64 text-slate-500 font-medium animate-pulse">Profile load ho rahi hai...</div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper title="Customer Profile" breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: 'Not Found' }]}>
        <ErrorState message={error || 'Gahak ka record nahi mila'} onRetry={loadProfile} />
      </PageWrapper>
    );
  }

  const customer = data;

  // Stats calculation
  const activeInstallments = customer.installments?.filter(i => i.status !== 'completed') || [];
  const totalPaid = customer.installments?.reduce((acc, i) => acc + (i.totalPaid || 0), 0) || 0;
  const totalRemaining = customer.installments?.reduce((acc, i) => acc + (i.remainingAmount || 0), 0) || 0;

  const sendWhatsAppReminder = () => {
    const customerName = customer.fullName;
    const phone = customer.phone;
    
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '92' + formattedPhone.substring(1);
    }
    
    const nextQist = activeInstallments[0]
      ? `Rs. ${activeInstallments[0].perInstallmentAmount}`
      : `Rs. ${totalRemaining}`;

    const text = `Assalam-o-Alaikum ${customerName}, Naseeb Autos & Showroom Khuzdar ki taraf se guzarish hai ke aapki qist (${nextQist}) baqaya hai. Bara-e-maharbani jald az jald jama karwa kar apna record saaf rakhein. Shukriya!`;
    
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const tabs = [
    { id: 'overview', label: 'Overview (Tafseel)', icon: User },
    { id: 'installments', label: 'Installments (Khatey)', icon: CreditCard },
    { id: 'payments', label: 'Payments (Adaigiyan)', icon: Wallet },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <>
    <PageWrapper 
      title="Gahak Profile (Customer)" 
      breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: customer.fullName }]}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={16} /> Print
          </button>
          <Link to={`/customers/${customer._id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded hover:bg-slate-200 transition-colors shadow-sm">
            <Edit size={16} /> Edit Profile
          </Link>
          <button onClick={() => { setSelectedInstallmentObj(null); setPayModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded hover:bg-slate-800 transition-colors shadow-sm">
            <Plus size={16} /> Payment
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* ── Left Sidebar: Profile Summary ── */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="erp-card p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-100 to-white"></div>
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-sm border border-slate-100 relative z-10 mb-4">
              {customer.photo ? (
                <img src={customer.photo} alt={customer.fullName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-3xl font-bold">
                  {customer.fullName.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 relative z-10">{customer.fullName}</h2>
            <p className="text-sm text-slate-500 mb-3">{customer.cnic}</p>
            <div className="flex flex-col items-center gap-2">
              <StatusBadge status={customer.status} />
            </div>
            
            <div className="w-full mt-6 space-y-4 text-sm text-left">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <span className="font-semibold">{customer.phone}</span>
                </div>
                <button
                  onClick={sendWhatsAppReminder}
                  className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  💬 Reminder
                </button>
              </div>
              <div className="flex items-start gap-3 text-slate-600 py-1 border-b border-slate-100">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{customer.address}, {customer.city}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 py-1">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span>Registered: {formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="erp-card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Khatey Ka Khulasa</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Active Plans</span>
              <span className="font-bold text-slate-900">{activeInstallments.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Remaining</span>
              <span className="font-bold text-red-600">{formatCurrency(totalRemaining)}</span>
            </div>
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="flex-1 erp-card flex flex-col min-h-[600px] overflow-hidden">
          
          {/* Tabs Header */}
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'border-black text-black bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
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
                    Personal Details (Shati Tafseel)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Waly Ka Naam (Father)</span> <span className="font-medium text-slate-900">{customer.fatherName}</span></div>
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Doosra Phone</span> <span className="font-medium text-slate-900">{customer.alternatePhone || 'N/A'}</span></div>
                    <div className="md:col-span-2"><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Mukammal Pata (Address)</span> <span className="font-medium text-slate-900">{customer.address}, {customer.city}</span></div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    Zamanatdar (Guarantors)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {customer.guarantors?.map((g, i) => (
                      <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 text-blue-600">
                          <User size={16} /> Zamanatdar {i + 1}
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-slate-500 font-medium">Naam:</span> <span className="font-bold text-slate-900">{g.fullName}</span></p>
                          {g.fatherName && <p><span className="text-slate-500">Walid:</span> {g.fatherName}</p>}
                          {g.relation && <p><span className="text-slate-500">Rishta:</span> {g.relation}</p>}
                          <p><span className="text-slate-500">CNIC:</span> {g.cnic || 'N/A'}</p>
                          <p><span className="text-slate-500">Phone:</span> {g.phone}</p>
                          <p><span className="text-slate-500">Pata (Address):</span> {g.address || 'N/A'}</p>
                          {g.department && <p><span className="text-slate-500">Kaam/Dept:</span> {g.department}</p>}
                          {g.businessName && <p><span className="text-slate-500">Karobar:</span> {g.businessName} {g.businessType ? `(${g.businessType})` : ''}</p>}
                          {g.designation && <p><span className="text-slate-500">Ohda:</span> {g.designation}</p>}
                        </div>
                      </div>
                    ))}
                    {(!customer.guarantors || customer.guarantors.length === 0) && (
                      <div className="col-span-2 text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Koi zamanatdar record mein nahi hai.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INSTALLMENTS TAB */}
            {activeTab === 'installments' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-900">Installment Plans (Khatey)</h3>
                  <Link to={`/installments/new?customerId=${customer._id}`} className="text-sm text-black font-bold hover:underline flex items-center gap-1">
                    <Plus size={16}/> Add New Plan
                  </Link>
                </div>
                
                {customer.installments?.map(inst => (
                  <div key={inst._id} className="border border-slate-200 rounded-xl p-5 hover:border-black hover:shadow-sm transition-all bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                          <Activity size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{inst.brand} {inst.model}</h4>
                          {inst.khataNumber ? (
                            <span className="inline-block mt-0.5 font-mono text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded tracking-widest">
                              Khata # {inst.khataNumber}
                            </span>
                          ) : (
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">ID: ...{inst._id.slice(-6)}</p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={inst.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="bg-slate-50 p-3 rounded-lg"><span className="text-slate-500 block text-xs">Kul Keemat</span><span className="font-bold text-slate-900">{formatCurrency(inst.installmentPrice)}</span></div>
                      <div className="bg-emerald-50 p-3 rounded-lg"><span className="text-emerald-700 block text-xs">Mili Hui</span><span className="font-bold text-emerald-700">{formatCurrency(inst.totalPaid)}</span></div>
                      <div className="bg-red-50 p-3 rounded-lg"><span className="text-red-700 block text-xs">Baqaya</span><span className="font-bold text-red-700">{formatCurrency(inst.remainingAmount)}</span></div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="text-slate-500 block text-xs">Qist Amount</span>
                        <span className="font-bold text-black">{formatCurrency(inst.perInstallmentAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end border-t border-slate-100 pt-3 gap-2">
                      <button onClick={() => {
                          // Inject the customer object so the modal info card has fullName, phone, etc.
                          setSelectedInstallmentObj({ ...inst, customer: data });
                          setPayModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-sm text-white font-bold bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors">
                        <Wallet size={14}/> Payment Lein
                      </button>
                      <Link to={`/installments/${inst._id}`} className="text-sm text-black font-bold hover:text-blue-700 flex items-center gap-1">
                        View Details <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
                {(!customer.installments || customer.installments.length === 0) && (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Is gahak ka koi khata (installment) abhi tak nahi hai.
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <div className="animate-fade-in">
                <h3 className="text-base font-bold text-slate-900 mb-4">Payment History (Adaigiyon Ka Record)</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-tighter text-[11px]">
                      <tr>
                        <th className="px-6 py-4">Tareekh (Date)</th>
                        <th className="px-6 py-4">Khata (Item)</th>
                        <th className="px-6 py-4 text-right">Rakam (Amount)</th>
                        <th className="px-6 py-4">Wasool Kar (Collector)</th>
                        <th className="px-6 py-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customer.payments?.map((payment) => (
                        <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-bold">{formatDate(payment.paymentDate)}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-500 block">{payment.installment?.category}</span>
                            <span className="font-bold text-slate-700">{payment.installment?.brand} {payment.installment?.model}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {payment.collectorName?.charAt(0) || 'O'}
                              </div>
                              <span className="font-bold text-slate-600">{payment.collectorName || 'Owner'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 italic text-xs">{payment.notes || '-'}</td>
                        </tr>
                      ))}
                      {(!customer.payments || customer.payments.length === 0) && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic font-medium">Abhi tak koi adaigi wasool nahi hui.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="animate-fade-in">
                <h3 className="text-base font-bold text-slate-900 mb-6">Customer Documents (Documents)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[
                    { title: 'Tasveer (Photo)', url: customer.photo, type: 'Profile Image' },
                    { title: 'CNIC Front', url: customer.cnicFront, type: 'Identity Document' },
                    { title: 'CNIC Back', url: customer.cnicBack, type: 'Identity Document' },
                  ].map((doc, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl overflow-hidden group hover:border-black transition-colors">
                      <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                        {doc.url ? (
                          <img src={doc.url} alt={doc.title} className="w-full h-full object-contain p-2" />
                        ) : (
                          <div className="text-center">
                            <ImageIcon size={40} className="text-slate-200 mx-auto mb-2" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image</span>
                          </div>
                        )}
                        {doc.url && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <a href={doc.url} target="_blank" rel="noreferrer" className="bg-white text-slate-900 font-bold px-4 py-2 rounded-lg text-sm shadow-xl hover:scale-105 transition-transform">Dekhein (View)</a>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-white border-t border-slate-100">
                        <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{doc.type}</p>
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

      <CollectPaymentModal
        isOpen={payModalOpen}
        onClose={() => { setPayModalOpen(false); setSelectedInstallmentObj(null); }}
        installment={selectedInstallmentObj}   // full object with .customer, .khataNumber, etc.
        customer={selectedInstallmentObj ? null : data}  // generic mode when no specific installment
        currentUser={currentUser}
        onSuccess={() => loadProfile()}
      />
    </>
  );
}
