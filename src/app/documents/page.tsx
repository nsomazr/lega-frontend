'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { 
  FileText, 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  MoreVertical, 
  Eye, 
  Download, 
  Move, 
  Copy, 
  Trash, 
  MessageCircle,
  Folder,
  FolderPlus,
  Edit,
  X,
  Check,
  ChevronRight,
  Home,
  FolderOpen,
  ArrowRight,
  FolderTree
} from 'lucide-react';

interface Document {
  id: number;
  original_filename: string;
  file_size: number;
  file_type: string;
  folder_path: string;
  summary: string;
  tags: string;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState('/');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, content: '', filename: '', fileType: '', isPDF: false, isExcel: false, isCSV: false });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean, doc: Document | null }>({ isOpen: false, doc: null });
  const [summaryModal, setSummaryModal] = useState<{ isOpen: boolean, text: string, loading: boolean }>({ isOpen: false, text: '', loading: false });
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState({ isOpen: false, docId: 0 });
  const [moveDest, setMoveDest] = useState('/');
  const [showRenameModal, setShowRenameModal] = useState({ isOpen: false, docId: 0, currentName: '' });
  const [renameValue, setRenameValue] = useState('');
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const [showRenameFolder, setShowRenameFolder] = useState({ open: false, folder: '' });
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [showMoveFolder, setShowMoveFolder] = useState({ open: false, folder: '' });
  const [moveFolderDest, setMoveFolderDest] = useState('/');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, docId: number, filename: string }>({ isOpen: false, docId: 0, filename: '' });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileFolderSidebarOpen, setMobileFolderSidebarOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('/');
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkMoveDest, setBulkMoveDest] = useState('/');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'move' | 'copy'>('move');

  // Sync uploadFolder with currentFolder whenever it changes
  useEffect(() => {
    setUploadFolder(currentFolder);
  }, [currentFolder]);
  
  const { toasts, success, error: showError, warning, info, removeToast } = useToast();

  // Handle clicking outside to deselect files
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-document-card]') && 
          !target.closest('button') && 
          !target.closest('input') && 
          !target.closest('select') &&
          !target.closest('[role="menu"]') &&
          !target.closest('[role="dialog"]')) {
        setSelectedDocuments([]);
      }

      if (!target.closest('[data-document-menu]') && !target.closest('[data-document-menu-button]')) {
        setOpenMenuId(null);
      }

      if (!target.closest('[data-folder-menu]') && !target.closest('[data-folder-menu-button]')) {
        setFolderMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      let list: string[] = [];
      try {
        const res = await api.get('/api/documents/folders');
        const data = res.data;
        list = Array.isArray(data) ? data : (Array.isArray(data?.folders) ? data.folders : []);
      } catch (e) {
        const res2 = await api.get('/api/documents/folders/list');
        const data2 = res2.data;
        list = Array.isArray(data2) ? data2 : (Array.isArray(data2?.folders) ? data2.folders : []);
      }
      setFolders(list || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        // Use current folder if uploadFolder is not set, otherwise use uploadFolder
        const targetFolder = uploadFolder || currentFolder || '/';
        formData.append('folder_path', targetFolder);

        await api.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      const uploadPath = uploadFolder || currentFolder || '/';
      success(`Successfully uploaded ${files.length} document(s) to ${uploadPath === '/' ? 'Root' : uploadPath}`);
      await fetchDocuments();
      await fetchFolders();
      // Keep uploadFolder synced with currentFolder - don't reset to '/'
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const requestDeleteDocument = (docId: number, filename: string) => {
    setConfirmDelete({ isOpen: true, docId, filename });
  };

  const handleDeleteDocument = async () => {
    try {
      await api.delete(`/api/documents/${confirmDelete.docId}`);
      success('Document deleted successfully');
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
    } finally {
      setConfirmDelete({ isOpen: false, docId: 0, filename: '' });
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
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document');
    }
  };

  const handlePreviewDocument = async (docId: number, filename: string) => {
    try {
      const doc = documents.find(d => d.id === docId);
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

  const openDetails = async (docId: number) => {
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

  const handleCopyDocument = async (docId: number, destinationFolder: string) => {
    try {
      await api.post(`/api/documents/${docId}/copy`, {
        destination_folder: destinationFolder
      });
      success('Document copied successfully');
      await fetchDocuments();
    } catch (error) {
      console.error('Error copying document:', error);
      showError('Failed to copy document');
    }
  };

  const handleBulkMove = async () => {
    if (selectedDocuments.length === 0) return;
    
    try {
      let normalizedPath = (bulkMoveDest || '/').trim();
      if (!normalizedPath || normalizedPath === '') {
        normalizedPath = '/';
      }
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }

      await api.post('/api/documents/bulk/move', {
        document_ids: selectedDocuments,
        destination_folder: normalizedPath
      });
      
      success(`Successfully moved ${selectedDocuments.length} document(s) to ${normalizedPath === '/' ? 'Root' : normalizedPath}`);
      setShowBulkMoveModal(false);
      setBulkMoveDest('/');
      setSelectedDocuments([]);
      await Promise.all([fetchDocuments(), fetchFolders()]);
    } catch (error: any) {
      console.error('Error moving documents:', error);
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to move documents';
      showError(errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;
    
    try {
      console.log('Deleting documents:', selectedDocuments);
      const response = await api.post('/api/documents/bulk/delete', {
        document_ids: selectedDocuments
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bulk delete response:', response.data);
      success(`Successfully deleted ${selectedDocuments.length} document(s)`);
      setShowBulkDeleteConfirm(false);
      setSelectedDocuments([]);
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting documents:', error);
      console.error('Error response:', error?.response?.data);
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to delete documents';
      showError(errorMessage);
    }
  };

  const handleBulkCopy = async () => {
    if (selectedDocuments.length === 0) return;
    
    try {
      let normalizedPath = (bulkMoveDest || '/').trim();
      if (!normalizedPath || normalizedPath === '') {
        normalizedPath = '/';
      }
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }

      // Copy each document individually (no bulk copy endpoint)
      let successCount = 0;
      let failCount = 0;
      
      for (const docId of selectedDocuments) {
        try {
          await api.post(`/api/documents/${docId}/copy`, {
            destination_folder: normalizedPath
          });
          successCount++;
    } catch (error) {
          console.error(`Error copying document ${docId}:`, error);
          failCount++;
        }
      }
      
      if (failCount === 0) {
        success(`Successfully copied ${successCount} document(s) to ${normalizedPath === '/' ? 'Root' : normalizedPath}`);
      } else {
        warning(`Copied ${successCount} document(s), failed to copy ${failCount} document(s)`);
      }
      
      setShowBulkMoveModal(false);
      setBulkMoveDest('/');
      setSelectedDocuments([]);
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error copying documents:', error);
      showError('Failed to copy documents');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocuments.length === 0) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Download each document individually with delays to avoid browser blocking
      for (let i = 0; i < selectedDocuments.length; i++) {
        const docId = selectedDocuments[i];
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          try {
            // Add a small delay between downloads to prevent browser blocking
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const response = await api.get(`/api/documents/${docId}/download`, {
              responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.original_filename);
            document.body.appendChild(link);
            link.click();
            // Small delay before removing to ensure download starts
            await new Promise(resolve => setTimeout(resolve, 100));
            link.remove();
            window.URL.revokeObjectURL(url);
            successCount++;
          } catch (error) {
            console.error(`Error downloading document ${docId}:`, error);
            failCount++;
          }
        }
      }
      
      if (failCount === 0) {
        success(`Successfully initiated download for ${successCount} document(s)`);
      } else {
        warning(`Downloaded ${successCount} document(s), failed to download ${failCount} document(s)`);
      }
    } catch (error) {
      console.error('Error downloading documents:', error);
      showError('Failed to download some documents');
    }
  };

  const handleMoveDocument = async (docId: number, destinationFolder: string) => {
    try {
      // Normalize folder path - ensure it starts with / and is not empty
      let normalizedPath = (destinationFolder || '/').trim();
      if (!normalizedPath || normalizedPath === '') {
        normalizedPath = '/';
      }
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }

      // Get current document to check its current folder
      const currentDoc = documents.find(d => d.id === docId);
      if (!currentDoc) {
        showError('Document not found');
        return;
      }
      
      const currentDocFolder = (currentDoc.folder_path || '/').trim();
      if (!currentDocFolder.startsWith('/')) {
        const normalizedCurrent = '/' + currentDocFolder;
      }

      // Check if moving to same location
      if (normalizedPath === currentDocFolder) {
        showError('Document is already in this folder');
        setShowMoveModal({ isOpen: false, docId: 0 });
        setMoveDest('/');
        return;
      }

      console.log(`Moving document ${docId} from "${currentDocFolder}" to "${normalizedPath}"`);
      
      const response = await api.post(`/api/documents/${docId}/move`, {
        destination_folder: normalizedPath
      });
      
      console.log('Move response:', response.data);
      
      success(`Document moved successfully from ${currentDocFolder === '/' ? 'Root' : currentDocFolder} to ${normalizedPath === '/' ? 'Root' : normalizedPath}`);
      
      // Close modal first
      setShowMoveModal({ isOpen: false, docId: 0 });
      setMoveDest('/');
      
      // Refresh documents and folders
      await Promise.all([fetchDocuments(), fetchFolders()]);
      
      // If document was moved to a different folder and we're viewing the old folder,
      // optionally switch to the new folder
      if (normalizedPath !== currentDocFolder && currentFolder === currentDocFolder) {
        // Optionally switch to destination folder
        // setCurrentFolder(normalizedPath);
      }
    } catch (error: any) {
      console.error('Error moving document:', error);
      console.error('Error response:', error?.response?.data);
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to move document';
      showError(errorMessage);
    }
  };

  const handleRenameDocument = async (docId: number, newName: string) => {
    try {
      await api.put(`/api/documents/${docId}/rename`, {
        new_name: newName
      });
      success('Document renamed successfully');
      await fetchDocuments();
      setShowRenameModal({ isOpen: false, docId: 0, currentName: '' });
    } catch (error) {
      console.error('Error renaming document:', error);
      showError('Failed to rename document');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const target = currentFolder.replace(/\/$/, '');
      const newPath = target === '/' ? `/${newFolderName.trim()}` : `${target}/${newFolderName.trim()}`;
      if (folders.includes(newPath)) {
        warning('A folder with this name already exists here');
        return;
      }

      await api.post('/api/documents/folders', {
        folder_name: newFolderName.trim(),
        parent_folder: currentFolder
      });
      success('Folder created successfully');
      await fetchFolders();
      setExpandedFolders(prev => new Set([...Array.from(prev), currentFolder]));
      setShowCreateFolder(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
      showError('Failed to create folder');
    }
  };

  const handleCleanupFolders = async () => {
    try {
      const response = await api.post('/api/documents/folders/cleanup');
      success(`Cleaned up ${response.data.cleaned_count} folder paths`);
      await fetchFolders();
    } catch (error) {
      console.error('Error cleaning up folders:', error);
      showError('Failed to cleanup folders');
    }
  };

  const toggleDocumentSelection = (documentId: number) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.tags && doc.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.summary && doc.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || doc.file_type.includes(filterType);
    
    // Normalize folder_path for comparison - handle null, empty, and '/' as root
    const docFolder = doc.folder_path || '/';
    const normalizedDocFolder = docFolder === '' ? '/' : docFolder;
    const normalizedCurrentFolder = currentFolder === '' ? '/' : currentFolder;
    
    const matchesFolder = normalizedCurrentFolder === '/' 
      ? (normalizedDocFolder === '/' || normalizedDocFolder === null || normalizedDocFolder === '') 
      : normalizedDocFolder === normalizedCurrentFolder;
    
    return matchesSearch && matchesType && matchesFolder;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        return a.original_filename.localeCompare(b.original_filename);
      case 'size':
        return b.file_size - a.file_size;
      default:
        return 0;
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const buildFolderTree = () => {
    const tree: { [key: string]: string[] } = {};
    const rootFolders: string[] = [];

    folders.forEach(folder => {
      if (folder === '/') {
        rootFolders.push('/');
        return;
      }
      
      const parts = folder.split('/').filter(p => p);
      if (parts.length === 1) {
        if (!tree['/']) tree['/'] = [];
        if (!tree['/'].includes(folder)) {
          tree['/'].push(folder);
        }
      } else {
        const parent = '/' + parts.slice(0, -1).join('/');
        if (!tree[parent]) tree[parent] = [];
        if (!tree[parent].includes(folder)) {
          tree[parent].push(folder);
        }
      }
    });

    return { tree, rootFolders };
  };

  const renderFolderTree = (parentPath: string = '/', level: number = 0) => {
    const { tree } = buildFolderTree();
    const children = tree[parentPath] || [];
    const isExpanded = expandedFolders.has(parentPath);

    if (parentPath === '/' && children.length === 0 && folders.length === 0) {
      return null;
    }

    return (
      <div className="space-y-1">
        {parentPath === '/' && (
                  <button
                    onClick={() => {
                      setCurrentFolder('/');
                      setUploadFolder('/');
                      setMobileFolderSidebarOpen(false); // Close mobile sidebar when folder is selected
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentFolder === '/' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium' 
                        : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                    }`}
                  >
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">All Documents</span>
                    {currentFolder === '/' && (
                      <span className="ml-auto text-xs text-secondary-500 dark:text-secondary-400">
                        {documents.filter(d => (d.folder_path || '/') === '/').length}
                      </span>
                    )}
                  </button>
        )}
        
        {children
          .sort((a, b) => a.localeCompare(b))
          .map(folder => {
            const folderName = folder.split('/').pop() || folder;
            const hasChildren = tree[folder] && tree[folder].length > 0;
            const isSelected = currentFolder === folder;

            return (
              <div key={folder} className="pl-2 relative">
                <div className="flex items-center group relative">
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        setExpandedFolders(prev => {
                          const next = new Set(prev);
                          if (next.has(folder)) {
                            next.delete(folder);
                          } else {
                            next.add(folder);
                          }
                          return next;
                        });
                      }
                    }}
                    className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors flex-shrink-0"
                  >
                    {hasChildren ? (
                      <ChevronRight className={`h-3 w-3 text-secondary-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    ) : (
                      <div className="w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setCurrentFolder(folder);
                      setUploadFolder(folder);
                      setMobileFolderSidebarOpen(false); // Close mobile sidebar when folder is selected
                      if (hasChildren && !expandedFolders.has(folder)) {
                        setExpandedFolders(prev => new Set([...Array.from(prev), folder]));
                      }
                    }}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors min-w-0 ${
                      isSelected 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium' 
                        : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                    }`}
                  >
                    {isExpanded && hasChildren ? (
                      <FolderOpen className="h-4 w-4 flex-shrink-0 text-primary-500" />
                    ) : (
                      <Folder className="h-4 w-4 flex-shrink-0 text-primary-500" />
                    )}
                    <span className="truncate flex-1">{folderName}</span>
                    {isSelected && (
                      <span className="ml-auto text-xs text-secondary-500 dark:text-secondary-400">
                        {documents.filter(d => {
                          const docFolder = d.folder_path || '/';
                          return docFolder === folder;
                        }).length}
                      </span>
                    )}
                  </button>
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderMenuOpen(folderMenuOpen === folder ? null : folder);
                      }}
                      className={`p-1.5 rounded hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all ${
                        folderMenuOpen === folder ? 'bg-secondary-200 dark:bg-secondary-700 opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      data-folder-menu-button
                    >
                      <MoreVertical className="h-3.5 w-3.5 text-secondary-500 dark:text-secondary-400" />
                    </button>
                    
                    {folderMenuOpen === folder && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-xl z-50" data-folder-menu>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors rounded-t-lg"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setFolderMenuOpen(null); 
                            setShowRenameFolder({open: true, folder: folder}); 
                            setRenameFolderValue(folderName); 
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setFolderMenuOpen(null); 
                            setMoveFolderDest('/'); 
                            setShowMoveFolder({open: true, folder: folder}); 
                          }}
                        >
                          Move
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setFolderMenuOpen(null);
                            try {
                              await api.delete(`/api/documents/folders/${encodeURIComponent(folder)}`);
                              await fetchDocuments();
                              await fetchFolders();
                              if (currentFolder === folder) setCurrentFolder('/');
                              success(`Folder deleted successfully.`);
                            } catch (error) {
                              console.error('Error deleting folder:', error);
                              showError('Failed to delete folder');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {hasChildren && isExpanded && (
                  <div className="ml-4 mt-1">
                    {renderFolderTree(folder, level + 1)}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  const renderFolderSelect = (currentValue: string, onChange: (value: string) => void) => {
    const { tree } = buildFolderTree();
    
    const renderSelectTree = (parentPath: string = '/', level: number = 0): JSX.Element[] => {
      const children = tree[parentPath] || [];
      const elements: JSX.Element[] = [];

      if (parentPath === '/') {
        elements.push(
          <option key="/" value="/">Root</option>
        );
      }

      children.forEach(folder => {
        const folderName = folder.split('/').pop() || folder;
        const indent = '  '.repeat(level);
        elements.push(
          <option key={folder} value={folder}>
            {indent}📁 {folderName}
          </option>
        );
        
        if (tree[folder] && tree[folder].length > 0) {
          elements.push(...renderSelectTree(folder, level + 1));
        }
      });

      return elements;
    };

    return (
      <select
        className="input w-full"
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {renderSelectTree()}
      </select>
    );
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
      {/* Mobile folder sidebar overlay */}
      {mobileFolderSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileFolderSidebarOpen(false)}
        />
      )}
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] gap-4 md:gap-6">
        {/* Sidebar - visible on mobile when toggled, always visible on desktop */}
        <div className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto ${sidebarCollapsed ? 'w-12' : 'w-64'} flex-shrink-0 transition-all duration-300 flex-col bg-secondary-50 dark:bg-secondary-900/50 rounded-xl p-4 relative transform transition-transform duration-300 ease-in-out ${
          mobileFolderSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div>
                <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">My Folders</h3>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">Organize your documents</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-800 transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight className={`h-4 w-4 text-secondary-600 dark:text-secondary-400 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-visible mb-4" style={{ minHeight: 0 }}>
                {renderFolderTree()}
              </div>

              <div className="space-y-2 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  onClick={() => { setNewFolderName(''); setShowCreateFolder(true); }}
                  className="w-full btn-primary btn-sm flex items-center justify-center gap-2 font-medium"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create Folder
                </button>
                <button
                  onClick={handleCleanupFolders}
                  className="w-full btn-ghost btn-sm flex items-center justify-center gap-2 text-xs text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300"
                  title="Remove empty folders"
                >
                  <Trash className="h-3.5 w-3.5" />
                  Clean Empty Folders
                </button>
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Mobile folder toggle button */}
              <button
                onClick={() => setMobileFolderSidebarOpen(!mobileFolderSidebarOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                title="Toggle folders"
              >
                <FolderTree className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Documents</h1>
                <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
                  Upload, organize, and manage your legal documents
                </p>
              </div>
            </div>
              <div className="flex items-center gap-3">
              <div className="flex items-center bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-secondary-700 shadow-sm text-primary-600 dark:text-primary-400' 
                      : 'text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-secondary-700 shadow-sm text-primary-600 dark:text-primary-400' 
                      : 'text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            
              <label className="btn-primary btn-md cursor-pointer flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all duration-300">
                <Upload className="h-4 w-4" />
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <span>Upload</span>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt,.csv,.xls,.xlsx,.md,.json,.xml"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  multiple
                />
              </label>
          </div>
        </div>

            {/* Breadcrumb */}
            {currentFolder !== '/' && (
              <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                <button
                  onClick={() => setCurrentFolder('/')}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  All Documents
                </button>
                {currentFolder.split('/').filter(p => p).map((part, idx, arr) => {
                  const path = '/' + arr.slice(0, idx + 1).join('/');
                  return (
                    <span key={path} className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
              <button
                        onClick={() => setCurrentFolder(path)}
                        className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                        {part}
              </button>
                  </span>
                  );
                })}
                    </div>
                  )}

        {/* Search and Filters */}
            <div className="card p-4">
              <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400 dark:text-secondary-500" />
              <input
                type="text"
                placeholder="Search by name, tags, or content..."
                    className="input pl-12 pr-4 py-2.5 w-full text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3 sm:gap-4 items-center w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 hidden sm:inline">File Type:</label>
                  <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 sm:hidden">Type:</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="input py-2 px-3 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="doc">DOC</option>
                    <option value="txt">TXT</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 whitespace-nowrap hidden sm:inline">Sort by:</label>
                  <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 whitespace-nowrap sm:hidden">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input py-2 px-3 text-sm min-w-[140px] sm:min-w-[160px]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="size">Size</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm text-secondary-600 dark:text-secondary-400 font-medium">
                  {selectedDocuments.length > 0 ? (
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      {selectedDocuments.length} {selectedDocuments.length === 1 ? 'document' : 'documents'} selected
                    </span>
                  ) : (
                    <span>
                      {filteredDocuments.length === documents.length ? (
                        <>{filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}</>
                      ) : (
                        <>{filteredDocuments.length} of {documents.length} {documents.length === 1 ? 'document' : 'documents'}</>
                      )}
                    </span>
                  )}
                </div>
                {selectedDocuments.length > 0 && (
                  <button
                    onClick={() => setSelectedDocuments([])}
                    className="text-xs text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedDocuments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleBulkDownload}
                  className="btn-secondary btn-sm flex items-center gap-2"
                  title="Download selected"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    setBulkMoveDest(currentFolder);
                    setBulkActionType('move');
                    setShowBulkMoveModal(true);
                  }}
                  className="btn-secondary btn-sm flex items-center gap-2"
                  title="Move selected"
                >
                  <Move className="h-4 w-4" />
                  Move
                </button>
                <button
                  onClick={() => {
                    setBulkMoveDest(currentFolder);
                    setBulkActionType('copy');
                    setShowBulkMoveModal(true);
                  }}
                  className="btn-secondary btn-sm flex items-center gap-2"
                  title="Copy selected"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="btn-destructive btn-sm flex items-center gap-2"
                  title="Delete selected"
                >
                  <Trash className="h-4 w-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedDocuments([])}
                  className="btn-ghost btn-sm"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Documents Display */}
          <div className="flex-1 overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <div className="card p-16 text-center">
                <div className="mx-auto w-24 h-24 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-secondary-400 dark:text-secondary-500" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                  {documents.length === 0 ? 'No documents yet' : 'No documents found'}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md mx-auto">
                  {documents.length === 0 
                    ? 'Upload your first document to get started. You can organize them into folders and use AI to analyze them.' 
                    : `No documents in ${currentFolder === '/' ? 'this location' : `"${currentFolder}"`}. Try a different folder or upload documents here.`}
                </p>
                {documents.length === 0 && (
                  <label className="btn-primary btn-md cursor-pointer flex items-center hover-lift hover-glow transition-all duration-300 mx-auto w-fit">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Document
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            ) : (
        <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1" 
                : "space-y-3 p-1"
        }>
          {filteredDocuments.map((doc, index) => (
            <div
              key={doc.id}
              data-document-card
              onClick={() => toggleDocumentSelection(doc.id)}
                    className={`card hover-lift hover-glow transition-all duration-300 cursor-pointer ${
                viewMode === 'list' ? 'flex items-center justify-between' : ''
              } ${selectedDocuments.includes(doc.id) ? 'ring-2 ring-primary-500 border-2 border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg' : ''}`}
            >
              {viewMode === 'grid' ? (
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/20">
                          <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1 min-w-0 overflow-hidden">
                              <h3 
                                className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-1 truncate" 
                                title={doc.original_filename}
                              >
                          {doc.original_filename}
                        </h3>
                              <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                                {(() => {
                                  const fileType = doc.file_type?.toUpperCase().split('/').pop() || 'FILE';
                                  // Simplify common MIME types
                                  const typeMap: Record<string, string> = {
                                    'VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT': 'DOCX',
                                    'MSWORD': 'DOC',
                                    'PDF': 'PDF',
                                    'PLAIN': 'TXT',
                                    'CSV': 'CSV',
                                    'VND.OPENXMLFORMATS-OFFICEDOCUMENT.SPREADSHEETML.SHEET': 'XLSX',
                                    'VND.MS-EXCEL': 'XLS',
                                    'MARKDOWN': 'MD',
                                    'JSON': 'JSON',
                                    'XML': 'XML'
                                  };
                                  const simplifiedType = typeMap[fileType] || fileType.split('.').pop() || fileType;
                                  return `${simplifiedType} • ${formatFileSize(doc.file_size)}`;
                                })()}
                              </p>
                      </div>
                    </div>
                <div className="relative" data-document-menu>
                      <button
                      className={`p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors ${
                          openMenuId === doc.id ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                        }`}
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === doc.id ? null : doc.id); }}
                      data-document-menu-button
                      >
                        <MoreVertical className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                      </button>
                      
                      {openMenuId === doc.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-10">
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); openDetails(doc.id); }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> Details
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleGetSummary(doc.id); }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" /> Get Summary
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleChatWithDocument(doc.id, doc.original_filename); }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" /> Chat with Document
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handlePreviewDocument(doc.id, doc.original_filename); }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> Preview
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDownloadDocument(doc.id, doc.original_filename); }}
                          >
                            <Download className="h-4 w-4 mr-2" /> Download
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setShowRenameModal({isOpen: true, docId: doc.id, currentName: doc.original_filename}); }}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Rename
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(null); 
                                    // Set destination to root by default, or current folder if not root
                                    const defaultDest = currentFolder === '/' ? '/' : currentFolder;
                                    setMoveDest(defaultDest);
                              setShowMoveModal({isOpen: true, docId: doc.id}); 
                            }}
                          >
                            <Move className="h-4 w-4 mr-2" /> Move
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleCopyDocument(doc.id, currentFolder); }}
                          >
                            <Copy className="h-4 w-4 mr-2" /> Make a Copy
                          </button>
                          <div className="h-px bg-secondary-200 dark:bg-secondary-700" />
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); requestDeleteDocument(doc.id, doc.original_filename); }}
                        >
                            <Trash className="h-4 w-4 mr-2" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                        {doc.folder_path && doc.folder_path !== '/' && (
                          <div className="flex items-center gap-1 text-xs text-secondary-500 dark:text-secondary-400">
                            <Folder className="h-3 w-3" />
                            <span className="truncate">{doc.folder_path}</span>
                          </div>
                        )}
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between w-full">
                  <div className="flex items-center flex-1 min-w-0 overflow-hidden gap-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 
                        className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate" 
                        title={doc.original_filename}
                      >
                        {doc.original_filename}
                      </h3>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5 truncate">
                        {(() => {
                          const fileType = doc.file_type?.toUpperCase().split('/').pop() || 'FILE';
                          // Simplify common MIME types
                          const typeMap: Record<string, string> = {
                            'VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT': 'DOCX',
                            'MSWORD': 'DOC',
                            'PDF': 'PDF',
                            'PLAIN': 'TXT',
                            'CSV': 'CSV',
                            'VND.OPENXMLFORMATS-OFFICEDOCUMENT.SPREADSHEETML.SHEET': 'XLSX',
                            'VND.MS-EXCEL': 'XLS',
                            'MARKDOWN': 'MD',
                            'JSON': 'JSON',
                            'XML': 'XML'
                          };
                          const simplifiedType = typeMap[fileType] || fileType.split('.').pop() || fileType;
                          return `${simplifiedType} • ${formatFileSize(doc.file_size)}`;
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="relative" data-document-menu>
                    <button
                      className={`p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors ${
                        openMenuId === doc.id ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                      }`}
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === doc.id ? null : doc.id); }}
                      data-document-menu-button
                    >
                      <MoreVertical className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                    </button>

                    {openMenuId === doc.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-10">
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); openDetails(doc.id); }}
                        >
                          <Eye className="h-4 w-4 mr-2" /> Details
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleGetSummary(doc.id); }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" /> Get Summary
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleChatWithDocument(doc.id, doc.original_filename); }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" /> Chat with Document
                        </button>
                        <div className="h-px bg-secondary-200 dark:bg-secondary-700" />
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handlePreviewDocument(doc.id, doc.original_filename); }}
                        >
                          <Eye className="h-4 w-4 mr-2" /> Preview
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDownloadDocument(doc.id, doc.original_filename); }}
                        >
                          <Download className="h-4 w-4 mr-2" /> Download
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setShowRenameModal({isOpen: true, docId: doc.id, currentName: doc.original_filename}); }}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Rename
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenuId(null); 
                            // Set destination to root by default, or current folder if not root
                            const defaultDest = currentFolder === '/' ? '/' : currentFolder;
                            setMoveDest(defaultDest);
                            setShowMoveModal({isOpen: true, docId: doc.id}); 
                          }}
                        >
                          <Move className="h-4 w-4 mr-2" /> Move
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleCopyDocument(doc.id, currentFolder); }}
                        >
                          <Copy className="h-4 w-4 mr-2" /> Make a Copy
                        </button>
                        <div className="h-px bg-secondary-200 dark:bg-secondary-700" />
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); requestDeleteDocument(doc.id, doc.original_filename); }}
                        >
                          <Trash className="h-4 w-4 mr-2" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals - keeping existing modal code but updating move modal to use folder selector */}
      {/* Document Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {previewModal.filename}
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Document Preview</p>
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

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.doc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-lg w-full animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate max-w-[420px]">
                    {detailsModal.doc.original_filename}
                  </h3>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    {detailsModal.doc.file_type} • {formatFileSize(detailsModal.doc.file_size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModal({ isOpen: false, doc: null })}
                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              >
                <X className="h-5 w-5 text-secondary-500" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-sm text-secondary-700 dark:text-secondary-300 space-y-2">
                <div>File name: {detailsModal.doc.original_filename}</div>
                <div>Path: {detailsModal.doc.folder_path === '/' ? 'Root' : detailsModal.doc.folder_path}</div>
                <div>Uploaded: {new Date(detailsModal.doc.created_at).toLocaleString()}</div>
                <div>Size: {formatFileSize(detailsModal.doc.file_size)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {summaryModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-lg w-full animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Summary</h3>
              </div>
              <button
                onClick={() => setSummaryModal({ isOpen: false, text: '', loading: false })}
                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              >
                <X className="h-5 w-5 text-secondary-500" />
              </button>
            </div>
            <div className="p-6">
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

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Create New Folder</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
              Creating in: <span className="font-medium">{currentFolder === '/' ? 'Root' : currentFolder}</span>
            </p>
            <input
              type="text"
              placeholder="Folder name"
              className="input w-full mb-4"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="btn-primary btn-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Document Modal */}
      {showMoveModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Move Document</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
              Select the destination folder:
            </p>
            {renderFolderSelect(moveDest || '/', (value) => setMoveDest(value || '/'))}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMoveModal({ isOpen: false, docId: 0 })}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Always allow move - moveDest defaults to '/' if not set
                  const dest = moveDest || '/';
                  handleMoveDocument(showMoveModal.docId, dest);
                }}
                className="btn-primary btn-sm"
                disabled={!moveDest}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {showRenameModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Rename Document</h3>
            <input
              type="text"
              placeholder="New name"
              className="input w-full mb-4"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRenameDocument(showRenameModal.docId, renameValue)}
              defaultValue={showRenameModal.currentName}
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowRenameModal({ isOpen: false, docId: 0, currentName: '' }); setRenameValue(''); }}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRenameDocument(showRenameModal.docId, renameValue)}
                className="btn-primary btn-sm"
                disabled={!renameValue.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">Delete document?</h3>
            <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">This action cannot be undone. You are about to delete "{confirmDelete.filename}".</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete({ isOpen: false, docId: 0, filename: '' })}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocument}
                className="btn-destructive btn-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Move/Copy Modal */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              {bulkActionType === 'copy' ? 'Copy' : 'Move'} {selectedDocuments.length} Document{selectedDocuments.length > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
              Select the destination folder:
            </p>
            {renderFolderSelect(bulkMoveDest || '/', (value) => setBulkMoveDest(value || '/'))}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkMoveModal(false);
                  setBulkMoveDest('/');
                }}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkActionType === 'copy') {
                    handleBulkCopy();
                  } else {
                    handleBulkMove();
                  }
                }}
                className="btn-primary btn-sm"
                disabled={!bulkMoveDest}
              >
                {bulkActionType === 'copy' ? 'Copy' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              Delete {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
              This action cannot be undone. You are about to delete {selectedDocuments.length} selected document{selectedDocuments.length > 1 ? 's' : ''}.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn-destructive btn-sm"
              >
                Delete {selectedDocuments.length} Document{selectedDocuments.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
