import { useState, useEffect } from 'react';
import { User, Association } from '../types';
import { usersService } from '../services/users';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile update fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Test email states
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState({ text: '', type: '' });

  const handleSendTestEmail = async () => {
    if (!notificationEmail) {
      setTestEmailMessage({ text: 'Please enter a notification email address first.', type: 'error' });
      return;
    }
    
    setSendingTestEmail(true);
    setTestEmailMessage({ text: '', type: '' });
    
    try {
      await usersService.sendTestEmail(notificationEmail);
      setTestEmailMessage({ text: 'Test email sent! Check your inbox or console.', type: 'success' });
    } catch (err: any) {
      setTestEmailMessage({ text: err.response?.data?.detail || 'Failed to send test email.', type: 'error' });
    } finally {
      setSendingTestEmail(false);
    }
  };
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  
  // Association link fields
  const [targetEmail, setTargetEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const userProfile = await usersService.getMe();
      setProfile(userProfile);
      setName(userProfile.name);
      setEmail(userProfile.email);
      setNotificationEmail(userProfile.notification_email || '');
      
      const links = await usersService.getAssociations();
      setAssociations(links);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const updated = await usersService.updateProfile({ name, email, notification_email: notificationEmail });
      setProfile(updated);
      
      // Update local storage so Navbar reflects changes
      localStorage.setItem('pillsync_user_name', updated.name);
      localStorage.setItem('pillsync_user_email', updated.email);
      
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setProfileMessage({
        text: err.response?.data?.detail || 'Failed to update profile.',
        type: 'error'
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMessage({ text: '', type: '' });

    try {
      await usersService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({
        text: err.response?.data?.detail || 'Failed to change password.',
        type: 'error'
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCreateAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    setLinking(true);
    setLinkMessage({ text: '', type: '' });

    try {
      if (profile?.role === 'patient') {
        await usersService.linkCaregiver(targetEmail);
        setLinkMessage({ text: 'Caregiver link request sent successfully!', type: 'success' });
      } else {
        await usersService.linkPatient(targetEmail);
        setLinkMessage({ text: 'Patient link request sent successfully!', type: 'success' });
      }
      setTargetEmail('');
      // Reload links
      const links = await usersService.getAssociations();
      setAssociations(links);
    } catch (err: any) {
      setLinkMessage({
        text: err.response?.data?.detail || 'Failed to send association request.',
        type: 'error'
      });
    } finally {
      setLinking(false);
    }
  };

  const handleRespondToAssociation = async (id: number, decision: 'active' | 'rejected') => {
    try {
      await usersService.respondToAssociation(id, decision);
      // Reload links
      const links = await usersService.getAssociations();
      setAssociations(links);
    } catch (err) {
      console.error('Failed to respond to association request', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-slate-400 text-sm mt-4">Loading your PillSync profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Profile Details and Update Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <UserIcon className="h-5 w-5 text-brand-500" />
            My Profile
          </h3>

          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-16 w-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <h4 className="font-bold text-slate-800 text-base">{profile?.name}</h4>
            <span className="text-xs px-2.5 py-0.5 mt-1 bg-brand-50 border border-brand-100 text-brand-600 rounded-full font-semibold capitalize">
              {profile?.role}
            </span>
          </div>

          <div className="space-y-3.5 mb-6 text-sm text-slate-500 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <Mail className="h-4.5 w-4.5 shrink-0 text-slate-400" />
              <span className="truncate">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4.5 w-4.5 shrink-0 text-slate-400" />
              <span>Joined {new Date(profile?.created_at || '').toLocaleDateString()}</span>
            </div>
          </div>

          {profileMessage.text && (
            <div className={`p-3.5 rounded-xl border text-sm flex gap-2.5 mb-4 ${
              profileMessage.type === 'success'
                ? 'bg-green-50 border-green-100 text-green-700'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notification Alert Email</label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="Alternative email for medicine alerts (optional)"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">If blank, alerts will send to your default login email.</p>
            </div>
            
            {notificationEmail && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 my-2 text-left">
                <p className="text-xs text-slate-500 font-medium">Want to test if notifications are working on this email?</p>
                {testEmailMessage.text && (
                  <p className={`text-xs font-semibold ${testEmailMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {testEmailMessage.text}
                  </p>
                )}
                <button
                  type="button"
                  disabled={sendingTestEmail}
                  onClick={handleSendTestEmail}
                  className="w-full py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg border border-brand-200 transition-all flex items-center justify-center gap-1.5"
                >
                  {sendingTestEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                  Send Test Email Alert
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center"
            >
              {updatingProfile && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Save Changes
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Lock className="h-5 w-5 text-brand-500" />
            Change Password
          </h3>

          {passwordMessage.text && (
            <div className={`p-3.5 rounded-xl border text-sm flex gap-2.5 mb-4 ${
              passwordMessage.type === 'success'
                ? 'bg-green-50 border-green-100 text-green-700'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center"
            >
              {updatingPassword && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Caregiver/Patient Association Management */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" />
              {profile?.role === 'patient' ? 'Caregiver Connections' : 'Monitored Patients'}
            </h3>
            <button 
              onClick={loadData}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Form to initiate association */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
            <h4 className="font-semibold text-slate-800 text-sm mb-1.5">
              {profile?.role === 'patient' ? 'Add a Caregiver' : 'Add a Patient'}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              {profile?.role === 'patient'
                ? 'Enter your caregiver\'s email to allow them to view your medicines, reminders and adherence.'
                : 'Enter your patient\'s email to request access to their medication dashboard.'}
            </p>

            {linkMessage.text && (
              <div className={`p-3.5 rounded-xl border text-sm flex gap-2.5 mb-4 ${
                linkMessage.type === 'success'
                  ? 'bg-green-50 border-green-100 text-green-700'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {linkMessage.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span>{linkMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssociation} className="flex gap-2.5">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={linking}
                className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-sm px-4 rounded-xl flex items-center gap-1 shadow-sm transition-all shrink-0"
              >
                {linking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Invite</span>
              </button>
            </form>
          </div>

          {/* List of current associations */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
              Connection Requests & Status
            </h4>

            {associations.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2.5" />
                <p className="text-sm font-medium text-slate-400">No connections set up yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Send an invitation above to get connected.</p>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {associations.map((assoc) => {
                  const isCurrentPatient = profile?.role === 'patient';
                  const contactName = isCurrentPatient ? assoc.caregiver_name : assoc.patient_name;
                  const contactEmail = isCurrentPatient ? assoc.caregiver_email : assoc.patient_email;
                  
                  // Pending status check
                  const isPending = assoc.status === 'pending';
                  const canRespond = isPending && (
                    // Caregivers respond to patient-initiated requests, patients respond to caregiver-initiated requests.
                    // For simplicity, any involved party who is NOT the one whose role doesn't match the flow, or just let them accept.
                    // Actually, our API allows both patient and caregiver to update, so we'll show controls.
                    // If Carl is Caregiver and he sees pending, he can accept it.
                    // If Pete is Patient and Carl requested, Pete can accept it.
                    true
                  );

                  return (
                    <div key={assoc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                          {contactName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 text-sm">{contactName}</h5>
                          <span className="text-xs text-slate-400">{contactEmail}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          assoc.status === 'active'
                            ? 'bg-green-50 border-green-100 text-green-700'
                            : assoc.status === 'rejected'
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {assoc.status}
                        </span>

                        {isPending && canRespond && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleRespondToAssociation(assoc.id, 'active')}
                              className="p-1 rounded-lg border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Accept Link"
                            >
                              <Check className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleRespondToAssociation(assoc.id, 'rejected')}
                              className="p-1 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Reject Link"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
