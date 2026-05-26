import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchTrainersFromSupabase } from '../../../services/trainerApi';
import { createStaffMember } from '../../../services/staffOperationsApi';

interface MemberDTO {
  fullName: string;
  phoneNumber: string;
  idCard: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  note: string;
  trainerId?: string;
}

export function AddMemberUI() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MemberDTO>({
    fullName: '',
    phoneNumber: '',
    idCard: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    note: '',
    trainerId: ''
  });

  const [errors, setErrors] = useState<Partial<MemberDTO>>({});
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loadMessage, setLoadMessage] = useState('');
  const availableTrainers = trainers.filter((trainer: any) => trainer.currentActiveMembers < trainer.maxActiveMembers);
  const selectedTrainer = trainers.find((trainer: any) => trainer.id === formData.trainerId);
  const selectedTrainerIsFull = Boolean(selectedTrainer && selectedTrainer.currentActiveMembers >= selectedTrainer.maxActiveMembers);

  useEffect(() => {
    let isMounted = true;
    fetchTrainersFromSupabase().then(({ data, error }) => {
      if (!isMounted) return;
      setTrainers(data);
      setLoadMessage(error ? 'Trainer data could not be loaded.' : '');
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<MemberDTO> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (!formData.idCard.trim()) {
      newErrors.idCard = 'Citizen ID is required';
    } else if (!/^[0-9]{12}$/.test(formData.idCard)) {
      newErrors.idCard = 'Citizen ID must be 12 digits';
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
    const result = await createStaffMember(formData);
    setLoading(false);
    if (!result.ok) {
      setDuplicateWarning(result.message);
      return;
    }
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigate('/staff/members');
      }, 2000);
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
              {loadMessage && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
                  {loadMessage}
                </div>
              )}
              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="bg-destructive/10 border-2 border-destructive rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4 fade-in">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-destructive text-lg">Duplicate Member Detected</p>
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
                    Citizen ID <span className="text-primary">*</span>
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

              {/* Medical Note */}
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">
                  Trainer Assignment
                </label>
                <select
                  value={formData.trainerId}
                  onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
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
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">
                  Medical Note
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-input px-6 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium min-h-[120px]"
                  placeholder="Any medical conditions, injuries, or special notes..."
                />
              </div>

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
                <p className="text-4xl font-black text-primary">M{Math.floor(Math.random() * 100000).toString().padStart(5, '0')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
