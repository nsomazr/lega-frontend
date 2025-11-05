'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  UserPlus, 
  UserMinus,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { isAdmin } from '@/lib/roleCheck';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  location?: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const { toasts, success, error: showError, removeToast } = useToast();
  
  const [form, setForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'client',
    phone: '',
    location: '',
    whatsapp_number: '',
    specialization: ''
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
      if (!isAdmin(response.data.role)) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      showError('Failed to fetch user information');
    }
  };

  const fetchUsers = async () => {
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.is_active = statusFilter === 'active';
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/api/admin/users', { params });
      setUsers(response.data);
    } catch (error: any) {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/admin/users', form);
      setShowCreate(false);
      setForm({
        email: '',
        username: '',
        full_name: '',
        password: '',
        role: 'client',
        phone: '',
        location: '',
        whatsapp_number: '',
        specialization: ''
      });
      fetchUsers();
      success('User created successfully');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (user: User) => {
    setShowEdit(user);
    setForm({
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      password: '',
      role: user.role,
      phone: user.phone || '',
      location: user.location || '',
      whatsapp_number: (user as any).whatsapp_number || '',
      specialization: (user as any).specialization || ''
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
        role: form.role,
        phone: form.phone || null,
        location: form.location || null,
        whatsapp_number: form.whatsapp_number || null,
        specialization: form.specialization || null
      };
      
      // Include password if provided
      if (form.password) {
        updateData.password = form.password;
      }
      
      await api.put(`/api/admin/users/${showEdit.id}`, updateData);
      setShowEdit(null);
      fetchUsers();
      success('User updated successfully');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete.user) return;
    
    try {
      await api.delete(`/api/admin/users/${showDelete.user.id}`);
      setShowDelete({ open: false, user: null });
      fetchUsers();
      success('User deleted successfully');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await api.put(`/api/admin/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
      success(`User ${user.is_active ? 'suspended' : 'reactivated'} successfully`);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update user status');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400';
      case 'lawyer': return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400';
      case 'staff': return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'client': return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300';
      default: return 'bg-secondary-100 text-secondary-800';
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
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">User Management</h1>
            <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
              Manage users, roles, and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary btn-md flex items-center justify-center hover-lift hover-glow w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                className="input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="lawyer">Lawyer</option>
                <option value="staff">Staff</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-100 dark:bg-secondary-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-900 dark:text-secondary-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-secondary-900 dark:text-secondary-100">{user.full_name}</div>
                        <div className="text-sm text-secondary-600 dark:text-secondary-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
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
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className="btn-ghost btn-sm"
                          title={user.is_active ? 'Suspend' : 'Reactivate'}
                        >
                          {user.is_active ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="btn-ghost btn-sm"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {currentUser?.id !== user.id && (
                          <button
                            onClick={() => setShowDelete({ open: true, user })}
                            className="btn-ghost btn-sm text-error-600 hover:text-error-700 dark:text-error-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-secondary-600 dark:text-secondary-400">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-body">
                <h3 className="modal-title mb-4">Create New User</h3>
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
                  <div className="form-group">
                    <label className="label-required">Role</label>
                    <select
                      className="input"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      required
                    >
                      <option value="client">Client</option>
                      <option value="lawyer">Lawyer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      className="input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp Number</label>
                    <input
                      type="tel"
                      className="input"
                      value={form.whatsapp_number}
                      onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    />
                  </div>
                  {form.role === 'lawyer' && (
                    <div className="form-group">
                      <label>Specialization</label>
                      <input
                        type="text"
                        className="input"
                        value={form.specialization}
                        onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                        placeholder="e.g., Criminal Law, Corporate Law"
                      />
                    </div>
                  )}
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
                      {creating ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEdit && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-body">
                <h3 className="modal-title mb-4">Edit User</h3>
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
                  <div className="form-group">
                    <label className="label-required">Role</label>
                    <select
                      className="input"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      required
                    >
                      <option value="client">Client</option>
                      <option value="lawyer">Lawyer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      className="input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp Number</label>
                    <input
                      type="tel"
                      className="input"
                      value={form.whatsapp_number}
                      onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    />
                  </div>
                  {form.role === 'lawyer' && (
                    <div className="form-group">
                      <label>Specialization</label>
                      <input
                        type="text"
                        className="input"
                        value={form.specialization}
                        onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                        placeholder="e.g., Criminal Law, Corporate Law"
                      />
                    </div>
                  )}
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
                <h3 className="modal-title mb-2">Delete User?</h3>
                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                  This action cannot be undone. You are about to delete user "{showDelete.user.full_name}" ({showDelete.user.email}).
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

