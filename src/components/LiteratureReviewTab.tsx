import React, { useState } from 'react';
import {
  GitCompare,
  Sparkles,
  Layers,
  AlertTriangle,
  Lightbulb,
  Table,
  Check,
  Trash2,
  Plus,
  ArrowRight,
  Loader2,
  FileText,
  BookmarkCheck,
} from 'lucide-react';
import { LiteratureReview, VerifiedPaper } from '../types/research';

interface LiteratureReviewTabProps {
  selectedPapers: VerifiedPaper[];
  onRemovePaper: (paperId: string) => void;
  onNavigateToTopicSearch: () => void;
  onForwardToReportGenerator: (litReview: LiteratureReview) => void;
  onSaveToHistory: (type: 'lit_review', title: string, subtitle: string, payload: any) => void;
}

export const LiteratureReviewTab: React.FC<LiteratureReviewTabProps> = ({
  selectedPapers,
  onRemovePaper,
  onNavigateToTopicSearch,
  onForwardToReportGenerator,
  onSaveToHistory,
}) => {
  const [reviewTopic, setReviewTopic] = useState('Comparative Synthesis of Selected Literature');
  const [synthesizing, setSynthesizing] = useState(false);
  const [reviewResult, setReviewResult] = useState<LiteratureReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter matrix column or search
  const [matrixFilter, setMatrixFilter] = useState('');

  const handleSynthesize = async () => {
    if (selectedPapers.length === 0) return;

    setSynthesizing(true);
    setError(null);

    try {
      const response = await fetch('/api/research/literature-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: reviewTopic,
          papers: selectedPapers,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const data: LiteratureReview = await response.json();
      setReviewResult(data);
      onSaveToHistory('lit_review', data.topic, `${data.papersCount} papers synthesized`, data);
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize literature review.');
    } finally {
      setSynthesizing(false);
    }
  };

  const filteredMatrix = reviewResult?.comparisonMatrix.filter(
    (item) =>
      !matrixFilter ||
      item.paperTitle.toLowerCase().includes(matrixFilter.toLowerCase()) ||
      item.methodology.toLowerCase().includes(matrixFilter.toLowerCase()) ||
      item.keyStrengths.toLowerCase().includes(matrixFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Shelf Configuration */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-3">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Cross-Study Synthesis & Matrix Generation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Literature Review & Comparative Synthesis
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Compare findings across multiple papers, generate a structured comparison matrix, discover consensus vs points of friction, and isolate unexplored research gaps.
          </p>
        </div>

        {/* Selected Papers Shelf */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <BookmarkCheck className="w-4 h-4 text-indigo-400" />
              <span>Literature Shelf ({selectedPapers.length} Papers Selected)</span>
            </h3>
            <button
              onClick={onNavigateToTopicSearch}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Discover & Add More Papers</span>
            </button>
          </div>

          {selectedPapers.length === 0 ? (
            <div className="py-8 px-4 rounded-xl border border-dashed border-slate-800 text-center space-y-3 bg-slate-950/40">
              <p className="text-xs sm:text-sm text-slate-400">
                Your literature review shelf is currently empty.
              </p>
              <p className="text-xs text-slate-400">
                Go to the <strong>Topic Explorer</strong> or <strong>Paper Analyzer</strong> and click "Queue for Lit Review" to add verified papers.
              </p>
              <button
                onClick={onNavigateToTopicSearch}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
              >
                <span>Find Papers in Topic Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400">arXiv:{paper.id}</span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{paper.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemovePaper(paper.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition flex-shrink-0"
                    title="Remove paper from shelf"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Synthesis Trigger */}
          {selectedPapers.length > 0 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                value={reviewTopic}
                onChange={(e) => setReviewTopic(e.target.value)}
                placeholder="Overarching Research Topic..."
                className="w-full sm:w-80 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-violet-600/20"
              >
                {synthesizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Cross-Study Matrix...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Cross-Paper Review</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          <p className="font-semibold">Review Generation Failed</p>
          <p className="text-xs text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Literature Review Results */}
      {reviewResult && (
        <div className="space-y-8 animate-fade-in">
          {/* Synthesis Overview */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  🟣 Multi-Paper Synthesis ({reviewResult.papersCount} Papers)
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {reviewResult.topic}
                </h2>
              </div>
              <button
                onClick={() => onForwardToReportGenerator(reviewResult)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <span>Compile into Full Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Overarching Scholarly Synthesis
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line font-serif">
                {reviewResult.synthesisOverview}
              </p>
            </div>

            {/* Thematic Clusters */}
            {reviewResult.thematicClusters && reviewResult.thematicClusters.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Thematic Clusters Identified</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewResult.thematicClusters.map((cluster, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2"
                    >
                      <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                        {cluster.theme}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {cluster.description}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cluster.contributingPapers.map((paperName, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                          >
                            📄 {paperName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Comparative Synthesis Matrix Table */}
          {reviewResult.comparisonMatrix && reviewResult.comparisonMatrix.length > 0 && (
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-white">
                  <Table className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold">Cross-Study Comparative Matrix</h3>
                </div>
                <input
                  type="text"
                  value={matrixFilter}
                  onChange={(e) => setMatrixFilter(e.target.value)}
                  placeholder="Search matrix items..."
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-48 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/90 uppercase tracking-wider text-[11px] text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Paper / Lead Authors</th>
                      <th className="p-3.5">Methodology</th>
                      <th className="p-3.5">Key Strengths</th>
                      <th className="p-3.5">Limitations</th>
                      <th className="p-3.5">Core Trade-offs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                    {filteredMatrix?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5 font-medium text-white max-w-[200px]">
                          <div className="font-bold">{row.paperTitle}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {row.authors} ({row.year || 'Published'})
                          </div>
                        </td>
                        <td className="p-3.5 max-w-[220px] text-slate-300 leading-relaxed">
                          {row.methodology}
                        </td>
                        <td className="p-3.5 max-w-[220px] text-emerald-300/90 leading-relaxed">
                          {row.keyStrengths}
                        </td>
                        <td className="p-3.5 max-w-[220px] text-amber-300/90 leading-relaxed">
                          {row.limitations}
                        </td>
                        <td className="p-3.5 max-w-[200px] text-indigo-300/90 leading-relaxed">
                          {row.tradeOffs}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Research Gaps & Future Directions */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Unexplored Research Gaps & Critical Voids</h3>
            </div>
            <p className="text-xs text-slate-400 -mt-3">
              Specific theoretical, experimental, and scaling voids isolated across the reviewed body of work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewResult.researchGaps.map((gap, gIdx) => (
                <div
                  key={gIdx}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        gap.importance === 'critical'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : gap.importance === 'moderate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {gap.importance} Gap
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{gap.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-serif">{gap.description}</p>
                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-indigo-300">
                    <strong>Suggested Investigation:</strong> {gap.suggestedInvestigation}
                  </div>
                </div>
              ))}
            </div>

            {/* Future Directions */}
            {reviewResult.futureDirections && reviewResult.futureDirections.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Strategic Future Research Directions</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {reviewResult.futureDirections.map((dir, dIdx) => (
                    <li key={dIdx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                      <span className="leading-relaxed">{dir}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
