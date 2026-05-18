import { useEffect, useMemo, useState } from 'react';
import { Check, CreditCard, Wallet, Smartphone, Building, Download, Printer, Mail, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { createPackageInSupabase, fetchPackagesFromSupabase } from '../../../services/packageApi';

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
};

const initialPackages: GymPackage[] = [
  {
    id: 1,
    name: 'Basic 3 Months',
    type: 'Basic',
    price: '2,500,000',
    duration: '3 months',
    description: 'Entry package for regular gym access.',
    status: 'Active',
    sessionLimit: 'Unlimited gym access',
    hasPersonalTrainer: false,
    features: ['Unlimited training access', 'Personal locker', 'Free Wi-Fi'],
    popular: false,
  },
  {
    id: 2,
    name: 'Premium 6 Months',
    type: 'VIP',
    price: '4,500,000',
    duration: '6 months',
    description: 'Popular membership with PT trial sessions.',
    status: 'Active',
    sessionLimit: 'Unlimited gym access',
    hasPersonalTrainer: true,
    features: ['Unlimited training access', 'Personal locker', 'Free Wi-Fi', '2 PT sessions included'],
    popular: true,
  },
  {
    id: 3,
    name: 'VIP Elite 12 Months',
    type: 'VIP',
    price: '8,000,000',
    duration: '12 months',
    description: 'Premium annual package for high-value members.',
    status: 'Active',
    sessionLimit: 'Unlimited gym access',
    hasPersonalTrainer: true,
    features: ['Unlimited training access', 'VIP locker', 'Free Wi-Fi', '5 PT sessions included', 'Private training room'],
    popular: false,
  },
  {
    id: 4,
    name: 'PT Elite',
    type: 'PT',
    price: '12,000,000',
    duration: '12 months',
    description: 'Personal training focused package.',
    status: 'Inactive',
    sessionLimit: '20 PT sessions',
    hasPersonalTrainer: true,
    features: ['VIP benefits', '20 PT sessions', 'Custom workout plan', 'Nutrition consultation'],
    popular: false,
  },
];

const emptyPackageForm = {
  name: '',
  type: 'Basic' as PackageType,
  duration: '',
  price: '',
  description: '',
  status: 'Active' as PackageStatus,
  sessionLimit: '',
  hasPersonalTrainer: false,
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
  };
}

export default function PackagesPayments() {
  const [packages, setPackages] = useState<GymPackage[]>(initialPackages);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packageLoadMessage, setPackageLoadMessage] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<GymPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchPackagesFromSupabase()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          setPackages(initialPackages);
          setPackageLoadMessage('Packages could not be loaded from Supabase. Showing demo packages instead.');
        } else if (!data.length) {
          setPackages(initialPackages);
          setPackageLoadMessage('No Supabase packages were returned. Showing demo packages instead.');
        } else {
          setPackages(data.map(mapSupabasePackageToAdminPackage));
          setPackageLoadMessage('');
        }

        setIsLoadingPackages(false);
      })
      .catch((error) => {
        console.error('[Gymster Supabase] Failed to load admin packages:', error);

        if (!isMounted) return;
        setPackages(initialPackages);
        setPackageLoadMessage('Packages could not be loaded from Supabase. Showing demo packages instead.');
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

  const handleSelectPackage = (pkg: GymPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    setShowPaymentModal(false);
    setShowReceipt(true);
  };

  const handleAddPackage = async () => {
    if (!packageForm.name.trim() || !packageForm.duration.trim() || !packageForm.price.trim()) return;

    setIsSavingPackage(true);
    const { data, error } = await createPackageInSupabase(packageForm);
    setIsSavingPackage(false);

    if (!error && data) {
      setPackages((current) => [mapSupabasePackageToAdminPackage(data), ...current]);
      setPackageForm(emptyPackageForm);
      setShowPackageModal(false);
      setPackageLoadMessage('');
      return;
    }

    const nextPackage: GymPackage = {
      id: Date.now(),
      ...packageForm,
      features: [
        packageForm.description || 'Custom package benefits',
        packageForm.sessionLimit || 'Session limit configured',
        packageForm.hasPersonalTrainer ? 'Personal trainer included' : 'Self-service training',
      ],
      popular: false,
    };

    setPackages((current) => [nextPackage, ...current]);
    setPackageLoadMessage('Package could not be saved to Supabase. It was added to the current demo view only.');
    setPackageForm(emptyPackageForm);
    setShowPackageModal(false);
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="bebas mb-2 text-5xl tracking-wider text-white">PACKAGES & PAYMENTS</h1>
          <p className="text-[#A1A1AA]">Manage membership packages, availability, and payment preview flows.</p>
        </div>
        <button
          onClick={() => setShowPackageModal(true)}
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
          Loading packages from Supabase...
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
              onClick={() => handleSelectPackage(pkg)}
              className="w-full rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000]"
            >
              Select Package
            </button>
          </motion.div>
          ))}
        </div>
      )}

      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm" onClick={() => setShowPackageModal(false)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#EF233C]/30 bg-[#0c1014] p-8" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="bebas text-4xl tracking-wider text-white">ADD PACKAGE</h2>
                <p className="text-sm text-[#A1A1AA]">Create a new package option for Gymster members.</p>
              </div>
              <button onClick={() => setShowPackageModal(false)} className="rounded-xl border border-[#EF233C]/30 p-2 text-white hover:bg-[#EF233C]/10">
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
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">Description</span>
                <textarea value={packageForm.description} onChange={(event) => setPackageForm({ ...packageForm, description: event.target.value })} className="min-h-28 w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[#EF233C]/20 bg-[#050607] p-4 text-white md:col-span-2">
                <input type="checkbox" checked={packageForm.hasPersonalTrainer} onChange={(event) => setPackageForm({ ...packageForm, hasPersonalTrainer: event.target.checked })} />
                Has personal trainer
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleAddPackage} disabled={isSavingPackage || !packageForm.name.trim() || !packageForm.duration.trim() || !packageForm.price.trim()} className="flex-1 rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35">
                {isSavingPackage ? 'Saving...' : 'Save Package'}
              </button>
              <button onClick={() => setShowPackageModal(false)} className="rounded-xl border border-[#EF233C]/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-[#EF233C]/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}>
          <div className="w-full max-w-2xl rounded-3xl border border-[#EF233C]/30 bg-[#0c1014] p-8" onClick={(event) => event.stopPropagation()}>
            <h2 className="bebas mb-6 text-4xl tracking-wider text-white">PAYMENT</h2>

            <div className="mb-6 rounded-xl border border-[#EF233C]/20 bg-[#050607] p-6">
              <h3 className="mb-2 text-xl font-bold text-white">{selectedPackage.name}</h3>
              <p className="text-3xl font-bold text-[#EF233C]">{selectedPackage.price} VND</p>
            </div>

            <div className="mb-6">
              <h4 className="mb-4 font-bold text-white">Select Payment Method</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'cash', name: 'Cash', icon: Wallet },
                  { id: 'bank', name: 'Bank Transfer', icon: Building },
                  { id: 'card', name: 'Credit Card', icon: CreditCard },
                  { id: 'wallet', name: 'E-Wallet', icon: Smartphone },
                ].map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      paymentMethod === id ? 'border-[#EF233C] bg-[#EF233C] text-white' : 'border-[#EF233C]/30 bg-[#050607] text-[#A1A1AA]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'bank' && (
              <div className="mb-6 rounded-xl border border-[#EF233C]/20 bg-[#050607] p-6">
                <div className="flex items-center gap-6">
                  <div className="h-32 w-32 rounded-xl bg-white p-2">
                    <div className="flex h-full w-full items-center justify-center bg-[#0c1014] text-xs text-white">QR CODE</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-white"><span className="text-[#A1A1AA]">Bank:</span> Vietcombank</p>
                    <p className="text-white"><span className="text-[#A1A1AA]">Account number:</span> 0123456789</p>
                    <p className="text-white"><span className="text-[#A1A1AA]">Account name:</span> GYMSTER FITNESS CENTER</p>
                    <p className="text-white"><span className="text-[#A1A1AA]">Transfer note:</span> PAYMENT {selectedPackage.id}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handlePayment} className="flex-1 rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000]">
                Confirm Payment
              </button>
              <button onClick={() => setShowPaymentModal(false)} className="rounded-xl bg-[#050607] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0c1014]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm" onClick={() => setShowReceipt(false)}>
          <div className="w-full max-w-lg rounded-3xl border border-[#EF233C]/30 bg-[#0c1014] p-8" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10">
                <Check className="h-10 w-10 text-[#22C55E]" />
              </div>
              <h2 className="bebas mb-2 text-4xl tracking-wider text-white">PAYMENT SUCCESSFUL</h2>
              <p className="text-[#A1A1AA]">Receipt code: #RC-2026-{Math.floor(Math.random() * 1000)}</p>
            </div>

            <div className="mb-6 space-y-3 rounded-xl border border-[#EF233C]/20 bg-[#050607] p-6">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Package:</span>
                <span className="font-semibold text-white">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Duration:</span>
                <span className="font-semibold text-white">{selectedPackage.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Amount:</span>
                <span className="text-xl font-bold text-[#EF233C]">{selectedPackage.price} VND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Payment date:</span>
                <span className="font-semibold text-white">May 16, 2026</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#EF233C] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#990000]">
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#EF233C]/30 bg-[#0c1014] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#EF233C]/10">
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button className="rounded-xl border border-[#EF233C]/30 bg-[#0c1014] px-4 py-3 text-white transition-colors hover:bg-[#EF233C]/10">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
