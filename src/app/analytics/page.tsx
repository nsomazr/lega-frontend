'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { FolderOpen, FileText, TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import MiniLineChart from '@/components/charts/MiniLineChart';
import DonutChart from '@/components/charts/DonutChart';
import BarChart from '@/components/charts/BarChart';

interface Summary {
  total_cases: number;
  open_cases: number;
  total_documents: number;
  docs_without_case: number;
  docs_missing_summary: number;
  docs_missing_tags: number;
  avg_case_age_days: number;
  chat_messages_last_7d: number;
}

interface SeriesPoint { date: string; count: number }

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [casesSeries, setCasesSeries] = useState<SeriesPoint[]>([]);
  const [docsSeries, setDocsSeries] = useState<SeriesPoint[]>([]);
  const [chatSeries, setChatSeries] = useState<SeriesPoint[]>([]);
  const [fileTypeMix, setFileTypeMix] = useState<{ label: string; value: number; color: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, cSeries, dSeries, chSeries, docs] = await Promise.all([
          api.get('/api/analytics/summary'),
          api.get('/api/analytics/timeseries', { params: { metric: 'cases', days: 14 } }),
          api.get('/api/analytics/timeseries', { params: { metric: 'documents', days: 14 } }),
          api.get('/api/analytics/timeseries', { params: { metric: 'chat', days: 14 } }),
          api.get('/api/documents'),
        ]);
        setSummary(sumRes.data);
        setCasesSeries(cSeries.data.series || []);
        setDocsSeries(dSeries.data.series || []);
        setChatSeries(chSeries.data.series || []);
        const docsArr = (docs.data || []) as any[];
        const fileTypeCounts: Record<string, number> = {};
        docsArr.forEach((d) => {
          const key = (d.file_type || 'other').toLowerCase();
          fileTypeCounts[key] = (fileTypeCounts[key] || 0) + 1;
        });
        const palette = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];
        const mix = Object.entries(fileTypeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
        setFileTypeMix(mix);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          router.push('/auth');
          return;
        }
        setError(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalCases = summary?.total_cases ?? 0;
  const openCases = summary?.open_cases ?? 0;
  const totalDocuments = summary?.total_documents ?? 0;
  const recentWeek = summary?.chat_messages_last_7d ?? 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-200 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !summary) {
    return (
      <DashboardLayout>
        <div className="card p-6 text-error-600">{error || 'Failed to load analytics'}</div>
      </DashboardLayout>
    );
  }

  const cards = [
    { label: 'Total Cases', value: totalCases, icon: FolderOpen, color: 'text-primary-600' },
    { label: 'Open Cases', value: openCases, icon: TrendingUp, color: 'text-warning-600' },
    { label: 'Documents', value: totalDocuments, icon: FileText, color: 'text-success-600' },
    { label: 'New This Week', value: recentWeek, icon: ActivityIcon, color: 'text-accent-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Analytics</h1>
            <p className="text-secondary-600 dark:text-secondary-400">High-level overview of your workspace.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="card p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-secondary-100 dark:bg-secondary-800">
                  <c.icon className={`h-6 w-6 ${c.color}`} />
                </div>
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">{c.label}</p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Cases (Last 14 days)</h3>
            </div>
            <MiniLineChart data={casesSeries} />
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Documents (Last 14 days)</h3>
            </div>
            <MiniLineChart data={docsSeries} />
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Chat (Last 14 days)</h3>
            </div>
            <MiniLineChart data={chatSeries} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">Data Quality</h3>
            <ul className="text-sm text-secondary-700 dark:text-secondary-300 space-y-2">
              <li className="flex justify-between"><span>Docs without case</span><span>{summary.docs_without_case}</span></li>
              <li className="flex justify-between"><span>Docs missing summary</span><span>{summary.docs_missing_summary}</span></li>
              <li className="flex justify-between"><span>Docs missing tags</span><span>{summary.docs_missing_tags}</span></li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">Case Health</h3>
            <ul className="text-sm text-secondary-700 dark:text-secondary-300 space-y-2">
              <li className="flex justify-between"><span>Average case age (days)</span><span>{summary.avg_case_age_days}</span></li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">File Types</h3>
            <DonutChart data={fileTypeMix} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


