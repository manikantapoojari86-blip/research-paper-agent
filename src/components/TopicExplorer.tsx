import React, { useState } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  BookOpen,
  HelpCircle,
  ExternalLink,
  FileDown,
  BookmarkPlus,
  Check,
  ChevronRight,
  Lightbulb,
  Cpu,
  Layers,
  ArrowRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { TopicAnalysis, VerifiedPaper } from '../types/research';
import { filterPapers } from '../utils/research-utils';

interface TopicExplorerProps {
  onSelectPaperForAnalysis: (paper: VerifiedPaper) => void;
  onTogglePaperForLitReview: (paper: VerifiedPaper) => void;
  isPaperSelected: (paperId: string, title?: string) => boolean;
  onOpenConceptExplainer: (concept: string) => void;
  onSaveToHistory: (type: 'topic', title: string, subtitle: string, payload: any) => void;
  activeTopicData?: { analysis: TopicAnalysis; verifiedPapers: VerifiedPaper[] } | null;
  setActiveTopicData?: (data: { analysis: TopicAnalysis; verifiedPapers: VerifiedPaper[] } | null) => void;
}

const STARTER_TOPICS = [
  {
    topic: 'Transformer Attention & Efficient Context Scaling',
    questions: 'How do linear and sliding window attention mechanisms reduce O(N^2) memory bottlenecks without sacrificing perplexity?',
    discipline: 'Computer Science & AI',
  },
  {
    topic: 'Retrieval-Augmented Generation (RAG) & Semantic Grounding',
    questions: 'What are the optimal retrieval chunking, re-ranking, and hallucination reduction strategies in enterprise LLM workflows?',
    discipline: 'Computer Science & AI',
  },
  {
    topic: 'Low-Rank Adaptation (LoRA) & Parameter-Efficient Fine-Tuning',
    questions: 'Why does intrinsic rank decomposition preserve model capability while training under 1% of parameters?',
    discipline: 'Computer Science & AI',
  },
  {
    topic: 'Diffusion Probabilistic Models & Score-Based Generative SDEs',
    questions: 'How does classifier-free guidance navigate the mode-coverage vs sample fidelity trade-off in latent diffusion models?',
    discipline: 'Computer Science & AI',
  },
  {
    topic: 'CRISPR-Cas9 Base Editing & Off-Target Minimization',
    questions: 'What molecular engineered Cas variants demonstrate minimal genome-wide off-target cleavages in therapeutic cell editing?',
    discipline: 'Biomedical Sciences',
  },
  {
    topic: 'Quantum Error Correction in Surface Codes',
    questions: 'What are the current physical fault-tolerance thresholds for 2D topological surface codes using superconducting transmon qubits?',
    discipline: 'Quantum Physics',
  },
];

export const TopicExplorer: React.FC<TopicExplorerProps> = ({
  onSelectPaperForAnalysis,
  onTogglePaperForLitReview,
  isPaperSelected,
  onOpenConceptExplainer,
  onSaveToHistory,
  activeTopicData,
  setActiveTopicData,
}) => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState('');
  const [discipline, setDiscipline] = useState('Computer Science & AI');
  const [depth, setDepth] = useState<'simple' | 'undergraduate' | 'expert'>('undergraduate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [analysis, setAnalysis] = useState<TopicAnalysis | null>(activeTopicData?.analysis || null);
  const [verifiedPapers, setVerifiedPapers] = useState<VerifiedPaper[]>(activeTopicData?.verifiedPapers || []);
  const [paperSearchQuery, setPaperSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleRunSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/research/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          researchQuestions: questions.trim(),
          discipline,
          depth,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setVerifiedPapers(data.verifiedPapers || []);
      if (setActiveTopicData) {
        setActiveTopicData(data);
      }

      onSaveToHistory('topic', data.analysis.topic, `${data.verifiedPapers?.length || 0} verified papers found`, data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while analyzing the topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStarter = (starter: typeof STARTER_TOPICS[0]) => {
    setTopic(starter.topic);
    setQuestions(starter.questions);
    setDiscipline(starter.discipline);
  };

  // Filtered papers list
  const filteredPapersList = filterPapers(verifiedPapers, paperSearchQuery, selectedCategory);

  return (
    <div className="space-y-8 pb-16">
      {/* Search & Topic Input Section */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Research Assistant & Verified Literature Discovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Explore Academic Topics & Verified Papers
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Formulate research questions, decompose complex theoretical frameworks, and ground your study in verified, peer-reviewed preprints from arXiv.
          </p>
        </div>

        <form onSubmit={handleRunSearch} className="space-y-5">
          {/* Main Topic Input */}
          <div>
            <label htmlFor="topic-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Research Topic or Domain *
            </label>
            <div className="relative">
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Transformer Attention Mechanisms in Long-Context LLMs"
                required
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Research Questions Textarea */}
          <div>
            <label htmlFor="questions-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>Specific Research Questions or Hypotheses</span>
              <span className="text-[11px] text-slate-400 font-normal">Optional</span>
            </label>
            <textarea
              id="questions-input"
              rows={2}
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="e.g. How does multi-head latent attention compare to grouped-query attention in compute efficiency?"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none shadow-inner"
            />
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            <div>
              <label htmlFor="discipline-select" className="block text-xs font-medium text-slate-400 mb-1.5">
                Academic Discipline
              </label>
              <select
                id="discipline-select"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Biomedical Sciences">Biomedical Sciences & Genetics</option>
                <option value="Quantum Physics">Quantum & Condensed Matter Physics</option>
                <option value="Climate & Earth Sciences">Climate & Environmental Science</option>
                <option value="Economics & Quantitative Social Science">Economics & Quantitative Finance</option>
                <option value="Neuroscience & Cognitive Science">Neuroscience & Cognitive Systems</option>
              </select>
            </div>

            <div>
              <label htmlFor="depth-select" className="block text-xs font-medium text-slate-400 mb-1.5">
                Explanation Depth
              </label>
              <select
                id="depth-select"
                value={depth}
                onChange={(e) => setDepth(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="simple">Intuitive / Feynman (Mental models)</option>
                <option value="undergraduate">Undergraduate Academic (Standard)</option>
                <option value="expert">Doctoral / Expert (Deep theoretical)</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Querying ArXiv...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Explore Research Topic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Starter Topics */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <span className="text-xs font-medium text-slate-400 block mb-2">
            Try a featured research topic:
          </span>
          <div className="flex flex-wrap gap-2">
            {STARTER_TOPICS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectStarter(item)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1"
              >
                <span>{item.topic.split('&')[0].trim()}</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          <p className="font-semibold">Analysis Failed</p>
          <p className="text-xs text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="py-16 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="relative inline-flex">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Synthesizing Academic Landscape</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Extracting theoretical pillars, decomposing key questions, and querying verified papers from arXiv...
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {analysis && !loading && (
        <div className="space-y-8 animate-fade-in">
          {/* Section: AI Research Assistant Conceptual Breakdown */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  🟣 AI-Synthesized Analysis (Gemini)
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Theoretical Analysis: {analysis.topic}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenConceptExplainer(analysis.topic)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center space-x-1.5 transition"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Explain Topic in Simple Terms</span>
                </button>
              </div>
            </div>

            {/* Feynman Intuitive Explainer Card */}
            {analysis.simpleExplanation && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/20 via-amber-900/10 to-transparent border border-amber-500/25 relative">
                <div className="flex items-center space-x-2 mb-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Intuitive Analogy (Feynman Breakdown)</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed font-serif italic">
                  "{analysis.simpleExplanation}"
                </p>
              </div>
            )}

            {/* Academic Landscape Overview */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Scholarly Landscape & State of the Art</span>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {analysis.overview}
              </p>
            </div>

            {/* Core Pillars & Interactive Terminology */}
            {analysis.corePillars && analysis.corePillars.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Core Pillars & Concepts (Click any term for instant breakdown)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.corePillars.map((pillar, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition"
                    >
                      <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span>{pillar.title}</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {pillar.description}
                      </p>
                      {pillar.keyTerminology && pillar.keyTerminology.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {pillar.keyTerminology.map((term, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => onOpenConceptExplainer(term)}
                              className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-indigo-900/50 hover:text-indigo-200 hover:border-indigo-500/40 border border-slate-700/80 text-slate-300 transition flex items-center space-x-1"
                              title="Click to explain this concept"
                            >
                              <span>{term}</span>
                              <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Questions & Theoretical Foundations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {analysis.researchQuestions && analysis.researchQuestions.length > 0 && (
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4" />
                    <span>Open Research Questions</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {analysis.researchQuestions.map((q, qIdx) => (
                      <li key={qIdx} className="flex items-start space-x-2">
                        <span className="text-indigo-400 font-mono font-bold mt-0.5">RQ{qIdx + 1}:</span>
                        <span className="leading-relaxed">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.theoreticalFoundations && analysis.theoreticalFoundations.length > 0 && (
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                    <Cpu className="w-4 h-4" />
                    <span>Theoretical & Mathematical Foundations</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {analysis.theoreticalFoundations.map((found, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                        <span className="leading-relaxed">{found}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Section: Verified Academic Research Papers */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  🟢 Verified Academic Sources (arXiv.org)
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Relevant Peer-Reviewed & Preprint Literature ({verifiedPapers.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live preprints from arXiv repository with verified authors, publication dates, and full text access.
                </p>
              </div>

              {/* Filter / Search within retrieved papers */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    value={paperSearchQuery}
                    onChange={(e) => setPaperSearchQuery(e.target.value)}
                    placeholder="Filter papers..."
                    className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 pl-8 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
                  />
                  <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Papers List */}
            {filteredPapersList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No papers match your filter "{paperSearchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPapersList.map((paper) => {
                  const isQueued = isPaperSelected(paper.id, paper.title);
                  return (
                    <article
                      key={paper.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                              arXiv:{paper.id}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                              {paper.primaryCategory}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Published: {paper.publishedDate}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white hover:text-indigo-300 transition">
                            <a href={paper.arxivUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                              <span>{paper.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400" />
                            </a>
                          </h4>
                          <p className="text-xs text-slate-400">
                            <strong>Authors:</strong> {paper.authors.join(', ')}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => onSelectPaperForAnalysis(paper)}
                            className="w-full px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition shadow-sm"
                          >
                            <span>Analyze Paper</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onTogglePaperForLitReview(paper)}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition ${
                              isQueued
                                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {isQueued ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>In Review Shelf</span>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="w-3 h-3 text-slate-400" />
                                <span>Queue for Lit Review</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Abstract / Summary */}
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-serif">
                        {paper.summary}
                      </p>

                      {/* Links row */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center space-x-3">
                          <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Download Full PDF</span>
                          </a>
                          <a
                            href={paper.arxivUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-slate-400 hover:text-slate-200 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View on arXiv.org</span>
                          </a>
                        </div>
                        <span className="text-[10px] text-emerald-400/90 font-medium">
                          ✓ Peer-referenced preprint
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
