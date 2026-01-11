'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DocumentEditor from '@/components/DocumentEditor';
import api from '@/lib/api';
import { Plus, FileType, Edit, Trash2, Upload, X, Wand2, MoreVertical, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { ToastContainer, useToast } from '@/components/Toast';

interface TemplateField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  default?: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  template_content: string;
  category: string;
  is_public: boolean;
  created_at: string;
  variable_fields?: string;
}

const TEMPLATE_CATEGORIES = [
  { id: 'contract', name: 'Contracts', description: 'Employment, partnership, service, lease contracts' },
  { id: 'agreement', name: 'Agreements', description: 'NDA, licensing, loan agreements' },
  { id: 'mou', name: 'MoUs', description: 'Memorandums of Understanding' },
  { id: 'notice', name: 'Legal Notices', description: 'Legal notices and communications' },
  { id: 'affidavit', name: 'Affidavits', description: 'Sworn statements and affidavits' },
  { id: 'policy', name: 'Policies', description: 'Legal policies and procedures' },
  { id: 'other', name: 'Other', description: 'Other legal documents' },
];

// Predefined field sets for different document types
const TEMPLATE_FIELD_SETS: Record<string, TemplateField[]> = {
  contract: [
    { name: 'party1_name', label: 'First Party Name', type: 'text', required: true, placeholder: 'Enter first party name' },
    { name: 'party2_name', label: 'Second Party Name', type: 'text', required: true, placeholder: 'Enter second party name' },
    { name: 'contract_type', label: 'Contract Type', type: 'select', required: true, options: ['Employment', 'Partnership', 'Service', 'Lease', 'Sales', 'Other'] },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: false },
    { name: 'contract_value', label: 'Contract Value', type: 'text', required: false, placeholder: 'Enter contract value (e.g., $10,000)' },
    { name: 'payment_terms', label: 'Payment Terms', type: 'textarea', required: false, placeholder: 'Enter payment terms' },
    { name: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: false, placeholder: 'Enter governing jurisdiction' },
  ],
  agreement: [
    { name: 'party1_name', label: 'First Party Name', type: 'text', required: true, placeholder: 'Enter first party name' },
    { name: 'party2_name', label: 'Second Party Name', type: 'text', required: true, placeholder: 'Enter second party name' },
    { name: 'agreement_type', label: 'Agreement Type', type: 'select', required: true, options: ['NDA', 'Licensing', 'Loan', 'Partnership', 'Service', 'Other'] },
    { name: 'effective_date', label: 'Effective Date', type: 'date', required: true },
    { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: false },
    { name: 'subject_matter', label: 'Subject Matter', type: 'textarea', required: true, placeholder: 'Describe the subject matter of the agreement' },
    { name: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: false, placeholder: 'Enter governing jurisdiction' },
  ],
  mou: [
    { name: 'party1_name', label: 'First Party Name', type: 'text', required: true, placeholder: 'Enter first party name' },
    { name: 'party2_name', label: 'Second Party Name', type: 'text', required: true, placeholder: 'Enter second party name' },
    { name: 'mou_date', label: 'MoU Date', type: 'date', required: true },
    { name: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'Describe the purpose of the MoU' },
    { name: 'key_objectives', label: 'Key Objectives', type: 'textarea', required: false, placeholder: 'List key objectives' },
    { name: 'duration', label: 'Duration', type: 'text', required: false, placeholder: 'Enter duration (e.g., 1 year)' },
  ],
  notice: [
    { name: 'sender_name', label: 'Sender Name', type: 'text', required: true, placeholder: 'Enter sender name' },
    { name: 'recipient_name', label: 'Recipient Name', type: 'text', required: true, placeholder: 'Enter recipient name' },
    { name: 'notice_type', label: 'Notice Type', type: 'select', required: true, options: ['Cease and Desist', 'Demand Letter', 'Notice of Breach', 'Termination Notice', 'Legal Notice', 'Other'] },
    { name: 'notice_date', label: 'Notice Date', type: 'date', required: true },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Enter notice subject' },
    { name: 'content', label: 'Notice Content', type: 'textarea', required: true, placeholder: 'Enter notice details' },
    { name: 'response_deadline', label: 'Response Deadline', type: 'date', required: false },
  ],
  affidavit: [
    { name: 'affiant_name', label: 'Affiant Name', type: 'text', required: true, placeholder: 'Enter affiant name' },
    { name: 'affiant_address', label: 'Affiant Address', type: 'textarea', required: true, placeholder: 'Enter affiant address' },
    { name: 'affidavit_date', label: 'Affidavit Date', type: 'date', required: true },
    { name: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'Describe the purpose of the affidavit' },
    { name: 'witness_name', label: 'Witness Name', type: 'text', required: false, placeholder: 'Enter witness name (if applicable)' },
    { name: 'notary_name', label: 'Notary Public Name', type: 'text', required: false, placeholder: 'Enter notary public name' },
    { name: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: false, placeholder: 'Enter jurisdiction' },
  ],
  policy: [
    { name: 'organization_name', label: 'Organization Name', type: 'text', required: true, placeholder: 'Enter organization name' },
    { name: 'policy_name', label: 'Policy Name', type: 'text', required: true, placeholder: 'Enter policy name' },
    { name: 'effective_date', label: 'Effective Date', type: 'date', required: true },
    { name: 'policy_type', label: 'Policy Type', type: 'select', required: true, options: ['Privacy Policy', 'Terms of Service', 'Code of Conduct', 'HR Policy', 'Security Policy', 'Other'] },
    { name: 'scope', label: 'Scope', type: 'textarea', required: true, placeholder: 'Describe the scope of the policy' },
    { name: 'review_date', label: 'Review Date', type: 'date', required: false },
  ],
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, any>>({});
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [generating, setGenerating] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template_content: '',
    category: '',
    is_public: false,
  });
  const [uploadedTemplate, setUploadedTemplate] = useState<Template | null>(null);
  const [showUploadConfigModal, setShowUploadConfigModal] = useState(false);
  const [uploadConfig, setUploadConfig] = useState({
    category: 'other',
    name: '',
    description: '',
    is_public: false,
  });
  const { toasts, success, error: showError, warning, info, removeToast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      fetchTemplateFields(selectedTemplate.id, selectedTemplate.category);
    }
  }, [selectedTemplate]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any template menu (button or dropdown)
      const isClickInsideMenu = target.closest('[data-template-menu]');
      if (!isClickInsideMenu && templateMenuOpen !== null) {
        setTemplateMenuOpen(null);
      }
    };
    
    if (templateMenuOpen !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [templateMenuOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateFields = async (templateId: number, category?: string) => {
    try {
      const response = await api.get(`/api/templates/${templateId}/variable-fields`);
      if (response.data.fields && response.data.fields.length > 0) {
        setTemplateFields(response.data.fields);
        // Initialize variables with defaults
        const vars: Record<string, any> = {};
        response.data.fields.forEach((field: TemplateField) => {
          vars[field.name] = field.default || '';
        });
        setTemplateVariables(vars);
      } else {
        // Use category-specific fields if available
        if (category && TEMPLATE_FIELD_SETS[category]) {
          setTemplateFields(TEMPLATE_FIELD_SETS[category]);
          const vars: Record<string, any> = {};
          TEMPLATE_FIELD_SETS[category].forEach((field) => {
            vars[field.name] = field.default || '';
          });
          setTemplateVariables(vars);
        } else {
          // Fallback to basic fields
          setTemplateFields([]);
          setTemplateVariables({
            client_name: '',
            witness_name: '',
            date: new Date().toISOString().split('T')[0],
          });
        }
      }
    } catch (error) {
      console.error('Error fetching template fields:', error);
      // Use category-specific fields as fallback
      if (category && TEMPLATE_FIELD_SETS[category]) {
        setTemplateFields(TEMPLATE_FIELD_SETS[category]);
        const vars: Record<string, any> = {};
        TEMPLATE_FIELD_SETS[category].forEach((field) => {
          vars[field.name] = field.default || '';
        });
        setTemplateVariables(vars);
      } else {
        setTemplateFields([]);
      }
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    setSelectedTemplate(template);
    setShowEditor(false);
    setDocumentContent('');
    setTemplateVariables({});
    // Fetch template fields when template is selected
    await fetchTemplateFields(template.id, template.category);
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) return;
    
    // Validate that required fields are filled
    const requiredFields = templateFields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !templateVariables[f.name] || templateVariables[f.name].trim() === '');
    
    if (missingFields.length > 0) {
      showError(`Please fill in all required fields: ${missingFields.map(f => f.label || f.name).join(', ')}`);
      return;
    }
    
    setGenerating(true);
    try {
      const response = await api.post(`/api/templates/${selectedTemplate.id}/generate-content`, {
        template_id: selectedTemplate.id,
        variables: templateVariables,
        output_format: 'docx'
      });
      
      if (!response.data || !response.data.content) {
        throw new Error('No content received from server');
      }
      
      // Clean markdown from content before displaying
      let cleanedContent = response.data.content
        .replace(/\*\*\*/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/__/g, '')
        .replace(/_/g, '')
        .replace(/###/g, '')
        .replace(/##/g, '')
        .replace(/#/g, '')
        .replace(/`/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      
      setDocumentContent(cleanedContent);
      setShowEditor(true);
      success('Document generated successfully! You can now edit it.');
    } catch (error: any) {
      console.error('Error generating document:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to generate document. Please check your template variables and try again.';
      showError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportDocument = async (format: 'docx' | 'pdf' | 'txt' | 'rtf') => {
    if (!selectedTemplate) return;
    
    try {
      const response = await api.post(
        `/api/templates/${selectedTemplate.id}/generate`,
        {
          template_id: selectedTemplate.id,
          variables: templateVariables,
          output_format: format
        },
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 
              format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              format === 'rtf' ? 'application/rtf' : 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name.replace(' ', '_')}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success(`Document exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting document:', error);
      showError('Failed to export document');
    }
  };

  const handleAIEdit = async (instruction: string): Promise<string> => {
    if (!selectedTemplate || !documentContent) return documentContent;
    
    try {
      // Use dedicated AI edit endpoint without context retrieval
      const response = await api.post('/api/templates/edit-content', {
        document_content: documentContent,
        instruction: instruction
      });
      
      return response.data.content || documentContent;
    } catch (error: any) {
      console.error('Error editing document:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to edit document';
      showError(errorMessage);
      return documentContent;
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await api.delete(`/api/templates/${templateId}`);
      setShowDeleteConfirm(null);
      await fetchTemplates();
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setShowEditor(false);
        setDocumentContent('');
      }
      success('Template deleted successfully');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete template. You may not have permission to delete this template.';
      showError(errorMessage);
      setShowDeleteConfirm(null);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description || '',
      template_content: template.template_content,
      category: template.category || '',
      is_public: template.is_public,
    });
    setShowCreateForm(true);
    setTemplateMenuOpen(null);
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    try {
      await api.put(`/api/templates/${editingTemplate.id}`, newTemplate);
      setNewTemplate({
        name: '',
        description: '',
        template_content: '',
        category: '',
        is_public: false,
      });
      setEditingTemplate(null);
      setShowCreateForm(false);
      fetchTemplates();
      success('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      showError('Failed to update template');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await handleUpdateTemplate(e);
        return;
      }
      
      await api.post('/api/templates', newTemplate);
      setNewTemplate({
        name: '',
        description: '',
        template_content: '',
        category: '',
        is_public: false,
      });
      setShowCreateForm(false);
      fetchTemplates();
      success('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      showError('Failed to create template');
    }
  };

  const toggleTemplateSelection = (templateId: number) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleToggleVisibility = async (template: Template) => {
    try {
      const newVisibility = !template.is_public;
      await api.put(`/api/templates/${template.id}`, {
        is_public: newVisibility,
      });
      setTemplateMenuOpen(null);
      await fetchTemplates();
      // Update selected template if it's the one being changed
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate({ ...selectedTemplate, is_public: newVisibility });
      }
      success(`Template is now ${newVisibility ? 'public' : 'private'}`);
    } catch (error: any) {
      console.error('Error toggling template visibility:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to change template visibility';
      showError(errorMessage);
    }
  };

  const handleCloneTemplate = async (template: Template) => {
    try {
      const clonedTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        template_content: template.template_content,
        category: template.category,
        is_public: false,
      };
      await api.post('/api/templates', clonedTemplate);
      
      // Also clone variable fields if they exist
      if (template.variable_fields) {
        const newTemplate = await api.get('/api/templates');
        const latest = newTemplate.data[newTemplate.data.length - 1];
        if (latest) {
          await api.put(`/api/templates/${latest.id}/variable-fields`, {
            fields: JSON.parse(template.variable_fields)
          });
        }
      }
      
      setTemplateMenuOpen(null);
      fetchTemplates();
      success('Template cloned successfully');
    } catch (error) {
      console.error('Error cloning template:', error);
      showError('Failed to clone template');
    }
  };

  const handleBulkClone = async () => {
    if (selectedTemplates.length === 0) return;
    
    try {
      let successCount = 0;
      for (const templateId of selectedTemplates) {
        const template = templates.find(t => t.id === templateId);
        if (template) {
          try {
            const clonedTemplate = {
              name: `${template.name} (Copy)`,
              description: template.description,
              template_content: template.template_content,
              category: template.category,
              is_public: false,
            };
            await api.post('/api/templates', clonedTemplate);
            
            // Clone variable fields if they exist
            if (template.variable_fields) {
              const newTemplates = await api.get('/api/templates');
              const latest = newTemplates.data[newTemplates.data.length - 1];
              if (latest) {
                await api.put(`/api/templates/${latest.id}/variable-fields`, {
                  fields: JSON.parse(template.variable_fields)
                });
              }
            }
            successCount++;
    } catch (error) {
            console.error(`Error cloning template ${templateId}:`, error);
          }
        }
      }
      
      const totalCount = selectedTemplates.length;
      setSelectedTemplates([]);
      success(`Successfully cloned ${successCount} of ${totalCount} template(s)`);
      fetchTemplates();
    } catch (error) {
      console.error('Error bulk cloning templates:', error);
      showError('Failed to clone some templates');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return;
    
    try {
      let successCount = 0;
      for (const templateId of selectedTemplates) {
        try {
          await api.delete(`/api/templates/${templateId}`);
          if (selectedTemplate?.id === templateId) {
            setSelectedTemplate(null);
          }
          successCount++;
        } catch (error) {
          console.error(`Error deleting template ${templateId}:`, error);
        }
      }
      
      const totalCount = selectedTemplates.length;
      setSelectedTemplates([]);
      setShowBulkDeleteConfirm(false);
      success(`Successfully deleted ${successCount} of ${totalCount} template(s)`);
      fetchTemplates();
    } catch (error) {
      console.error('Error bulk deleting templates:', error);
      showError('Failed to delete some templates');
    }
  };

  const handleTriggerUpload = () => fileInputRef.current?.click();

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    // Use a default category for initial upload, user will specify later
    const lower = file.name.toLowerCase();
    const defaultCategory = lower.includes('contract') ? 'contract' : 
                           lower.includes('affidavit') ? 'affidavit' : 
                           lower.includes('mou') ? 'mou' :
                           lower.includes('notice') ? 'notice' :
                           lower.includes('policy') ? 'policy' : 'other';
    formData.append('category', defaultCategory);
    formData.append('is_public', 'false');
    formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
    try {
      const response = await api.post('/api/templates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Show configuration modal with pre-filled data
      setUploadedTemplate(response.data);
      setUploadConfig({
        category: defaultCategory,
        name: response.data.name || file.name.replace(/\.[^/.]+$/, ''),
        description: response.data.description || '',
        is_public: response.data.is_public || false,
      });
      setShowUploadConfigModal(true);
      
      success('Template uploaded! Please specify the document type.');
    } catch (error: any) {
      console.error('Error uploading template:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to upload template';
      showError(errorMessage);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveUploadConfig = async () => {
    if (!uploadedTemplate || !uploadConfig.name.trim()) return;
    
    setLoading(true);
    try {
      // Update the template with user-specified configuration
      const response = await api.put(`/api/templates/${uploadedTemplate.id}`, {
        category: uploadConfig.category,
        name: uploadConfig.name,
        description: uploadConfig.description,
        is_public: uploadConfig.is_public,
      });
      
      success(`Template configured as ${TEMPLATE_CATEGORIES.find(c => c.id === uploadConfig.category)?.name || uploadConfig.category}. Document fields have been set.`);
      setShowUploadConfigModal(false);
      setSelectedCategory(null);
      await fetchTemplates();
      
      // Select and configure the template with appropriate fields based on category
      if (response.data) {
        await handleTemplateSelect(response.data);
      }
      
      setUploadedTemplate(null);
    } catch (error: any) {
      console.error('Error updating template:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to update template';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = selectedCategory 
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show editor view
  if (showEditor && selectedTemplate) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setDocumentContent('');
                }}
                className="btn-ghost btn-sm mb-4"
              >
                ← Back to Templates
              </button>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 truncate" title={selectedTemplate.name}>
                {selectedTemplate.name}
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                Edit your generated document
              </p>
            </div>
          </div>
          
          <div className="h-[calc(100vh-200px)]">
            <DocumentEditor
              content={documentContent}
              onContentChange={setDocumentContent}
              onExport={handleExportDocument}
              templateName={selectedTemplate.name}
              onAIEdit={handleAIEdit}
            />
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    );
  }

  // Show template selection and form view
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">Templates</h1>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                Create, customize, and manage legal documents with intelligent generation.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTriggerUpload}
                className="btn-secondary btn-md flex items-center hover-lift"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Template
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary btn-md flex items-center hover-lift"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input for uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleUploadTemplate}
        />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
            }`}
          >
            All Templates
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Template Selection and Form */}
        {selectedTemplate && !showEditor && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Info */}
            <div className="card border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50/50 to-white dark:from-primary-900/10 dark:to-secondary-800 p-6">
              <div className="flex items-start justify-between mb-6 gap-4">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                      <FileType className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2 truncate" title={selectedTemplate.name}>
                      {selectedTemplate.name}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="px-2.5 py-1 rounded-md bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium capitalize">
                        {selectedTemplate.category}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md font-medium ${
                        selectedTemplate.is_public 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                      }`}>
                        {selectedTemplate.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="btn-ghost btn-sm p-2 flex-shrink-0 hover:bg-error-50 dark:hover:bg-error-900/20"
                  title="Close"
                >
                  <X className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                </button>
              </div>
              
              {selectedTemplate.description && (
                <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <p className="text-sm leading-relaxed text-secondary-700 dark:text-secondary-300">
                    {selectedTemplate.description}
                  </p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Created {new Date(selectedTemplate.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Variable Form */}
            <div className="card hover-lift">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6 px-2">
                  Document Information
                </h3>
              <div className="space-y-5">
                {templateFields.length > 0 ? (
                  templateFields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        {field.label} {field.required && <span className="text-error-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          placeholder={field.placeholder}
                          className="input mt-1"
                          rows={3}
                          value={templateVariables[field.name] || ''}
                          onChange={(e) => setTemplateVariables({
                            ...templateVariables,
                            [field.name]: e.target.value
                          })}
                          spellCheck={typeof window !== 'undefined' ? (localStorage.getItem('enable_autocorrect') === 'true') : false}
                        />
                      ) : field.type === 'select' && field.options ? (
                        <select
                          required={field.required}
                          className="input mt-1"
                          value={templateVariables[field.name] || ''}
                          onChange={(e) => setTemplateVariables({
                            ...templateVariables,
                            [field.name]: e.target.value
                          })}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          required={field.required}
                          placeholder={field.placeholder}
                          className="input mt-1"
                          value={templateVariables[field.name] || ''}
                          onChange={(e) => setTemplateVariables({
                            ...templateVariables,
                            [field.name]: e.target.value
                          })}
                        />
                      ) : (
                        <input
                          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                          required={field.required}
                          placeholder={field.placeholder}
                          className="input mt-1"
                          value={templateVariables[field.name] || ''}
                          onChange={(e) => setTemplateVariables({
                            ...templateVariables,
                            [field.name]: e.target.value
                          })}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Client Name <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter client name"
                        className="input mt-1"
                        value={templateVariables.client_name || ''}
                        onChange={(e) => setTemplateVariables({
                          ...templateVariables,
                          client_name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Witness Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter witness name (if applicable)"
                        className="input mt-1"
                        value={templateVariables.witness_name || ''}
                        onChange={(e) => setTemplateVariables({
                          ...templateVariables,
                          witness_name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        className="input mt-1"
                        value={templateVariables.date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setTemplateVariables({
                          ...templateVariables,
                          date: e.target.value
                        })}
                      />
                    </div>
                  </>
                )}
                
                <button
                  onClick={handleGenerateDocument}
                  disabled={generating}
                  className="btn-primary btn-md w-full flex items-center justify-center"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Document
                    </>
                  )}
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Template Form */}
        {showCreateForm && (
          <div className="card hover-lift animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 px-2">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTemplate(null);
                  setNewTemplate({
                    name: '',
                    description: '',
                    template_content: '',
                    category: '',
                    is_public: false,
                  });
                }}
                className="btn-ghost btn-sm p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Name</label>
                  <input
                    type="text"
                    required
                    className="input mt-1"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Category</label>
                  <select
                    className="input mt-1"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Description</label>
                <textarea
                  className="input mt-1"
                  rows={2}
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Template Content</label>
                <textarea
                  required
                  className="input mt-1"
                  rows={8}
                  placeholder="Enter your template content or structure. The AI will generate a complete document based on this."
                  value={newTemplate.template_content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template_content: e.target.value })}
                />
                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                  You can provide a structure, outline, or sample content. The AI will generate a complete professional document.
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  checked={newTemplate.is_public}
                  onChange={(e) => setNewTemplate({ ...newTemplate, is_public: e.target.checked })}
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
                  Make this template public
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    setNewTemplate({
                      name: '',
                      description: '',
                      template_content: '',
                      category: '',
                      is_public: false,
                    });
                  }}
                  className="btn-secondary btn-md"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-md">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedTemplates.length > 0 && !selectedTemplate && !showCreateForm && (
          <div className="flex items-center justify-between py-3 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkClone}
                className="btn-secondary btn-sm flex items-center gap-2"
                title="Clone selected"
              >
                <Copy className="h-4 w-4" />
                Clone
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="btn-destructive btn-sm flex items-center gap-2"
                title="Delete selected"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedTemplates([])}
                className="btn-ghost btn-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
                title="Clear selection"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {!selectedTemplate && !showCreateForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
            {filteredTemplates.map((template, index) => (
            <div 
              key={template.id} 
                onClick={(e) => {
                  // Don't open if clicking on ellipsis menu or its actions
                  if ((e.target as HTMLElement).closest('[data-template-menu]')) {
                    return;
                  }
                  // Single click selects/opens the template
                  // Ctrl+Click for multi-select (optional)
                  if (e.ctrlKey || e.metaKey) {
                    toggleTemplateSelection(template.id);
                  } else {
                    handleTemplateSelect(template);
                  }
                }}
                className={`card hover-lift hover-glow transition-all duration-300 cursor-pointer animate-fade-in-up p-6 ${
                  selectedTemplates.includes(template.id) 
                    ? 'ring-2 ring-primary-500 border-2 border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg' 
                    : ''
                }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/20">
                        <FileType className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate mb-2" title={template.name}>
                        {template.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded-md bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium capitalize">
                          {template.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          template.is_public 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                        }`}>
                          {template.is_public ? 'Public' : 'Private'}
                        </span>
                    </div>
                  </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative" data-template-menu>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateMenuOpen(templateMenuOpen === template.id ? null : template.id);
                        }}
                        className="p-1 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 dark:text-secondary-400 transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="h-5 w-5" />
                    </button>
                      {templateMenuOpen === template.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-xl z-50">
                          <div className="p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTemplate(template);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloneTemplate(template);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Clone
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVisibility(template);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg flex items-center gap-2"
                            >
                              {template.is_public ? (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Make Public
                                </>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(template.id);
                                setTemplateMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                    </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {template.description && (
                  <div className="mb-5">
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    Use Template →
                  </span>
              </div>
            </div>
          ))}
        </div>
        )}

        {filteredTemplates.length === 0 && !selectedTemplate && !showCreateForm && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="mx-auto w-20 h-20 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <FileType className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              No templates found
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto mb-6">
              Get started by creating your first document template or uploading an existing one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary btn-md flex items-center hover-lift"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </button>
              <button
                onClick={handleTriggerUpload}
                className="btn-secondary btn-md flex items-center hover-lift"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Template
                  </button>
                </div>
          </div>
        )}

        {/* Single Template Delete Confirmation Modal */}
        {showDeleteConfirm !== null && (() => {
          const templateToDelete = templates.find(t => t.id === showDeleteConfirm);
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in-up">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                  Delete Template?
                </h3>
                <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-2">
                  This action cannot be undone. You are about to delete:
                </p>
                {templateToDelete && (
                  <div className="mb-4 p-3 bg-secondary-50 dark:bg-secondary-900/50 rounded-lg border border-secondary-200 dark:border-secondary-700">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate" title={templateToDelete.name}>
                      {templateToDelete.name}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(showDeleteConfirm)}
                    className="btn-destructive btn-sm"
                  >
                    Delete Template
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in-up">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                Delete {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''}?
              </h3>
              <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                This action cannot be undone. You are about to delete {selectedTemplates.length} selected template{selectedTemplates.length > 1 ? 's' : ''}.
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
                  Delete {selectedTemplates.length} Template{selectedTemplates.length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Configuration Modal */}
      {showUploadConfigModal && uploadedTemplate && (
        <div className="modal-overlay" onClick={() => setShowUploadConfigModal(false)}>
          <div className="modal-container max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center justify-between">
                <h3 className="modal-title">Configure Uploaded Template</h3>
                <button
                  onClick={() => {
                    setShowUploadConfigModal(false);
                    setUploadedTemplate(null);
                  }}
                  className="btn-ghost btn-xs p-1.5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                Specify the document type to automatically configure the information fields that will be used when generating documents from this template.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveUploadConfig(); }} className="space-y-4">
                <div className="form-group">
                  <label className="label-required">Document Type</label>
                  <select
                    className="input"
                    value={uploadConfig.category}
                    onChange={(e) => setUploadConfig({ ...uploadConfig, category: e.target.value })}
                    required
                  >
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} - {cat.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    This determines which fields will be available when generating documents
                  </p>
                </div>
                
                <div className="form-group">
                  <label className="label-required">Template Name</label>
                  <input
                    type="text"
                    className="input"
                    value={uploadConfig.name}
                    onChange={(e) => setUploadConfig({ ...uploadConfig, name: e.target.value })}
                    placeholder="Enter template name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={uploadConfig.description}
                    onChange={(e) => setUploadConfig({ ...uploadConfig, description: e.target.value })}
                    placeholder="Optional description of what this template is used for..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadConfig.is_public}
                      onChange={(e) => setUploadConfig({ ...uploadConfig, is_public: e.target.checked })}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Make this template public (visible to all users)
                    </span>
                  </label>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadConfigModal(false);
                      setUploadedTemplate(null);
                    }}
                    className="btn-secondary btn-md"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    className="btn-primary btn-md"
                    disabled={loading || !uploadConfig.name.trim()}
                  >
                    {loading ? 'Saving...' : 'Save & Continue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </DashboardLayout>
  );
}
