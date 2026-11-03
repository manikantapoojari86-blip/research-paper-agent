import { useState, useEffect } from 'react';
import { HistoryItem, PaperAnalysis, LiteratureReview, ResearchReport, VerifiedPaper } from '../types/research';

const STORAGE_KEYS = {
  HISTORY: 'rpa_history_v1',
  SELECTED_PAPERS: 'rpa_selected_papers_v1',
  SAVED_REPORTS: 'rpa_saved_reports_v1',
};

export function useResearchStorage() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedPapers, setSelectedPapers] = useState<VerifiedPaper[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_PAPERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PAPERS, JSON.stringify(selectedPapers));
    } catch (e) {
      console.warn('Failed to save selected papers to localStorage', e);
    }
  }, [selectedPapers]);

  const addHistoryItem = (
    type: 'topic' | 'paper' | 'lit_review' | 'report',
    title: string,
    subtitle: string,
    payload: any
  ) => {
    const newItem: HistoryItem = {
      id: 'hist-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      type,
      title,
      subtitle,
      payload,
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // keep latest 50
    return newItem;
  };

  const removeHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch {}
  };

  const toggleSelectPaper = (paper: VerifiedPaper) => {
    setSelectedPapers((prev) => {
      const exists = prev.some((p) => p.id === paper.id || p.title.toLowerCase() === paper.title.toLowerCase());
      if (exists) {
        return prev.filter((p) => p.id !== paper.id && p.title.toLowerCase() !== paper.title.toLowerCase());
      } else {
        return [...prev, paper];
      }
    });
  };

  const isPaperSelected = (paperId: string, title?: string) => {
    return selectedPapers.some((p) => p.id === paperId || (title && p.title.toLowerCase() === title.toLowerCase()));
  };

  const clearSelectedPapers = () => {
    setSelectedPapers([]);
  };

  return {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
    selectedPapers,
    setSelectedPapers,
    toggleSelectPaper,
    isPaperSelected,
    clearSelectedPapers,
  };
}
