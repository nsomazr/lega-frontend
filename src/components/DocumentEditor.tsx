'use client';

import { useState, useRef, useEffect } from 'react';
import { Save, Download, FileText, FileDown, File, FileType, Wand2, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface DocumentEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  onExport?: (format: 'docx' | 'pdf' | 'txt' | 'rtf') => void;
  templateName?: string;
  onAIEdit?: (instruction: string) => Promise<string>;
}

export default function DocumentEditor({
  content,
  onContentChange,
  onSave,
  onExport,
  templateName = 'Document',
  onAIEdit
}: DocumentEditorProps) {
  const autocorrectEnabled = useAutocorrect();
  const [showAIEdit, setShowAIEdit] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { success, error: showError } = useToast();

  const handleExport = (format: 'docx' | 'pdf' | 'txt' | 'rtf') => {
    if (onExport) {
      onExport(format);
      success(`Exporting as ${format.toUpperCase()}...`);
    }
  };

  const handleAIEdit = async () => {
    if (!aiInstruction.trim() || !onAIEdit) return;
    
    setAiLoading(true);
    try {
      const editedContent = await onAIEdit(aiInstruction);
      onContentChange(editedContent);
      setAiInstruction('');
      setShowAIEdit(false);
      success('Document edited successfully');
    } catch (error) {
      showError('Failed to edit document');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            {templateName}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {onAIEdit && (
            <button
              onClick={() => setShowAIEdit(!showAIEdit)}
              className="btn-secondary btn-sm flex items-center"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Edit
            </button>
          )}
          
          {onSave && (
            <button
              onClick={onSave}
              className="btn-primary btn-sm flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          )}
          
          <div className="relative group">
            <button className="btn-secondary btn-sm flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            
            {onExport && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-xl z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2">
                  <button
                    onClick={() => handleExport('docx')}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as DOCX
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg flex items-center"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg flex items-center"
                  >
                    <File className="h-4 w-4 mr-2" />
                    Export as TXT
                  </button>
                  <button
                    onClick={() => handleExport('rtf')}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg flex items-center"
                  >
                    <FileType className="h-4 w-4 mr-2" />
                    Export as RTF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Edit Panel */}
      {showAIEdit && onAIEdit && (
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-primary-50 dark:bg-primary-900/20">
          <div className="flex items-start space-x-2">
            <div className="flex-1">
              <textarea
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Enter your editing instruction (e.g., 'Make the language more formal', 'Add a confidentiality clause', 'Simplify paragraph 3')"
                className="input w-full"
                rows={2}
              />
            </div>
            <button
              onClick={handleAIEdit}
              disabled={!aiInstruction.trim() || aiLoading}
              className="btn-primary btn-sm"
            >
              {aiLoading ? 'Editing...' : 'Apply'}
            </button>
            <button
              onClick={() => {
                setShowAIEdit(false);
                setAiInstruction('');
              }}
              className="btn-ghost btn-sm p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={content ? cleanMarkdownForDisplay(content) : ''}
          onChange={(e) => {
            // User edits should preserve the cleaned content
            onContentChange(e.target.value);
          }}
          className="w-full h-full p-6 text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-800 border-0 resize-none focus:outline-none focus:ring-0 text-sm leading-relaxed whitespace-pre-wrap"
          placeholder="Document content will appear here..."
          style={{ minHeight: '500px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          spellCheck={autocorrectEnabled}
        />
      </div>
    </div>
  );
}

// Helper function to clean markdown for display
function cleanMarkdownForDisplay(content: string): string {
  if (!content) return content;
  
  // Remove markdown symbols
  let cleaned = content
    .replace(/\*\*\*/g, '')  // Bold italic
    .replace(/\*\*/g, '')    // Bold
    .replace(/\*/g, '')      // Italic
    .replace(/__/g, '')      // Bold underscore
    .replace(/_/g, '')       // Italic underscore
    .replace(/###/g, '')     // Heading level 3
    .replace(/##/g, '')      // Heading level 2
    .replace(/#/g, '')       // Heading level 1
    .replace(/`/g, '')       // Code
    .replace(/```/g, '');    // Code blocks
  
  // Remove markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/ {2,}/g, ' ');
  
  return cleaned;
}

