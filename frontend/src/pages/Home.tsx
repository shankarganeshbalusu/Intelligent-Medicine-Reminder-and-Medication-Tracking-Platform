import { Link } from 'react-router-dom';
import { Pill, Activity, Clock, Users, FileText, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { authService } from '../services/auth';

export default function Home() {
  const isAuth = authService.isAuthenticated();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-16 animate-fade-in pb-12 select-none">
      {/* 1. Hero Showcase Section */}
      <div className="text-center relative py-12 px-6 rounded-3xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-brand-500/20 to-indigo-500/20 border border-brand-500/30 text-brand-200 text-xs font-bold uppercase rounded-full tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-spin-slow" />
            AI-Powered Medication Adherence Platform
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Never Miss a Dose. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-400">
              Synchronize Your Health.
            </span>
          </h1>
          
          <p className="text-slate-200 text-sm max-w-2xl mx-auto leading-relaxed font-semibold">
            PillSync is an intelligent clinical assistant that tracks your prescriptions, scans paper prescriptions with OCR, verifies drug names, alerts caregivers, and scans for dangerous drug-to-drug interactions.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {isAuth ? (
              <Link
                to="/dashboard"
                className="py-3 px-6 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 hover:scale-[1.03] active:scale-95"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="py-3 px-6 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 hover:scale-[1.03] active:scale-95"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="py-3 px-6 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold rounded-2xl transition-all hover:scale-[1.03] active:scale-95"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Features Grid (5 Cards layout - Premium styling) */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Full-Suite Digital Therapeutics</h2>
          <p className="text-slate-350 text-xs mt-1 font-semibold">Five core pillars engineered for medication safety and caregiver monitoring</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-brand-50 rounded-xl text-brand-600 inline-block">
                <Pill className="h-6 w-6" />
              </div>
              <h4 className="text-slate-800 font-extrabold text-base mt-4">Medicine Management</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Add, modify, and archive active prescriptions. Validate names against FDA drug directories to prevent fake medicine entries.
              </p>
            </div>
            <div className="text-brand-600 text-xs font-bold flex items-center gap-1 mt-4">
              <span>FDA Verified</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-red-50 rounded-xl text-red-500 inline-block">
                <Activity className="h-6 w-6" />
              </div>
              <h4 className="text-slate-800 font-extrabold text-base mt-4">Disease Tracking</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Map each medication directly to diagnosed medical conditions or symptoms, maintaining a clinical history of your health routines.
              </p>
            </div>
            <div className="text-red-500 text-xs font-bold flex items-center gap-1 mt-4">
              <span>Health Mapping</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500 inline-block">
                <Clock className="h-6 w-6" />
              </div>
              <h4 className="text-slate-800 font-extrabold text-base mt-4">Dosage Scheduling</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Establish custom dose times with automatic daily checklists. Receive push email/SMS notification reminders when it's time to take them.
              </p>
            </div>
            <div className="text-amber-500 text-xs font-bold flex items-center gap-1 mt-4">
              <span>Real-Time Alerts</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500 inline-block">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-slate-800 font-extrabold text-base mt-4">Multiple Profiles</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Add caregiver links. Let family members, doctors, or nurses monitor your medication compliance and receive missed-dose alerts.
              </p>
            </div>
            <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 mt-4">
              <span>Caregiver Links</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-500 inline-block">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-slate-800 font-extrabold text-base mt-4">Prescription Management</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Upload image or PDF files of prescriptions. Our multimodal AI OCR automatically reads instructions and auto-populates schedule slots.
              </p>
            </div>
            <div className="text-purple-600 text-xs font-bold flex items-center gap-1 mt-4">
              <span>AI OCR Extraction</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
