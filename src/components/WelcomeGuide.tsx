'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { X, Sparkles, MessageSquare, Users, Briefcase, Building2, Trash2 } from 'lucide-react';
import { supportAssistantChat } from '@/lib/api';

interface WelcomeGuideProps {
  storageKey?: string; // localStorage key override
}

type Audience = 'clients' | 'lawyers' | 'enterprise' | null;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
};

const STEPS = [
  {
    id: 'clients',
    icon: Users,
    title: 'For Clients',
    summary: 'Get matched with lawyers, upload documents, and track your case.',
    actions: [
      { label: 'Find a Lawyer', href: '/clients/lawyers' },
      { label: 'Upload a Document', href: '/documents' },
      { label: 'Start a Chat', href: '/chat' },
    ],
  },
  {
    id: 'lawyers',
    icon: Briefcase,
    title: 'For Lawyers & Law Firms',
    summary: 'Manage cases, collaborate with staff, and generate documents from templates.',
    actions: [
      { label: 'Create a Case', href: '/cases' },
      { label: 'Use Templates', href: '/templates' },
      { label: 'Invite Staff', href: '/lawyers/staff' },
    ],
  },
  {
    id: 'enterprise',
    icon: Building2,
    title: 'For Enterprises',
    summary: 'Centralize documents, set permissions, and get analytics across teams.',
    actions: [
      { label: 'Talk to Us', href: '/plans' },
      { label: 'Explore Analytics', href: '/analytics' },
      { label: 'Security & Compliance', href: '/dashboard' },
    ],
  },
];

export default function WelcomeGuide({ storageKey = 'lega_has_seen_welcome' }: WelcomeGuideProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [audience, setAudience] = useState<Audience>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        setOpen(true);
        localStorage.setItem(storageKey, 'true');
      }
      const savedAudience = localStorage.getItem('lega_assistant_audience') as Audience | null;
      const savedMsgs = localStorage.getItem('lega_welcome_chat');
      if (savedAudience) setAudience(savedAudience);
      if (savedMsgs) setMessages(JSON.parse(savedMsgs));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem('lega_assistant_audience', audience ?? ''); } catch {}
  }, [audience, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem('lega_welcome_chat', JSON.stringify(messages)); } catch {}
  }, [messages, mounted]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const pushAssistant = (text: string) => setMessages((m) => [...m, { role: 'assistant', content: text, ts: Date.now() }]);
  const pushUser = (text: string) => setMessages((m) => [...m, { role: 'user', content: text, ts: Date.now() }]);

  const clearChat = () => {
    setMessages([]);
    setAudience(null);
    try {
      localStorage.removeItem('lega_welcome_chat');
      localStorage.removeItem('lega_assistant_audience');
    } catch {}
  };

  const respond = async (text: string, includeCurrentMessage: boolean = true) => {
    setIsLoading(true);
    try {
      // Build history including the current message being sent
      // This ensures conversation context is maintained since React state updates are async
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      if (includeCurrentMessage) {
        history.push({ role: 'user', content: text });
      }
      const reply = await supportAssistantChat({ message: text, audience, history });
      pushAssistant(reply || 'I could not generate a response right now. Please try again.');
    } catch (e) {
      console.error('Support chat error:', e);
      pushAssistant('Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudienceSelect = async (selectedAudience: Audience) => {
    setAudience(selectedAudience);
    // Send a natural greeting message to the AI based on the selected audience
    const greetingMessage = selectedAudience === 'clients' 
      ? "Hi! I'm a client looking for legal help."
      : selectedAudience === 'lawyers'
      ? "Hi! I'm a lawyer interested in using Lega for my practice."
      : "Hi! I'm interested in enterprise solutions for my organization.";
    
    pushUser(greetingMessage);
    await respond(greetingMessage);
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    pushUser(text);
    setInput('');
    await respond(text);
  };

  if (!mounted) return null;

  return (
    <div>
      {/* Floating help button (always visible) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        title="AI Assistant"
        className="fixed bottom-5 right-5 z-40 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg p-3 md:p-3.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {/* Chat Widget (non-blocking, keeps features visible) */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-md sm:max-w-lg shadow-2xl rounded-xl overflow-hidden bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 animate-fade-in-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Welcome to Lega</h3>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button 
                    aria-label="Clear chat" 
                    onClick={clearChat} 
                    className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors"
                    title="Clear chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button aria-label="Close" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700">
                  <X className="h-5 w-5 text-secondary-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Audience selection (only if not chosen) */}
              {!audience && (
                <div className="rounded-lg p-3 bg-secondary-50 dark:bg-secondary-900/40 border border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <MessageSquare className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">Hi! Which describes you best?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => handleAudienceSelect('clients')} className="btn-secondary btn-sm">I'm a Client</button>
                        <button onClick={() => handleAudienceSelect('lawyers')} className="btn-secondary btn-sm">I'm a Lawyer</button>
                        <button onClick={() => handleAudienceSelect('enterprise')} className="btn-secondary btn-sm">Enterprise</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General-purpose conversational assistant (features moved to landing page) */}

              {/* Chat area */}
              <div className="rounded-lg border border-secondary-200 dark:border-secondary-700">
                <div 
                  ref={chatContainerRef}
                  className="h-56 sm:h-64 overflow-y-auto p-3 space-y-3 bg-white dark:bg-secondary-800"
                >
                  {messages.length === 0 && !audience && (
                    <div className="text-sm text-secondary-600 dark:text-secondary-400 text-center py-4">
                      Select your role above to get started, or ask me anything about Lega!
                    </div>
                  )}
                  {messages.map((m, idx) => (
                    <div key={m.ts + '-' + idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {/* Typing indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-secondary-100 dark:bg-secondary-700 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-secondary-600 dark:text-secondary-400 text-sm">Thinking</span>
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-secondary-400 dark:bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-secondary-400 dark:bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-secondary-400 dark:bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex items-center gap-2 p-3 border-t border-secondary-200 dark:border-secondary-700">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) onSend(); }}
                    placeholder={audience ? 'Ask a question about using Lega…' : 'Tell me who you are to personalize the help…'}
                    className="input h-10"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={onSend} 
                    className="btn-primary btn-sm"
                    disabled={isLoading || !input.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
