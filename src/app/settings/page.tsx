'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { User, Mail, Phone, Shield, Key, Bell, Eye, EyeOff, CreditCard, FileText, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    username: '',
  });
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    caseUpdates: true,
    documentAlerts: false,
  });
  const { toasts, success, error: showError, removeToast } = useToast();
  const [pwdModal, setPwdModal] = useState({ open: false });
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdShow, setPwdShow] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    fetchUser();
    // Load preferences from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('user_prefs') || 'null');
      if (saved) setPrefs(saved);
    } catch {}
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setUserForm({
        full_name: response.data.full_name,
        email: response.data.email,
        username: response.data.username,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const res = await api.put('/api/auth/me', {
        full_name: userForm.full_name,
        email: userForm.email,
        username: userForm.username,
      });
      setUser(res.data);
      success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const updatePref = (key: keyof typeof prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { localStorage.setItem('user_prefs', JSON.stringify(next)); } catch {}
    success('Preference saved');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400';
      case 'lawyer':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400';
      case 'staff':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'client':
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300';
      default:
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">Settings</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card hover-lift animate-fade-in-up">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">Profile Information</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        className="input"
                        value={userForm.full_name}
                        onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Username</label>
                      <input
                        type="text"
                        className="input"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="btn-primary btn-md hover-lift"
                    >
                      {updating ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card hover-lift">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">Security</h3>
                <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-secondary-500 dark:text-secondary-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Change Password</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Update your account password</p>
                    </div>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={()=>setPwdModal({open:true})}>
                    Change
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-secondary-500 dark:text-secondary-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Two-Factor Authentication</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={()=>success('Two-factor authentication enabled (demo)')}>
                    Enabled
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-6">
            <div className="card hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">Account Information</h3>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user?.is_active ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' : 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400'}`}>{user?.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              <div className="divide-y divide-secondary-200 dark:divide-secondary-700 rounded-lg overflow-hidden border border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center p-4 bg-secondary-50/60 dark:bg-secondary-800/40">
                  <User className="h-4 w-4 text-secondary-500 dark:text-secondary-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{user?.full_name}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">Full Name</p>
                  </div>
                </div>
                <div className="flex items-center p-4">
                  <Mail className="h-4 w-4 text-secondary-500 dark:text-secondary-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 break-all">{user?.email}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">Email Address</p>
                  </div>
                  <button className="btn-secondary btn-xs" onClick={()=>{ navigator.clipboard.writeText(user?.email || ''); success('Email copied'); }} title="Copy email">Copy</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary-50/60 dark:bg-secondary-800/40">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mr-3">Role</p>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(user?.role || '')} capitalize`}>{user?.role}</span>
                </div>
              </div>
              </div>
            </div>

            {/* Billing & Subscription */}
            <div className="card hover-lift">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">Billing & Subscription</h3>
                <div className="space-y-3">
                <button
                  onClick={() => router.push('/plans')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">View Plans</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Choose or upgrade your subscription plan</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                </button>

                <button
                  onClick={() => router.push('/billing')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Billing</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Manage payment methods and invoices</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                </button>

                <button
                  onClick={() => router.push('/payment')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Payment</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Complete payment or add payment method</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {pwdModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={()=>setPwdModal({open:false})}>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Current Password</label>
                <input type={pwdShow.current? 'text':'password'} className="input pr-10" value={pwdForm.current} onChange={(e)=>setPwdForm({...pwdForm, current: e.target.value})} />
                <button className="absolute right-2 top-9 text-secondary-500" onClick={()=>setPwdShow({...pwdShow, current: !pwdShow.current})}>
                  {pwdShow.current? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">New Password</label>
                <input type={pwdShow.next? 'text':'password'} className="input pr-10" value={pwdForm.next} onChange={(e)=>setPwdForm({...pwdForm, next: e.target.value})} />
                <button className="absolute right-2 top-9 text-secondary-500" onClick={()=>setPwdShow({...pwdShow, next: !pwdShow.next})}>
                  {pwdShow.next? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Confirm New Password</label>
                <input type={pwdShow.confirm? 'text':'password'} className="input pr-10" value={pwdForm.confirm} onChange={(e)=>setPwdForm({...pwdForm, confirm: e.target.value})} />
                <button className="absolute right-2 top-9 text-secondary-500" onClick={()=>setPwdShow({...pwdShow, confirm: !pwdShow.confirm})}>
                  {pwdShow.confirm? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700 mt-6">
              <button className="btn-secondary btn-md" onClick={()=>setPwdModal({open:false})}>Cancel</button>
              <button className="btn-primary btn-md" onClick={async ()=>{
                if(!pwdForm.current || !pwdForm.next){ showError('Please fill all fields'); return; }
                if(pwdForm.next !== pwdForm.confirm){ showError('New passwords do not match'); return; }
                try{
                  await api.post('/api/auth/change-password', { current_password: pwdForm.current, new_password: pwdForm.next });
                  success('Password updated');
                  setPwdModal({open:false});
                  setPwdForm({current:'', next:'', confirm:''});
                }catch(err:any){
                  const msg = err.response?.data?.detail || 'Failed to change password';
                  showError(msg);
                }
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
