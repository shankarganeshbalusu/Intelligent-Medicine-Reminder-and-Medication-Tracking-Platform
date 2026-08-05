import { useState, useEffect } from 'react';
import { Medicine, Association } from '../types';
import { medicinesService } from '../services/medicines';
import { usersService } from '../services/users';
import { authService } from '../services/auth';
import {
  Pill,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  Users,
  Edit3,
  Trash2,
  X,
  FileText
} from 'lucide-react';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTimeToShow = (timeStr: string) => {
  if (!timeStr) return '';
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${m} ${ampm}`;
};

export default function Medicines() {
  const user = authService.getCurrentUser();
  const isPatient = user?.role === 'patient';

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Association[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editMedicineId, setEditMedicineId] = useState<number | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Form states (Patients only)
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [customTimes, setCustomTimes] = useState<string[]>(['09:00']);
  const [durationDays, setDurationDays] = useState('');
  const [scheduleType, setScheduleType] = useState<'Daily' | 'Specific Days'>('Daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(weekdays);
  const [submitting, setSubmitting] = useState(false);
  const [foodRelation, setFoodRelation] = useState('No Preference');
  const [formMessage, setFormMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      if (isPatient) {
        const list = await medicinesService.getMedicines();
        setMedicines(list);
      } else {
        const associations = await usersService.getAssociations();
        const activeLinks = associations.filter(a => a.status === 'active');
        setPatients(activeLinks);
        
        if (activeLinks.length > 0) {
          setSelectedPatientId(activeLinks[0].patient_id);
          const list = await medicinesService.getMedicines(activeLinks[0].patient_id);
          setMedicines(list);
        }
      }
    } catch (err) {
      console.error('Failed to load medicines data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientChange = async (patientId: number) => {
    setSelectedPatientId(patientId);
    try {
      setLoading(true);
      const list = await medicinesService.getMedicines(patientId);
      setMedicines(list);
    } catch (err) {
      console.error('Failed to fetch patient medicines', err);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimesPerDayChange = (val: number) => {
    setTimesPerDay(val);
    // Auto populate custom times depending on the times per day
    const defaults: { [key: number]: string[] } = {
      1: ['09:00'],
      2: ['09:00', '21:00'],
      3: ['09:00', '14:00', '21:00'],
      4: ['09:00', '13:00', '18:00', '22:00']
    };
    setCustomTimes(defaults[val] || ['09:00']);
  };

  const handlePrescriptionOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setFormMessage({ text: '', type: '' });
    try {
      const data = await medicinesService.uploadPrescriptionOCR(file);
      const firstMed = data.medicines?.[0];
      if (!firstMed) throw new Error("No medicines found in the scanned prescription.");

      setName(firstMed.name || '');
      setDosage(firstMed.dosage || '');
      setQuantity((firstMed.quantity || '').toString());
      setTimesPerDay(firstMed.times_per_day || 1);
      setDurationDays((firstMed.duration_days || '').toString());
      setFoodRelation(firstMed.food_relation || 'No Preference');
      if (firstMed.custom_times) {
        setCustomTimes(firstMed.custom_times.split(','));
      }
      if (firstMed.days_of_week && firstMed.days_of_week !== 'Daily') {
        setScheduleType('Specific Days');
        setSelectedDays(firstMed.days_of_week.split(','));
      } else {
        setScheduleType('Daily');
        setSelectedDays(weekdays);
      }
      setFormMessage({
        text: `AI parsed successfully! Prefilled form with '${firstMed.name}'. You can scan and import all medicines at once on the dedicated Prescription OCR page.`,
        type: 'success'
      });
    } catch (err: any) {
      setFormMessage({
        text: err.response?.data?.detail || 'Failed to process prescription with AI. Please fill manually.',
        type: 'error'
      });
    } finally {
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const handleTimeChange = (idx: number, val: string) => {
    const updated = [...customTimes];
    updated[idx] = val;
    setCustomTimes(updated);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleDeleteMedicine = async (medId: number) => {
    if (window.confirm('Are you sure you want to delete this medication? This will also delete all its compliance logs.')) {
      try {
        await medicinesService.deleteMedicine(medId);
        const list = await medicinesService.getMedicines();
        setMedicines(list);
      } catch (err) {
        console.error('Failed to delete medicine', err);
      }
    }
  };

  const startEditMedicine = (med: Medicine) => {
    setIsEditing(true);
    setEditMedicineId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setQuantity(med.quantity.toString());
    setTimesPerDay(med.times_per_day);
    setFoodRelation(med.food_relation || 'No Preference');
    if (med.custom_times) {
      setCustomTimes(med.custom_times.split(','));
    } else {
      const defaults = ['09:00', '21:00', '14:00', '18:00'];
      setCustomTimes(defaults.slice(0, med.times_per_day));
    }
    setDurationDays(med.duration_days.toString());
    if (med.days_of_week && med.days_of_week !== 'Daily') {
      setScheduleType('Specific Days');
      setSelectedDays(med.days_of_week.split(','));
    } else {
      setScheduleType('Daily');
      setSelectedDays(weekdays);
    }
    setFormMessage({ text: '', type: '' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditMedicineId(null);
    setName('');
    setDosage('');
    setQuantity('');
    setTimesPerDay(1);
    setCustomTimes(['09:00']);
    setDurationDays('');
    setScheduleType('Daily');
    setSelectedDays(weekdays);
    setFoodRelation('No Preference');
    setFormMessage({ text: '', type: '' });
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPatient) return;
    setSubmitting(true);
    setFormMessage({ text: '', type: '' });

    // Validate duplicate custom times
    const uniqueTimes = new Set(customTimes.map(t => t.trim()));
    if (uniqueTimes.size !== customTimes.length) {
      setFormMessage({
        text: 'Duplicate dose timings are not allowed. Please set a different time for each dose.',
        type: 'error'
      });
      setSubmitting(false);
      return;
    }

    const payload = {
      name,
      dosage,
      quantity: parseInt(quantity),
      times_per_day: timesPerDay,
      duration_days: parseInt(durationDays),
      custom_times: customTimes.join(','),
      days_of_week: scheduleType === 'Daily' ? 'Daily' : selectedDays.join(','),
      food_relation: foodRelation
    };

    try {
      if (isEditing && editMedicineId !== null) {
        await medicinesService.updateMedicine(editMedicineId, payload);
        setFormMessage({ text: 'Medicine updated successfully and reminders rescheduled!', type: 'success' });
        cancelEdit();
      } else {
        await medicinesService.createMedicine(payload);
        setFormMessage({ text: 'Medicine added successfully and reminder slots generated!', type: 'success' });
        
        setName('');
        setDosage('');
        setQuantity('');
        setTimesPerDay(1);
        setCustomTimes(['09:00']);
        setDurationDays('');
        setScheduleType('Daily');
        setSelectedDays(weekdays);
        setFoodRelation('No Preference');
      }

      const list = await medicinesService.getMedicines();
      setMedicines(list);
    } catch (err: any) {
      setFormMessage({
        text: err.response?.data?.detail || 'Failed to submit medicine form.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-brand-500" />
            Medicine Cabinet
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isPatient
              ? 'Manage your medication schedule and track inventory levels.'
              : "Monitor your linked patients' medicine cabinets."}
          </p>
        </div>

        {/* Caregiver Patient Dropdown selection */}
        {!isPatient && patients.length > 0 && (
          <div className="flex items-center gap-2">
            <ListFilter className="h-4.5 w-4.5 text-slate-400" />
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(parseInt(e.target.value))}
              className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-700 font-medium"
            >
              {patients.map(p => (
                <option key={p.id} value={p.patient_id}>
                  {p.patient_name} ({p.patient_email})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-4">Syncing inventory data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form to Add/Edit Medicine (Patients Only) */}
          {isPatient && (
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-xl shadow-slate-100/40 space-y-5 sticky top-24">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-brand-500" />
                    {isEditing ? 'Edit Medication' : 'Add Medication'}
                  </h3>
                  {isEditing && (
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      title="Cancel Edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {formMessage.text && (
                  <div className={`p-3.5 rounded-xl border text-sm flex gap-2.5 ${
                    formMessage.type === 'success'
                      ? 'bg-green-50 border-green-100 text-green-700'
                      : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    {formMessage.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0" />
                    )}
                    <span>{formMessage.text}</span>
                  </div>
                )}

                {/* AI Prescription Upload scanner */}
                {isPatient && !isEditing && (
                  <div className="mb-4 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner mt-4">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500/5 font-black text-6xl pointer-events-none select-none">AI OCR</span>
                    <FileText className="h-8 w-8 text-brand-500 mb-2 animate-pulse" />
                    <h4 className="text-xs font-bold text-slate-800">Scan Prescription with AI</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 mb-3 max-w-[240px]">
                      Upload your prescription file or photo. Our AI will automatically extract details and fill out the form!
                    </p>
                    
                    <label className="relative cursor-pointer py-2 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-100/50 flex items-center gap-1.5 cursor-pointer">
                      {ocrLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>AI is parsing...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-3.5 w-3.5" />
                          <span>Select Image / PDF</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        disabled={ocrLoading}
                        onChange={handlePrescriptionOCRUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metformin"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage strength</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500mg or 1 tablet"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 60"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Days)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 30"
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Frequency</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => { setScheduleType('Daily'); setSelectedDays(weekdays); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          scheduleType === 'Daily'
                            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleType('Specific Days')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          scheduleType === 'Specific Days'
                            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Specific Days
                      </button>
                    </div>

                    {scheduleType === 'Specific Days' && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {weekdays.map((day) => {
                          const isSelected = selectedDays.includes(day);
                          const shortName = day.substring(0, 3);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                                  : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {shortName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Doses per Day</label>
                    <select
                      value={timesPerDay}
                      onChange={(e) => handleTimesPerDayChange(parseInt(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-700"
                    >
                      <option value={1}>1 time daily</option>
                      <option value={2}>2 times daily</option>
                      <option value={3}>3 times daily</option>
                      <option value={4}>4 times daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Food Relation</label>
                    <select
                      value={foodRelation}
                      onChange={(e) => setFoodRelation(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-750"
                    >
                      <option value="No Preference">No Preference</option>
                      <option value="Before Food">Before Food</option>
                      <option value="After Food">After Food</option>
                      <option value="At Night">At Night</option>
                    </select>

                    <div className="mt-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Manually Edit Dose Timings</span>
                      <div className="grid grid-cols-2 gap-2">
                        {customTimes.map((time, idx) => (
                          <div key={idx} className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">Dose {idx + 1}</span>
                            <input
                              type="time"
                              required
                              value={time}
                              onChange={(e) => handleTimeChange(idx, e.target.value)}
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isEditing ? 'Save Changes' : 'Confirm & Schedule'}
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Right Column: Medicines Inventory List */}
          <div className={isPatient ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
            {!isPatient && patients.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No linked patients</p>
                <p className="text-xs text-slate-400 mt-1">Accept client connections in the profile to see their cabinets.</p>
              </div>
            ) : medicines.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Pill className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No medications logged</p>
                <p className="text-xs text-slate-400 mt-1">
                  {isPatient
                    ? 'Start by inputting your first prescription details.'
                    : 'The patient has not added any medications yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicines.map((med) => (
                  <div key={med.id} className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-xl shadow-slate-100/40 flex flex-col justify-between gap-4 hover:shadow-2xl hover:border-white transition-all duration-200">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                          <Pill className="h-5 w-5" />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            med.quantity > 10
                              ? 'bg-green-50 border-green-100 text-green-700'
                              : med.quantity > 0
                              ? 'bg-amber-50 border-amber-100 text-amber-700'
                              : 'bg-red-50 border-red-100 text-red-700'
                          }`}>
                            {med.quantity} remaining
                          </span>

                          {isPatient && (
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                              <button
                                onClick={() => startEditMedicine(med)}
                                className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-all"
                                title="Edit Medication"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(med.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                title="Delete Medication"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h4 className="text-base font-bold text-slate-800 mt-3">{med.name}</h4>
                      <p className="text-slate-400 text-xs mt-0.5">Strength: {med.dosage}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          med.food_relation?.toLowerCase().includes('before')
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : med.food_relation?.toLowerCase().includes('night')
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            : 'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          {med.food_relation || 'No Preference'}
                        </span>
                      </div>
                      
                      {med.days_of_week && med.days_of_week !== 'Daily' && (
                        <p className="text-brand-600 text-[10px] font-bold mt-2 uppercase tracking-wider">
                          Days: {med.days_of_week.split(',').map(d => d.substring(0,3)).join(', ')}
                        </p>
                      )}
                      {med.custom_times && (
                        <p className="text-slate-500 text-[10px] font-semibold mt-1">
                          Timings: {med.custom_times.split(',').map(formatTimeToShow).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{med.duration_days} days schedule</span>
                      </div>
                      <div className="text-right font-medium text-slate-700 capitalize">
                        {med.days_of_week && med.days_of_week !== 'Daily' ? 'Weekly' : 'Daily'} ({med.times_per_day}x)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
