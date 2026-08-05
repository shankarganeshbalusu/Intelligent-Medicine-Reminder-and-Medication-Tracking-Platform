import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Association, Medicine, Reminder, MedicationLog } from '../types';
import { usersService } from '../services/users';
import { medicinesService } from '../services/medicines';
import { authService } from '../services/auth';
import {
  Activity,
  Pill,
  Clock,
  Loader2,
  FileText,
  Check,
  X,
  ListFilter,
  Plus,
  AlertCircle
} from 'lucide-react';

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

export default function Dashboard() {
  const currentUser = authService.getCurrentUser();
  const isPatient = currentUser?.role === 'patient';

  const [profile, setProfile] = useState<User | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [patients, setPatients] = useState<Association[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  
  // Stats & Schedule data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [warnings, setWarnings] = useState<Array<{ medication: string; severity: string; warning: string }>>([]);
  
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [complianceScore, setComplianceScore] = useState(100);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const calculateCompliance = (historyLogs: MedicationLog[]) => {
    if (historyLogs.length === 0) {
      setComplianceScore(100);
      return;
    }
    const taken = historyLogs.filter(l => l.status === 'taken').length;
    const total = historyLogs.length;
    setComplianceScore(Math.round((taken / total) * 100));
  };

  const fetchPatientData = async (uid: number) => {
    try {
      const activeMeds = await medicinesService.getMedicines(uid);
      setMedicines(activeMeds);

      const todayRems = await medicinesService.getTodayReminders(uid);
      setReminders(todayRems);

      const historyLogs = await medicinesService.getMedicationLogs(uid);
      setLogs(historyLogs);
      calculateCompliance(historyLogs);

      if (isPatient) {
        const interactionData = await medicinesService.checkDrugInteractions();
        setWarnings(interactionData.warnings || []);
      } else {
        setWarnings([]);
      }
    } catch (err) {
      console.error('Failed to fetch patient data', err);
    }
  };



  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const userProfile = await usersService.getMe();
      setProfile(userProfile);
      
      const links = await usersService.getAssociations();
      const activeLinks = links.filter(l => l.status === 'active');
      setAssociations(activeLinks);

      if (isPatient) {
        await fetchPatientData(userProfile.id);
      } else {
        setPatients(activeLinks);
        if (activeLinks.length > 0) {
          setSelectedPatientId(activeLinks[0].patient_id);
          await fetchPatientData(activeLinks[0].patient_id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handlePatientSelect = async (patientId: number) => {
    setSelectedPatientId(patientId);
    setLoading(true);
    await fetchPatientData(patientId);
    setLoading(false);
  };

  const handleActionDose = async (reminderId: number, outcome: 'taken' | 'missed') => {
    setActioningId(reminderId);
    try {
      await medicinesService.updateReminderStatus(reminderId, outcome);
      
      // Refresh patient data
      const targetId = isPatient ? profile?.id : (selectedPatientId as number);
      if (targetId) {
        await fetchPatientData(targetId);
      }
    } catch (err) {
      console.error('Failed to log reminder outcome', err);
    } finally {
      setActioningId(null);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-slate-400 text-sm mt-4">Loading your PillSync dashboard...</p>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-3xl p-8 text-white shadow-xl shadow-brand-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-brand-100 text-xs font-semibold uppercase tracking-wider bg-brand-700/30 px-3 py-1 rounded-full">
            Medication Dashboard
          </span>
          <h2 className="text-3xl font-extrabold mt-3">Welcome back, {profile?.name}!</h2>
          <p className="text-brand-50 text-sm mt-1">{todayStr}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isPatient && patients.length > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
              <ListFilter className="h-4 w-4 text-brand-100" />
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(parseInt(e.target.value))}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none border-none cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.patient_id} className="text-slate-800">
                    {p.patient_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-right">
            <span className="text-xs text-brand-100 block">Logged in as</span>
            <span className="text-sm font-semibold capitalize">{profile?.role}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-4">Syncing dashboard information...</p>
        </div>
      ) : (
        <>
          {/* Drug Interaction Warning Banners */}
          {isPatient && warnings.length > 0 && (
            <div className="space-y-3.5 mb-6">
              {warnings.map((w, idx) => (
                <div key={idx} className="p-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl flex items-start gap-3.5 text-red-950 shadow-sm animate-pulse-slow">
                  <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-red-950 flex items-center gap-1.5">
                      Clinical Warning: Drug Interaction Found ({w.severity} Severity)
                    </h5>
                    <p className="text-xs text-red-900 mt-1 leading-relaxed font-semibold">{w.warning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden neon-border-cyan hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-500 animate-heartbeat">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Compliance Rate (ECG)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{complianceScore}%</span>
                    <span className={`text-xs font-bold ${
                      complianceScore >= 85 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {complianceScore >= 85 ? 'NORMAL RHYTHM' : 'ALERT'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Cardiac ECG monitor grid wrapper */}
              <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-inner relative overflow-hidden h-14 flex items-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
                <svg className="w-full h-10 relative z-10 opacity-90" viewBox="0 0 300 50" preserveAspectRatio="none">
                  <path
                    d="M 0,25 L 100,25 L 108,10 L 116,40 L 124,25 L 140,25 L 146,5 L 158,45 L 168,21 L 174,29 L 180,25 L 300,25"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-ecg"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 flex items-start gap-4 neon-border-purple hover:scale-[1.02] transition-all duration-300">
              <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Medications</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{medicines.length}</span>
                <span className="text-xs text-slate-400 mt-1 block">In patient's cabinet</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 flex items-start gap-4 neon-border-pink hover:scale-[1.02] transition-all duration-300">
              <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Today's Doses</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{reminders.length}</span>
                <span className="text-xs text-slate-400 mt-1 block">Scheduled for intake</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checklist Column */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-xl shadow-slate-100/40 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand-500" />
                  Today's Scheduled Checklist
                </h3>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">No doses scheduled for today</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isPatient
                      ? 'Go to the Medicines page to register your prescriptions.'
                      : 'The patient has not scheduled any medications.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {reminders.map((rem) => {
                    const isPending = rem.status === 'pending' || rem.status === 'notified';
                    const isTaken = rem.status === 'taken';
                    const isMissed = rem.status === 'missed';

                    return (
                      <div key={rem.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-inner bg-slate-50/20 transition-all">
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2 rounded-xl text-xs font-bold ${
                            isTaken
                              ? 'bg-green-50 text-green-600'
                              : isMissed
                              ? 'bg-red-50 text-red-600'
                              : 'bg-brand-50 text-brand-600'
                          }`}>
                            {formatTimeToShow(rem.dose_time)}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {rem.medicine_name}
                              {rem.medicine_food_relation && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  rem.medicine_food_relation.toLowerCase().includes('before')
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : rem.medicine_food_relation.toLowerCase().includes('night')
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    : 'bg-green-50 text-green-600 border border-green-100'
                                }`}>
                                  {rem.medicine_food_relation}
                                </span>
                              )}
                            </h5>
                            <p className="text-xs text-slate-400">Dosage: {rem.medicine_dosage}</p>
                          </div>
                        </div>

                        {/* Action buttons (Patients only) */}
                        {isPatient ? (
                          isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleActionDose(rem.id, 'taken')}
                                disabled={actioningId !== null}
                                className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 transition-colors flex items-center justify-center"
                                title="Mark Taken"
                              >
                                <Check className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleActionDose(rem.id, 'missed')}
                                disabled={actioningId !== null}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors flex items-center justify-center"
                                title="Mark Missed"
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              isTaken
                                ? 'bg-green-50 border-green-100 text-green-700'
                                : 'bg-red-50 border-red-100 text-red-700'
                            }`}>
                              {isTaken ? 'Taken' : 'Missed'}
                            </span>
                          )
                        ) : (
                          /* Caregiver Read-only tags */
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            isTaken
                              ? 'bg-green-50 border-green-100 text-green-700'
                              : isMissed
                              ? 'bg-red-50 border-red-100 text-red-700'
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {isTaken ? 'Taken' : isMissed ? 'Missed' : 'Scheduled'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick stats and link section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-xl shadow-slate-100/40 space-y-5">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-100 pb-4">
                  <Activity className="h-5 w-5 text-brand-500" />
                  Status Info
                </h3>
                
                <div className="space-y-4 text-sm text-slate-500">
                  <div className="flex justify-between">
                    <span>Active Connection</span>
                    <span className="font-semibold text-slate-800">
                      {associations.length} {associations.length === 1 ? 'Person' : 'People'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adherence Logs</span>
                    <span className="font-semibold text-slate-800">{logs.length} logged</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  {isPatient ? (
                    <Link
                      to="/medicines"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition-all"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Add Medication
                    </Link>
                  ) : (
                    <Link
                      to="/medicines"
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 rounded-xl transition-all"
                    >
                      <Pill className="h-4.5 w-4.5" />
                      View Cabinet
                    </Link>
                  )}
                  <Link
                    to="/history"
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 rounded-xl transition-all"
                  >
                    <FileText className="h-4.5 w-4.5" />
                    View History Logs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
