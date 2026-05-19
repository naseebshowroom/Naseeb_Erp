import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import PageWrapper from '@/components/ui/PageWrapper';
import { SkeletonCard, ErrorState } from '@/components/ui/Skeleton';
import { settingsService } from '@/services/index';
import { useSettingsStore } from '@/store/settingsStore';
import { handleApiError } from '@/utils/errorHandler';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Building2, User, Phone, MapPin, FileText, Users,
  UserPlus, KeyRound, Database, Download, Settings,
  ShieldCheck, Image as ImageIcon
} from 'lucide-react';

const INPUT = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black transition-colors';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { update: updateStore } = useSettingsStore();

  const { register: regProfile, handleSubmit: submitProfile, reset: resetProfile } = useForm();
  const { register: regSecurity, handleSubmit: submitSecurity, reset: resetSecurity } = useForm();
  const { register: regTerms, handleSubmit: submitTerms, reset: resetTerms } = useForm();

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const res = await settingsService.get();
        if (res.success && res.data) {
          const d = res.data;
          resetProfile({
            shopName: d.shopName,
            ownerName: d.ownerName,
            phone: d.phone,
            city: d.city,
            address: d.address,
            receiptBrands: d.receiptBrands,
            receiptColors: d.receiptColors
          });
          resetTerms({ termsElectronics: d.termsElectronics, termsMotorcycle: d.termsMotorcycle, termsCar: d.termsCar });
        }
      } catch (err) {
        setError(handleApiError(err, { silent: true }));
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [resetProfile, resetTerms]);

  const handleSaveProfile = async (data) => {
    setSaving(true);
    try {
      await updateStore(data);
      toast.success('Shop profile saved!');
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerms = async (data) => {
    setSaving(true);
    try {
      await updateStore(data);
      toast.success('Agreement terms saved!');
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      // Calls authService.changePassword via direct import to avoid circular deps
      const { default: authService } = await import('@/services/authService');
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password updated successfully!');
      resetSecurity();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return (
    <PageWrapper title="Settings" subtitle="Loading configuration...">
      <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}</div>
    </PageWrapper>
  );

  if (error) return (
    <PageWrapper title="Settings" subtitle="">
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    </PageWrapper>
  );

  const TABS = [
    { key: 'profile', label: 'Shop Profile', icon: Settings },
    { key: 'terms', label: 'Agreement Terms', icon: FileText },
    { key: 'security', label: 'Security & Backup', icon: ShieldCheck },
  ];

  return (
    <PageWrapper title="System Settings" subtitle="Manage global preferences, agreements, users, and security.">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full xl:w-64 shrink-0 space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeTab === key ? 'bg-black text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-black'}`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {activeTab === 'profile' && (
            <div className="erp-card p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Shop Identity</h3>
                  <p className="text-sm text-slate-500 mt-1">Appears on receipts and agreements.</p>
                </div>
                <button onClick={submitProfile(handleSaveProfile)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 shadow-sm">
                  {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Shop Name *</label>
                  <div className="relative"><Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input {...regProfile('shopName')} className={`${INPUT} pl-10`} /></div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Owner Name *</label>
                  <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input {...regProfile('ownerName')} className={`${INPUT} pl-10`} /></div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone *</label>
                  <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input {...regProfile('phone')} className={`${INPUT} pl-10`} /></div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">City *</label>
                  <input {...regProfile('city')} className={INPUT} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Address *</label>
                  <div className="relative"><MapPin size={16} className="absolute left-3 top-3 text-slate-400" /><textarea {...regProfile('address')} rows={3} className={`${INPUT} pl-10`} /></div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Receipt Brand Options (Comma/Slash Separated)</label>
                  <input {...regProfile('receiptBrands')} placeholder="Honda / Super Power / Unique / Impress / Express / Galaxy / United" className={INPUT} />
                  <p className="text-xs text-slate-400 font-medium">Sale receipt par aane wale motorcycle brands yahan likhein (e.g. Impress Honda, Super Power, etc.).</p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Receipt Color Options (Comma/Slash Separated)</label>
                  <input {...regProfile('receiptColors')} placeholder="Red / Black / Selvar / Blue" className={INPUT} />
                  <p className="text-xs text-slate-400 font-medium">Sale receipt par aane wale motorcycle colors yahan likhein.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="erp-card p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Agreement Templates</h3>
                  <p className="text-sm text-slate-500 mt-1">Customize legal terms per product category.</p>
                </div>
                <button onClick={submitTerms(handleSaveTerms)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 shadow-sm">
                  {saving ? 'Saving...' : <><Save size={16} /> Save Terms</>}
                </button>
              </div>
              <div className="space-y-6">
                {[['termsElectronics', 'Electronics'], ['termsMotorcycle', 'Motorcycle'], ['termsCar', 'Car']].map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">{label} Agreement Terms</label>
                    <textarea {...regTerms(field)} rows={4} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black font-medium text-slate-700 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}


          {activeTab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={submitSecurity(handleChangePassword)} className="erp-card p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><KeyRound size={18} className="text-black" /> Change Password</h3>
                <p className="text-sm text-slate-500 mb-6">Update your login credentials.</p>
                <div className="space-y-4">
                  {[['currentPassword', 'Current Password'], ['newPassword', 'New Password (min 6 chars)'], ['confirmPassword', 'Confirm New Password']].map(([f, l]) => (
                    <div key={f} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{l}</label>
                      <input type="password" {...regSecurity(f, { required: true, minLength: f !== 'currentPassword' ? 6 : 1 })} className={INPUT} />
                    </div>
                  ))}
                  <button type="submit" disabled={saving} className="w-full py-3 mt-2 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">{saving ? 'Updating...' : 'Update Password'}</button>
                </div>
              </form>

              <div className="space-y-6">
                <div className="erp-card p-6 bg-slate-50 border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><Database size={18} /> Database Backup</h3>
                  <p className="text-sm text-slate-600 mb-5">Download a complete copy of all ERP records.</p>
                  <button type="button" className="w-full py-3 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl hover:bg-slate-100 hover:border-black transition-colors flex justify-center items-center gap-2 shadow-sm">
                    <Download size={18} /> Export Full Backup
                  </button>
                  <p className="text-xs text-center text-slate-500 mt-3 font-medium">Last backed up: Today, 10:00 AM</p>
                </div>
                <div className="erp-card p-6 border-dashed border-2">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">WhatsApp Integration</h3>
                  <p className="text-sm text-slate-500 mb-4">Auto-send payment reminders via WhatsApp.</p>
                  <div className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-lg inline-block">Coming Soon</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageWrapper>
  );
}
