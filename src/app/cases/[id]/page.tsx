'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { 
  ArrowLeft, FolderOpen, FileText, CheckCircle2, Plus, 
  Users, Calendar, Clock, BookOpen, Trash2, Edit, 
  X, Save, Bell, AlertCircle, CheckCircle, UserPlus,
  Calendar as CalendarIcon, FileEdit, Gavel, Upload,
  MoreVertical, Eye, Download, Move, Copy, MessageCircle, MapPin,
  UserPlus as AddCollaborator, ArrowRightLeft, UserMinus
} from 'lucide-react';

type Tab = 'overview' | 'timeline' | 'participants' | 'dates' | 'notes' | 'documents';

interface Participant {
  id: number;
  participant_type: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  organization?: string;
  notes?: string;
}

interface TimelineEvent {
  id: number;
  event_type: string;
  title: string;
  description?: string;
  event_date?: string;
  location?: string;
  is_completed?: boolean;
  completed_at?: string;
  created_at: string;
}

interface ImportantDate {
  id: number;
  date_type: string;
  title: string;
  description?: string;
  due_date: string;
  reminder_days: number;
  is_completed: boolean;
  completed_at?: string;
}

interface CaseNote {
  id: number;
  title?: string;
  content: string;
  note_type: string;
  created_at: string;
  updated_at?: string;
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableLawyers, setAvailableLawyers] = useState<any[]>([]);
  
  // Data for each tab
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  
  // Modals for transfer and collaborators
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ new_lawyer_id: '', transfer_notes: '' });
  const [collaboratorForm, setCollaboratorForm] = useState({ lawyer_id: '', role: 'collaborator', notes: '' });
  
  // Document-related state
  const [uploading, setUploading] = useState(false);
  const [openDocumentMenuId, setOpenDocumentMenuId] = useState<number | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<{ isOpen: boolean; docId: number; filename: string }>({ isOpen: false, docId: 0, filename: '' });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, content: '', filename: '', fileType: '', isPDF: false, isExcel: false, isCSV: false });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean, doc: any | null }>({ isOpen: false, doc: null });
  const [summaryModal, setSummaryModal] = useState<{ isOpen: boolean, text: string, loading: boolean }>({ isOpen: false, text: '', loading: false });
  
  // Modals/Forms
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<CaseNote | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  
  // Form states
  const [participantForm, setParticipantForm] = useState({
    participant_type: 'lawyer',
    name: '',
    email: '',
    phone: '',
    role: '',
    organization: '',
    notes: ''
  });
  const [eventForm, setEventForm] = useState({
    event_type: 'hearing',
    title: '',
    description: '',
    event_date: '',
    location: ''
  });
  const [dateForm, setDateForm] = useState({
    date_type: 'hearing',
    title: '',
    description: '',
    due_date: '',
    reminder_days: 3
  });
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    note_type: 'general'
  });
  
  const { toasts, success, error: showError, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'lawyer') {
      fetchAvailableLawyers();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchAvailableLawyers = async () => {
    try {
      const response = await api.get('/api/lawyers/recommend?limit=100');
      setAvailableLawyers(response.data || []);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    }
  };

  const loadAllData = async () => {
    try {
      const [c, d, p, e, dates, n, collabs] = await Promise.all([
          api.get(`/api/cases/${id}`),
          api.get('/api/documents', { params: { case_id: id } }),
        api.get(`/api/cases/${id}/participants`),
        api.get(`/api/cases/${id}/events`),
        api.get(`/api/cases/${id}/important-dates`),
        api.get(`/api/cases/${id}/notes`),
        api.get(`/api/cases/${id}/collaborators`).catch(() => ({ data: [] }))
        ]);
        setCaseData(c.data);
        setDocuments(d.data || []);
      setParticipants(p.data || []);
      setEvents(e.data || []);
      setImportantDates(dates.data || []);
      setNotes(n.data || []);
      setCollaborators(collabs.data || []);
    } catch (err: any) {
      if (err.response?.status === 404) {
        showError('Case not found');
        router.push('/cases');
      } else {
        showError('Failed to load case data');
      }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!Number.isNaN(id)) loadAllData();
  }, [id]);

  const closeCase = async () => {
    if (!caseData) return;
    try {
    await api.put(`/api/cases/${id}`, { status: 'closed' });
      await loadAllData();
      success('Case closed');
    } catch {
      showError('Failed to close case');
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        await api.put(`/api/cases/${id}/participants/${editingParticipant.id}`, participantForm);
        success('Participant updated');
      } else {
        await api.post(`/api/cases/${id}/participants`, participantForm);
        success('Participant added');
      }
      setShowParticipantModal(false);
      setEditingParticipant(null);
      setParticipantForm({
        participant_type: 'lawyer',
        name: '',
        email: '',
        phone: '',
        role: '',
        organization: '',
        notes: ''
      });
      await loadAllData();
    } catch {
      showError(editingParticipant ? 'Failed to update participant' : 'Failed to add participant');
    }
  };

  const handleEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant);
    setParticipantForm({
      participant_type: participant.participant_type,
      name: participant.name,
      email: participant.email || '',
      phone: participant.phone || '',
      role: participant.role || '',
      organization: participant.organization || '',
      notes: participant.notes || ''
    });
    setShowParticipantModal(true);
  };

  const handleDeleteParticipant = async (participantId: number) => {
    try {
      await api.delete(`/api/cases/${id}/participants/${participantId}`);
      await loadAllData();
      success('Participant removed');
    } catch {
      showError('Failed to remove participant');
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        event_date: eventForm.event_date ? new Date(eventForm.event_date).toISOString() : null
      };
      if (editingEvent) {
        await api.put(`/api/cases/${id}/events/${editingEvent.id}`, payload);
        success('Event updated');
      } else {
        await api.post(`/api/cases/${id}/events`, payload);
        success('Event added to timeline');
      }
      setShowEventModal(false);
      setEditingEvent(null);
      setEventForm({
        event_type: 'hearing',
        title: '',
        description: '',
        event_date: '',
        location: ''
      });
      await loadAllData();
    } catch {
      showError(editingEvent ? 'Failed to update event' : 'Failed to add event');
    }
  };

  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    setEventForm({
      event_type: event.event_type,
      title: event.title,
      description: event.description || '',
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
      location: event.location || ''
    });
    setShowEventModal(true);
  };

  const handleMarkEventComplete = async (eventId: number, isCompleted: boolean) => {
    try {
      await api.put(`/api/cases/${id}/events/${eventId}/complete?is_completed=${isCompleted}`);
      await loadAllData();
      success(isCompleted ? 'Event marked as done' : 'Event marked as incomplete');
    } catch {
      showError('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await api.delete(`/api/cases/${id}/events/${eventId}`);
      await loadAllData();
      success('Event deleted');
    } catch {
      showError('Failed to delete event');
    }
  };

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...dateForm,
        due_date: new Date(dateForm.due_date).toISOString()
      };
      if (editingDate) {
        await api.put(`/api/cases/${id}/important-dates/${editingDate.id}`, payload);
        success('Important date updated');
      } else {
        await api.post(`/api/cases/${id}/important-dates`, payload);
        success('Important date added');
      }
      setShowDateModal(false);
      setEditingDate(null);
      setDateForm({
        date_type: 'hearing',
        title: '',
        description: '',
        due_date: '',
        reminder_days: 3
      });
      await loadAllData();
    } catch {
      showError(editingDate ? 'Failed to update date' : 'Failed to add date');
    }
  };

  const handleEditDate = (date: ImportantDate) => {
    setEditingDate(date);
    setDateForm({
      date_type: date.date_type,
      title: date.title,
      description: date.description || '',
      due_date: new Date(date.due_date).toISOString().slice(0, 16),
      reminder_days: date.reminder_days
    });
    setShowDateModal(true);
  };

  const handleToggleDateComplete = async (dateId: number, isCompleted: boolean) => {
    try {
      await api.put(`/api/cases/${id}/important-dates/${dateId}`, null, { params: { is_completed: !isCompleted } });
      await loadAllData();
      success(isCompleted ? 'Date marked incomplete' : 'Date marked complete');
    } catch {
      showError('Failed to update date');
    }
  };

  const handleDeleteDate = async (dateId: number) => {
    try {
      await api.delete(`/api/cases/${id}/important-dates/${dateId}`);
      await loadAllData();
      success('Date deleted');
    } catch {
      showError('Failed to delete date');
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await api.put(`/api/cases/${id}/notes/${editingNote.id}`, noteForm);
        success('Note updated');
      } else {
        await api.post(`/api/cases/${id}/notes`, noteForm);
        success('Note added');
      }
      setShowNoteModal(false);
      setEditingNote(null);
      setNoteForm({ title: '', content: '', note_type: 'general' });
      await loadAllData();
    } catch {
      showError('Failed to save note');
    }
  };

  const handleEditNote = (note: CaseNote) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title || '',
      content: note.content,
      note_type: note.note_type
    });
    setShowNoteModal(true);
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await api.delete(`/api/cases/${id}/notes/${noteId}`);
      await loadAllData();
      success('Note deleted');
    } catch {
      showError('Failed to delete note');
    }
  };

  // Document handlers
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('case_id', id.toString());
        formData.append('folder_path', '/');

        await api.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      success(`Successfully uploaded ${files.length} document(s)`);
      await loadAllData();
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownloadDocument = async (docId: number, filename: string) => {
    try {
      const response = await api.get(`/api/documents/${docId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Document downloaded');
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document');
    }
  };

  const handlePreviewDocument = async (docId: number, filename: string) => {
    try {
      const doc = documents.find((d: any) => d.id === docId);
      const fileType = doc?.file_type || '';
      const filenameLower = filename.toLowerCase();
      const isPDF = fileType === 'application/pdf' || filenameLower.endsWith('.pdf');
      const isExcel = fileType.includes('excel') || fileType.includes('spreadsheet') || 
                     filenameLower.endsWith('.xls') || filenameLower.endsWith('.xlsx');
      const isCSV = fileType === 'text/csv' || filenameLower.endsWith('.csv');
      
      if (isPDF) {
        // For PDFs, create a blob URL and show in iframe
        const response = await api.get(`/api/documents/${docId}/preview`, {
          responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewModal({
          isOpen: true,
          content: url,
          filename: filename,
          fileType: fileType,
          isPDF: true,
          isExcel: false,
          isCSV: false
        });
      } else if (isExcel) {
        // For Excel files, try to get blob first, fallback to text
        try {
          const response = await api.get(`/api/documents/${docId}/preview`, {
            responseType: 'blob',
          });
          const blob = new Blob([response.data], { type: fileType });
          const url = URL.createObjectURL(blob);
          setPreviewModal({
            isOpen: true,
            content: url,
            filename: filename,
            fileType: fileType,
            isPDF: false,
            isExcel: true,
            isCSV: false
          });
        } catch {
          // Fallback to text extraction
          const response = await api.get(`/api/documents/${docId}/preview`);
          setPreviewModal({
            isOpen: true,
            content: response.data.content || 'No preview available',
            filename: filename,
            fileType: fileType,
            isPDF: false,
            isExcel: false,
            isCSV: false
          });
        }
      } else {
        // For other file types (CSV, DOCX, TXT, etc.), get text content
        const response = await api.get(`/api/documents/${docId}/preview`);
        setPreviewModal({
          isOpen: true,
          content: response.data.content || 'No preview available',
          filename: filename,
          fileType: fileType,
          isPDF: false,
          isExcel: false,
          isCSV: isCSV
        });
      }
    } catch (error) {
      console.error('Error previewing document:', error);
      showError('Failed to preview document');
    }
  };

  const openDocumentDetails = async (docId: number) => {
    try {
      const response = await api.get(`/api/documents/${docId}`);
      setDetailsModal({ isOpen: true, doc: response.data });
    } catch (error) {
      console.error('Error fetching document details:', error);
      showError('Failed to load details');
    }
  };

  const handleGetSummary = async (docId: number) => {
    try {
      setSummaryModal({ isOpen: true, text: 'Generating summary...', loading: true });
      const res = await api.post(`/api/documents/${docId}/summarize`);
      const summaryText = res.data?.summary || 'No summary available.';
      setSummaryModal({ isOpen: true, text: summaryText, loading: false });
    } catch (error) {
      console.error('Error getting summary:', error);
      showError('Failed to get summary');
      setSummaryModal({ isOpen: false, text: '', loading: false });
    }
  };

  const handleChatWithDocument = (docId: number, filename: string) => {
    window.location.href = `/chat?documentId=${docId}&documentName=${encodeURIComponent(filename)}`;
  };

  const handleCopyDocument = async (docId: number) => {
    try {
      await api.post(`/api/documents/${docId}/copy`, {
        destination_folder: '/'
      });
      await loadAllData();
      success('Document copied successfully');
    } catch (error) {
      console.error('Error copying document:', error);
      showError('Failed to copy document');
    }
  };

  const requestDeleteDocument = (docId: number, filename: string) => {
    setConfirmDeleteDoc({ isOpen: true, docId, filename });
  };

  const handleDeleteDocument = async () => {
    try {
      await api.delete(`/api/documents/${confirmDeleteDoc.docId}`);
      success('Document deleted successfully');
      await loadAllData();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
    } finally {
      setConfirmDeleteDoc({ isOpen: false, docId: 0, filename: '' });
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-document-menu]') && !target.closest('[data-document-menu-button]')) {
        setOpenDocumentMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !caseData) {
    return (
      <DashboardLayout>
        <div className="h-64 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-200 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: FolderOpen },
    { id: 'documents' as Tab, label: 'Documents', icon: FileText },
    { id: 'timeline' as Tab, label: 'Timeline', icon: Clock },
    { id: 'participants' as Tab, label: 'Participants', icon: Users },
    { id: 'dates' as Tab, label: 'Important Dates', icon: Calendar },
    { id: 'notes' as Tab, label: 'Notes', icon: BookOpen },
  ];

  const getDateStatus = (date: ImportantDate) => {
    const dueDate = new Date(date.due_date);
    const now = new Date();
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (date.is_completed) return { label: 'Completed', color: 'text-success-600', bg: 'bg-success-100 dark:bg-success-900/20' };
    if (daysUntil < 0) return { label: 'Overdue', color: 'text-error-600', bg: 'bg-error-100 dark:bg-error-900/20' };
    if (daysUntil <= date.reminder_days) return { label: 'Due Soon', color: 'text-warning-600', bg: 'bg-warning-100 dark:bg-warning-900/20' };
    return { label: 'Upcoming', color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/20' };
  };

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="space-y-6">
        <button onClick={() => router.push('/cases')} className="inline-flex items-center text-sm text-secondary-600 hover:text-primary-600">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to cases
        </button>

        {/* Case Header */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{caseData.title}</h1>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                {caseData.case_number} • <span className={`capitalize ${caseData.status === 'open' ? 'text-success-600' : caseData.status === 'closed' ? 'text-secondary-500' : 'text-warning-600'}`}>{caseData.status}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(currentUser?.role === 'lawyer' && caseData.lawyer_id === currentUser.id) || currentUser?.role === 'admin' ? (
                <>
                  <button onClick={() => setShowTransferModal(true)} className="btn-secondary btn-sm inline-flex items-center gap-2" title="Transfer Case">
                    <ArrowRightLeft className="h-4 w-4" /> <span className="hidden sm:inline">Transfer</span>
                  </button>
                  <button onClick={() => setShowCollaboratorModal(true)} className="btn-secondary btn-sm inline-flex items-center gap-2" title="Add Collaborator">
                    <AddCollaborator className="h-4 w-4" /> <span className="hidden sm:inline">Collaborate</span>
                  </button>
                </>
              ) : null}
            {caseData.status !== 'closed' && (
                <button onClick={closeCase} className="btn-secondary btn-sm inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> <span className="hidden sm:inline">Close Case</span>
              </button>
            )}
            </div>
          </div>
          <div className="mt-4 text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">{caseData.description || 'No description'}</div>
        </div>

        {/* Tabs */}
          <div className="card p-0">
            <div className="border-b border-secondary-200 dark:border-secondary-700">
             <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
                     }`}
                    >
                     <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                     <span className="hidden sm:inline">{tab.label}</span>
                     <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Case Team Card */}
                {(currentUser?.role === 'lawyer' || currentUser?.role === 'admin') && (
                  <div className="card hover-lift">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Case Team</h3>
                      {caseData?.lawyer && (
                        <div className="mb-4">
                          <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Primary Lawyer</div>
                          <div className="font-medium text-secondary-900 dark:text-secondary-100">
                            {caseData.lawyer.full_name || caseData.lawyer.email}
                          </div>
                        </div>
                      )}
                      {collaborators.length > 0 && (
                        <div>
                          <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">Collaborators</div>
                          <div className="space-y-2">
                            {collaborators.map((collab) => (
                              <div key={collab.id} className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                                <div>
                                  <div className="font-medium text-secondary-900 dark:text-secondary-100">
                                    {collab.full_name || collab.email}
                                  </div>
                                  <div className="text-xs text-secondary-500 dark:text-secondary-400">{collab.email}</div>
                                </div>
                                {(currentUser?.role === 'lawyer' && caseData?.lawyer_id === currentUser.id) || currentUser?.role === 'admin' ? (
                                  <button
                                    onClick={async () => {
                                      if (confirm('Remove this collaborator?')) {
                                        try {
                                          await api.delete(`/api/cases/${id}/collaborators/${collab.id}`);
                                          success('Collaborator removed');
                                          loadAllData();
                                        } catch (error: any) {
                                          showError(error.response?.data?.detail || 'Failed to remove collaborator');
                                        }
                                      }
                                    }}
                                    className="btn-ghost btn-xs text-error-600 hover:text-error-700"
                                    title="Remove Collaborator"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Client Information Card */}
                <div className="card hover-lift">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">Client Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 w-20">Name:</span>
                      <span className="text-sm text-secondary-900 dark:text-secondary-100 flex-1">{caseData.client_name}</span>
                    </div>
                    {caseData.client_email && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 w-20">Email:</span>
                        <span className="text-sm text-secondary-900 dark:text-secondary-100 flex-1 break-all">{caseData.client_email}</span>
                      </div>
                    )}
                    {caseData.client_phone && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 w-20">Phone:</span>
                        <span className="text-sm text-secondary-900 dark:text-secondary-100 flex-1">{caseData.client_phone}</span>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Quick Stats Card */}
                <div className="card hover-lift">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">Quick Stats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{documents.length}</div>
                      <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Documents</div>
                    </div>
                    <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-success-600 dark:text-success-400">{participants.length}</div>
                      <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Participants</div>
                    </div>
                    <div className="text-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">{events.length}</div>
                      <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Timeline Events</div>
                    </div>
                    <div className="text-center p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{importantDates.length}</div>
                      <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Important Dates</div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Documents Card */}
                <div className="card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">Documents</h3>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="btn-ghost btn-sm text-primary-600 dark:text-primary-400"
                    >
                      View All
                    </button>
                  </div>
            {documents.length === 0 ? (
                    <div className="text-center py-6 text-secondary-600 dark:text-secondary-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-secondary-400 dark:text-secondary-600" />
                      <p className="text-sm">No documents linked to this case.</p>
                      <button
                        onClick={() => setActiveTab('documents')}
                        className="btn-primary btn-sm mt-3 inline-flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" /> Upload Document
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.slice(0, 5).map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <FileText className="h-5 w-5 text-primary-500" />
                    </div>
                            <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate" title={d.original_filename}>
                              {d.original_filename}
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveTab('documents')}
                            className="btn-ghost btn-xs text-primary-600 dark:text-primary-400 flex-shrink-0"
                          >
                            View
                          </button>
                        </div>
                      ))}
                      {documents.length > 5 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setActiveTab('documents')}
                            className="btn-ghost btn-sm text-primary-600 dark:text-primary-400"
                          >
                            View all {documents.length} documents →
                          </button>
                        </div>
            )}
          </div>
                  )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">Case Timeline</h3>
                      <button onClick={() => setShowEventModal(true)} className="btn-primary btn-sm inline-flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Event
                      </button>
                    </div>
                  </div>
                </div>
            {events.length === 0 ? (
                  <div className="card hover-lift p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-secondary-400 dark:text-secondary-600" />
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">No timeline events yet. Add events to track case progress.</p>
                    <button onClick={() => setShowEventModal(true)} className="btn-primary btn-sm inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add First Event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className={`card p-5 ${event.is_completed ? 'opacity-75' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium capitalize">
                                {event.event_type}
                              </span>
                              {event.is_completed && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 font-medium flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Completed
                                </span>
                              )}
                            </div>
                            <h4 className={`text-base font-semibold mb-2 ${event.is_completed ? 'line-through text-secondary-500 dark:text-secondary-400' : 'text-secondary-900 dark:text-secondary-100'}`}>
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 leading-relaxed">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap text-xs text-secondary-500 dark:text-secondary-500">
                              {event.event_date && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <span>Created {new Date(event.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => handleEditEvent(event)} className="btn-ghost btn-xs p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleMarkEventComplete(event.id, !event.is_completed || false)} className={`btn-ghost btn-xs p-2 ${event.is_completed ? 'text-success-600 dark:text-success-400' : 'text-secondary-600 dark:text-secondary-400'}`} title={event.is_completed ? 'Mark incomplete' : 'Mark as done'}>
                              {event.is_completed ? <CheckCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <button onClick={() => handleDeleteEvent(event.id)} className="btn-ghost btn-xs p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
            )}
          </div>
            )}

            {activeTab === 'participants' && (
              <div className="space-y-6">
                <div className="card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">People Involved</h3>
                      <button onClick={() => setShowParticipantModal(true)} className="btn-primary btn-sm inline-flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Add Participant
                      </button>
        </div>
      </div>
                </div>
                {participants.length === 0 ? (
                  <div className="card hover-lift p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 text-secondary-400 dark:text-secondary-600" />
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">No participants added yet. Add lawyers, clients, witnesses, and other people involved in this case.</p>
                    <button onClick={() => setShowParticipantModal(true)} className="btn-primary btn-sm inline-flex items-center gap-2">
                      <UserPlus className="h-4 w-4" /> Add First Participant
                    </button>
        </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {participants.map((p) => (
                      <div key={p.id} className="card p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium capitalize">
                                {p.participant_type}
                              </span>
      </div>
                            <h4 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-2 truncate" title={p.name}>
                              {p.name}
                            </h4>
                            {p.role && (
                              <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{p.role}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => handleEditParticipant(p)} className="btn-ghost btn-xs p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteParticipant(p.id)} className="btn-ghost btn-xs p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {p.organization && (
                            <div className="flex items-start">
                              <span className="text-secondary-500 dark:text-secondary-400 w-20 flex-shrink-0">Org:</span>
                              <span className="text-secondary-700 dark:text-secondary-300 flex-1">{p.organization}</span>
                            </div>
                          )}
                          {p.email && (
                            <div className="flex items-start">
                              <span className="text-secondary-500 dark:text-secondary-400 w-20 flex-shrink-0">Email:</span>
                              <span className="text-secondary-700 dark:text-secondary-300 flex-1 break-all">{p.email}</span>
                            </div>
                          )}
                          {p.phone && (
                            <div className="flex items-start">
                              <span className="text-secondary-500 dark:text-secondary-400 w-20 flex-shrink-0">Phone:</span>
                              <span className="text-secondary-700 dark:text-secondary-300 flex-1">{p.phone}</span>
                            </div>
                          )}
                          {p.notes && (
                            <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
                              <p className="text-xs text-secondary-500 dark:text-secondary-400 italic leading-relaxed">{p.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dates' && (
              <div className="space-y-6">
                <div className="card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">Important Dates & Deadlines</h3>
                      <button onClick={() => setShowDateModal(true)} className="btn-primary btn-sm inline-flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Add Date
                      </button>
                    </div>
                  </div>
                </div>
                {importantDates.length === 0 ? (
                  <div className="card hover-lift p-8 text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-secondary-400 dark:text-secondary-600" />
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">No important dates set. Add hearing dates, deadlines, and reminders.</p>
                    <button onClick={() => setShowDateModal(true)} className="btn-primary btn-sm inline-flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Add First Date
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {importantDates.map((date) => {
                      const status = getDateStatus(date);
                      const dueDate = new Date(date.due_date);
                      const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={date.id} className={`card p-5 ${date.is_completed ? 'opacity-75' : ''} ${daysUntil < 0 && !date.is_completed ? 'border-l-4 border-error-500' : daysUntil <= date.reminder_days && !date.is_completed ? 'border-l-4 border-warning-500' : ''}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className={`text-xs px-2.5 py-1 rounded-full ${status.bg} ${status.color} font-medium capitalize`}>
                                  {date.date_type}
                                </span>
                                {date.is_completed && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 font-medium flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Completed
                                  </span>
                                )}
                                {!date.is_completed && daysUntil < 0 && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 font-medium">
                                    Overdue
                                  </span>
                                )}
                                {!date.is_completed && daysUntil > 0 && daysUntil <= date.reminder_days && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 font-medium">
                                    Due Soon
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-base font-semibold mb-2 ${date.is_completed ? 'line-through text-secondary-500 dark:text-secondary-400' : 'text-secondary-900 dark:text-secondary-100'}`}>
                                {date.title}
                              </h4>
                              {date.description && (
                                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 leading-relaxed">
                                  {date.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 flex-wrap text-xs text-secondary-500 dark:text-secondary-500">
                                <div className="flex items-center gap-1.5">
                                  <CalendarIcon className="h-3.5 w-3.5" />
                                  <span className="font-medium">{dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                  <span className="text-secondary-400">at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {!date.is_completed && (
                                  <div className={`flex items-center gap-1.5 ${daysUntil < 0 ? 'text-error-600 dark:text-error-400 font-medium' : daysUntil <= date.reminder_days ? 'text-warning-600 dark:text-warning-400 font-medium' : ''}`}>
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days remaining`}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Bell className="h-3.5 w-3.5" />
                                  <span>Reminder: {date.reminder_days} days before</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleToggleDateComplete(date.id, date.is_completed)}
                                className={`btn-ghost btn-xs p-2 ${date.is_completed ? 'text-success-600 dark:text-success-400' : 'text-secondary-600 dark:text-secondary-400'}`}
                                title={date.is_completed ? 'Mark incomplete' : 'Mark complete'}
                              >
                                {date.is_completed ? <CheckCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              </button>
                              <button onClick={() => handleEditDate(date)} className="btn-ghost btn-xs p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400" title="Edit">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteDate(date.id)} className="btn-ghost btn-xs p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">Case Documents</h3>
                      <label className="btn-primary btn-sm inline-flex items-center gap-2 cursor-pointer">
                        <Upload className="h-4 w-4" /> Upload Document
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc,.txt,.csv,.xls,.xlsx,.md,.json,.xml"
                          onChange={handleUploadDocument}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                {uploading && (
                  <div className="card p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-3"></div>
                    <p className="text-secondary-600 dark:text-secondary-400">Uploading documents...</p>
                  </div>
                )}
                {!uploading && documents.length === 0 ? (
                  <div className="card p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-secondary-400 dark:text-secondary-600" />
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">No documents linked to this case. Upload documents to get started.</p>
                    <label className="btn-primary btn-sm inline-flex items-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" /> Upload First Document
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.doc,.txt,.csv,.xls,.xlsx,.md,.json,.xml"
                        onChange={handleUploadDocument}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="card p-4 hover-lift">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                                <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              </div>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 truncate" title={doc.original_filename}>
                                {doc.original_filename}
                              </h4>
                              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                                {doc.file_type?.toUpperCase()} • {(doc.file_size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <div className="relative" data-document-menu>
                            <button
                              className={`btn-ghost btn-xs p-1.5 ${openDocumentMenuId === doc.id ? 'bg-secondary-100 dark:bg-secondary-700' : ''}`}
                              onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(openDocumentMenuId === doc.id ? null : doc.id); }}
                              data-document-menu-button
                            >
                              <MoreVertical className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                            </button>
                            
                            {openDocumentMenuId === doc.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-10">
                                <button
                                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(null); openDocumentDetails(doc.id); }}
                                >
                                  <Eye className="h-4 w-4 mr-2" /> Details
                                </button>
                                <button
                                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(null); handleGetSummary(doc.id); }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" /> Get Summary
                                </button>
                                <button
                                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(null); handleChatWithDocument(doc.id, doc.original_filename); }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" /> Chat with Document
                                </button>
                                <button
                                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(null); handlePreviewDocument(doc.id, doc.original_filename); }}
                                >
                                  <Eye className="h-4 w-4 mr-2" /> Preview
                                </button>
                                <button
                                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(null); handleDownloadDocument(doc.id, doc.original_filename); }}
                                >
                                  <Download className="h-4 w-4 mr-2" /> Download
                                </button>
                                <button
                                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(null); handleCopyDocument(doc.id); }}
                                >
                                  <Copy className="h-4 w-4 mr-2" /> Make a Copy
                                </button>
                                <div className="h-px bg-secondary-200 dark:bg-secondary-700" />
                                <button
                                  className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenDocumentMenuId(null); requestDeleteDocument(doc.id, doc.original_filename); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">Case Notes & Journal</h3>
                      <button onClick={() => { setEditingNote(null); setNoteForm({ title: '', content: '', note_type: 'general' }); setShowNoteModal(true); }} className="btn-primary btn-sm inline-flex items-center gap-2">
                        <FileEdit className="h-4 w-4" /> Add Note
                      </button>
                    </div>
                  </div>
                </div>
                {notes.length === 0 ? (
                  <div className="card hover-lift p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-secondary-400 dark:text-secondary-600" />
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">No notes yet. Add journal entries, observations, and case strategy notes.</p>
                    <button onClick={() => { setEditingNote(null); setNoteForm({ title: '', content: '', note_type: 'general' }); setShowNoteModal(true); }} className="btn-primary btn-sm inline-flex items-center gap-2">
                      <FileEdit className="h-4 w-4" /> Add First Note
                    </button>
          </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="card p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            {note.title && (
                              <h4 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                                {note.title}
                              </h4>
                            )}
                            <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap leading-relaxed mb-3">
                              {note.content}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap text-xs text-secondary-500 dark:text-secondary-500">
                              <span className="px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium capitalize">
                                {note.note_type}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Created {new Date(note.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                              {note.updated_at && note.updated_at !== note.created_at && (
                                <div className="flex items-center gap-1.5">
                                  <span>Updated {new Date(note.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => handleEditNote(note)} className="btn-ghost btn-xs p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteNote(note.id)} className="btn-ghost btn-xs p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Participant Modal */}
        {showParticipantModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowParticipantModal(false); setEditingParticipant(null); setParticipantForm({ participant_type: 'lawyer', name: '', email: '', phone: '', role: '', organization: '', notes: '' }); }}>
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-secondary-100">{editingParticipant ? 'Edit Participant' : 'Add Participant'}</h3>
              <form onSubmit={handleAddParticipant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select className="input" value={participantForm.participant_type} onChange={(e) => setParticipantForm({...participantForm, participant_type: e.target.value})}>
                    <option value="lawyer">Lawyer</option>
                    <option value="client">Client</option>
                    <option value="witness">Witness</option>
                    <option value="opposing_counsel">Opposing Counsel</option>
                    <option value="judge">Judge</option>
                    <option value="expert">Expert</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input className="input" required value={participantForm.name} onChange={(e) => setParticipantForm({...participantForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input type="email" className="input" value={participantForm.email} onChange={(e) => setParticipantForm({...participantForm, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input className="input" value={participantForm.phone} onChange={(e) => setParticipantForm({...participantForm, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <input className="input" placeholder="e.g., Lead Attorney, Co-counsel" value={participantForm.role} onChange={(e) => setParticipantForm({...participantForm, role: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Organization</label>
                  <input className="input" placeholder="Law firm, company name" value={participantForm.organization} onChange={(e) => setParticipantForm({...participantForm, organization: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea className="input" rows={3} value={participantForm.notes} onChange={(e) => setParticipantForm({...participantForm, notes: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <button type="button" onClick={() => { setShowParticipantModal(false); setEditingParticipant(null); setParticipantForm({ participant_type: 'lawyer', name: '', email: '', phone: '', role: '', organization: '', notes: '' }); }} className="btn-secondary btn-md">Cancel</button>
                  <button type="submit" className="btn-primary btn-md">{editingParticipant ? 'Update Participant' : 'Add Participant'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowEventModal(false); setEditingEvent(null); setEventForm({ event_type: 'hearing', title: '', description: '', event_date: '', location: '' }); }}>
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-secondary-100">{editingEvent ? 'Edit Timeline Event' : 'Add Timeline Event'}</h3>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <select className="input" value={eventForm.event_type} onChange={(e) => setEventForm({...eventForm, event_type: e.target.value})}>
                    <option value="hearing">Hearing</option>
                    <option value="filing">Filing</option>
                    <option value="meeting">Meeting</option>
                    <option value="milestone">Milestone</option>
                    <option value="deposition">Deposition</option>
                    <option value="trial">Trial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input className="input" required value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea className="input" rows={3} value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Date</label>
                    <input type="datetime-local" className="input" value={eventForm.event_date} onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <input className="input" placeholder="Court, office, etc." value={eventForm.location} onChange={(e) => setEventForm({...eventForm, location: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <button type="button" onClick={() => { setShowEventModal(false); setEditingEvent(null); setEventForm({ event_type: 'hearing', title: '', description: '', event_date: '', location: '' }); }} className="btn-secondary btn-md">Cancel</button>
                  <button type="submit" className="btn-primary btn-md">{editingEvent ? 'Update Event' : 'Add Event'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Important Date Modal */}
        {showDateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowDateModal(false); setEditingDate(null); setDateForm({ date_type: 'hearing', title: '', description: '', due_date: '', reminder_days: 3 }); }}>
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-secondary-100">{editingDate ? 'Edit Important Date' : 'Add Important Date'}</h3>
              <form onSubmit={handleAddDate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date Type</label>
                  <select className="input" value={dateForm.date_type} onChange={(e) => setDateForm({...dateForm, date_type: e.target.value})}>
                    <option value="hearing">Hearing</option>
                    <option value="deadline">Deadline</option>
                    <option value="filing">Filing Deadline</option>
                    <option value="reminder">Reminder</option>
                    <option value="meeting">Meeting</option>
                    <option value="trial">Trial Date</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input className="input" required value={dateForm.title} onChange={(e) => setDateForm({...dateForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea className="input" rows={3} value={dateForm.description} onChange={(e) => setDateForm({...dateForm, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date & Time *</label>
                    <input type="datetime-local" className="input" required value={dateForm.due_date} onChange={(e) => setDateForm({...dateForm, due_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Reminder (days before)</label>
                    <input type="number" min="0" className="input" value={dateForm.reminder_days} onChange={(e) => setDateForm({...dateForm, reminder_days: parseInt(e.target.value) || 3})} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <button type="button" onClick={() => { setShowDateModal(false); setEditingDate(null); setDateForm({ date_type: 'hearing', title: '', description: '', due_date: '', reminder_days: 3 }); }} className="btn-secondary btn-md">Cancel</button>
                  <button type="submit" className="btn-primary btn-md">{editingDate ? 'Update Date' : 'Add Date'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowNoteModal(false); setEditingNote(null); }}>
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-secondary-100">{editingNote ? 'Edit Note' : 'Add Note'}</h3>
              <form onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Note Type</label>
                  <select className="input" value={noteForm.note_type} onChange={(e) => setNoteForm({...noteForm, note_type: e.target.value})}>
                    <option value="general">General</option>
                    <option value="observation">Observation</option>
                    <option value="strategy">Strategy</option>
                    <option value="meeting_notes">Meeting Notes</option>
                    <option value="research">Research</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title (optional)</label>
                  <input className="input" value={noteForm.title} onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content *</label>
                  <textarea className="input" rows={6} required value={noteForm.content} onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <button type="button" onClick={() => { setShowNoteModal(false); setEditingNote(null); }} className="btn-secondary btn-md">Cancel</button>
                  <button type="submit" className="btn-primary btn-md">{editingNote ? 'Update' : 'Add'} Note</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => {
            // Clean up blob URL if it's a PDF or Excel
            if ((previewModal.isPDF || previewModal.isExcel) && previewModal.content.startsWith('blob:')) {
              URL.revokeObjectURL(previewModal.content);
            }
            setPreviewModal({ isOpen: false, content: '', filename: '', fileType: '', isPDF: false, isExcel: false, isCSV: false });
          }}>
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-primary-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate max-w-[420px]">
                      {previewModal.filename}
                    </h3>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Document Preview</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Clean up blob URL if it's a PDF or Excel
                    if ((previewModal.isPDF || previewModal.isExcel) && previewModal.content.startsWith('blob:')) {
                      URL.revokeObjectURL(previewModal.content);
                    }
                    setPreviewModal({ isOpen: false, content: '', filename: '', fileType: '', isPDF: false, isExcel: false, isCSV: false });
                  }}
                  className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                >
                  <X className="h-5 w-5 text-secondary-500" />
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                {previewModal.isPDF ? (
                  <div className="w-full h-full">
                    <iframe
                      src={previewModal.content}
                      className="w-full h-full min-h-[600px] border-0 rounded-lg"
                      title={`Preview of ${previewModal.filename}`}
                    />
                  </div>
                ) : previewModal.isExcel ? (
                  <div className="w-full h-full">
                    <iframe
                      src={previewModal.content}
                      className="w-full h-full min-h-[600px] border-0 rounded-lg"
                      title={`Preview of ${previewModal.filename}`}
                    />
                    <div className="mt-4 p-4 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Excel file preview. If the preview doesn't load, you can download the file to view it in Excel.
                      </p>
                    </div>
                  </div>
                ) : previewModal.isCSV ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border-collapse border border-secondary-300 dark:border-secondary-600">
                        <tbody>
                          {previewModal.content.split('\n').filter(line => line.trim() && !line.trim().match(/^\|[-:]+\|$/)).map((line, idx) => {
                            const cells = line.split('|').map(c => c.trim()).filter(c => c && !c.match(/^-+$/));
                            if (!cells.length) return null;
                            
                            // Check if this is a separator row (all dashes)
                            if (cells.every(c => /^-+$/.test(c))) return null;
                            
                            const isHeader = idx === 0;
                            return (
                              <tr key={idx} className={isHeader ? "bg-primary-100 dark:bg-primary-900/30 font-semibold" : "hover:bg-secondary-50 dark:hover:bg-secondary-800/50"}>
                                {cells.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="border border-secondary-300 dark:border-secondary-600 px-4 py-2">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            );
                          }).filter(Boolean)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : previewModal.fileType?.includes('msword') || previewModal.fileType?.includes('wordprocessingml') ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed">
                      {previewModal.content.split('\n').map((line, idx) => (
                        line.trim() ? (
                          <p key={idx} className="mb-3">{line}</p>
                        ) : (
                          <br key={idx} />
                        )
                      ))}
                    </div>
                  </div>
                ) : previewModal.filename?.endsWith('.md') || previewModal.fileType?.includes('markdown') ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <div 
                      className="text-sm text-secondary-700 dark:text-secondary-300"
                      dangerouslySetInnerHTML={{ 
                        __html: previewModal.content
                          .replace(/\n### (.*)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
                          .replace(/\n## (.*)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
                          .replace(/\n# (.*)/g, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                ) : previewModal.filename?.endsWith('.json') || previewModal.fileType?.includes('json') ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed font-mono bg-secondary-50 dark:bg-secondary-900/50 p-4 rounded-lg overflow-x-auto">
                      {previewModal.content}
                    </pre>
                  </div>
                ) : previewModal.filename?.endsWith('.xml') || previewModal.fileType?.includes('xml') ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed font-mono bg-secondary-50 dark:bg-secondary-900/50 p-4 rounded-lg overflow-x-auto">
                      {previewModal.content}
                    </pre>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed">
                      {previewModal.content}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Details Modal */}
        {detailsModal.isOpen && detailsModal.doc && (
          <div className="modal-overlay" onClick={() => setDetailsModal({ isOpen: false, doc: null })}>
            <div className="modal-container max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex items-center justify-between">
                  <h3 className="modal-title">Document Details</h3>
                  <button
                    onClick={() => setDetailsModal({ isOpen: false, doc: null })}
                    className="btn-ghost btn-xs p-1.5"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <div className="space-y-4">
                  <div>
                    <label className="label">Filename</label>
                    <p className="text-sm text-secondary-700 dark:text-secondary-300">{detailsModal.doc.original_filename}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">File Type</label>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">{detailsModal.doc.file_type?.toUpperCase() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="label">File Size</label>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">{(detailsModal.doc.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {detailsModal.doc.tags && (
                    <div>
                      <label className="label">Tags</label>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">{detailsModal.doc.tags}</p>
                    </div>
                  )}
                  {detailsModal.doc.summary && (
                    <div>
                      <label className="label">Summary</label>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">{detailsModal.doc.summary}</p>
                    </div>
                  )}
                  <div>
                    <label className="label">Uploaded</label>
                    <p className="text-sm text-secondary-700 dark:text-secondary-300">{new Date(detailsModal.doc.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Summary Modal */}
        {summaryModal.isOpen && (
          <div className="modal-overlay" onClick={() => setSummaryModal({ isOpen: false, text: '', loading: false })}>
            <div className="modal-container max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-primary-600" />
                    <h3 className="modal-title">Summary</h3>
                  </div>
                  <button
                    onClick={() => setSummaryModal({ isOpen: false, text: '', loading: false })}
                    className="btn-ghost btn-xs p-1.5"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="modal-body">
                {summaryModal.loading ? (
                  <div className="flex items-center space-x-3 text-secondary-700 dark:text-secondary-300">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating summary...</span>
                  </div>
                ) : (
                  <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">{summaryModal.text}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Document Modal */}
        {confirmDeleteDoc.isOpen && (
          <div className="modal-overlay" onClick={() => setConfirmDeleteDoc({ isOpen: false, docId: 0, filename: '' })}>
            <div className="modal-container max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="modal-body">
                <h3 className="modal-title mb-2">Delete document?</h3>
                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                  This action cannot be undone. You are about to delete "{confirmDeleteDoc.filename}".
                </p>
                <div className="modal-footer">
                  <button
                    onClick={() => setConfirmDeleteDoc({ isOpen: false, docId: 0, filename: '' })}
                    className="btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteDocument}
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

      {/* Transfer Case Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <h3 className="modal-title mb-4">Transfer Case</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.post(`/api/cases/${id}/transfer`, {
                    new_lawyer_id: parseInt(transferForm.new_lawyer_id),
                    transfer_notes: transferForm.transfer_notes
                  });
                  success('Case transferred successfully');
                  setShowTransferModal(false);
                  setTransferForm({ new_lawyer_id: '', transfer_notes: '' });
                  loadAllData();
                } catch (error: any) {
                  showError(error.response?.data?.detail || 'Failed to transfer case');
                }
              }} className="space-y-4">
                <div className="form-group">
                  <label className="label-required">Transfer To</label>
                  <select
                    className="input"
                    value={transferForm.new_lawyer_id}
                    onChange={(e) => setTransferForm({ ...transferForm, new_lawyer_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Lawyer --</option>
                    {availableLawyers.filter(l => l.id !== caseData?.lawyer_id).map((lawyer) => (
                      <option key={lawyer.id} value={lawyer.id}>
                        {lawyer.full_name || lawyer.email} ({lawyer.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Transfer Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={transferForm.transfer_notes}
                    onChange={(e) => setTransferForm({ ...transferForm, transfer_notes: e.target.value })}
                    placeholder="Optional notes about the transfer..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowTransferModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Transfer Case</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Collaborator Modal */}
      {showCollaboratorModal && (
        <div className="modal-overlay" onClick={() => setShowCollaboratorModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <h3 className="modal-title mb-4">Add Collaborator</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.post(`/api/cases/${id}/collaborators`, {
                    lawyer_id: parseInt(collaboratorForm.lawyer_id),
                    role: collaboratorForm.role,
                    notes: collaboratorForm.notes
                  });
                  success('Collaborator added successfully');
                  setShowCollaboratorModal(false);
                  setCollaboratorForm({ lawyer_id: '', role: 'collaborator', notes: '' });
                  loadAllData();
                } catch (error: any) {
                  showError(error.response?.data?.detail || 'Failed to add collaborator');
                }
              }} className="space-y-4">
                <div className="form-group">
                  <label className="label-required">Select Lawyer</label>
                  <select
                    className="input"
                    value={collaboratorForm.lawyer_id}
                    onChange={(e) => setCollaboratorForm({ ...collaboratorForm, lawyer_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Lawyer --</option>
                    {availableLawyers.filter(l => l.id !== caseData?.lawyer_id && !collaborators.find(c => c.id === l.id)).map((lawyer) => (
                      <option key={lawyer.id} value={lawyer.id}>
                        {lawyer.full_name || lawyer.email} ({lawyer.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label-required">Role</label>
                  <select
                    className="input"
                    value={collaboratorForm.role}
                    onChange={(e) => setCollaboratorForm({ ...collaboratorForm, role: e.target.value })}
                    required
                  >
                    <option value="collaborator">Collaborator</option>
                    <option value="co-counsel">Co-Counsel</option>
                    <option value="observer">Observer</option>
                    <option value="consultant">Consultant</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={collaboratorForm.notes}
                    onChange={(e) => setCollaboratorForm({ ...collaboratorForm, notes: e.target.value })}
                    placeholder="Optional notes about the collaboration..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowCollaboratorModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Add Collaborator</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Remove Collaborator Confirmations */}
      {collaborators.map((collab) => (
        <div key={`remove-${collab.id}`} id={`remove-collab-${collab.id}`} style={{ display: 'none' }}></div>
      ))}
    </DashboardLayout>
  );
}