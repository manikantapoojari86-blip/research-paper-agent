import React from 'react';
import {
  Compass,
  FileText,
  GitCompare,
  ScrollText,
  Clock,
  BookmarkCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'topic' | 'analyzer' | 'literature' | 'report';
  setActiveTab: (tab: 'topic' | 'analyzer' | 'literature' | 'report') => void;
  selectedPapersCount: number;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPapersCount,
  onOpenHistory,
  historyCount,
}) => {
  const tabs = [
    {
      id: 'topic' as const,
      label: 'Topic Explorer',
      icon: Compass,
      description: 'Break down questions & find verified papers',
    },
    {
      id: 'analyzer' as const,
      label: 'Paper Analyzer',
      icon: FileText,
      description: 'Upload PDF & extract deep methodology',
    },
    {
      id: 'literature' as const,
      label: 'Literature Review',
      icon: GitCompare,
      badge: selectedPapersCount > 0 ? selectedPapersCount : undefined,
      description: 'Cross-paper matrix & research gaps',
    },
    {
      id: 'report' as const,
      label: 'Report Generator',
      icon: ScrollText,
      description: 'Synthesize structured reports with citations',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                  Research Paper Agent
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Verified Sources
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Autonomous academic research synthesis engine
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {selectedPapersCount > 0 && (
              <button
                onClick={() => setActiveTab('literature')}
                className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-lg text-xs text-indigo-200 transition"
                title="View selected papers in Literature Review"
              >
                <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong className="text-white font-semibold">{selectedPapersCount}</strong> queued for synthesis
                </span>
              </button>
            )}

            <button
              onClick={onOpenHistory}
              aria-label="Open research history"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-medium transition"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-indigo-300 font-mono text-[10px]">
                  {historyCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Main Navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-sm'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-500 text-white font-bold leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
