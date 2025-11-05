'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { canCreateCases } from '@/lib/roleCheck';
import { Plus, Search, Filter, MoreVertical } from 'lucide-react';

interface Case {
  id: number;
  case_number: string;
  title: string;
  description: string;
  status: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
}

function CasesPageContent() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form, setForm] = useState({
    case_number: '',
    title: '',
    description: '',
    client_id: '',
    client_name: '',
    client_email: '',
    client_phone: ''
  });
  const caseNumRef = useRef<HTMLInputElement | null>(null);
  const { toasts, success, error: showError, removeToast } = useToast();
  const [showEdit, setShowEdit] = useState<{open: boolean, data: Case | null}>({open: false, data: null});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number; title: string }>(
    { open: false, id: 0, title: '' }
  );

  useEffect(() => {
    fetchCurrentUser();
    fetchCases();
  }, []);

  useEffect(() => {
    if (currentUser && showCreate) {
      fetchAvailableClients();
    }
  }, [currentUser, showCreate]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchAvailableClients = async () => {
    if (!currentUser) {
      console.log('No current user, skipping client fetch');
      return;
    }
    setLoadingClients(true);
    console.log('Fetching clients for user:', currentUser.role, currentUser.id);
    try {
      // For lawyers: always get ALL clients (not just assigned ones)
      // This allows lawyers to select any client when creating a case
      if (currentUser.role === 'lawyer') {
        try {
          const allClientsResponse = await api.get('/api/clients/all');
          const clients = allClientsResponse.data || [];
          console.log('Fetched all clients:', clients.length);
          setAvailableClients(clients);
          
          // If no clients found, show helpful message
          if (clients.length === 0) {
            console.warn('No clients found in system. Clients must be registered first.');
          }
        } catch (error: any) {
          console.error('Error fetching all clients:', error.response?.data || error.message);
          // Don't fallback to assigned clients - we want ALL clients
          setAvailableClients([]);
          showError('Failed to load clients. Please try again.');
        }
      } else if (currentUser.role === 'admin') {
        // Admins can see all clients
        try {
          const adminResponse = await api.get('/api/admin/users?role=client');
          console.log('Fetched admin clients:', adminResponse.data?.length || 0);
          setAvailableClients(adminResponse.data || []);
        } catch (error: any) {
          console.error('Error fetching admin clients:', error.response?.data || error.message);
          setAvailableClients([]);
        }
      } else {
        console.log('User role not lawyer or admin, cannot fetch clients');
        setAvailableClients([]);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching clients:', error);
      setAvailableClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('create') === '1') {
      setShowCreate(true);
    }
  }, [searchParams]);

  // Quick create with keyboard (N) and close modal with Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && !showCreate) {
        setShowCreate(true);
      }
      if (e.key === 'Escape' && showCreate) {
        setShowCreate(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCreate]);

  useEffect(() => {
    if (showCreate) {
      setTimeout(() => caseNumRef.current?.focus(), 0);
      if (!form.case_number) {
        const ts = new Date();
        const ymd = ts.toISOString().slice(0,10).replace(/-/g,'');
        setForm((f) => ({ ...f, case_number: `CASE-${ymd}-${Math.floor(Math.random()*900+100)}` }));
      }
      // Ensure clients are fetched when modal opens
      if (currentUser && availableClients.length === 0 && !loadingClients) {
        console.log('Modal opened, fetching clients...');
        fetchAvailableClients();
      }
    }
  }, [showCreate, currentUser]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.case_number.trim()) next.case_number = 'Case number is required';
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.client_id && !form.client_name.trim()) {
      next.client_name = 'Please select a client or enter client name';
    }
    if (form.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email)) next.client_email = 'Invalid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleClientSelect = (clientId: string) => {
    if (clientId) {
      const selectedClient = availableClients.find(c => c.id === parseInt(clientId));
      if (selectedClient) {
        setForm({
          ...form,
          client_id: clientId,
          client_name: selectedClient.full_name || '',
          client_email: selectedClient.email || '',
          client_phone: selectedClient.phone || ''
        });
      }
    } else {
      // Clear client selection
      setForm({
        ...form,
        client_id: '',
        client_name: '',
        client_email: '',
        client_phone: ''
      });
    }
  };

  const fetchCases = async () => {
    try {
      const response = await api.get('/api/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
      showError('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const createCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    if (!validate()) { setCreating(false); return; }
    try {
      const payload = {
        ...form,
        client_id: form.client_id ? parseInt(form.client_id) : null
      };
      await api.post('/api/cases', payload);
      setShowCreate(false);
      setForm({ case_number: '', title: '', description: '', client_id: '', client_name: '', client_email: '', client_phone: '' });
      fetchCases();
      success('Case created successfully');
    } catch (error: any) {
      console.error('Error creating case:', error);
      const apiDetail = error?.response?.data?.detail;
      setFormError(typeof apiDetail === 'string' ? apiDetail : 'Failed to create case. Please check inputs and try again.');
    } finally {
      setCreating(false);
    }
  };

  const saveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit.data) return;
    setSaving(true);
    try {
      const payload = {
        title: showEdit.data.title,
        description: showEdit.data.description,
        client_name: showEdit.data.client_name,
        client_email: showEdit.data.client_email,
        client_phone: showEdit.data.client_phone,
        status: showEdit.data.status
      };
      await api.put(`/api/cases/${showEdit.data.id}`, payload);
      setShowEdit({open: false, data: null});
      fetchCases();
      success('Case updated');
    } catch (error) {
      console.error('Error saving case:', error);
      showError('Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const deleteCase = async () => {
    try {
      await api.delete(`/api/cases/${confirmDelete.id}`);
      setConfirmDelete({ open: false, id: 0, title: '' });
      fetchCases();
      success('Case deleted');
    } catch (error) {
      console.error('Error deleting case:', error);
      showError('Failed to delete case');
    }
  };

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || case_.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'closed':
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400';
      default:
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400';
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                {currentUser?.role === 'client' ? 'My Cases' : 'Cases'}
              </h1>
              <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
                {currentUser?.role === 'client' 
                  ? 'View and track your legal cases'
                  : 'Manage your legal cases and client information efficiently.'}
              </p>
            </div>
            {canCreateCases(currentUser?.role) && (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary btn-md flex items-center justify-center hover-lift hover-glow w-full sm:w-auto"
                title="New Case (shortcut: N)"
                aria-label="Create new case"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select className="input" onChange={(e)=>{
                const v=e.target.value;
                const sorted=[...cases].sort((a,b)=>{
                  if(v==='newest') return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
                  if(v==='oldest') return new Date(a.created_at).getTime()-new Date(b.created_at).getTime();
                  if(v==='title') return a.title.localeCompare(b.title);
                  return 0;
                });
                setCases(sorted);
              }} defaultValue="newest">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-body">
                <h3 className="modal-title mb-4">Create New Case</h3>
                {formError && (
                  <div className="alert-destructive mb-4">{formError}</div>
                )}
                <form onSubmit={createCase} className="form-row gap-4">
                  <div className="form-group">
                    <label className="label-required">Case Number</label>
                    <input ref={caseNumRef} required className={`input ${errors.case_number ? 'input-error' : ''}`} value={form.case_number} onChange={e=>setForm({...form, case_number: e.target.value})} />
                    {errors.case_number && <p className="form-error">{errors.case_number}</p>}
                  </div>
                  <div className="form-group">
                    <label className="label-required">Title</label>
                    <input required className={`input ${errors.title ? 'input-error' : ''}`} value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
                    {errors.title && <p className="form-error">{errors.title}</p>}
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="label">Description</label>
                    <textarea className="input" rows={3} value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="label-required">Select Client</label>
                    <select
                      className={`input ${errors.client_name ? 'input-error' : ''}`}
                      value={form.client_id}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      disabled={loadingClients}
                    >
                      <option value="">-- Select a client --</option>
                      {loadingClients ? (
                        <option disabled>Loading clients...</option>
                      ) : availableClients.length > 0 ? (
                        availableClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.full_name || client.email} ({client.email})
                          </option>
                        ))
                      ) : (
                        <option disabled value="">No clients available</option>
                      )}
                    </select>
                    {errors.client_name && <p className="form-error">{errors.client_name}</p>}
                    {availableClients.length === 0 && !loadingClients && currentUser && (
                      <div className="mt-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                        <p className="text-xs text-warning-700 dark:text-warning-300">
                          {currentUser.role === 'lawyer' 
                            ? 'No clients found in the system. Please ensure clients are registered before creating cases. You can create cases for any registered client, even if they are not yet assigned to you.' 
                            : 'No clients available. Please contact an administrator.'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="label">Client Name</label>
                    <input
                      className={`input ${errors.client_name ? 'input-error' : ''}`}
                      value={form.client_name}
                      onChange={e=>setForm({...form, client_name: e.target.value})}
                      placeholder="Auto-filled when client selected"
                    />
                    {errors.client_name && <p className="form-error">{errors.client_name}</p>}
                  </div>
                  <div className="form-group">
                    <label className="label">Client Email</label>
                    <input
                      type="email"
                      className={`input ${errors.client_email ? 'input-error' : ''}`}
                      value={form.client_email}
                      onChange={e=>setForm({...form, client_email: e.target.value})}
                      placeholder="Auto-filled when client selected"
                    />
                    {errors.client_email && <p className="form-error">{errors.client_email}</p>}
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="label">Client Phone</label>
                    <input
                      className="input"
                      value={form.client_phone}
                      onChange={e=>setForm({...form, client_phone: e.target.value})}
                      placeholder="Auto-filled when client selected"
                    />
                  </div>
                  <div className="modal-footer md:col-span-2">
                    <button
                      type="button"
                      onClick={()=>setShowCreate(false)}
                      className="btn-secondary btn-md"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={creating}
                      type="submit"
                      className="btn-primary btn-md inline-flex items-center gap-2"
                      aria-disabled={creating}
                    >
                      {creating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Create Case</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEdit.open && showEdit.data && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-body">
                <h3 className="modal-title mb-4">Edit Case</h3>
                <form onSubmit={saveCase} className="form-row gap-4">
                  <div className="form-group">
                    <label className="label">Case Number</label>
                    <input disabled className="input bg-secondary-100 dark:bg-secondary-700" value={showEdit.data.case_number} />
                  </div>
                  <div className="form-group">
                    <label className="label-required">Title</label>
                    <input required className="input" value={showEdit.data.title} onChange={e=>setShowEdit({open:true, data:{...showEdit.data!, title: e.target.value}})} />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="label">Description</label>
                    <textarea className="input" rows={3} value={showEdit.data.description} onChange={e=>setShowEdit({open:true, data:{...showEdit.data!, description: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="label-required">Client Name</label>
                    <input required className="input" value={showEdit.data.client_name} onChange={e=>setShowEdit({open:true, data:{...showEdit.data!, client_name: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Client Email</label>
                    <input type="email" className="input" value={showEdit.data.client_email} onChange={e=>setShowEdit({open:true, data:{...showEdit.data!, client_email: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Client Phone</label>
                    <input className="input" value={showEdit.data.client_phone} onChange={e=>setShowEdit({open:true, data:{...showEdit.data!, client_phone: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Status</label>
                    <select className="input" value={showEdit.data.status} onChange={e=>setShowEdit({open:true, data:{...showEdit.data!, status: e.target.value}})}>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="modal-footer md:col-span-2">
                    <button
                      type="button"
                      onClick={()=>setShowEdit({open:false, data:null})}
                      className="btn-secondary btn-md"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={saving}
                      type="submit"
                      className="btn-primary btn-md inline-flex items-center gap-2"
                      aria-disabled={saving}
                    >
                      {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Cases Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
              <thead className="bg-secondary-50 dark:bg-secondary-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                {filteredCases.map((case_) => (
                  <tr key={case_.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          <a href={`/cases/${case_.id}`} className="text-primary-600 hover:underline">{case_.case_number}</a>
                        </div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400">
                          {case_.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {case_.client_name}
                        </div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400">
                          {case_.client_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(case_.status)}`}>
                        {case_.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                      {new Date(case_.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {canCreateCases(currentUser?.role) && (
                          <>
                            <button className="btn-ghost btn-sm text-primary-600 dark:text-primary-400" onClick={()=>setShowEdit({open:true, data: case_})}>Edit</button>
                            <select
                              className="input text-xs h-8 px-2 py-1"
                              value={case_.status}
                              onChange={async (e)=>{
                                try { await api.put(`/api/cases/${case_.id}`, { status: e.target.value }); fetchCases(); } catch(e){ alert('Failed to update status'); }
                              }}
                            >
                              <option value="open">Open</option>
                              <option value="pending">Pending</option>
                              <option value="closed">Closed</option>
                            </select>
                            <button
                              className="btn-ghost btn-sm text-error-600 dark:text-error-400"
                              onClick={() => setConfirmDelete({ open: true, id: case_.id, title: case_.title })}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {currentUser?.role === 'client' && (
                          <span className="text-xs text-secondary-500 dark:text-secondary-400">
                            View Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCases.length === 0 && (
            <div className="text-center py-12">
              <div className="text-secondary-500 dark:text-secondary-400">
                {cases.length === 0 ? 'No cases found. Create your first case to get started.' : 'No cases match your search criteria.'}
              </div>
            </div>
          )}
        </div>

        {/* Floating Create Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowCreate(true)}
            className="h-12 w-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-xl flex items-center justify-center hover-lift hover-glow"
            title="New Case (N)"
            aria-label="Create new case"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Confirm Delete Case Modal */}
        {confirmDelete.open && (
          <div className="modal-overlay">
            <div className="modal-container max-w-md">
              <div className="modal-body">
                <h3 className="modal-title mb-2">Delete case?</h3>
                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                  This action cannot be undone. You are about to delete "{confirmDelete.title}".
                </p>
                <div className="modal-footer">
                  <button
                    onClick={() => setConfirmDelete({ open: false, id: 0, title: '' })}
                    className="btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteCase}
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

export default function CasesPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    }>
      <CasesPageContent />
    </Suspense>
  );
}
