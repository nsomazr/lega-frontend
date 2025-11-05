'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import api from '@/lib/api';
import { FolderOpen, FileText, Clock, MessageSquare, Trash2 } from 'lucide-react';

type ActivityItem = {
  id: string | number;
  type: 'case' | 'document' | 'chat';
  title: string;
  time: string;
};

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/analytics/activity', { params: { limit: 100 } });
        const events = (res.data?.events || []) as any[];
        const mapped: ActivityItem[] = events.map((e) => {
          const t = e.event_type as string;
          const when = e.created_at as string;
          if (t === 'case_created') {
            return { id: e.id, type: 'case', title: `New case #${e.case_id}`, time: when };
          }
          if (t === 'document_uploaded') {
            return { id: e.id, type: 'document', title: `Document uploaded #${e.document_id}`, time: when };
          }
          if (t.startsWith('chat_message')) {
            return { id: e.id, type: 'chat', title: `Chat activity in session #${e.session_id}`, time: when };
          }
          return { id: e.id, type: 'document', title: t, time: when };
        });
        setItems(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [items]);

  const handleDelete = async (itemId: string | number) => {
    try {
      await api.delete(`/api/analytics/activity/${itemId}`);
      setItems(prev => prev.filter(item => item.id !== itemId));
      success('Activity deleted');
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Failed to delete activity');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-200 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="card p-6 text-error-600">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="btn-secondary btn-sm"
              title="Back"
            >
              Back
            </button>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Activity</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Recent cases and document events.</p>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {sortedItems.length === 0 && (
              <div className="p-6 text-secondary-600 dark:text-secondary-400">No recent activity.</div>
            )}
            {sortedItems.map((item) => (
              <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-secondary-50 dark:hover:bg-secondary-800/40 group">
                <div className="p-2 rounded-lg bg-secondary-100 dark:bg-secondary-800">
                  {item.type === 'case' ? (
                    <FolderOpen className="h-4 w-4 text-primary-600" />
                  ) : item.type === 'document' ? (
                    <FileText className="h-4 w-4 text-success-600" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-accent-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-400">
                        <Clock className="h-3 w-3" />
                        {new Date(item.time).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-ghost btn-xs p-1.5 text-error-600 dark:text-error-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete activity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    {item.type === 'case' ? 'New case' : item.type === 'document' ? 'New document' : 'Chat activity'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


