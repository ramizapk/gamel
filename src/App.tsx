import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import RateLibraryPage from './pages/RateLibraryPage';
import AdminPage from './pages/AdminPage';
import BOQSummaryPage from './pages/BOQSummaryPage';
import BOQTable from './components/BOQTable';
import type { BOQFile } from './types';

type Page = 'dashboard' | 'projects' | 'boq' | 'library' | 'admin' | 'summary';

interface BOQNavData {
  boqFileId: string;
  boqFile: BOQFile;
}

interface NavData {
  boqFileId?: string;
  boqFile?: BOQFile;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [boqNavData, setBOQNavData] = useState<BOQNavData | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setConfigError('Missing Supabase configuration. Please check your .env file.');
      setAuthLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleNavigate(page: string, data?: unknown) {
    const typedPage = page as Page;
    if (typedPage === 'boq' && data) {
      const navData = data as NavData;
      if (navData.boqFileId && navData.boqFile) {
        setBOQNavData({ boqFileId: navData.boqFileId, boqFile: navData.boqFile });
      }
    }
    setCurrentPage(typedPage);
  }

  function handleBackFromBOQ() {
    setBOQNavData(null);
    setCurrentPage('projects');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">خطأ في الإعدادات</h2>
          <p className="text-slate-600 mb-6">يبدو أن ملف الإعدادات <code className="bg-slate-100 px-1 rounded">.env</code> مفقود أو غير مكتمل.</p>
          <div className="text-right bg-slate-50 p-4 rounded-lg text-sm font-mono text-slate-700 mb-6 overflow-x-auto ltr">
            VITE_SUPABASE_URL=...<br />
            VITE_SUPABASE_ANON_KEY=...
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }
  // r

  if (!user) {
    return <AuthPage onAuth={setUser} />;
  }

  function renderPage() {
    if (currentPage === 'boq' && boqNavData) {
      return (
        <BOQTable
          boqFileId={boqNavData.boqFileId}
          boqFile={boqNavData.boqFile}
          onBack={handleBackFromBOQ}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'projects':
        return <ProjectsPage onNavigate={handleNavigate} />;
      case 'library':
        return <RateLibraryPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminPage onNavigate={handleNavigate} />;
      case 'summary':
        return <BOQSummaryPage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  }

  const layoutPage = currentPage === 'boq' ? 'projects' : currentPage as Page;

  return (
    <Layout
      currentPage={layoutPage as Page}
      onNavigate={(page: Page) => handleNavigate(page)}
      user={user}
    >
      {renderPage()}
    </Layout>
  );
}
