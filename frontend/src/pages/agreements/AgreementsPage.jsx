import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, Search, RefreshCw, Receipt, 
  Calendar, CheckCircle2, ChevronRight,
  AlertCircle, FileQuestion
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import DocumentModal from '@/components/documents/DocumentModal'
import { formatDate } from '@/lib/utils'
import { agreementService } from '@/services/agreementService'
import toast from 'react-hot-toast'

const DOC_TYPES = {
  MOTORCYCLE: 'motorcycle_agreement',
  CAR: 'car_agreement',
  ELECTRONICS: 'electronics_agreement',
  RECEIPT: 'sale_receipt'
}

const CATEGORIES = {
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
  MOBILE: 'mobile',
  AC: 'ac',
  LCD: 'lcd',
  WASHING_MACHINE: 'washing_machine',
  FRIDGE: 'fridge'
}

export default function AgreementsPage() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [docTypeFilter, setDocTypeFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [modalData, setModalData] = useState(null)

  const fetchAgreements = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = {
        search,
        documentType: docTypeFilter,
        startDate: dateRange.from,
        endDate: dateRange.to
      }
      const res = await agreementService.getAgreements(params)
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [search, docTypeFilter, dateRange])

  useEffect(() => {
    fetchAgreements()
  }, [fetchAgreements])

  const getAvailableDocs = (category) => {
    const cat = category?.toLowerCase()
    if (cat === CATEGORIES.MOTORCYCLE) return [DOC_TYPES.MOTORCYCLE, DOC_TYPES.RECEIPT]
    if (cat === CATEGORIES.CAR) return [DOC_TYPES.CAR]
    return [DOC_TYPES.ELECTRONICS]
  }

  const isDocGenerated = (records, type) => {
    return records?.find(r => r.documentType === type) || null
  }

  const getBadgeStyles = (category) => {
    const cat = category?.toLowerCase()
    if (cat === 'motorcycle') return 'bg-slate-100 text-slate-700 border-slate-200'
    if (cat === 'car') return 'bg-slate-100 text-slate-700 border-slate-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const getDocLabel = (type) => {
    if (type === DOC_TYPES.MOTORCYCLE) return 'Motorcycle Agreement'
    if (type === DOC_TYPES.CAR) return 'Car Agreement'
    if (type === DOC_TYPES.ELECTRONICS) return 'Electronics Agreement'
    if (type === DOC_TYPES.RECEIPT) return 'Sale Receipt'
    return type
  }

  return (
    <PageWrapper 
      title="Documents & Agreements" 
      subtitle="Generate, preview and print official documents for each installment"
    >
      {/* Top Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name or CNIC..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Doc Type Dropdown */}
        <select
          value={docTypeFilter}
          onChange={e => setDocTypeFilter(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="all">All Documents</option>
          <option value={DOC_TYPES.ELECTRONICS}>Electronics Agreement</option>
          <option value={DOC_TYPES.MOTORCYCLE}>Motorcycle Agreement</option>
          <option value={DOC_TYPES.RECEIPT}>Sale Receipt</option>
        </select>

        {/* Date Range */}
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
          />
        </div>

        {/* Refresh */}
        <button 
          onClick={fetchAgreements}
          className="w-12 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:border-black hover:text-black transition-colors text-slate-500"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Available Documents</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-4 h-20 bg-slate-50/30" />
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={40} className="text-red-400" />
                      <p className="text-slate-600 font-medium">{error}</p>
                      <button onClick={fetchAgreements} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Retry</button>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      {search ? (
                        <>
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Search size={32} />
                          </div>
                          <div>
                            <h3 className="text-slate-900 font-bold text-lg">No results for "{search}"</h3>
                            <p className="text-slate-500 text-sm">Try a different name or CNIC</p>
                          </div>
                          <button onClick={() => setSearch('')} className="px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold">Clear Search</button>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <FileText size={32} />
                          </div>
                          <div>
                            <h3 className="text-slate-900 font-bold text-lg">No installments found</h3>
                            <p className="text-slate-500 text-sm">Add installments first, then generate documents here.</p>
                          </div>
                          <button className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-slate-800">
                            Go to Installments <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map(item => {
                  const availableDocs = getAvailableDocs(item.installment.category)
                  const allGenerated = availableDocs.every(type => isDocGenerated(item.agreementRecords, type))

                  return (
                    <tr key={item.installment._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.customer?.fullName}</div>
                        <div className="text-xs text-slate-400">{item.customer?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.installment?.model}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">{item.installment?.brand}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${getBadgeStyles(item.installment.category)}`}>
                          {item.installment.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {availableDocs.map(docType => {
                            const record = isDocGenerated(item.agreementRecords, docType)
                            return (
                              <button
                                key={docType}
                                onClick={() => setModalData({ ...item, initialTab: docType })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                  record 
                                    ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-black hover:text-black'
                                }`}
                              >
                                {record ? <CheckCircle2 size={12} /> : <FileText size={12} />}
                                {getDocLabel(docType)}
                                {record && <span className="opacity-50 font-normal ml-1">✓ Generated {formatDate(record.printedAt)}</span>}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                        {formatDate(item.installment.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {!allGenerated ? (
                            <button 
                              onClick={() => setModalData(item)}
                              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800"
                            >
                              Generate Documents
                            </button>
                          ) : (
                            availableDocs.map(docType => (
                              <button
                                key={docType}
                                onClick={() => setModalData({ ...item, initialTab: docType })}
                                className="px-3 py-2 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200"
                              >
                                {docType === DOC_TYPES.ELECTRONICS ? 'View / Print Agreement' : 
                                 docType === DOC_TYPES.RECEIPT ? 'View Receipt' : 'View Agreement'}
                              </button>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalData && (
        <DocumentModal
          installment={modalData.installment}
          customer={modalData.customer}
          initialTab={modalData.initialTab}
          onClose={() => setModalData(null)}
          onRefresh={fetchAgreements}
        />
      )}
    </PageWrapper>
  )
}
