import { useState, useEffect, useMemo } from 'react'
import {
  UserPlus, Search, Edit, Lock, Printer,
  Activity, ArrowRight, X, Phone, RefreshCw, UserX, Trash2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import api from '@/lib/axios'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import PageWrapper from '@/components/ui/PageWrapper'
import ConfirmModal from '@/components/ui/ConfirmModal'
import toast from 'react-hot-toast'
import { handleApiError } from '@/utils/errorHandler'

const INPUT = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'

export default function WorkersPage() {
  const [workers, setWorkers]               = useState([])
  const [addModalOpen, setAddModalOpen]     = useState(false)
  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [search, setSearch]                 = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [workerToDelete, setWorkerToDelete] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [editWorker, setEditWorker]         = useState(null)   // worker being edited
  const [isEditSubmitting, setEditSubmitting] = useState(false)
  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm()



  // ── Add Worker ───────────────────────────────────────────────
  const handleAddWorker = async (data) => {
    setIsSubmitting(true)
    try {
      await api.post('/auth/register', {
        name:     data.name,
        phone:    data.phone,
        cnic:     data.cnic,
        username: data.username,
        password: data.password,
        role:     data.role || 'worker',
      })
      toast.success(`${data.name} ka account bana diya gaya!`)
      setAddModalOpen(false)
      reset()
      fetchWorkers()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Open edit modal ─────────────────────────────────────────
  const openEdit = (w) => {
    setEditWorker(w)
    resetEdit({
      fullName: w.fullName || w.name || '',
      phone:    w.phone || '',
      role:     w.role  || 'worker',
      isActive: w.isActive !== false,
    })
  }

  // ── Save edited worker ────────────────────────────────────────
  const handleEditWorker = async (data) => {
    setEditSubmitting(true)
    try {
      await api.put(`/auth/users/${editWorker._id}`, {
        fullName: data.fullName,
        phone:    data.phone,
        role:     data.role,
        isActive: data.isActive === true || data.isActive === 'true',
      })
      toast.success('Worker ki maloomat update ho gayi!')
      setEditWorker(null)
      fetchWorkers()
    } catch (err) {
      handleApiError(err)
    } finally {
      setEditSubmitting(false)
    }
  }

  // ── Delete Worker ─────────────────────────────────────────────
  const handleDeleteWorker = (w) => {
    setWorkerToDelete(w)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteWorker = async () => {
    if (!workerToDelete) return
    const displayName = workerToDelete.fullName || workerToDelete.name || workerToDelete.username
    try {
      await api.delete(`/auth/users/${workerToDelete._id}`)
      toast.success(`${displayName} ka account delete ho gaya.`)
      fetchWorkers()
    } catch (err) {
      handleApiError(err)
    } finally {
      setDeleteConfirmOpen(false)
      setWorkerToDelete(null)
    }
  }



  // ── Render ───────────────────────────────────────────────────
  return (
    <PageWrapper
      title="Team aur Vasooli"
      subtitle="Workers ka intizaam, rozana routes assign karein, aur progress track karein."
      actions={
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={16} /> Naya Worker
        </button>
      }
    >
      {/* ── Title Area ── */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Worker List</h2>
          <p className="text-sm text-slate-500">Tamam field workers aur managers ka intizaam.</p>
        </div>
      </div>

      {/* ── Worker List ── */}
        <div className="erp-card overflow-hidden animate-fade-in">
          {workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
              <UserX size={40} className="opacity-30" />
              <p className="font-medium">Koi worker nahi mila</p>
              <p className="text-sm">"Naya Worker" button se worker add karein</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Worker</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 text-center">Haisiyat</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-slate-100">
                  {workerPagination.paginated.map(w => {
                    const displayName = w.fullName || w.name || w.username || '?'
                    return (
                      <tr key={w._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0 text-sm">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{displayName}</div>
                              <div className="text-xs text-slate-500">@{w.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                            w.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>{w.role}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{w.phone || '—'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            w.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {w.isActive !== false ? 'Chalu' : 'Band'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(w)}
                              title="Edit"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteWorker(w)}
                              title="Delete"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Pagination {...workerPagination} onPageChange={workerPagination.setPage} label="workers" />
            </div>
          )}
        </div>



      {/* ── Edit Worker Modal ── */}
      {editWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-slate-900">Worker Edit Karein</h2>
              <button onClick={() => setEditWorker(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit(handleEditWorker)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Poora Naam *</label>
                  <input {...regEdit('fullName', { required: 'Naam zaroori hai' })} className={INPUT} />
                  {editErrors.fullName && <p className="text-red-500 text-xs mt-1">{editErrors.fullName.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input {...regEdit('phone')} className={INPUT} placeholder="0300-1234567" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ohda (Role)</label>
                  <select {...regEdit('role')} className={INPUT}>
                    <option value="worker">Field Worker / Collector</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...regEdit('isActive')}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Account Chalu Hai (Active)
                  </label>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isEditSubmitting ? 'Save ho raha hai...' : 'Save Karein'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Worker Modal ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-slate-900">Naya Worker Add Karein</h2>
              <button onClick={() => { setAddModalOpen(false); reset() }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleAddWorker)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Poora Naam *</label>
                    <input
                      {...register('name', { required: 'Naam zaroori hai' })}
                      className={INPUT}
                      placeholder="Muhammad Raheem"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Phone *</label>
                    <input
                      {...register('phone', { required: 'Phone zaroori hai' })}
                      className={INPUT}
                      placeholder="0300-1234567"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">CNIC</label>
                    <input {...register('cnic')} className={INPUT} placeholder="34201-XXXXXXX-X" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ohda (Role)</label>
                    <select {...register('role')} className={INPUT}>
                      <option value="worker">Field Worker / Collector</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Lock size={13} className="text-blue-500" /> Login Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Username *</label>
                      <input
                        {...register('username', { required: 'Username zaroori hai' })}
                        className={INPUT}
                        placeholder="raheem123"
                      />
                      {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Password *</label>
                      <input
                        type="password"
                        defaultValue="123456"
                        {...register('password', { required: 'Password zaroori hai', minLength: { value: 6, message: 'Kam az kam 6 harf' } })}
                        className={INPUT}
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Ban raha hai...' : 'Account Banao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Worker Account"
        message={`Kya aap waqai is worker ka account delete karna chahte hain? (Are you sure you want to delete this worker account?) This action cannot be undone.`}
        confirmLabel="Delete Account"
        onConfirm={confirmDeleteWorker}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </PageWrapper>
  )
}
