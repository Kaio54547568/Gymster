import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchTrainersFromApi } from '../../../services/trainerApi';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import { getTrainerWeeklyAvailability } from '../../../services/trainerAvailabilityApi';
import { createStaffMember } from '../../../services/staffOperationsApi';
import { validateAddMemberAccount } from './addMemberForm';

interface MemberDTO {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  idCard: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
  memberCode: string;
  packageId?: string;
  trainerId?: string;
  weeklySlots?: any[];
}

export function AddMemberUI() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MemberDTO>({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    idCard: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    occupation: '',
    memberCode: '',
    packageId: '',
    trainerId: '',
    weeklySlots: []
  });

  const [errors, setErrors] = useState<Partial<MemberDTO>>({});
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdMember, setCreatedMember] = useState<any>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [packageLoadError, setPackageLoadError] = useState('');
  const [trainerLoadError, setTrainerLoadError] = useState('');
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(false);
  const [availability, setAvailability] = useState<any[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const availableTrainers = trainers.filter((trainer: any) => trainer.currentActiveMembers < trainer.maxActiveMembers);
  const selectedTrainer = trainers.find((trainer: any) => trainer.id === formData.trainerId);
  const selectedTrainerIsFull = Boolean(selectedTrainer && selectedTrainer.currentActiveMembers >= selectedTrainer.maxActiveMembers);

  const selectedPackage = packages.find(p => p.id === formData.packageId);
  const showTrainerAssignment = Boolean(selectedPackage && selectedPackage.hasPersonalTrainer);
  const sessionsPerWeek = selectedPackage?.sessionsPerWeek || 1;

  const isScheduleValid = useMemo(() => {
    if (sessionsPerWeek === 2) {
      if (formData.weeklySlots?.length !== 2) return false;
      const dayOfWeekMap: Record<string, number> = {
        monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
        friday: 5, saturday: 6, sunday: 0,
      };
      const day1 = dayOfWeekMap[formData.weeklySlots[0].dayKey.toLowerCase()];
      const day2 = dayOfWeekMap[formData.weeklySlots[1].dayKey.toLowerCase()];
      if (day1 === undefined || day2 === undefined) return false;
      const diff = Math.abs(day1 - day2);
      return day1 !== day2 && diff !== 1 && diff !== 6;
    }
    return formData.weeklySlots?.length === 1;
  }, [formData.weeklySlots, sessionsPerWeek]);

  const loadReferenceData = useCallback(async () => {
    setIsLoadingReferenceData(true);
    setPackageLoadError('');
    setTrainerLoadError('');

    const [trainerResult, packageResult] = await Promise.allSettled([
      fetchTrainersFromApi(),
      fetchPackagesFromSupabase(),
    ]);
    const trainersRes = trainerResult.status === 'fulfilled'
      ? trainerResult.value
      : { data: [], error: trainerResult.reason };
    const packagesRes = packageResult.status === 'fulfilled'
      ? packageResult.value
      : { data: [], error: packageResult.reason };

    setTrainers(trainersRes.data || []);
    setPackages(packagesRes.data || []);

    const describeError = (error: any, fallback: string) => {
      if (error?.code === 'BACKEND_UNAVAILABLE' || /failed to fetch|api request failed/i.test(error?.message || '')) {
        return 'Backend is unavailable. Start the API server on port 3001, then retry.';
      }
      if (error?.status === 401) return 'Your session has expired. Please sign in again.';
      if (error?.status === 403) return 'You do not have permission to load this data.';
      return fallback;
    };

    if (packagesRes.error) setPackageLoadError(describeError(packagesRes.error, 'Package list could not be loaded.'));
    if (trainersRes.error) setTrainerLoadError(describeError(trainersRes.error, 'Trainer list could not be loaded.'));
    setIsLoadingReferenceData(false);
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    if (!showTrainerAssignment && formData.trainerId) {
      setFormData(prev => ({ ...prev, trainerId: '', weeklySlots: [] }));
    }
  }, [showTrainerAssignment, formData.trainerId]);

  useEffect(() => {
    let isMounted = true;
    if (!formData.trainerId) {
      setAvailability([]);
      setFormData(prev => ({ ...prev, weeklySlots: [] }));
      return;
    }

    setIsLoadingAvailability(true);
    getTrainerWeeklyAvailability(formData.trainerId).then(({ data }) => {
      if (!isMounted) return;
      setAvailability(data || []);
      setIsLoadingAvailability(false);
    }).catch(() => {
      if (!isMounted) return;
      setAvailability([]);
      setIsLoadingAvailability(false);
    });

    return () => { isMounted = false; };
  }, [formData.trainerId]);

  const chooseSlot = (day: any, slot: any) => {
    if (!slot.available) return;
    const newSlot = {
      dayKey: day.key,
      dayLabel: day.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `${day.label}, ${slot.label}`,
    };

    const currentSlots = formData.weeklySlots || [];

    if (sessionsPerWeek === 2) {
      const exists = currentSlots.some(s => s.dayKey === day.key && s.startTime === slot.startTime);
      let nextSlots;
      if (exists) {
        nextSlots = currentSlots.filter(s => !(s.dayKey === day.key && s.startTime === slot.startTime));
      } else {
        if (currentSlots.length < 2) {
          nextSlots = [...currentSlots, newSlot];
        } else {
          nextSlots = [currentSlots[1], newSlot];
        }
      }
      setFormData({ ...formData, weeklySlots: nextSlots });
    } else {
      setFormData({ ...formData, weeklySlots: [newSlot] });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<MemberDTO> = validateAddMemberAccount(formData);

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (formData.idCard.trim() && !/^[0-9]{12}$/.test(formData.idCard)) {
      newErrors.idCard = 'Citizen ID must be 12 digits if provided';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.dateOfBirth = 'Member must be between 16 and 100 years old';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Also validate if slots are chosen if PT is assigned
    if (showTrainerAssignment) {
      if (!formData.trainerId) {
        newErrors.trainerId = 'Trainer must be selected';
      }
      if (!isScheduleValid) {
        newErrors.weeklySlots = 'Valid weekly slots must be selected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateWarning('');

    if (!validateForm()) {
      return;
    }

    if (selectedTrainerIsFull) {
      setDuplicateWarning('This trainer is currently full.');
      return;
    }

    setLoading(true);
    try {
      const result = await createStaffMember(formData);
      if (!result.ok) {
        setDuplicateWarning(result.message);
        return;
      }
      setCreatedMember(result.data || null);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigate('/staff/members');
      }, 2000);
    } catch (error) {
      setDuplicateWarning(error instanceof Error ? error.message : 'Could not create member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/staff/dashboard');
  };

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBkdW1iYmVsbCUyMHRyYWluaW5nfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Member Registration"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div>
              <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">MEMBER OPERATIONS</p>
              <h1 className="text-6xl font-black tracking-tight mb-4">
                <span className="text-primary">ADD</span>
                <br />
                <span className="text-white">MEMBER</span>
              </h1>
              <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                Create a member profile, track registration details, and keep member access ready for package workflows.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Form Card */}
          <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-destructive/10 rounded-full blur-3xl"></div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              {(packageLoadError || trainerLoadError) && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
                  {packageLoadError ? <p>{packageLoadError}</p> : null}
                  {trainerLoadError ? <p>{trainerLoadError}</p> : null}
                  <button
                    type="button"
                    onClick={loadReferenceData}
                    disabled={isLoadingReferenceData}
                    className="mt-3 rounded-lg border border-destructive/40 px-4 py-2 text-xs font-black uppercase tracking-wide hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {isLoadingReferenceData ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              )}
              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="bg-destructive/10 border-2 border-destructive rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4 fade-in">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-destructive text-lg">Could not create member</p>
                    <p className="text-sm text-destructive/80 mt-1">{duplicateWarning}</p>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full bg-input px-6 py-4 rounded-xl border-2 ${errors.fullName ? 'border-destructive' : 'border-border'} focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg`}
                  placeholder="Nguyen Van A"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive mt-2 font-medium">{errors.fullName}</p>
                )}
              </div>

              {/* Login Email & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full bg-input px-6 py-4 rounded-xl border-2 ${errors.email ? 'border-destructive' : 'border-border'} focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg`}
                    placeholder="member@example.com"
                    autoComplete="off"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-2 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Password <span className="text-muted-foreground/70">(Optional)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full bg-input px-6 py-4 rounded-xl border-2 ${errors.password ? 'border-destructive' : 'border-border'} focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg`}
                    placeholder="Defaults to Member@123"
                    autoComplete="new-password"
                  />
                  {errors.password ? (
                    <p className="text-sm text-destructive mt-2 font-medium">{errors.password}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">Leave empty to use Member@123.</p>
                  )}
                </div>
              </div>

              {/* Phone & Citizen ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Phone Number <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`w-full bg-input px-6 py-4 rounded-xl border-2 ${errors.phoneNumber ? 'border-destructive' : 'border-border'} focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg`}
                    placeholder="0912345678"
                    maxLength={10}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive mt-2 font-medium">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Citizen ID
                  </label>
                  <input
                    type="text"
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    className={`w-full bg-input px-6 py-4 rounded-xl border-2 ${errors.idCard ? 'border-destructive' : 'border-border'} focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg`}
                    placeholder="001234567890"
                    maxLength={12}
                  />
                  {errors.idCard && (
                    <p className="text-sm text-destructive mt-2 font-medium">{errors.idCard}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Date of Birth <span className="text-primary">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className={`w-full bg-input px-6 py-4 rounded-xl border-2 ${errors.dateOfBirth ? 'border-destructive' : 'border-border'} focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive mt-2 font-medium">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Gender <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-input px-6 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">
                  Address <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full bg-input px-6 py-4 rounded-xl border-2 ${errors.address ? 'border-destructive' : 'border-border'} focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg`}
                  placeholder="123 Main Street"
                />
                {errors.address && (
                  <p className="text-sm text-destructive mt-2 font-medium">{errors.address}</p>
                )}
              </div>

              {/* Occupation & Member Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full bg-input px-6 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg"
                    placeholder="Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Member Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.memberCode}
                    onChange={(e) => setFormData({ ...formData, memberCode: e.target.value.toUpperCase() })}
                    className="w-full bg-input px-6 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg"
                    placeholder="MB-000001"
                  />
                </div>
              </div>

              {/* Package Selection */}
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">
                  Package Selection (Optional)
                </label>
                <select
                  value={formData.packageId || ''}
                  onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                  disabled={isLoadingReferenceData || Boolean(packageLoadError)}
                  className="w-full bg-input px-6 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg"
                >
                  <option value="">{isLoadingReferenceData ? 'Loading packages...' : 'Select a package...'}</option>
                  {packages.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id} disabled={Boolean(pkg.hasPersonalTrainer && trainerLoadError)}>
                      {pkg.name} - {pkg.durationText}{pkg.hasPersonalTrainer && trainerLoadError ? ' (trainers unavailable)' : ''}
                    </option>
                  ))}
                </select>
                {trainerLoadError ? (
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    Non-PT packages remain available. PT packages require the trainer list to load successfully.
                  </p>
                ) : null}
              </div>

              {/* Trainer Assignment */}
              {showTrainerAssignment && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">
                    Trainer Assignment
                  </label>
                  <select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    disabled={Boolean(trainerLoadError)}
                    className="w-full bg-input px-6 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg"
                  >
                    <option value="">Select available trainer...</option>
                    {availableTrainers.map((trainer: any) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name} - {trainer.currentActiveMembers}/{trainer.maxActiveMembers} active members
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {trainers.map((trainer: any) => {
                      const full = trainer.currentActiveMembers >= trainer.maxActiveMembers;
                      return (
                        <div key={trainer.id} className="rounded-xl border border-border bg-input/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold">{trainer.name}</span>
                            <span className={`text-xs font-bold ${full ? 'text-destructive' : 'text-primary'}`}>{full ? 'Full' : 'Available'}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{trainer.currentActiveMembers}/{trainer.maxActiveMembers} active members</p>
                          {full && <p className="mt-2 text-xs font-bold text-destructive">This trainer is currently full.</p>}
                        </div>
                      );
                    })}
                  </div>

                  {formData.trainerId && (
                    <div className="mt-6 rounded-2xl border border-border bg-input p-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-black text-white">Weekly available slots</h3>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">Booked slots are hidden from selection.</p>
                      </div>

                      {isLoadingAvailability ? (
                        <div className="rounded-xl border border-border bg-background p-6 text-center text-sm font-bold text-muted-foreground">Loading PT schedule...</div>
                      ) : !availability.length ? (
                        <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-6 text-center text-sm font-bold text-destructive">
                          No weekly slots are available for this PT. Please choose another PT.
                        </div>
                      ) : (
                        <div className="grid gap-3 lg:grid-cols-7">
                          {availability.map((day) => (
                            <div key={day.key} className="rounded-xl border border-border bg-background p-3">
                              <div className="mb-3 text-center text-sm font-black text-foreground">{day.shortLabel}</div>
                              <div className="grid gap-2">
                                {day.slots.map((slot: any) => {
                                  const currentSlots = formData.weeklySlots || [];
                                  const isSelected = sessionsPerWeek === 2
                                    ? currentSlots.some(s => s.dayKey === day.key && s.startTime === slot.startTime)
                                    : currentSlots[0]?.dayKey === day.key && currentSlots[0]?.startTime === slot.startTime;

                                  return (
                                    <button
                                      key={`${day.key}-${slot.label}`}
                                      type="button"
                                      disabled={!slot.available}
                                      onClick={(e) => { e.preventDefault(); chooseSlot(day, slot); }}
                                      className={`rounded-lg border px-2 py-2 text-xs font-black transition ${
                                        isSelected
                                          ? 'border-primary bg-primary text-white'
                                          : slot.available
                                            ? 'border-border/50 bg-input hover:border-primary/50'
                                            : 'cursor-not-allowed border-border/20 bg-background/50 text-muted-foreground line-through'
                                      }`}
                                    >
                                      {slot.startTime}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {sessionsPerWeek === 2 && formData.weeklySlots?.length === 2 && !isScheduleValid && (
                        <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm font-bold text-destructive">
                          Please select 2 sessions on non-consecutive days.
                        </div>
                      )}
                      {sessionsPerWeek === 2 && (formData.weeklySlots?.length || 0) < 2 && (
                        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm font-bold text-primary">
                          Please select {2 - (formData.weeklySlots?.length || 0)} more session(s).
                        </div>
                      )}
                      {sessionsPerWeek === 1 && (formData.weeklySlots?.length || 0) === 0 && (
                        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm font-bold text-primary">
                          Please select 1 session.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-destructive text-white px-8 py-5 rounded-2xl font-black text-lg hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    'Save Information'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-10 py-5 rounded-2xl font-bold text-lg border-2 border-border hover:bg-secondary transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-card/90 border-2 border-primary rounded-3xl p-10 max-w-md w-full mx-4 shadow-[0_0_60px_rgba(255,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-destructive rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,0,0,0.8)] animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-black mb-3">Success!</h3>
              <p className="text-muted-foreground text-lg mb-6">Member added to the system</p>
              <div className="bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-2xl p-6 border border-primary/30 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground mb-2">New Member ID</p>
                <p className="text-4xl font-black text-primary">{createdMember?.memberCode || 'MB-NEW'}</p>
                {createdMember?.credentials ? (
                  <div className="mt-4 space-y-1 text-left text-sm text-white/80">
                    <p><span className="font-bold text-white">Login email:</span> {createdMember.credentials.email}</p>
                    <p><span className="font-bold text-white">Username:</span> {createdMember.credentials.username}</p>
                    <p><span className="font-bold text-white">Temporary password:</span> {createdMember.credentials.password}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
