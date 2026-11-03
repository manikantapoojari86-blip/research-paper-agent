import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Lightbulb, AlertTriangle, Cpu, Layers, Loader2 } from 'lucide-react';
import { ConceptExplanation } from '../types/research';

interface ConceptExplainerModalProps {
  concept: string;
  isOpen: boolean;
  onClose: () => void;
  initialExplanation?: ConceptExplanation | null;
}

export const ConceptExplainerModal: React.FC<ConceptExplainerModalProps> = ({
  concept,
  isOpen,
  onClose,
  initialExplanation,
}) => {
  const [depth, setDepth] = useState<'simple' | 'undergraduate' | 'expert'>('simple');
  const [explanation, setExplanation] = useState<ConceptExplanation | null>(initialExplanation || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && concept) {
      fetchConceptExplanation(concept, depth);
    }
  }, [isOpen, concept, depth]);

  const fetchConceptExplanation = async (term: string, currentDepth: 'simple' | 'undergraduate' | 'expert') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/research/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: term, depth: currentDepth }),
      });
      if (!res.ok) {
        throw new Error(`Failed to explain concept (${res.status})`);
      }
      const data: ConceptExplanation = await res.json();
      setExplanation(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve explanation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-concept-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400">Concept Deep-Dive</span>
              <h2 id="modal-concept-title" className="text-xl font-bold text-white">
                {concept}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close concept explanation dialog"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Depth Selector Tabs */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400 font-medium">Explanation Depth:</span>
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setDepth('simple')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                depth === 'simple'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Intuitive (Feynman)
            </button>
            <button
              onClick={() => setDepth('undergraduate')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                depth === 'undergraduate'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Undergraduate Academic
            </button>
            <button
              onClick={() => setDepth('expert')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                depth === 'expert'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Doctoral / Expert
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm">Synthesizing pedagogical breakdown with Gemini...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200">
              <p className="font-semibold text-sm">Failed to generate explanation</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
              <button
                onClick={() => fetchConceptExplanation(concept, depth)}
                className="mt-3 px-3 py-1.5 bg-red-800/40 hover:bg-red-800/60 rounded-md text-xs font-medium text-white transition"
              >
                Retry
              </button>
            </div>
          ) : explanation ? (
            <>
              {/* Intuitive Analogy */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <div className="flex items-center space-x-2 mb-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                  <Lightbulb className="w-4 h-4" />
                  <span>Intuitive Mental Model & Analogy</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-sm italic font-serif">
                  "{explanation.analogy}"
                </p>
              </div>

              {/* Formal Academic Definition */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="flex items-center space-x-2 mb-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                  <BookOpen className="w-4 h-4" />
                  <span>Formal Academic Definition</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{explanation.formalDefinition}</p>
              </div>

              {/* Technical Mechanism */}
              {explanation.technicalMechanism && explanation.technicalMechanism.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <div className="flex items-center space-x-2 mb-3 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
                    <Cpu className="w-4 h-4" />
                    <span>How It Works Under the Hood</span>
                  </div>
                  <ol className="space-y-2 list-decimal list-inside text-slate-300">
                    {explanation.technicalMechanism.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-slate-200">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Practical Application */}
              {explanation.practicalApplication && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center space-x-2 mb-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
                    <Layers className="w-4 h-4" />
                    <span>State-of-the-Art Applications</span>
                  </div>
                  <p className="text-emerald-100/90 leading-relaxed">{explanation.practicalApplication}</p>
                </div>
              )}

              {/* Common Pitfalls / Misconceptions */}
              {explanation.commonMisconceptions && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center space-x-2 mb-2 text-rose-400 font-semibold text-xs tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Common Misconceptions & Gotchas</span>
                  </div>
                  <p className="text-rose-200/90 leading-relaxed">{explanation.commonMisconceptions}</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini Academic Intelligence
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
