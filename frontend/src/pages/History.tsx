import { useState, useEffect } from 'react';
import { MedicationLog, Association } from '../types';
import { medicinesService } from '../services/medicines';
import { usersService } from '../services/users';
import { authService } from '../services/auth';
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ListFilter,
  Users
} from 'lucide-react';

export default function History() {
  const user = authService.getCurrentUser();
  const isPatient = user?.role === 'patient';

  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [patients, setPatients] = useState<Association[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isPatient) {
        const list = await medicinesService.getMedicationLogs();
        setLogs(list);
      } else {
        const associations = await usersService.getAssociations();
        const activeLinks = associations.filter(a => a.status === 'active');
        setPatients(activeLinks);
        
        if (activeLinks.length > 0) {
          setSelectedPatientId(activeLinks[0].patient_id);
          const list = await medicinesService.getMedicationLogs(activeLinks[0].patient_id);
          setLogs(list);
        }
      }
    } catch (err) {
      console.error('Failed to load logs', err);
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
      const list = await medicinesService.getMedicationLogs(patientId);
      setLogs(list);
    } catch (err) {
      console.error('Failed to fetch patient history logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-brand-500" />
            Adherence History
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isPatient
              ? 'Timeline of your checked medication logs.'
              : "Audit logs showing your patient's dose compliance history."}
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
          <p className="text-slate-400 text-sm mt-4">Syncing log files...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {!isPatient && patients.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No linked patients</p>
              <p className="text-xs text-slate-400 mt-1">Accept patient invitations in the profile settings.</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No logs found</p>
              <p className="text-xs text-slate-400 mt-1">
                {isPatient
                  ? "You haven't checked off any scheduled doses yet."
                  : 'The patient has not logged any scheduled doses yet.'}
              </p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl shadow-slate-100/40 overflow-hidden divide-y divide-slate-100/40">
              {logs.map((log) => {
                const isTaken = log.status === 'taken';
                const logDate = new Date(log.logged_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-50/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl border ${
                        isTaken
                          ? 'bg-green-50 border-green-100 text-green-600'
                          : 'bg-red-50 border-red-100 text-red-600'
                      }`}>
                        {isTaken ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{log.medicine_name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Dose time: {log.dose_time}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        isTaken
                          ? 'bg-green-50 border-green-100 text-green-700'
                          : 'bg-red-50 border-red-100 text-red-700'
                      }`}>
                        {isTaken ? 'Taken' : 'Missed'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1.5">{logDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
