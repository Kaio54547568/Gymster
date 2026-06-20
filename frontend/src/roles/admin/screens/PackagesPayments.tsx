import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { createPackageInSupabase, createPackagePromotion, deletePackageInSupabase, fetchPackagesFromSupabase, updatePackageInSupabase } from '../../../services/packageApi';

type PackageStatus = 'Active' | 'Inactive';
type PackageType = 'Basic' | 'PT' | 'VIP' | 'Session-based' | string;

type SupabasePackage = {
  id: string | number;
  code?: string | null;
  name: string;
  type?: string;
  adminType?: string;
  packageTypeLabel?: string;
  price: number;
  priceText?: string;
  duration?: string;
  durationText?: string;
  durationMonths?: number;
  description?: string;
  status?: string;
  isActive?: boolean;
  sessionLimit?: string;
  hasPersonalTrainer?: boolean;
  features?: string[];
  isPopular?: boolean;
  popular?: boolean;
  sessionsPerWeek?: number;
};

type GymPackage = {
  id: number | string;
  code?: string | null;
  name: string;
  type: PackageType;
  price: string;
  duration: string;
  description: string;
  status: PackageStatus;
  rawStatus?: string;
  isActive?: boolean;
  sessionLimit: string;
  hasPersonalTrainer: boolean;
  features: string[];
  popular: boolean;
  isPopular?: boolean;
  sessionsPerWeek?: number;
};

const emptyPackageForm = {
  name: '',
  type: 'Basic' as PackageType,
  duration: '',
  price: '',
  description: '',
  status: 'Active' as PackageStatus,
  sessionLimit: '',
  hasPersonalTrainer: false,
  isPopular: false,
  sessionsPerWeek: 1,
};

const emptyPromotionForm = {
  title: '',
  description: '',
  discountPercent: '',
  startDate: '',
  endDate: '',
  status: 'active',
};

function mapSupabasePackageToAdminPackage(pkg: SupabasePackage): GymPackage {
  const isActive = typeof pkg.isActive === 'boolean' ? pkg.isActive : String(pkg.status || '').toLowerCase() === 'active';
  const sessionLimit = pkg.sessionLimit || 'Session limit not configured';
  const hasPersonalTrainer = Boolean(pkg.hasPersonalTrainer);

  return {
    id: pkg.id,
    code: pkg.code,
    name: pkg.name,
    type: pkg.adminType || pkg.packageTypeLabel || pkg.type || 'Basic',
    price: pkg.priceText || Number(pkg.price || 0).toLocaleString('vi-VN'),
    duration: pkg.durationText || pkg.duration || `${pkg.durationMonths || 0} months`,
    description: pkg.description || 'Package description not configured.',
    status: isActive ? 'Active' : 'Inactive',
    rawStatus: pkg.status,
    isActive,
    sessionLimit,
    hasPersonalTrainer,
    features: pkg.features?.length
      ? pkg.features
      : [
          pkg.description || 'Package benefits configured',
          sessionLimit,
          hasPersonalTrainer ? 'Personal trainer included' : 'Self-service training',
        ],
    popular: Boolean(pkg.isPopular || pkg.popular),
    isPopular: Boolean(pkg.isPopular || pkg.popular),
    sessionsPerWeek: pkg.sessionsPerWeek || 1,
  };
}

export default function PackagesPayments() {
  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packageLoadMessage, setPackageLoadMessage] = useState('');
  const [promotionPackage, setPromotionPackage] = useState<GymPackage | null>(null);
  const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);
  const [promotionError, setPromotionError] = useState('');
  const [isSavingPromotion, setIsSavingPromotion] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [editingPackage, setEditingPackage] = useState<GymPackage | null>(null);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [isDeletingPackage, setIsDeletingPackage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchPackagesFromSupabase()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          setPackages([]);
          setPackageLoadMessage('Package list could not be loaded.');
        } else if (!data.length) {
          setPackages([]);
          setPackageLoadMessage('No packages found.');
        } else {
          setPackages(data.map(mapSupabasePackageToAdminPackage));
          setPackageLoadMessage('');
        }

        setIsLoadingPackages(false);
      })
      .catch((error) => {
        console.error('[Gymster h\u1ec7 th\u1ed1ng] Failed to load admin packages:', error);

        if (!isMounted) return;
        setPackages([]);
        setPackageLoadMessage('Package list could not be loaded.');
        setIsLoadingPackages(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const packageCounters = useMemo(() => {
    return {
      total: packages.length,
      active: packages.filter((pkg) => pkg.isActive === true || String(pkg.status).toLowerCase() === 'active').length,
      inactive: packages.filter((pkg) => pkg.isActive === false || String(pkg.status).toLowerCase() === 'inactive').length,
    };
  }, [packages]);

  const openPromotionModal = (pkg: GymPackage) => {
    setPromotionPackage(pkg);
    setPromotionForm(emptyPromotionForm);
    setPromotionError('');
  };

  const closePromotionModal = () => {
    setPromotionPackage(null);
    setPromotionForm(emptyPromotionForm);
    setPromotionError('');
  };

  const handleSavePromotion = async () => {
    if (!promotionPackage) return;
    const discountPercent = Number(promotionForm.discountPercent);
    if (!promotionForm.title.trim() || !promotionForm.startDate || !promotionForm.endDate) {
      setPromotionError('Title, start date, and end date are required.');
      return;
    }
    if (!(discountPercent > 0 && discountPercent <= 100)) {
      setPromotionError('Discount percent must be greater than 0 and at most 100.');
      return;
    }
    if (promotionForm.endDate < promotionForm.startDate) {
      setPromotionError('End date must be on or after start date.');
      return;
    }
    setIsSavingPromotion(true);
    const { error } = await createPackagePromotion({
      packageId: promotionPackage.id,
      title: promotionForm.title,
      description: promotionForm.description,
      discountPercent,
      startDate: promotionForm.startDate,
      endDate: promotionForm.endDate,
      status: promotionForm.status,
    });
    setIsSavingPromotion(false);
    if (error) {
      setPromotionError(error.message);
      return;
    }
    closePromotionModal();
    setPackageLoadMessage('Promotion created successfully.');
  };

  const openCreatePackageModal = () => {
    setEditingPackage(null);
    setPackageForm(emptyPackageForm);
    setShowPackageModal(true);
  };

  const openEditPackageModal = (pkg: GymPackage) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      type: pkg.type,
      duration: pkg.duration,
      price: pkg.price,
      description: pkg.description,
      status: pkg.status,
      sessionLimit: pkg.sessionLimit,
      hasPersonalTrainer: pkg.hasPersonalTrainer,
      isPopular: Boolean(pkg.isPopular || pkg.popular),
      sessionsPerWeek: pkg.sessionsPerWeek || 1,
    });
    setShowPackageModal(true);
  };

  const closePackageModal = () => {
    setShowPackageModal(false);
    setEditingPackage(null);
    setPackageForm(emptyPackageForm);
  };

  const handleSavePackage = async () => {
    if (!packageForm.name.trim() || !packageForm.duration.trim() || !packageForm.price.trim()) return;

    setIsSavingPackage(true);
    const { data, error } = editingPackage
      ? await updatePackageInSupabase(editingPackage.id, packageForm)
      : await createPackageInSupabase(packageForm);
    setIsSavingPackage(false);

    if (!error && data) {
      const mappedPackage = mapSupabasePackageToAdminPackage(data);
      setPackages((current) => (
        editingPackage
          ? current.map((pkg) => (pkg.id === editingPackage.id ? mappedPackage : pkg))
          : [mappedPackage, ...current]
      ));
      closePackageModal();
      setPackageLoadMessage('');
      return;
    }

    setPackageLoadMessage(editingPackage ? 'Package could not be updated.' : 'Package could not be saved. No package was created.');
  };

  const handleDeletePackage = async () => {
    if (!editingPackage || isDeletingPackage) return;
    const shouldDelete = window.confirm(`Delete package "${editingPackage.name}"? This cannot be undone.`);
    if (!shouldDelete) return;

    setIsDeletingPackage(true);
    const { error } = await deletePackageInSupabase(editingPackage.id);
    setIsDeletingPackage(false);

    if (!error) {
      setPackages((current) => current.filter((pkg) => pkg.id !== editingPackage.id));
      closePackageModal();
      setPackageLoadMessage('');
      return;
    }

    setPackageLoadMessage('Package could not be deleted. It may already be linked to members or payments.');
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="bebas mb-2 text-5xl tracking-wider text-white">PACKAGE</h1>
          <p className="text-[#A1A1AA]">Manage membership packages, availability, and promotions.</p>
        </div>
        <button
          onClick={openCreatePackageModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000]"
        >
          <Plus className="h-5 w-5" />
          Add Package
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Total packages', packageCounters.total],
          ['Active packages', packageCounters.active],
          ['Inactive packages', packageCounters.inactive],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">{label}</p>
            <p className="bebas mt-2 text-5xl tracking-wider text-white">{value}</p>
          </div>
        ))}
      </div>

      {isLoadingPackages && (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">
          Loading packages...
        </div>
      )}

      {packageLoadMessage && !isLoadingPackages && (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">
          {packageLoadMessage}
        </div>
      )}

      {!isLoadingPackages && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => (
          <motion.div
            key={pkg.id}
            whileHover={{ scale: 1.03, y: -6 }}
            className={`relative rounded-2xl border bg-[#0c1014] p-6 ${
              pkg.popular ? 'border-[#EF233C] shadow-2xl shadow-[#EF233C]/30' : 'border-[#EF233C]/20'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#EF233C] px-4 py-1 text-xs font-bold text-white">
                MOST POPULAR
              </div>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openEditPackageModal(pkg);
              }}
              className="absolute right-4 top-4 rounded-xl border border-[#EF233C]/25 bg-[#050607]/90 p-2 text-white/70 transition-colors hover:border-[#EF233C] hover:bg-[#EF233C]/10 hover:text-white"
              aria-label={`Edit ${pkg.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>

            <div className="mb-6 text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="rounded-full border border-[#EF233C]/25 bg-[#EF233C]/10 px-3 py-1 text-xs font-bold text-[#EF233C]">{pkg.type}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${pkg.status === 'Active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/45'}`}>
                  {pkg.status}
                </span>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">{pkg.name}</h3>
              <div className="bebas mb-1 text-5xl tracking-wider text-[#EF233C]">{pkg.price}</div>
              <p className="text-[#A1A1AA]">VND / {pkg.duration}</p>
            </div>

            <p className="mb-5 min-h-12 text-sm leading-6 text-white/60">{pkg.description}</p>

            <div className="mb-5 rounded-xl border border-[#EF233C]/10 bg-[#050607] p-4 text-sm text-[#A1A1AA]">
              <div className="flex justify-between gap-3">
                <span>Session limit</span>
                <span className="text-right font-bold text-white">{pkg.sessionLimit}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span>Personal trainer</span>
                <span className="font-bold text-white">{pkg.hasPersonalTrainer ? 'Yes' : 'No'}</span>
              </div>
              {pkg.hasPersonalTrainer && (
                <div className="mt-2 flex justify-between gap-3">
                  <span>Sessions/week</span>
                  <span className="font-bold text-white">{pkg.sessionsPerWeek} session{pkg.sessionsPerWeek && pkg.sessionsPerWeek > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <ul className="mb-6 space-y-3">
              {pkg.features.map((feature, idx) => (
                <li key={`pkg-${pkg.id}-feature-${idx}`} className="flex items-center gap-2 text-sm text-white">
                  <Check className="h-5 w-5 text-[#22C55E]" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => openPromotionModal(pkg)}
              className="w-full rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000]"
            >
              Add Discount
            </button>
          </motion.div>
          ))}
        </div>
      )}

      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm" onClick={closePackageModal}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#EF233C]/30 bg-[#0c1014] p-8" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="bebas text-4xl tracking-wider text-white">{editingPackage ? 'EDIT PACKAGE' : 'ADD PACKAGE'}</h2>
                <p className="text-sm text-[#A1A1AA]">
                  {editingPackage ? 'Update package details for member registration and renewals.' : 'Create a new package option for Gymster members.'}
                </p>
              </div>
              <button onClick={closePackageModal} className="rounded-xl border border-[#EF233C]/30 p-2 text-white hover:bg-[#EF233C]/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Package name</span>
                <input value={packageForm.name} onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Package type</span>
                <select value={packageForm.type} onChange={(event) => setPackageForm({ ...packageForm, type: event.target.value as PackageType })} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  {['Basic', 'PT', 'VIP', 'Session-based'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Duration</span>
                <input value={packageForm.duration} onChange={(event) => setPackageForm({ ...packageForm, duration: event.target.value })} placeholder="Example: 3 months" className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Price</span>
                <input value={packageForm.price} onChange={(event) => setPackageForm({ ...packageForm, price: event.target.value })} placeholder="Example: 2,500,000" className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Status</span>
                <select value={packageForm.status} onChange={(event) => setPackageForm({ ...packageForm, status: event.target.value as PackageStatus })} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Session limit</span>
                <input value={packageForm.sessionLimit} onChange={(event) => setPackageForm({ ...packageForm, sessionLimit: event.target.value })} placeholder="Example: 12 PT sessions" className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Sessions per week (PT)</span>
                <select value={packageForm.sessionsPerWeek} onChange={(event) => setPackageForm({ ...packageForm, sessionsPerWeek: Number(event.target.value) })} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value={1}>1 session / week</option>
                  <option value={2}>2 sessions / week (VIP)</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Description</span>
                <textarea value={packageForm.description} onChange={(event) => setPackageForm({ ...packageForm, description: event.target.value })} className="min-h-28 w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[#EF233C]/20 bg-[#050607] p-4 text-white md:col-span-2">
                <input type="checkbox" checked={packageForm.hasPersonalTrainer} onChange={(event) => setPackageForm({ ...packageForm, hasPersonalTrainer: event.target.checked })} />
                Has personal trainer
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[#EF233C]/20 bg-[#050607] p-4 text-white md:col-span-2">
                <input type="checkbox" checked={packageForm.isPopular} onChange={(event) => setPackageForm({ ...packageForm, isPopular: event.target.checked })} />
                Mark as most popular
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {editingPackage && (
                <button
                  type="button"
                  onClick={handleDeletePackage}
                  disabled={isDeletingPackage || isSavingPackage}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EF233C]/40 px-6 py-3 font-semibold text-[#EF233C] transition-colors hover:bg-[#EF233C]/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/35"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeletingPackage ? 'Deleting...' : 'Delete'}
                </button>
              )}
              <button onClick={handleSavePackage} disabled={isSavingPackage || !packageForm.name.trim() || !packageForm.duration.trim() || !packageForm.price.trim()} className="flex-1 rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35">
                {isSavingPackage ? 'Saving...' : 'Save Package'}
              </button>
              <button onClick={closePackageModal} className="rounded-xl border border-[#EF233C]/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-[#EF233C]/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {promotionPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm" onClick={closePromotionModal}>
          <div className="w-full max-w-2xl rounded-3xl border border-[#EF233C]/30 bg-[#0c1014] p-8" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="bebas flex items-center gap-3 text-4xl tracking-wider text-white"><Tags className="h-7 w-7 text-[#EF233C]" /> ADD DISCOUNT</h2>
                <p className="mt-1 text-sm text-[#A1A1AA]">Create a promotion without changing the package base price.</p>
              </div>
              <button onClick={closePromotionModal} className="rounded-xl border border-[#EF233C]/30 p-2 text-white"><X className="h-5 w-5" /></button>
            </div>
            {promotionError && <div className="mb-4 rounded-xl border border-[#EF233C]/30 bg-[#EF233C]/10 p-3 text-sm font-bold text-white">{promotionError}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Package name</span><input readOnly value={promotionPackage.name} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white/55" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Promotion title</span><input value={promotionForm.title} onChange={(event) => setPromotionForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Description</span><textarea rows={3} value={promotionForm.description} onChange={(event) => setPromotionForm((current) => ({ ...current, description: event.target.value }))} className="w-full resize-none rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" /></label>
              <label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Discount percent</span><input type="number" min="0.01" max="100" value={promotionForm.discountPercent} onChange={(event) => setPromotionForm((current) => ({ ...current, discountPercent: event.target.value }))} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" /></label>
              <label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Status</span><select value={promotionForm.status} onChange={(event) => setPromotionForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
              <label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Start date</span><input type="date" value={promotionForm.startDate} onChange={(event) => setPromotionForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white" /></label>
              <label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">End date</span><input type="date" value={promotionForm.endDate} onChange={(event) => setPromotionForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closePromotionModal} className="rounded-xl border border-white/10 px-5 py-3 font-bold text-white">Cancel</button>
              <button onClick={handleSavePromotion} disabled={isSavingPromotion} className="rounded-xl bg-[#EF233C] px-5 py-3 font-bold text-white disabled:opacity-50">{isSavingPromotion ? 'Saving...' : 'Create Promotion'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
