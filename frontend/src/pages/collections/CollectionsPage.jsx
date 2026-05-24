import { useState, useEffect, useMemo } from 'react';
import { Search, Printer, ArrowRight, X, Phone, RefreshCw, Activity, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import PageWrapper from '@/components/ui/PageWrapper';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/axios';
import Pagination, { usePagination } from '@/components/ui/Pagination';

const INPUT = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black';

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState('assign');
  const [workers, setWorkers] = useState([]);
  const [vasooliList, setVasooliList] = useState([]);
  const [todaysAssignments, setTodaysAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedList, setAssignedList] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');

  // ── Filtered list ──
  const filteredVasooli = useMemo(() => {
    return vasooliList.filter(v => {
      const name = v.customer?.fullName?.toLowerCase() || '';
      const phone = v.customer?.phone || '';
      const s = search.toLowerCase();
      return name.includes(s) || phone.includes(s);
    });
  }, [vasooliList, search]);

  const vasooliPagination = usePagination(filteredVasooli, 10);

  // ── API Fetchers ──
  const fetchWorkers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setWorkers(res.data.data.filter(w => w.role === 'worker' || w.role === 'manager'));
      }
    } catch {}
  };

  const fetchVasooli = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/installments/vasooli');
      if (res.data.success) setVasooliList(res.data.data);
    } catch {
      toast.error('Vasooli list fetch fail');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodaysAssignments = async (workerId) => {
    if (!workerId) {
      setTodaysAssignments([]);
      return;
    }
    try {
      const res = await api.get(`/collections/today?workerId=${workerId}`);
      if (res.data.success) setTodaysAssignments(res.data.data);
    } catch {
      toast.error('Assignments fetch fail');
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchVasooli();
  }, []);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchTodaysAssignments(selectedWorker);
    }
  }, [activeTab, selectedWorker]);

  // ── Actions ──
  const handleAssign = (item) => {
    if (!assignedList.find(c => c._id === item._id))
      setAssignedList(prev => [...prev, item]);
  };
  
  const removeAssigned = (id) => setAssignedList(prev => prev.filter(c => c._id !== id));

  const submitAssignments = async () => {
    if (!selectedWorker) return toast.error('Worker select karein');
    if (assignedList.length === 0) return toast.error('Gahak select karein');

    try {
      const payload = assignedList.map(item => ({
        customerId: item.customer._id,
        installmentId: item._id,
        amountDue: item.cumulativeDue || item.perInstallmentAmount || 0
      }));

      await api.post('/collections', {
        workerId: selectedWorker,
        assignments: payload
      });

      toast.success('Assignments save ho gaye!');
      printCollectionSheet(); // Auto print on success
      setAssignedList([]);
      fetchVasooli();
    } catch (err) {
      toast.error('Assignment fail');
    }
  };

  const printCollectionSheet = () => {
    if (assignedList.length === 0) return;
    const workerObj = workers.find(w => w._id === selectedWorker);
    const workerName = workerObj?.fullName || workerObj?.name || 'N/A';

    const doc = new jsPDF();
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('NASEEB ERP', 105, 18, { align: 'center' });
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text('ROZANA VASOOLI SHEET (Daily Collection Route)', 105, 27, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Tareekh: ${selectedDate}`, 14, 38);
    doc.text(`Collector: ${workerName}`, 130, 38);
    doc.line(14, 42, 196, 42);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('#', 14, 50); doc.text('Gahak', 22, 50);
    doc.text('Phone', 80, 50); doc.text('Samaan', 115, 50);
    doc.text('Baqaya', 155, 50); doc.text('Adaigi', 178, 50);
    doc.line(14, 53, 196, 53);

    let y = 60; let total = 0;
    doc.setFont('helvetica', 'normal');
    assignedList.forEach((item, i) => {
      const name = item.customer?.fullName || '—';
      const phone = item.customer?.phone || '—';
      const product = `${item.brand || ''} ${item.model || ''}`.trim() || item.category;
      const due = item.cumulativeDue || item.perInstallmentAmount || 0;
      total += due;
      doc.text(`${i + 1}`, 14, y);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(name, 55), 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(phone, 80, y);
      doc.text(doc.splitTextToSize(product, 35), 115, y);
      doc.text(`Rs.${due.toLocaleString()}`, 155, y);
      doc.rect(178, y - 4, 18, 6);
      y += 12;
      doc.setDrawColor(200, 200, 200); doc.line(14, y - 4, 196, y - 4); doc.setDrawColor(0);
    });

    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Kul Expected:', 110, y);
    doc.text(`Rs. ${Math.round(total).toLocaleString()}`, 155, y);
    doc.setFontSize(9);
    doc.line(14, 270, 65, 270); doc.text('Collector Ka Signature', 14, 276);
    doc.line(140, 270, 196, 270); doc.text('Malik Ka Signature', 140, 276);

    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <PageWrapper
      title="Collections & Routes"
      subtitle="Rozana ki vasooli assignments aur unki live tracking."
    >
      <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit mb-6 border border-slate-200">
        {[
          { id: 'assign', label: 'Route Assign' },
          { id: 'live', label: 'Live Progress', icon: Activity },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === t.id ? 'bg-white text-black shadow-sm border border-slate-200' : 'text-slate-500 hover:text-black'
            }`}
          >
            {t.icon && <t.icon size={16} className={activeTab === t.id ? 'text-blue-600' : ''} />}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Left: Vasooli Search */}
          <div className="erp-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Gahak Chunein (Pending Vasooli)</h3>
              <button onClick={fetchVasooli} className="p-1.5 text-slate-400 hover:text-black transition-colors rounded-lg hover:bg-slate-50">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Naam ya phone se talash karein..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`${INPUT} pl-9`}
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto mb-4 max-h-[500px] pr-1">
              {isLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>
              ) : vasooliPagination.paginated.length === 0 ? (
                <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-2 border border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 size={32} />
                  <span>Koi baqaya nahi mila</span>
                </div>
              ) : (
                vasooliPagination.paginated.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-black bg-white transition-colors group">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm truncate">{item.customer?.fullName || '—'}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Phone size={12} /> {item.customer?.phone || '—'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 capitalize font-medium">{item.brand} {item.model}</div>
                    </div>
                    <div className="ml-3 text-right shrink-0 flex flex-col items-end">
                      <div className="font-black text-sm text-red-600 mb-2">{formatCurrency(item.cumulativeDue)}</div>
                      <button
                        onClick={() => handleAssign(item)}
                        disabled={!!assignedList.find(c => c._id === item._id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          assignedList.find(c => c._id === item._id) 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-slate-800 shadow-sm'
                        }`}
                      >
                        {assignedList.find(c => c._id === item._id) ? 'Added ✓' : 'Add +'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Pagination {...vasooliPagination} onPageChange={vasooliPagination.setPage} label="gahak" />
          </div>

          {/* Right: Route Assembly */}
          <div className="erp-card flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Naya Route</h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">{assignedList.length} Gahak</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tareekh</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Collector (Worker) *</label>
                  <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)} className={INPUT}>
                    <option value="">-- Select Worker --</option>
                    {workers.map(w => (
                      <option key={w._id} value={w._id}>
                        {w.fullName || w.name || w.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 p-5 space-y-3 min-h-[300px] overflow-y-auto bg-slate-50">
              {assignedList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <ArrowRight size={40} className="opacity-20" />
                  <p className="text-sm font-medium">Bayin taraf se gahak route mein shamil karein</p>
                </div>
              ) : (
                assignedList.map((item, idx) => (
                  <div key={item._id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{item.customer?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium">{item.brand} {item.model}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-900 text-sm">{formatCurrency(item.cumulativeDue)}</span>
                      <button onClick={() => removeAssigned(item._id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-white">
              {assignedList.length > 0 && (
                <div className="flex justify-between items-center mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-sm font-bold text-emerald-800">Route Total Value:</span>
                  <span className="text-lg font-black text-emerald-600">{formatCurrency(assignedList.reduce((s, i) => s + (i.cumulativeDue || 0), 0))}</span>
                </div>
              )}
              <button
                onClick={submitAssignments}
                disabled={assignedList.length === 0 || !selectedWorker}
                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={18} /> Assign Route & Print Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'live' && (
        <div className="erp-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Aaj Ke Assignments (Live)</h3>
              <p className="text-xs text-slate-500 mt-1">Worker ki live tracking. Worker app se status update karega.</p>
            </div>
            <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)} className="w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black">
              <option value="">-- Worker Chunein --</option>
              {workers.map(w => (
                <option key={w._id} value={w._id}>
                  {w.fullName || w.name || w.username}
                </option>
              ))}
            </select>
          </div>

          {!selectedWorker ? (
            <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Worker select karein taake assignments dekh sakein.
            </div>
          ) : todaysAssignments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Is worker ko aaj koi assignment nahi di gayi.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Gahak</th>
                    <th className="px-6 py-4">Samaan</th>
                    <th className="px-6 py-4 text-right">Target Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Wasool Shuda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todaysAssignments.map(a => (
                    <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{a.customer?.fullName}</div>
                        <div className="text-xs text-slate-500">{a.customer?.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {a.installment?.brand} {a.installment?.model}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {formatCurrency(a.amountDue)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          a.status === 'collected' ? 'bg-emerald-100 text-emerald-700' :
                          a.status === 'postponed' ? 'bg-amber-100 text-amber-700' :
                          a.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                        {a.amountCollected ? formatCurrency(a.amountCollected) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
