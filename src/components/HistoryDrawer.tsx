import React, { useState } from 'react';
import {
  X,
  Clock,
  Search,
  Trash2,
  ExternalLink,
  Compass,
  FileText,
  GitCompare,
  ScrollText,
  Download,
} from 'lucide-react';
import { HistoryItem } from '../types/research';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectItem,
  onDeleteItem,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'topic':
        return <Compass className="w-4 h-4 text-indigo-400" />;
      case 'paper':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'lit_review':
        return <GitCompare className="w-4 h-4 text-violet-400" />;
      case 'report':
        return <ScrollText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'topic':
        return 'Topic Analysis';
      case 'paper':
        return 'Paper Extraction';
      case 'lit_review':
        return 'Literature Review';
      case 'report':
        return 'Research Report';
      default:
        return 'Item';
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Research History"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Research History</h2>
              <p className="text-xs text-slate-400">{history.length} sessions recorded locally</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-900/40">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search previous research..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 pl-8 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'topic', 'paper', 'lit_review', 'report'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition whitespace-nowrap ${
                  filterType === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'lit_review' ? 'Lit Reviews' : f}
              </button>
            ))}
          </div>
        </div>

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No research history found.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition group flex items-start justify-between gap-3"
              >
                <div
                  className="space-y-1 cursor-pointer flex-1"
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {getIcon(item.type)}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-[10px] text-slate-500">• {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                </div>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
            <button
              onClick={handleExportJson}
              className="text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export History JSON</span>
            </button>
            <button
              onClick={onClearHistory}
              className="text-red-400 hover:text-red-300 transition"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
