'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { LawyerRecommendation } from '@/components/LawyerRecommendation';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  ArrowLeft, 
  FileText, 
  MessageCircle, 
  Copy, 
  Edit, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  MoreVertical,
  Menu,
  X,
  Plus,
  History,
  Eye,
  EyeOff,
  Pause,
  Archive,
  ArchiveRestore,
  Gavel,
  Upload,
  Users
} from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  messageCount: number;
}

interface ChatMessage {
  id: number;
  content: string;
  is_user: boolean;
  created_at: string;
  isStreaming?: boolean;
}

interface Document {
  id: number;
  original_filename: string;
  summary: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentId = searchParams.get('documentId');
  const documentName = searchParams.get('documentName');
  
  const [document, setDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]); // Max 3
  const [selectedCase, setSelectedCase] = useState<number | null>(null); // Max 1
  const [useTanzLii, setUseTanzLii] = useState(false);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{open: boolean; id: string; name: string}>({open:false, id:'', name:''});
  const [deleteModal, setDeleteModal] = useState<{open: boolean; id: string; name: string}>({open:false, id:'', name:''});
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Response style/tone removed from UI and requests
  // Models fetched from backend (fallback includes Default)
  const [modelOptions, setModelOptions] = useState<{ value: string; label: string }[]>([
    { value: 'default', label: 'Default' },
  ]);
  const [model, setModel] = useState<string>(() => {
    try { return localStorage.getItem('chat_model') || 'default'; } catch { return 'default'; }
  });
  const { toasts, success, error: showError, warning, info, removeToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    if (documentId) {
      fetchDocument();
      fetchMessages();
    } else {
      // General chat mode - load chat sessions
      fetchChatSessions();
      setLoading(false);
    }
    // Fetch all documents and cases for selection
    fetchAllDocuments();
    fetchAllCases();
  }, [documentId]);

  const fetchAllDocuments = async () => {
    try {
      const response = await api.get('/api/documents');
      setAllDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchAllCases = async () => {
    try {
      const response = await api.get('/api/cases');
      setAllCases(response.data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const uploadedDoc = response.data;
      const newSelected = [...selectedDocuments, uploadedDoc.id].slice(0, 3);
      setSelectedDocuments(newSelected);
      // Refresh all documents to include the new one
      await fetchAllDocuments();
      success(`Document "${uploadedDoc.original_filename}" uploaded and selected`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploadingFile(false);
    }
  };

  // Close selectors when clicking elsewhere
  useEffect(() => {
    const handleGlobalClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (!target.closest('[data-document-selector]') && !target.closest('[data-case-selector]')) {
        setShowDocumentSelector(false);
        setShowCaseSelector(false);
      }
    };
    if (showDocumentSelector || showCaseSelector) {
      window.document.addEventListener('click', handleGlobalClick);
      return () => window.document.removeEventListener('click', handleGlobalClick);
    }
  }, [showDocumentSelector, showCaseSelector]);

  // Close any open session menu when clicking elsewhere
  useEffect(() => {
    if (!menuOpenId) return;
    const handleGlobalClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) { setMenuOpenId(null); return; }
      const insideMenu = target.closest('.chat-session-menu');
      const onButton = target.closest('.chat-session-menu-btn');
      if (!insideMenu && !onButton) setMenuOpenId(null);
    };
    if (typeof window !== 'undefined' && window.document) {
      window.document.addEventListener('click', handleGlobalClick);
      return () => window.document.removeEventListener('click', handleGlobalClick);
    }
  }, [menuOpenId]);

  // Fetch available models for dropdown
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await api.get('/api/chat/models');
        // Use exact backend names as labels to match availability precisely
        const items = (res.data?.models || []).map((m: any) => ({ value: m.name, label: m.name }));
        if (Array.isArray(items) && items.length > 0) {
          setModelOptions([{ value: 'default', label: 'Default' }, ...items]);
        }
      } catch (e) {
        // keep default only on failure
      }
    };
    loadModels();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load archived toggle from localStorage on mount
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('show_archived_toggle');
      if (persisted !== null) {
        setShowArchived(persisted === 'true');
      }
    } catch {}
  }, []);

  // Refetch sessions when archive visibility changes
  useEffect(() => {
    if (!documentId) {
      fetchChatSessions();
    }
    try {
      localStorage.setItem('show_archived_toggle', String(showArchived));
    } catch {}
  }, [showArchived]);

  const fetchDocument = async () => {
    try {
      const response = await api.get(`/api/documents/${documentId}`);
      setDocument(response.data);
    } catch (error) {
      console.error('Error fetching document:', error);
      showError('Failed to load document');
    }
  };

  const toggleArchive = (sessionId: string) => {
    const key = 'archived_sessions';
    const arr: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const id = String(sessionId);
    let next: string[];
    if (arr.includes(id)) {
      next = arr.filter(x => x !== id);
      success('Unarchived');
    } else {
      next = [...arr, id];
      success('Archived');
    }
    localStorage.setItem(key, JSON.stringify(next));
    setArchivedIds(next);
    setArchivedCount(next.length);
    fetchChatSessions();
  };

  const handleDeleteChat = async (sessionId: string) => {
    try {
      const key = 'archived_sessions';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const sid = String(sessionId);
      const next = Array.isArray(arr) ? arr.filter((x: string) => x !== sid) : [];
      localStorage.setItem(key, JSON.stringify(next));
      setArchivedIds(next);
      setArchivedCount(next.length);
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      await api.delete(`/api/chat/sessions/${sessionId}`);
      setDeleteModal({open: false, id: '', name: ''});
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
      fetchChatSessions();
      success('Chat deleted');
    } catch (error) {
      showError('Failed to delete chat');
    }
  };

  const fetchMessages = async () => {
    try {
      // For now, we'll create a mock chat session for document-specific chat
      // In a real implementation, you'd create a chat session tied to the document
      setMessages([]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatSessions = async () => {
    try {
      const res = await api.get('/api/chat/sessions');
      const sessions = (res.data || []).map((s: any) => ({
        id: String(s.id),
        title: s.session_name || `Chat ${s.id}`,
        lastMessage: '',
        createdAt: s.created_at,
        messageCount: (s.messages || []).length ?? 0,
      }));
      // Filter archived if not showing
      const archived = JSON.parse(localStorage.getItem('archived_sessions') || '[]');
      const archivedArr = Array.isArray(archived) ? archived : [];
      // Only count archived IDs that actually exist in current sessions
      const sessionIds = new Set(sessions.map((s: any) => String(s.id)));
      const validArchived = archivedArr.filter((id: string) => sessionIds.has(id));
      // Update localStorage to remove invalid archived IDs
      if (validArchived.length !== archivedArr.length) {
        localStorage.setItem('archived_sessions', JSON.stringify(validArchived));
      }
      setArchivedIds(validArchived);
      setArchivedCount(validArchived.length);
      const filtered = sessions.filter((s: any) => showArchived || !validArchived.includes(String(s.id)));
      setChatSessions(filtered);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success('Copied to clipboard!');
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  const retryMessage = async (messageId: number) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    const aiMsg = messages[idx];
    if (aiMsg.is_user) return;

    // Find the most recent preceding user message to retry
    let promptToRetry = '';
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].is_user) { promptToRetry = messages[i].content; break; }
    }
    if (!promptToRetry) return;

    // Remove the AI message we are retrying and resend using the original user prompt
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await sendMessage(promptToRetry, true);
  };

  const editMessage = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.is_user) return;
    
    setEditingMessage(messageId);
    setEditContent(message.content);
  };

  const saveEdit = async (messageId: number) => {
    if (!editContent.trim()) return;
    
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, content: editContent } : m
    ));
    setEditingMessage(null);
    setEditContent('');
    
    // Resend the edited message
    await sendMessage(editContent, true);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const sendMessage = async (content: string, isRetry = false) => {
    if (!content.trim()) return;

    if (!isRetry) {
      const userMessage: ChatMessage = {
        id: Date.now(),
        content: content,
        is_user: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
    }
    setSending(true);

    try {
      // persist preferences (model only)
      try { localStorage.setItem('chat_model', model); } catch {}
      let response;
      
      // Build context from selections
      const documentIds = documentId ? [parseInt(documentId)] : selectedDocuments;
      const caseId = selectedCase;
      const useTanzLiiFlag = useTanzLii;
      
      // Debug log
      console.log('DEBUG: Sending message with context:', {
        documentId,
        documentIds,
        caseId,
        useTanzLiiFlag,
        hasDocument: !!document
      });

        // Ensure we have a session, create if needed with auto title from first message
        let sessionId = currentSessionId;
        if (!sessionId) {
          const name = documentId 
            ? (document?.original_filename || `Document Chat ${new Date().toLocaleString()}`)
            : (content.length > 30 ? `${content.slice(0, 30)}…` : (content || `Chat ${new Date().toLocaleString()}`));
          const res = await api.post('/api/chat/sessions', { session_name: name });
          sessionId = String(res.data.id);
          setCurrentSessionId(sessionId);
          await fetchChatSessions();
        }

      // Always use query-documents endpoint when documentId is present or when context is selected
      if (documentIds.length > 0 || caseId || useTanzLiiFlag || documentId) {
        // Enhanced chat with context - get response then save to session
        const controller = new AbortController();
        controllerRef.current = controller;
        const requestPayload: any = {
          query: content,
          use_tanzlii: useTanzLiiFlag
        };
        // Always include document_ids if we have documentId from URL or selected documents
        if (documentIds.length > 0) {
          requestPayload.document_ids = documentIds;
        } else if (documentId) {
          // Fallback: ensure documentId from URL is included
          const docId = parseInt(documentId);
          if (!isNaN(docId)) {
            requestPayload.document_ids = [docId];
          }
        }
        if (caseId) {
          requestPayload.case_id = caseId;
        }
        // Include session_id for conversation history
        if (currentSessionId) {
          requestPayload.session_id = currentSessionId;
        }
        console.log('DEBUG: Sending query with context:', requestPayload);
        response = await api.post('/api/chat/query-documents', requestPayload, { signal: controller.signal });
        
        // Save messages to session after getting response
        try {
          const responseContent = response.data?.response 
            ? response.data.response 
            : (response.data?.content || response.data?.message || '');
          
          // Save user message
          await api.post(`/api/chat/sessions/${sessionId}/messages/save`, { 
            content,
            message_type: 'user'
          });
          
          // Save assistant response
          await api.post(`/api/chat/sessions/${sessionId}/messages/save`, { 
            content: responseContent,
            message_type: 'assistant'
          });
        } catch (saveError) {
          console.error('Error saving messages to session:', saveError);
          // Continue even if saving fails
        }
      } else {
        // General chat without context - use standard endpoint that saves messages
        const controller = new AbortController();
        controllerRef.current = controller;
        response = await api.post(`/api/chat/sessions/${sessionId}/messages`, { 
          content,
          document_ids: documentIds.length > 0 ? documentIds : undefined,
          case_id: caseId || undefined,
          use_tanzlii: useTanzLiiFlag
        }, { signal: controller.signal });
      }

      // Create AI message placeholder
      const aiMessageId = Date.now() + 1;
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        content: '',
        is_user: false,
        created_at: new Date().toISOString(),
        isStreaming: true
      };

      setMessages(prev => [...prev, aiMessage]);
      // Handle response based on endpoint used
      // query-documents returns {response: ...}
      // sessions/{id}/messages returns {content: ...}
      const responseContent = response.data?.response 
        ? response.data.response 
        : (response.data?.content || response.data?.message || '');
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: responseContent, isStreaming: false } : m));

      // After assistant reply in general chat, auto-summarize session title
      if (!documentId && currentSessionId) {
        try {
          const title = generateSessionTitle(content);
          await api.put(`/api/chat/sessions/${currentSessionId}`, { session_name: title });
          fetchChatSessions();
        } catch {}
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Provide helpful error message
      let errorMessage = 'Failed to send message. Please try again.';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to access this document.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found. Please refresh and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Service is temporarily unavailable. Please try again later.';
      }
      
      showError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: Date.now() + 1,
        content: `I apologize, but I'm having trouble processing your request right now. ${errorMessage}`,
        is_user: false,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setSending(false);
      controllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const createNewChat = async () => {
    try {
      const name = `Chat ${new Date().toLocaleString()}`;
      const res = await api.post('/api/chat/sessions', { session_name: name });
      const id = String(res.data.id);
      await fetchChatSessions();
      setMessages([]);
      setCurrentSessionId(id);
      setSidebarOpen(false);
      success('New chat created');
    } catch (e) {
      showError('Failed to create chat');
    }
  };

  const generateSessionTitle = (text: string) => {
    const cleaned = (text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return `Chat ${new Date().toLocaleTimeString()}`;
    const words = cleaned.split(' ');
    const short = words.slice(0, 8).join(' ');
    const capped = short.charAt(0).toUpperCase() + short.slice(1);
    return capped.length > 40 ? capped.slice(0, 39) + '…' : capped;
  };

  const handleCopyInput = async () => {
    const text = newMessage.trim();
    if (!text) {
      warning('Nothing to copy');
      return;
    }
    await copyToClipboard(text);
  };

  const handleClearInput = () => {
    if (!newMessage.trim()) {
      return;
    }
    setNewMessage('');
    info('Cleared');
  };

  const handlePasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewMessage(prev => (prev ? prev + (prev.endsWith('\n') ? '' : '\n') + text : text));
        info('Pasted from clipboard');
      } else {
        warning('Clipboard is empty');
      }
    } catch {
      warning('Clipboard not available');
    }
  };

  const handleStop = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setSending(false);
      info('Stopped');
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      setCurrentSessionId(sessionId);
      setSidebarOpen(false);
      const res = await api.get(`/api/chat/sessions/${sessionId}/messages`);
      const msgs = (res.data || []).map((m: any) => ({
        id: m.id,
        content: m.content,
        is_user: m.message_type === 'user',
        created_at: m.created_at,
      }));
      setMessages(msgs);
    } catch {
      showError('Failed to load chat');
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
      <div className="h-screen flex flex-col bg-secondary-50 dark:bg-secondary-900">
        {/* Modern Header */}
        <div className="bg-white/80 dark:bg-secondary-800/80 backdrop-blur-sm border-b border-secondary-200/50 dark:border-secondary-700/50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile sidebar toggle for general chat */}
                {!documentId && (
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                  >
                    <Menu className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </button>
                )}
                
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center px-3 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {documentId ? 'Back to Documents' : 'Back to Dashboard'}
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-600 rounded-xl shadow-lg">
                    {documentId ? <FileText className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
                      {documentId ? 'Document Chat' : 'Lega Assistant'}
                    </h1>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium">
                      {documentId ? (documentName || 'Loading...') : 'General Lega Assistant'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400 rounded-full text-xs font-medium">
                  Lega
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat History Sidebar - Only for general chat */}
          {!documentId && (
            <>
              {/* Mobile sidebar overlay */}
              {sidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              
              {/* Sidebar */}
              <div className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto ${historyCollapsed ? 'w-14' : 'w-80'} bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              }`}>
                <div className="flex flex-col h-full">
                  {/* Sidebar Header */}
                  <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between gap-3 flex-wrap">
                    {!historyCollapsed && <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Chat History</h2>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {!historyCollapsed && (
                        <button
                          onClick={() => setShowArchived(v => !v)}
                          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border transition-colors shadow-sm ${showArchived ? 'bg-secondary-900 text-secondary-100 border-secondary-700' : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border-secondary-300 dark:border-secondary-600'}`}
                          title={showArchived ? 'Hide archived' : 'Show archived'}
                        >
                          {showArchived ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{showArchived ? 'Hide archived' : 'Show archived'}</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${showArchived ? 'bg-secondary-800 text-secondary-100' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200'}`}>{archivedCount}</span>
                        </button>
                      )}
                      {!historyCollapsed && (
                        <button
                          onClick={createNewChat}
                          className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                          title="New chat"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setHistoryCollapsed(v=>!v)}
                        className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700"
                        title={historyCollapsed ? 'Expand' : 'Collapse'}
                      >
                        <History className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                      </button>
                    </div>
                  </div>

                  {/* Chat Sessions */}
                  <div className={`flex-1 overflow-y-auto ${historyCollapsed ? 'p-2' : 'p-4'}`}>
                    <div className="space-y-2">
                      {chatSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => loadChatSession(session.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                            currentSessionId === session.id
                              ? 'bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                              : 'hover:bg-secondary-100 dark:hover:bg-secondary-700/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              {!historyCollapsed && (
                                <>
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">{session.title}</h3>
                                    <div className="relative">
                                      <button
                                        onClick={(e)=>{e.stopPropagation(); setMenuOpenId(menuOpenId===session.id?null:session.id);}}
                                        className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 chat-session-menu-btn"
                                        title="More"
                                      >
                                        <MoreVertical className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                                      </button>
                                      {menuOpenId===session.id && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-10 chat-session-menu">
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                            onClick={(e)=>{e.stopPropagation(); setRenameModal({open:true, id:session.id, name:session.title}); setMenuOpenId(null);}}
                                          >Rename</button>
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                            onClick={(e)=>{e.stopPropagation(); toggleArchive(session.id); setMenuOpenId(null); }}
                                          >Archive</button>
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                                            onClick={(e)=>{e.stopPropagation(); setDeleteModal({open:true, id:session.id, name:session.title}); setMenuOpenId(null);}}
                                          >Delete</button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center mt-2 space-x-2">
                                    <span className="text-xs text-secondary-500 dark:text-secondary-400">{session.messageCount} messages</span>
                                    <span className="text-xs text-secondary-500 dark:text-secondary-400">•</span>
                                    <span className="text-xs text-secondary-500 dark:text-secondary-400">{new Date(session.createdAt).toLocaleDateString()}</span>
                                    <button
                                      onClick={(e)=>{ e.stopPropagation(); toggleArchive(session.id); }}
                                      className="ml-2 p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                      title={archivedIds.includes(String(session.id)) ? 'Unarchive' : 'Archive'}
                                    >
                                      {archivedIds.includes(String(session.id)) ? (
                                        <ArchiveRestore className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
                                      ) : (
                                        <Archive className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
                                      )}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Lawyer Recommendations for Clients */}
            {currentUser?.role === 'client' && messages.length === 0 && !documentId && (
              <div className="mx-6 mt-6">
                <LawyerRecommendation 
                  location={currentUser?.location}
                  specialization={undefined}
                />
              </div>
            )}

            {/* Modern Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Document Filename at Top of Chat Area */}
              {document && (
                <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-sm border-b border-secondary-200 dark:border-secondary-700 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-600 rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                        {document.original_filename}
                      </h3>
                      {document.summary && (
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate mt-0.5">
                          {document.summary.length > 60 ? `${document.summary.slice(0, 60)}...` : document.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                    <MessageCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                    {currentUser?.role === 'client' ? 'Get Legal Help' : 'Start a conversation'}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
                    {currentUser?.role === 'client' 
                      ? 'Ask legal questions, upload documents for analysis, or explore recommended lawyers near you.'
                      : documentId 
                        ? 'Ask questions about this document to get insights and analysis.'
                        : 'Ask me anything! I can help with legal questions, document analysis, and general assistance.'
                    }
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {documentId ? (
                      <>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full text-xs font-medium">
                          Document Analysis
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full text-xs font-medium">
                          Legal Insights
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full text-xs font-medium">
                          Key Points
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full text-xs font-medium">
                          Legal Questions
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full text-xs font-medium">
                          Document Help
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full text-xs font-medium">
                          General Assistant
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-2xl ${message.is_user ? 'order-2' : 'order-1'}`}>
                      {!message.is_user && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Lega</span>
                        </div>
                      )}
                      <div
                        className={`px-6 py-4 rounded-xl shadow-sm ${
                          message.is_user
                            ? 'bg-primary-600 text-white order-1'
                            : 'bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100 order-2'
                        }`}
                      >
                        {editingMessage === message.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 border border-secondary-300 dark:border-secondary-600 resize-none"
                              rows={3}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => saveEdit(message.id)}
                                className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-secondary-300 dark:bg-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-lg text-sm hover:bg-secondary-400 dark:hover:bg-secondary-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          message.is_user ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )
                        )}
                        
                        {/* Message Actions */}
                        <div className={`flex items-center justify-between mt-3 ${
                          message.is_user ? 'text-primary-100' : 'text-secondary-500 dark:text-secondary-400'
                        }`}>
                          <p className="text-xs">
                            {new Date(message.created_at).toLocaleTimeString()}
                            {message.isStreaming && (
                              <span className="ml-2 inline-flex items-center">
                                <div className="w-2 h-2 bg-current rounded-full animate-pulse mr-1"></div>
                                Typing...
                              </span>
                            )}
                          </p>
                          
                          {/* Action buttons */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {message.is_user ? (
                              <>
                                <button
                                  onClick={() => editMessage(message.id)}
                                  className="p-1 rounded hover:bg-primary-500 transition-colors"
                                  title="Edit message"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => copyToClipboard(message.content)}
                                  className="p-1 rounded hover:bg-primary-500 transition-colors"
                                  title="Copy message"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => copyToClipboard(message.content)}
                                  className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                                  title="Copy response"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => retryMessage(message.id)}
                                  className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                                  title="Retry response"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                                <button
                                  className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                                  title="Good response"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </button>
                                <button
                                  className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                                  title="Poor response"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {sending && (
                <div className="flex justify-start">
                  <div className="max-w-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Lega</span>
                    </div>
                    <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 px-6 py-4 rounded-xl shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">Lega is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scroll target */}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Selection Bar - For Lawyers/Admins */}
            {!documentId && currentUser?.role !== 'client' && (
              <div className="px-6 pt-4 pb-2">
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {/* Document Selection */}
                    <div className="relative">
                  <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDocumentSelector(!showDocumentSelector);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors flex items-center gap-2 ${
                          selectedDocuments.length > 0
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                            : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                        }`}
                        data-document-selector
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Documents {selectedDocuments.length > 0 && `(${selectedDocuments.length}/3)`}
                      </button>
                      {showDocumentSelector && (
                        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" data-document-selector>
                          <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Select Documents (max 3)</h4>
                  <button
                                onClick={() => {
                                  setSelectedDocuments([]);
                                  setShowDocumentSelector(false);
                                }}
                                className="text-xs text-error-600 hover:text-error-700"
                              >
                                Clear
                              </button>
                            </div>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400">Choose up to 3 documents to use as context</p>
                          </div>
                          <div className="p-2">
                            {allDocuments.length === 0 ? (
                              <p className="text-xs text-secondary-500 dark:text-secondary-400 p-3 text-center">No documents available</p>
                            ) : (
                              allDocuments.map((doc) => {
                                const isSelected = selectedDocuments.includes(doc.id);
                                const canSelect = isSelected || selectedDocuments.length < 3;
                                return (
                                  <label
                                    key={doc.id}
                                    className={`flex items-start space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-primary-50 dark:bg-primary-900/20'
                                        : canSelect
                                        ? 'hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                                        : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked && selectedDocuments.length < 3) {
                                          setSelectedDocuments([...selectedDocuments, doc.id]);
                                        } else if (!e.target.checked) {
                                          setSelectedDocuments(selectedDocuments.filter((id) => id !== doc.id));
                                        }
                                      }}
                                      disabled={!canSelect}
                                      className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-secondary-900 dark:text-secondary-100 truncate">
                                        {doc.original_filename}
                                      </p>
                                      {doc.case_id && (
                                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                          Case #{doc.case_id}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Case Selection */}
                    <div className="relative">
                  <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCaseSelector(!showCaseSelector);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors flex items-center gap-2 ${
                          selectedCase
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                            : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                        }`}
                        data-case-selector
                      >
                        <Gavel className="h-3.5 w-3.5" />
                        Case {selectedCase && `(${allCases.find(c => c.id === selectedCase)?.case_number || selectedCase})`}
                      </button>
                      {showCaseSelector && (
                        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" data-case-selector>
                          <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Select Case</h4>
                              <button
                                onClick={() => {
                                  setSelectedCase(null);
                                  setShowCaseSelector(false);
                                }}
                                className="text-xs text-error-600 hover:text-error-700"
                              >
                                Clear
                              </button>
                </div>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400">Choose a case to use as context</p>
              </div>
                          <div className="p-2">
                            {allCases.length === 0 ? (
                              <p className="text-xs text-secondary-500 dark:text-secondary-400 p-3 text-center">No cases available</p>
                            ) : (
                              allCases.map((caseItem) => (
                                <button
                                  key={caseItem.id}
                                  onClick={() => {
                                    setSelectedCase(caseItem.id);
                                    setShowCaseSelector(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                                    selectedCase === caseItem.id
                                      ? 'bg-primary-50 dark:bg-primary-900/20'
                                      : 'hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                                  }`}
                                >
                                  <p className="text-xs font-medium text-secondary-900 dark:text-secondary-100">
                                    {caseItem.case_number}: {caseItem.title}
                                  </p>
                                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                    {caseItem.client_name} • {caseItem.status}
                                  </p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TanzLii Toggle */}
                    <button
                      onClick={() => setUseTanzLii(!useTanzLii)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors flex items-center gap-2 ${
                        useTanzLii
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                          : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      TanzLii
                    </button>

                    {/* Selected Items Display */}
                    {(selectedDocuments.length > 0 || selectedCase || useTanzLii) && (
                      <div className="flex-1 flex flex-wrap items-center gap-2 text-xs">
                        {selectedDocuments.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {selectedDocuments.map((docId) => {
                              const doc = allDocuments.find((d) => d.id === docId);
                              return doc ? (
                                <span
                                  key={docId}
                                  className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full flex items-center gap-1"
                                >
                                  {doc.original_filename}
                                  <button
                                    onClick={() => setSelectedDocuments(selectedDocuments.filter((id) => id !== docId))}
                                    className="hover:text-error-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        {selectedCase && (
                          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full flex items-center gap-1">
                            {allCases.find((c) => c.id === selectedCase)?.case_number || `Case #${selectedCase}`}
                            <button
                              onClick={() => setSelectedCase(null)}
                              className="hover:text-error-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {useTanzLii && (
                          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full flex items-center gap-1">
                            TanzLii
                            <button
                              onClick={() => setUseTanzLii(false)}
                              className="hover:text-error-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Filters + Controls */}
            <div className="px-6 py-4">
              <div className="max-w-4xl mx-auto">
                {/* Connect to Lawyer Button for Clients - Small, well-placed */}
                {!documentId && currentUser?.role === 'client' && (
                  <div className="mb-3 flex justify-center">
                    <button
                      onClick={() => router.push('/clients/lawyers')}
                      className="px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-200 flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200"
                    >
                      <Users className="h-4 w-4" />
                      <span>explore lawyers portal</span>
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                    </button>
                  </div>
                )}
                
                {/* Selected Documents Display - Cancellable badges */}
                {selectedDocuments.length > 0 && !documentId && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {selectedDocuments.map((docId) => {
                      const doc = allDocuments.find((d) => d.id === docId);
                      return doc ? (
                        <div
                          key={docId}
                          className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg flex items-center gap-2 text-sm border border-primary-300 dark:border-primary-700"
                        >
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{doc.original_filename}</span>
                          <button
                            onClick={() => setSelectedDocuments(selectedDocuments.filter((id) => id !== docId))}
                            className="ml-1 p-0.5 rounded hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors flex-shrink-0"
                            title="Remove document"
                            aria-label="Remove document"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                
                <div className="flex flex-col space-y-3">
                  {/* Model selector - moved above input on mobile, inline on desktop */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <span className="text-xs text-secondary-500 dark:text-secondary-400 font-medium whitespace-nowrap">Model:</span>
                    <select
                      value={model}
                      onChange={(e)=>setModel(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2.5 py-1.5 rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors cursor-pointer shadow-sm flex-1"
                      title={`Current model: ${modelOptions.find(m => m.value === model)?.label || model}`}
                    >
                      {modelOptions.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="relative flex-1">
                    {/* Model selector inside input (left side) - hidden on mobile, visible on desktop */}
                    <div className="hidden sm:flex absolute left-3 items-center gap-2 z-10" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                      <span className="text-xs text-secondary-500 dark:text-secondary-400 font-medium whitespace-nowrap">Model:</span>
                      <select
                        value={model}
                        onChange={(e)=>setModel(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors cursor-pointer shadow-sm min-w-[110px]"
                        title={`Current model: ${modelOptions.find(m => m.value === model)?.label || model}`}
                      >
                        {modelOptions.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={documentId ? "Ask a question about this document..." : "Ask me anything..."}
                      className="w-full sm:pl-[240px] pl-4 sm:pr-36 pr-28 border border-secondary-300 dark:border-secondary-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white dark:bg-secondary-800 shadow-sm transition-all duration-200 placeholder-secondary-400 dark:placeholder-secondary-500 text-sm text-secondary-900 dark:text-secondary-100"
                      rows={2}
                      disabled={sending}
                      style={{ 
                        paddingTop: '18px', 
                        paddingBottom: '18px',
                        lineHeight: '1.8'
                      }}
                    />
                    {/* Inline actions inside the input (right side) - responsive spacing */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {/* Mobile: Only show send button, desktop: show all buttons */}
                      {currentUser?.role === 'client' && (
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.md,.json,.xml"
                            disabled={uploadingFile}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="hidden sm:flex p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Upload document"
                            aria-label="Upload document"
                          >
                            <Upload className={`h-4 w-4 text-secondary-500 dark:text-secondary-400 ${uploadingFile ? 'animate-pulse' : ''}`} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleCopyInput}
                        disabled={!newMessage.trim()}
                        className="hidden sm:flex p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copy message"
                        aria-label="Copy message"
                      >
                        <Copy className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                      </button>
                      <button
                        onClick={handleClearInput}
                        disabled={!newMessage.trim()}
                        className="hidden sm:flex p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clear message"
                        aria-label="Clear message"
                      >
                        <X className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                      </button>
                      <button
                        onClick={() => (sending ? handleStop() : sendMessage(newMessage))}
                        disabled={!newMessage.trim() && !sending}
                        className={`ml-1 px-3 sm:px-3 h-9 rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center ${sending ? 'bg-secondary-600 text-white hover:bg-secondary-700' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                        title={sending ? 'Pause' : 'Send'}
                        aria-label={sending ? 'Pause' : 'Send'}
                      >
                        {sending ? <Pause className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {/* (Toolbar moved above input) */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">Lega Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Session Modal */}
      {renameModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setRenameModal({open:false, id:'', name:''})}>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">Rename Chat</h3>
            <input
              type="text"
              value={renameModal.name}
              onChange={(e)=>setRenameModal({...renameModal, name: e.target.value})}
              className="input w-full mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={()=>setRenameModal({open:false, id:'', name:''})}
                className="px-4 py-2 rounded-md border border-secondary-300 dark:border-secondary-600 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700"
              >Cancel</button>
              <button
                onClick={async ()=>{ try{ await api.put(`/api/chat/sessions/${renameModal.id}`, { session_name: renameModal.name }); setRenameModal({open:false, id:'', name:''}); fetchChatSessions(); success('Chat renamed'); } catch{ showError('Failed to rename'); } }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setDeleteModal({open:false, id:'', name:''})}>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">Delete Chat</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
              Are you sure you want to delete "<span className="font-medium">{deleteModal.name}</span>"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={()=>setDeleteModal({open:false, id:'', name:''})}
                className="px-4 py-2 rounded-md border border-secondary-300 dark:border-secondary-600 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700"
              >Cancel</button>
              <button
                onClick={()=>handleDeleteChat(deleteModal.id)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-white bg-error-600 hover:bg-error-700"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function DocumentChatPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading chat...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <ChatContent />
    </Suspense>
  );
}