import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Check, 
  ClipboardList, 
  Sparkles, 
  Clock,
  Edit3,
  Trash2,
  Save,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { medicinesService } from '../services/medicines';

interface ExtractedMedicine {
  name: string;
  generic_name?: string;
  dosage: string;
  quantity: number;
  times_per_day: number;
  duration_days: number;
  custom_times: string;
  days_of_week: string;
  food_relation: string;
  confidence?: number;
  name_confidence?: number;
  dosage_confidence?: number;
  frequency_confidence?: number;
  instructions?: string;
}

interface ExtractedData {
  patient_name?: string;
  diagnosis?: string;
  is_mock?: boolean;
  medicines: ExtractedMedicine[];
}

export default function PrescriptionOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  // Edit states for review list
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editGenericName, setEditGenericName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editTimesPerDay, setEditTimesPerDay] = useState(1);
  const [editCustomTimes, setEditCustomTimes] = useState<string[]>(['09:00']);
  const [editDurationDays, setEditDurationDays] = useState('');
  const [editFoodRelation, setEditFoodRelation] = useState('No Preference');
  const [editInstructions, setEditInstructions] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
      setEditingIndex(null);
      setMessage({ text: '', type: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setEditingIndex(null);
    setMessage({ text: '', type: '' });
    try {
      const data = await medicinesService.uploadPrescriptionOCR(file);
      setExtractedData(data);
      // Select all medicines by default
      setSelectedIndexes(data.medicines.map((_: any, idx: number) => idx));
      setMessage({ text: 'AI successfully scanned the prescription and extracted all items!', type: 'success' });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to scan prescription. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectMedicine = (idx: number) => {
    if (editingIndex === idx) return; // Prevent selection toggle while editing
    setSelectedIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Start editing a specific medicine item inline
  const startEditing = (idx: number, med: ExtractedMedicine) => {
    setEditingIndex(idx);
    setEditName(med.name);
    setEditGenericName(med.generic_name || '');
    setEditDosage(med.dosage);
    setEditQuantity(med.quantity.toString());
    setEditTimesPerDay(med.times_per_day);
    setEditCustomTimes(med.custom_times.split(','));
    setEditDurationDays(med.duration_days.toString());
    setEditFoodRelation(med.food_relation);
    setEditInstructions(med.instructions || '');
  };

  const handleTimesPerDayChange = (val: number) => {
    setEditTimesPerDay(val);
    const defaults: { [key: number]: string[] } = {
      1: ['09:00'],
      2: ['09:00', '21:00'],
      3: ['09:00', '14:00', '21:00'],
      4: ['09:00', '13:00', '18:00', '22:00']
    };
    setEditCustomTimes(defaults[val] || ['09:00']);
  };

  const handleTimeChange = (idx: number, val: string) => {
    const updated = [...editCustomTimes];
    updated[idx] = val;
    setEditCustomTimes(updated);
  };

  // Save changes back to local list
  const saveMedicineEdit = (idx: number) => {
    if (!extractedData) return;
    
    // Validate custom times duplicates
    const uniqueTimes = new Set(editCustomTimes.map(t => t.trim()));
    if (uniqueTimes.size !== editCustomTimes.length) {
      alert('Duplicate timings are not allowed. Please set a different time for each dose.');
      return;
    }

    const updatedMedicines = [...extractedData.medicines];
    updatedMedicines[idx] = {
      ...updatedMedicines[idx],
      name: editName,
      generic_name: editGenericName || undefined,
      dosage: editDosage,
      quantity: parseInt(editQuantity) || 10,
      times_per_day: editTimesPerDay,
      duration_days: parseInt(editDurationDays) || 5,
      custom_times: editCustomTimes.join(','),
      food_relation: editFoodRelation,
      instructions: editInstructions,
      confidence: 100, // Manually corrected elements gain 100% confidence
      name_confidence: 100,
      dosage_confidence: 100,
      frequency_confidence: 100
    };

    setExtractedData({
      ...extractedData,
      medicines: updatedMedicines
    });
    setEditingIndex(null);
  };

  // Delete medicine from local scan list
  const deleteMedicine = (idx: number) => {
    if (!extractedData) return;
    const updatedMedicines = extractedData.medicines.filter((_, i) => i !== idx);
    setSelectedIndexes(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
    setExtractedData({
      ...extractedData,
      medicines: updatedMedicines
    });
    if (editingIndex === idx) {
      setEditingIndex(null);
    }
  };

  // Append a blank medicine to list in edit mode
  const addNewMedicine = () => {
    if (!extractedData) return;
    const newMed: ExtractedMedicine = {
      name: 'New Medicine',
      generic_name: 'Generic Chemical Name',
      dosage: '1 tablet',
      quantity: 10,
      times_per_day: 1,
      duration_days: 5,
      custom_times: '09:00',
      days_of_week: 'Daily',
      food_relation: 'No Preference',
      confidence: 100,
      name_confidence: 100,
      dosage_confidence: 100,
      frequency_confidence: 100,
      instructions: ''
    };

    const newIdx = extractedData.medicines.length;
    setExtractedData({
      ...extractedData,
      medicines: [...extractedData.medicines, newMed]
    });
    setSelectedIndexes(prev => [...prev, newIdx]);
    startEditing(newIdx, newMed);
  };

  // Import selected checked medications into database
  const handleImport = async () => {
    if (!extractedData || selectedIndexes.length === 0) return;
    setImporting(true);
    setMessage({ text: '', type: '' });
    let successCount = 0;
    try {
      for (const idx of selectedIndexes) {
        const med = extractedData.medicines[idx];
        await medicinesService.createMedicine({
          name: med.name,
          generic_name: med.generic_name,
          dosage: med.dosage,
          quantity: med.quantity,
          times_per_day: med.times_per_day,
          duration_days: med.duration_days,
          custom_times: med.custom_times,
          days_of_week: med.days_of_week,
          food_relation: med.food_relation
        });
        successCount++;
      }
      setMessage({
        text: `Successfully imported ${successCount} medicines and scheduled your daily reminders! Redirecting to cabinet...`,
        type: 'success'
      });
      setTimeout(() => {
        navigate('/medicines');
      }, 2500);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'An error occurred while importing medicines to your cabinet.',
        type: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  const getConfidenceColorClass = (score: number) => {
    if (score >= 95) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 80) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200 animate-pulse';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 95) return `🟢 ${score}%`;
    if (score >= 80) return `🟡 ${score}%`;
    return `🔴 ${score}%`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Panel */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-brand-500 animate-pulse" />
          AI Prescription OCR Linear Review
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload any prescription image. Verify written shortcuts alongside full chemical names lineally side-by-side before cabinet import.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl border text-sm flex gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-150 text-green-700 font-medium'
            : 'bg-red-50 border-red-150 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-150 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500/5 font-black text-7xl pointer-events-none select-none">AI</div>
            <FileText className="h-10 w-10 text-brand-500 mb-3" />
            <h4 className="text-sm font-bold text-slate-800">Select Prescription</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1 mb-4 max-w-[180px]">
              Support JPG, PNG, or PDF format files
            </p>

            <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer text-center block border border-slate-200">
              {file ? file.name : 'Choose File'}
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {file && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-100/50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                    <span>Run AI OCR Scanner</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 space-y-3.5 text-left">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guide</h5>
            <ul className="space-y-2 text-[11px] text-slate-500 font-medium">
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand-500 mt-0.5 shrink-0" />
                <span>Shows prescription shortcuts side-by-side with full generic chemical active formulas.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand-500 mt-0.5 shrink-0" />
                <span>Compact linear table format for simple overview.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-9">
          {extractedData ? (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-150 shadow-xl space-y-6">
              {/* Header Context */}
              <div className="flex flex-col sm:flex-row justify-between border-b border-slate-100 pb-4 gap-2 text-left">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</span>
                  <h4 className="text-sm font-black text-slate-800">{extractedData.patient_name || 'Not specified'}</h4>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block sm:text-right">Diagnosis/Context</span>
                  <h4 className="text-sm font-black text-brand-600 block sm:text-right">{extractedData.diagnosis || 'General Treatment'}</h4>
                </div>
              </div>



              {/* Medicines List */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-brand-500" />
                    Medication Checklist ({extractedData.medicines.length})
                  </h5>
                  <button
                    onClick={addNewMedicine}
                    className="flex items-center gap-1 py-1 px-3 bg-brand-50 border border-brand-100 hover:bg-brand-100 text-brand-600 text-[10px] font-black uppercase rounded-full tracking-wider transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Medicine</span>
                  </button>
                </div>
                
                {/* Linear Compact Table wrapper */}
                <div className="overflow-x-auto border border-slate-150 rounded-2xl shadow-inner bg-slate-50/20">
                  <table className="w-full min-w-[800px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="py-3 px-3 w-10 text-center">Select</th>
                        <th className="py-3 px-4 w-[280px]">Medicine Names (Shortcut vs Full Generic)</th>
                        <th className="py-3 px-3 w-28">Dosage & Stock</th>
                        <th className="py-3 px-3 w-40">Schedule & Food</th>
                        <th className="py-3 px-2 w-16 text-center">Days</th>
                        <th className="py-3 px-3 w-28 text-center">Confidence</th>
                        <th className="py-3 px-3 w-20 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 bg-white">
                      {extractedData.medicines.map((med, idx) => {
                        const isSelected = selectedIndexes.includes(idx);
                        const isEditing = editingIndex === idx;
                        const confidenceVal = med.confidence ?? 95;
                        const isLowConfidence = confidenceVal < 80;

                        if (isEditing) {
                          return (
                            <tr key={idx} className="bg-brand-50/10 ring-2 ring-brand-400 ring-inset">
                              <td className="py-4 px-3 text-center">
                                <Check className="h-4.5 w-4.5 text-brand-500 mx-auto" />
                              </td>
                              <td className="py-4 px-4 space-y-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Shortcut/Brand name</label>
                                  <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Full Generic name</label>
                                  <input
                                    type="text"
                                    value={editGenericName}
                                    onChange={(e) => setEditGenericName(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-500 italic"
                                    placeholder="Active ingredients"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Notes/Instructions</label>
                                  <textarea
                                    value={editInstructions}
                                    onChange={(e) => setEditInstructions(e.target.value)}
                                    rows={1}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-650"
                                    placeholder="Instructions"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-3 space-y-2 vertical-align-top">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Dose</label>
                                  <input
                                    type="text"
                                    required
                                    value={editDosage}
                                    onChange={(e) => setEditDosage(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-center text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Qty Stock</label>
                                  <input
                                    type="number"
                                    required
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-center text-slate-800"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-3 space-y-2 vertical-align-top">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Food relation</label>
                                  <select
                                    value={editFoodRelation}
                                    onChange={(e) => setEditFoodRelation(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-700"
                                  >
                                    <option value="No Preference">No Preference</option>
                                    <option value="Before Food">Before Food</option>
                                    <option value="After Food">After Food</option>
                                    <option value="At Night">At Night</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Frequency</label>
                                  <select
                                    value={editTimesPerDay}
                                    onChange={(e) => handleTimesPerDayChange(parseInt(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-700"
                                  >
                                    <option value={1}>1x daily</option>
                                    <option value={2}>2x daily</option>
                                    <option value={3}>3x daily</option>
                                    <option value={4}>4x daily</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase block">Dose Timings</label>
                                  <div className="grid grid-cols-2 gap-1">
                                    {editCustomTimes.map((time, tIdx) => (
                                      <input
                                        key={tIdx}
                                        type="time"
                                        required
                                        value={time}
                                        onChange={(e) => handleTimeChange(tIdx, e.target.value)}
                                        className="px-1 py-0.5 border border-slate-200 rounded text-[10px] text-center"
                                      />
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-2 text-center vertical-align-top">
                                <label className="text-[9px] font-black text-slate-400 uppercase block sm:hidden">Days</label>
                                <input
                                  type="number"
                                  required
                                  value={editDurationDays}
                                  onChange={(e) => setEditDurationDays(e.target.value)}
                                  className="w-12 px-1 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-center text-slate-800"
                                />
                              </td>
                              <td className="py-4 px-3 text-center text-[10px] text-slate-400">
                                <span>Correcting...</span>
                              </td>
                              <td className="py-4 px-3 text-center flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => saveMedicineEdit(idx)}
                                  className="p-1 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-600 rounded-lg transition-all"
                                  title="Save Changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingIndex(null)}
                                  className="p-1 border border-slate-200 hover:bg-slate-50 text-slate-400 rounded-lg transition-all"
                                  title="Cancel Edit"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        // Compact table row (linear layout!)
                        return (
                          <tr 
                            key={idx} 
                            className={`hover:bg-slate-50/50 transition-all ${
                              isSelected ? 'bg-white font-medium' : 'bg-slate-50/20 text-slate-400 opacity-60'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSelectMedicine(idx)}
                                className={`p-1.5 rounded-lg border transition-all mx-auto ${
                                  isSelected
                                    ? 'bg-brand-500 border-brand-500 text-white'
                                    : 'bg-white border-slate-200 text-slate-300'
                                }`}
                              >
                                {isSelected ? <Check className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 flex-wrap">
                                  {med.name}
                                  {isLowConfidence && (
                                    <span className="flex items-center gap-0.5 text-[8px] font-black text-red-600 bg-red-50 border border-red-100 px-1 py-0.2 rounded uppercase">
                                      Verify
                                    </span>
                                  )}
                                </span>
                                {med.generic_name && (
                                  <span className="text-[11px] text-slate-400 font-semibold italic">
                                    {med.generic_name}
                                  </span>
                                )}
                                {med.instructions && (
                                  <span className="text-[10px] text-slate-450 mt-1 pl-2 border-l border-slate-200">
                                    Note: {med.instructions}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-700">{med.dosage}</span>
                                <span className="text-[10px] text-slate-400">{med.quantity} in stock</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-700">{med.times_per_day}x daily</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase border ${
                                    med.food_relation.toLowerCase().includes('before')
                                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                                      : med.food_relation.toLowerCase().includes('night')
                                      ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                      : 'bg-green-50 text-green-600 border-green-100'
                                  }`}>
                                    {med.food_relation}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {med.custom_times.split(',').join(', ')}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-slate-700">
                              {med.duration_days} days
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border uppercase ${getConfidenceColorClass(confidenceVal)}`}>
                                {getConfidenceBadge(confidenceVal)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => startEditing(idx, med)}
                                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-brand-500 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteMedicine(idx)}
                                  className="p-1 hover:bg-red-50 text-slate-450 hover:text-red-600 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Action */}
              <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-450 font-extrabold">
                  {selectedIndexes.length} of {extractedData.medicines.length} medicines selected for cabinet
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setExtractedData(null);
                      setFile(null);
                      setMessage({ text: '', type: '' });
                    }}
                    className="py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel Scan
                  </button>

                  <button
                    onClick={handleImport}
                    disabled={importing || selectedIndexes.length === 0 || editingIndex !== null}
                    className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-100/50 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving to Medication Cabinet...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4.5 w-4.5 text-emerald-300" />
                        <span>Save to Medication Cabinet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/20">
              <ClipboardList className="h-10 w-10 text-slate-350 mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No Scanning Data</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 max-w-[280px]">
                Please select your doctor prescription document in the left panel and click scan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
