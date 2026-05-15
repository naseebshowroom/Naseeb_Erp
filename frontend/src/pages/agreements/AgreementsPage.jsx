import { useState, useRef } from 'react'
import { 
  FileText, Download, Printer, Plus, 
  Search, Eye, ArrowLeft, Building2, User
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency, formatDate } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MOCK_AGREEMENTS = [
  { id: 1, customer: 'Muhammad Asif', product: 'Honda CD 70', template: 'Motorcycle', date: '2026-05-15', status: 'Signed' },
  { id: 2, customer: 'Ali Hassan', product: 'Suzuki Mehran', template: 'Car', date: '2026-05-10', status: 'Draft' },
  { id: 3, customer: 'Sana Bibi', product: 'Haier 1.5T AC', template: 'Electronics', date: '2026-04-20', status: 'Signed' },
]

// Mock fetched installment data to auto-fill
const ACTIVE_INSTALLMENT = {
  customer: {
    fullName: 'Tariq Mehmood',
    fatherName: 'Abdul Rehman',
    cnic: '36302-9876543-9',
    phone: '0312-9876543',
    address: 'House 42, WAPDA Colony, Multan',
    guarantor1: { name: 'Sajid Ali', cnic: '36302-1112223-3', phone: '0300-1111111', address: 'Gulshan Market', profession: 'Business' },
    guarantor2: { name: 'Kashif Riaz', cnic: '36302-4445556-6', phone: '0311-2222222', address: 'Shah Rukn-e-Alam', profession: 'Govt Teacher' },
  },
  product: {
    category: 'Motorcycle',
    brand: 'Honda',
    model: 'CG 125',
    color: 'Red',
    engineNo: 'E-555666',
    chassisNo: 'C-777888',
  },
  financial: {
    totalPrice: 220000,
    advance: 50000,
    remaining: 170000,
    installments: 10,
    perInstallment: 17000,
    scheduleType: 'Monthly',
    startDate: '2026-06-01'
  }
}

// Global Shop Settings Mock
const SHOP_INFO = {
  name: 'Kiraya Electronics & Motors',
  owner: 'Haji Naseeb',
  phone: '0300-1234567',
  address: 'Main Installment Market, Multan'
}

export default function AgreementsPage() {
  const [view, setView] = useState('list') // 'list' | 'generator'
  const [templateType, setTemplateType] = useState('motorcycle')
  const [agreements] = useState(MOCK_AGREEMENTS)
  const agreementRef = useRef(null)

  const handleDownloadPDF = async () => {
    toast.loading('Generating High-Quality PDF...', { id: 'pdf' })
    try {
      const element = agreementRef.current
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Agreement_${ACTIVE_INSTALLMENT.customer.fullName.replace(' ', '_')}.pdf`)
      toast.success('PDF Downloaded!', { id: 'pdf' })
    } catch (err) {
      toast.error('Failed to generate PDF', { id: 'pdf' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // ── Render List View ──
  if (view === 'list') {
    return (
      <PageWrapper 
        title="Agreements & Contracts" 
        subtitle="Manage legal documents, view signed contracts, and generate new ones."
        actions={
          <button onClick={() => setView('generator')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} /> Generate New Agreement
          </button>
        }
      >
        <div className="erp-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative max-w-sm w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search customer or contract..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Template</th>
                  <th className="px-6 py-4">Date Created</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agreements.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{row.product}</td>
                    <td className="px-6 py-4 text-slate-600">{row.template}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(row.date)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.status === 'Signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={18}/></button>
                        <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Download size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageWrapper>
    )
  }

  // ── Render Generator View ──
  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8 font-inter">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Controls */}
        <div className="w-full lg:w-80 shrink-0 space-y-4 no-print">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-6">
            <ArrowLeft size={16} /> Back to List
          </button>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Generator Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Template</label>
                <select value={templateType} onChange={e => setTemplateType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="motorcycle">Motorcycle Agreement</option>
                  <option value="electronics">Electronics Agreement</option>
                  <option value="car">Car Agreement</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Link Installment Record</label>
                <div className="flex gap-2">
                  <input type="text" value="Tariq Mehmood - CG 125" readOnly className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-medium rounded-lg text-sm focus:outline-none" />
                  <button className="px-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700"><Search size={16}/></button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
            <button onClick={handleDownloadPDF} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 transition-colors">
              <Download size={18} /> Download PDF
            </button>
            <button onClick={handlePrint} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2 transition-colors">
              <Printer size={18} /> Print Now
            </button>
          </div>
        </div>

        {/* Right Side: A4 Document Preview */}
        <div className="flex-1 overflow-x-auto pb-10">
          <div 
            ref={agreementRef} 
            className="bg-white mx-auto shadow-2xl p-8 sm:p-12 md:p-16 print:shadow-none print:p-0 print-area"
            style={{ width: '210mm', minHeight: '297mm' }} // A4 dimensions
          >
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-8 text-center flex flex-col items-center">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">{SHOP_INFO.name}</h1>
              <p className="text-sm font-medium text-slate-600 mt-2">{SHOP_INFO.address} | Phone: {SHOP_INFO.phone}</p>
              <div className="mt-6 bg-slate-900 text-white px-8 py-2 font-bold uppercase tracking-widest text-lg inline-block">
                INSTALLMENT AGREEMENT ({templateType.toUpperCase()})
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex justify-between text-sm mb-8 font-medium">
              <div><span className="text-slate-500">Date:</span> {formatDate(new Date().toISOString())}</div>
              <div><span className="text-slate-500">Agreement No:</span> AGR-2026-0045</div>
            </div>

            {/* Parties */}
            <div className="space-y-4 mb-8">
              <p className="text-sm leading-relaxed text-justify">
                This agreement is made between <strong>{SHOP_INFO.name}</strong> represented by <strong>{SHOP_INFO.owner}</strong> (hereinafter referred to as the "Seller") and the following individual (hereinafter referred to as the "Buyer"):
              </p>
              
              <div className="bg-slate-50 border border-slate-300 p-4 text-sm grid grid-cols-2 gap-y-3">
                <div><span className="text-slate-500">Name:</span> <span className="font-bold">{ACTIVE_INSTALLMENT.customer.fullName}</span></div>
                <div><span className="text-slate-500">S/O:</span> {ACTIVE_INSTALLMENT.customer.fatherName}</div>
                <div><span className="text-slate-500">CNIC:</span> <span className="font-bold font-mono">{ACTIVE_INSTALLMENT.customer.cnic}</span></div>
                <div><span className="text-slate-500">Phone:</span> {ACTIVE_INSTALLMENT.customer.phone}</div>
                <div className="col-span-2"><span className="text-slate-500">Address:</span> {ACTIVE_INSTALLMENT.customer.address}</div>
              </div>
            </div>

            {/* Product & Financials */}
            <div className="mb-8">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-sm border-b border-slate-200 pb-1">Product & Financial Details</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <ul className="space-y-2">
                    <li className="flex justify-between"><span className="text-slate-500">Product:</span> <strong>{ACTIVE_INSTALLMENT.product.brand} {ACTIVE_INSTALLMENT.product.model}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-500">Engine No:</span> <span className="font-mono">{ACTIVE_INSTALLMENT.product.engineNo}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Chassis No:</span> <span className="font-mono">{ACTIVE_INSTALLMENT.product.chassisNo}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Color:</span> {ACTIVE_INSTALLMENT.product.color}</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2">
                    <li className="flex justify-between"><span className="text-slate-500">Total Price:</span> <strong className="text-lg">Rs. {ACTIVE_INSTALLMENT.financial.totalPrice.toLocaleString()}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-500">Advance Paid:</span> <strong>Rs. {ACTIVE_INSTALLMENT.financial.advance.toLocaleString()}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-500">Remaining Balance:</span> <strong>Rs. {ACTIVE_INSTALLMENT.financial.remaining.toLocaleString()}</strong></li>
                    <li className="flex justify-between"><span className="text-slate-500">Payment Plan:</span> {ACTIVE_INSTALLMENT.financial.installments} Installments ({ACTIVE_INSTALLMENT.financial.scheduleType})</li>
                    <li className="flex justify-between"><span className="text-slate-500">Per Installment:</span> <strong className="text-blue-700">Rs. {ACTIVE_INSTALLMENT.financial.perInstallment.toLocaleString()}</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Guarantors */}
            <div className="mb-8 border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-sm uppercase">Guarantors Information</div>
              <div className="grid grid-cols-2 divide-x divide-slate-300">
                <div className="p-4 text-xs space-y-2">
                  <div className="font-bold underline mb-2">Guarantor 1</div>
                  <div><span className="text-slate-500">Name:</span> {ACTIVE_INSTALLMENT.customer.guarantor1.name}</div>
                  <div><span className="text-slate-500">CNIC:</span> {ACTIVE_INSTALLMENT.customer.guarantor1.cnic}</div>
                  <div><span className="text-slate-500">Phone:</span> {ACTIVE_INSTALLMENT.customer.guarantor1.phone}</div>
                  <div><span className="text-slate-500">Profession:</span> {ACTIVE_INSTALLMENT.customer.guarantor1.profession}</div>
                </div>
                <div className="p-4 text-xs space-y-2">
                  <div className="font-bold underline mb-2">Guarantor 2</div>
                  <div><span className="text-slate-500">Name:</span> {ACTIVE_INSTALLMENT.customer.guarantor2.name}</div>
                  <div><span className="text-slate-500">CNIC:</span> {ACTIVE_INSTALLMENT.customer.guarantor2.cnic}</div>
                  <div><span className="text-slate-500">Phone:</span> {ACTIVE_INSTALLMENT.customer.guarantor2.phone}</div>
                  <div><span className="text-slate-500">Profession:</span> {ACTIVE_INSTALLMENT.customer.guarantor2.profession}</div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-12">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-sm border-b border-slate-200 pb-1">Terms & Conditions</h3>
              <ol className="list-decimal pl-5 space-y-2 text-xs text-justify text-slate-700">
                <li>The Buyer acknowledges receipt of the product in perfect working condition.</li>
                <li>The Seller retains ownership of the product until the final installment is paid in full.</li>
                <li>If the Buyer defaults on 2 consecutive installments, the Seller has the right to repossess the item without legal notice, and the advance payment will be forfeited.</li>
                <li>Both Guarantors hold full responsibility for the outstanding balance in case the Buyer defaults or absconds.</li>
                <li>Any disputes shall be resolved in the local jurisdiction where the Seller's business is registered.</li>
              </ol>
            </div>

            {/* Signatures & Thumbprints */}
            <div className="mt-auto grid grid-cols-3 gap-8">
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-20 border-2 border-slate-300 mb-2 flex items-center justify-center text-[10px] text-slate-400">Thumb</div>
                <div className="w-full border-t border-slate-800 pt-2 text-center text-xs font-bold">Buyer Signature</div>
                <div className="text-[10px] text-slate-500 mt-1">{ACTIVE_INSTALLMENT.customer.fullName}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-20 border-2 border-slate-300 mb-2 flex items-center justify-center text-[10px] text-slate-400">Thumb</div>
                <div className="w-full border-t border-slate-800 pt-2 text-center text-xs font-bold">Guarantor 1 Signature</div>
                <div className="text-[10px] text-slate-500 mt-1">{ACTIVE_INSTALLMENT.customer.guarantor1.name}</div>
              </div>

              <div className="flex flex-col items-center justify-end">
                <div className="w-full border-t border-slate-800 pt-2 text-center text-xs font-bold">Authorized Seller</div>
                <div className="text-[10px] text-slate-500 mt-1">{SHOP_INFO.owner}</div>
                <div className="text-[10px] text-slate-500">Official Stamp</div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
