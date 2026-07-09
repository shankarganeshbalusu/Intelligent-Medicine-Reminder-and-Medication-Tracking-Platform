import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Association } from '../types';
import { usersService } from '../services/users';
import {
  Activity,
  Pill,
  Users,
  ArrowRight,
  TrendingUp,
  Clock,
  Loader2,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<User | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const userProfile = await usersService.getMe();
        setProfile(userProfile);
        
        const links = await usersService.getAssociations();
        setAssociations(links.filter(l => l.status === 'active'));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
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
            Milestone 1 Portal
          </span>
          <h2 className="text-3xl font-extrabold mt-3">Welcome back, {profile?.name}!</h2>
          <p className="text-brand-50 text-sm mt-1">{todayStr}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-right">
          <span className="text-xs text-brand-100 block">Logged in as</span>
          <span className="text-sm font-semibold capitalize">{profile?.role}</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Compliance Score</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">92%</span>
            <span className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <span>Excellent Adherence</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Medicines</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">0</span>
            <span className="text-xs text-slate-400 mt-1 block">Setup in Milestone 2</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Doses Scheduled Today</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">0</span>
            <span className="text-xs text-slate-400 mt-1 block">Setup in Milestone 2</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connections Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" />
              {profile?.role === 'patient' ? 'Caregiver Status' : 'Linked Patients'}
            </h3>
            <Link 
              to="/profile" 
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              <span>Manage Links</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {associations.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No active connections</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile?.role === 'patient'
                  ? 'Connect a caregiver to allow remote tracking.'
                  : 'Invite a patient to monitor their compliance logs.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
              {associations.map((assoc) => {
                const isCurrentPatient = profile?.role === 'patient';
                const contactName = isCurrentPatient ? assoc.caregiver_name : assoc.patient_name;
                const contactEmail = isCurrentPatient ? assoc.caregiver_email : assoc.patient_email;

                return (
                  <div key={assoc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-800 text-sm">{contactName}</h5>
                        <p className="text-xs text-slate-400">{contactEmail}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-green-50 border-green-100 text-green-700">
                      Active Link
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info card / quick actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-100 pb-4">
              <Activity className="h-5 w-5 text-brand-500" />
              Status Info
            </h3>
            
            <div className="space-y-4 text-sm text-slate-500">
              <div className="flex justify-between">
                <span>Account Role</span>
                <span className="font-semibold text-slate-800 capitalize">{profile?.role}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Connection</span>
                <span className="font-semibold text-slate-800">
                  {associations.length} {associations.length === 1 ? 'Person' : 'People'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Milestone Status</span>
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Completed
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <Link
                to="/profile"
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 rounded-xl transition-all"
              >
                <FileText className="h-4.5 w-4.5" />
                Go to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
