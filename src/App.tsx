import React, { useState } from 'react';
import { Header } from './components/Header';
import { TopicExplorer } from './components/TopicExplorer';
import { PaperAnalyzer } from './components/PaperAnalyzer';
import { LiteratureReviewTab } from './components/LiteratureReviewTab';
import { ReportGenerator } from './components/ReportGenerator';
import { ConceptExplainerModal } from './components/ConceptExplainerModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { useResearchStorage } from './hooks/useResearchStorage';
import { HistoryItem, LiteratureReview, TopicAnalysis, VerifiedPaper } from './types/research';

export default function App() {
  const [activeTab, setActiveTab] = useState<'topic' | 'analyzer' | 'literature' | 'report'>('topic');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Cross-tab shared states
  const [paperToAnalyze, setPaperToAnalyze] = useState<VerifiedPaper | null>(null);
  const [activeTopicData, setActiveTopicData] = useState<{
    analysis: TopicAnalysis;
    verifiedPapers: VerifiedPaper[];
  } | null>(null);
  const [reportInitialTopic, setReportInitialTopic] = useState<string>('');

  // Interactive Concept Explainer Modal
  const [explainingConcept, setExplainingConcept] = useState<string | null>(null);

  // Persistence Hook
  const {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
    selectedPapers,
    toggleSelectPaper,
    isPaperSelected,
  } = useResearchStorage();

  // Handlers for switching tabs with context
  const handleSelectPaperForAnalysis = (paper: VerifiedPaper) => {
    setPaperToAnalyze(paper);
    setActiveTab('analyzer');
  };

  const handleForwardToReportGenerator = (litReview: LiteratureReview) => {
    setReportInitialTopic(litReview.topic);
    setActiveTab('report');
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.type === 'topic' && item.payload) {
      setActiveTopicData(item.payload);
      setActiveTab('topic');
    } else if (item.type === 'paper' && item.payload) {
      const paperData = item.payload;
      setPaperToAnalyze({
        id: paperData.id,
        title: paperData.title,
        authors: paperData.authors,
        summary: paperData.simplifiedSummary,
        publishedDate: paperData.analyzedAt ? paperData.analyzedAt.slice(0, 10) : 'Recent',
        arxivUrl: '',
        pdfUrl: '',
        primaryCategory: 'Analyzed Paper',
        isVerified: true,
      });
      setActiveTab('analyzer');
    } else if (item.type === 'lit_review' && item.payload) {
      setActiveTab('literature');
    } else if (item.type === 'report' && item.payload) {
      setReportInitialTopic(item.payload.topic);
      setActiveTab('report');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Academic Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPapersCount={selectedPapers.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'topic' && (
          <TopicExplorer
            onSelectPaperForAnalysis={handleSelectPaperForAnalysis}
            onTogglePaperForLitReview={toggleSelectPaper}
            isPaperSelected={isPaperSelected}
            onOpenConceptExplainer={(concept) => setExplainingConcept(concept)}
            onSaveToHistory={addHistoryItem}
            activeTopicData={activeTopicData}
            setActiveTopicData={setActiveTopicData}
          />
        )}

        {activeTab === 'analyzer' && (
          <PaperAnalyzer
            key={paperToAnalyze ? paperToAnalyze.id : 'default-analyzer'}
            initialPaper={paperToAnalyze}
            onAddToLitReview={toggleSelectPaper}
            isPaperSelected={isPaperSelected}
            onSaveToHistory={addHistoryItem}
          />
        )}

        {activeTab === 'literature' && (
          <LiteratureReviewTab
            selectedPapers={selectedPapers}
            onRemovePaper={(id) => {
              const p = selectedPapers.find((item) => item.id === id);
              if (p) toggleSelectPaper(p);
            }}
            onNavigateToTopicSearch={() => setActiveTab('topic')}
            onForwardToReportGenerator={handleForwardToReportGenerator}
            onSaveToHistory={addHistoryItem}
          />
        )}

        {activeTab === 'report' && (
          <ReportGenerator
            selectedPapers={selectedPapers}
            initialTopic={reportInitialTopic || activeTopicData?.analysis.topic}
            onSaveToHistory={addHistoryItem}
          />
        )}
      </main>

      {/* Concept Explainer Modal */}
      <ConceptExplainerModal
        concept={explainingConcept || ''}
        isOpen={Boolean(explainingConcept)}
        onClose={() => setExplainingConcept(null)}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectItem={handleSelectHistoryItem}
        onDeleteItem={removeHistoryItem}
        onClearHistory={clearHistory}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Research Paper Agent • Grounded in Verified Academic Preprints</p>
          <p className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Gemini API & arXiv.org Grounding Active</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
