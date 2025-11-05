'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { Plus, Search, Edit, Trash2, Users, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { isLawyerOrAdmin } from '@/lib/roleCheck';
import { formatApiError } from '@/lib/errorUtils';

interface Staff {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function LawyerStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Staff | null>(null);
  const [showDelete, setShowDelete] = useState<{ open: boolean; user: Staff | null }>({ open: false, user: null });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { toasts, success, error: showError, removeToast } = useToast();
  
  const [form, setForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchStaff();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
      if (!isLawyerOrAdmin(response.data?.role)) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      showError('Failed to fetch user information');
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/lawyers/staff');
      const allStaff = response.data || [];
      // Filter by search term if provided
      const filtered = searchTerm
        ? allStaff.filter((s: Staff) =>
            s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.username?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allStaff;
      setStaff(filtered);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      const errorMessage = formatApiError(error, 'Failed to fetch staff members');
      showError(errorMessage);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm !== undefined) {
      fetchStaff();
    }
  }, [searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // Prepare data - only include username if provided, otherwise let backend auto-generate
      const staffData: any = {
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        role: 'staff',
      };
      
      // Only include username if it's provided and not empty
      if (form.username && form.username.trim()) {
        staffData.username = form.username.trim();
      }
      
      await api.post('/api/lawyers/staff', staffData);
      setShowCreate(false);
      setForm({
        email: '',
        username: '',
        full_name: '',
        password: '',
      });
      fetchStaff();
      success('Staff member created successfully');
    } catch (error: any) {
      showError(formatApiError(error, 'Failed to create staff member'));
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setShowEdit(staffMember);
    setForm({
      email: staffMember.email,
      username: staffMember.username,
      full_name: staffMember.full_name,
      password: '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    
    setSaving(true);
    try {
      const updateData: any = {
        email: form.email,
        username: form.username,
        full_name: form.full_name,
      };
      
      // Password update requires admin endpoint
      const staffId = parseInt(String(showEdit.id), 10);
      if (isNaN(staffId)) {
        showError('Invalid staff ID');
        return;
      }
      if (form.password) {
        await api.put(`/api/admin/users/${staffId}`, { ...updateData, password: form.password });
      } else {
        await api.put(`/api/lawyers/staff/${staffId}`, updateData);
      }
      setShowEdit(null);
      fetchStaff();
      success('Staff member updated successfully');
    } catch (error: any) {
      showError(formatApiError(error, 'Failed to update staff member'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete.user || !showDelete.user.id) return;
    
    try {
      const staffId = parseInt(String(showDelete.user.id), 10);
      if (isNaN(staffId)) {
        showError('Invalid staff ID');
        return;
      }
      await api.delete(`/api/lawyers/staff/${staffId}`);
      setShowDelete({ open: false, user: null });
      fetchStaff();
      success('Staff member deleted successfully');
    } catch (error: any) {
      showError(formatApiError(error, 'Failed to delete staff member'));
    }
  };

  const toggleStaffStatus = async (staffMember: Staff) => {
    if (!staffMember.id) return;
    
    try {
      const staffId = parseInt(String(staffMember.id), 10);
      if (isNaN(staffId)) {
        showError('Invalid staff ID');
        return;
      }
      await api.put(`/api/admin/users/${staffId}`, { is_active: !staffMember.is_active });
      fetchStaff();
      success(`Staff member ${staffMember.is_active ? 'suspended' : 'reactivated'} successfully`);
    } catch (error: any) {
      showError(formatApiError(error, 'Failed to update staff status'));
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
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Staff Management</h1>
            <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
              Manage your staff members
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary btn-md flex items-center justify-center hover-lift hover-glow w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </button>
        </div>

        {/* Search */}
        <div className="card p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search staff members..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Staff Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-100 dark:bg-secondary-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Staff Member</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-900 dark:text-secondary-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {staff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-secondary-900 dark:text-secondary-100">{staffMember.full_name}</div>
                        <div className="text-sm text-secondary-600 dark:text-secondary-400">{staffMember.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {staffMember.is_active ? (
                        <span className="flex items-center text-success-600 dark:text-success-400">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-error-600 dark:text-error-400">
                          <XCircle className="h-4 w-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-400">
                      {new Date(staffMember.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleStaffStatus(staffMember)}
                          className="btn-ghost btn-sm"
                          title={staffMember.is_active ? 'Suspend' : 'Reactivate'}
                        >
                          {staffMember.is_active ? <UserPlus className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(staffMember)}
                          className="btn-ghost btn-sm"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDelete({ open: true, user: staffMember })}
                          className="btn-ghost btn-sm text-error-600 hover:text-error-700 dark:text-error-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staff.length === 0 && (
              <div className="text-center py-12 text-secondary-600 dark:text-secondary-400">
                No staff members found
              </div>
            )}
          </div>
        </div>

        {/* Create Staff Modal */}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-body">
                <h3 className="modal-title mb-4">Add Staff Member</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="form-group">
                    <label className="label-required">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label-required">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label-required">Username</label>
                    <input
                      type="text"
                      className="input"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label-required">Password</label>
                    <input
                      type="password"
                      className="input"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="btn-secondary btn-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="btn-primary btn-md"
                    >
                      {creating ? 'Creating...' : 'Create Staff Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEdit && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-body">
                <h3 className="modal-title mb-4">Edit Staff Member</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="form-group">
                    <label className="label-required">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label-required">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label-required">Username</label>
                    <input
                      type="text"
                      className="input"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      className="input"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      minLength={8}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEdit(null)}
                      className="btn-secondary btn-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary btn-md"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDelete.open && showDelete.user && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-body">
                <h3 className="modal-title mb-2">Delete Staff Member?</h3>
                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                  This action cannot be undone. You are about to delete staff member "{showDelete.user.full_name}" ({showDelete.user.email}).
                </p>
                <div className="modal-footer">
                  <button
                    onClick={() => setShowDelete({ open: false, user: null })}
                    className="btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn-destructive btn-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
