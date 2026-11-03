import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Target,
  FlaskConical,
  BarChart3,
  AlertOctagon,
  Award,
  Check,
  BookmarkPlus,
  Loader2,
  FileCheck,
  HelpCircle,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PaperAnalysis, VerifiedPaper } from '../types/research';

interface PaperAnalyzerProps {
  initialPaper?: VerifiedPaper | null;
  onAddToLitReview: (paper: VerifiedPaper) => void;
  isPaperSelected: (paperId: string, title?: string) => boolean;
  onSaveToHistory: (type: 'paper', title: string, subtitle: string, payload: any) => void;
}

const PRELOADED_SAMPLE_PAPERS = [
  {
    title: 'Attention Is All You Need',
    authors: ['Vaswani et al.'],
    arxivId: '1706.03762',
    category: 'Transformer Architecture & NLP',
    summary: 'Proposes the Transformer architecture based solely on self-attention mechanisms, dispensing with recurrence and convolutions entirely.',
  },
  {
    title: 'Retrieval-Augmented Generation (RAG)',
    authors: ['Lewis et al.'],
    arxivId: '2005.11401',
    category: 'Knowledge-Intensive NLP',
    summary: 'Combines pre-trained parametric memory with non-parametric retrieval memory from dense vector indexes for grounded question answering.',
  },
  {
    title: 'LoRA: Low-Rank Adaptation',
    authors: ['Hu et al.'],
    arxivId: '2106.09685',
    category: 'Parameter-Efficient Fine-Tuning',
    summary: 'Freezes pre-trained weights and injects trainable rank decomposition matrices into Transformer attention layers, reducing trainable parameters by 10,000x.',
  },
  {
    title: 'Deep Residual Learning (ResNet)',
    authors: ['He et al.'],
    arxivId: '1512.03385',
    category: 'Computer Vision & Deep Networks',
    summary: 'Reformulates neural network layers as learning residual functions with skip connections, enabling stable training of 152+ layer networks.',
  },
];

export const PaperAnalyzer: React.FC<PaperAnalyzerProps> = ({
  initialPaper,
  onAddToLitReview,
  isPaperSelected,
  onSaveToHistory,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'samples' | 'paste'>('samples');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pastedTitle, setPastedTitle] = useState(initialPaper?.title || '');
  const [pastedAuthors, setPastedAuthors] = useState(initialPaper?.authors.join(', ') || '');
  const [pastedText, setPastedText] = useState(initialPaper?.summary || '');
  const [selectedArxivId, setSelectedArxivId] = useState(initialPaper?.id || '');

  // Analysis result
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PaperAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active section accordion
  const [expandedSection, setExpandedSection] = useState<'all' | 'objectives' | 'methodology' | 'results' | 'limitations' | 'conclusions'>('all');

  // Interactive Paper Q&A
  const [paperQuestion, setPaperQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [qaLoading, setQaLoading] = useState(false);

  // Handle preloaded paper selection
  const handleSelectSample = (sample: typeof PRELOADED_SAMPLE_PAPERS[0]) => {
    setPastedTitle(sample.title);
    setPastedAuthors(sample.authors.join(', '));
    setPastedText(sample.summary);
    setSelectedArxivId(sample.arxivId);
    setUploadedFile(null);
    setPdfBase64(null);
  };

  // Handle PDF file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF document (.pdf)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit. Please upload a smaller PDF or preprint.');
      return;
    }

    setError(null);
    setUploadedFile(file);
    setPastedTitle(file.name.replace(/\.pdf$/i, ''));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPdfBase64(base64);
    };
    reader.onerror = () => {
      setError('Failed to read PDF file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const payload: any = {
        paperTitle: pastedTitle.trim() || 'Academic Research Paper',
        authors: pastedAuthors ? pastedAuthors.split(',').map((a) => a.trim()) : [],
      };

      if (pdfBase64) {
        payload.pdfBase64 = pdfBase64;
      } else if (pastedText.trim() || selectedArxivId) {
        payload.paperText = pastedText.trim();
        payload.arxivId = selectedArxivId;
      } else {
        throw new Error('Please upload a PDF or choose a research paper to analyze.');
      }

      const response = await fetch('/api/research/analyze-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const result: PaperAnalysis = await response.json();
      setAnalysisResult(result);

      onSaveToHistory('paper', result.title, `Analyzed via ${result.sourceType}`, result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during paper analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAskPaperQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperQuestion.trim() || !analysisResult) return;

    setQaLoading(true);
    const userQ = paperQuestion.trim();
    setPaperQuestion('');

    try {
      const prompt = `You are a research co-author answering questions about this specific academic paper:
Title: "${analysisResult.title}"
Authors: ${analysisResult.authors.join(', ')}
Executive Summary: ${analysisResult.simplifiedSummary}
Detailed Analysis: ${JSON.stringify(analysisResult.analysis)}

Question from reader: "${userQ}"
Provide a precise, scholarly, and direct answer based strictly on the paper's findings, methodology, and limitations.`;

      const res = await fetch('/api/research/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: userQ, context: `Paper: ${analysisResult.title}`, depth: 'undergraduate' }),
      });

      const data = await res.json();
      const answer = data.formalDefinition || data.analogy || 'Analysis answered.';
      setQaHistory((prev) => [...prev, { q: userQ, a: answer }]);
    } catch (err) {
      setQaHistory((prev) => [
        ...prev,
        { q: userQ, a: 'Unable to process question. Please ensure network connectivity.' },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  // Convert current analysis into a VerifiedPaper format to add to lit review
  const handleAddCurrentToLitReview = () => {
    if (!analysisResult) return;
    const paperObj: VerifiedPaper = {
      id: analysisResult.id,
      title: analysisResult.title,
      authors: analysisResult.authors,
      summary: analysisResult.simplifiedSummary,
      publishedDate: new Date().toISOString().slice(0, 10),
      arxivUrl: selectedArxivId ? `https://arxiv.org/abs/${selectedArxivId}` : '',
      pdfUrl: selectedArxivId ? `https://arxiv.org/pdf/${selectedArxivId}.pdf` : '',
      primaryCategory: 'Academic Research',
      isVerified: true,
    };
    onAddToLitReview(paperObj);
  };

  const isQueued = analysisResult ? isPaperSelected(analysisResult.id, analysisResult.title) : false;

  return (
    <div className="space-y-8 pb-16">
      {/* Input Selection Header */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5" />
            <span>Deep Structural Academic Paper Extraction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Analyze Research Papers & Preprints
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Upload a PDF research paper, select a seminal preprint, or paste an abstract. The agent extracts objectives, methodology, quantitative results, limitations, and conclusions.
          </p>
        </div>

        {/* Source Mode Toggles */}
        <div className="flex border-b border-slate-800 space-x-4 mb-6">
          <button
            onClick={() => setActiveInputMode('samples')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
              activeInputMode === 'samples'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Seminal Papers (Instant)</span>
          </button>
          <button
            onClick={() => setActiveInputMode('upload')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
              activeInputMode === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF Paper</span>
          </button>
          <button
            onClick={() => setActiveInputMode('paste')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
              activeInputMode === 'paste'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Paper Text / Abstract</span>
          </button>
        </div>

        {/* Mode 1: Seminal Pre-loaded Papers */}
        {activeInputMode === 'samples' && (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Select a peer-reviewed seminal paper to analyze:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRELOADED_SAMPLE_PAPERS.map((sample, idx) => {
                const isSelected = pastedTitle === sample.title;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-indigo-400">arXiv:{sample.arxivId}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {sample.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{sample.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{sample.authors.join(', ')}</p>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{sample.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode 2: PDF Upload */}
        {activeInputMode === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center transition bg-slate-950/40">
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {uploadedFile ? uploadedFile.name : 'Click to select or drag and drop a PDF research paper'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {uploadedFile
                      ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for multimodal analysis`
                      : 'Accepts standard scientific PDFs up to 25MB'}
                  </p>
                </div>
                <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition">
                  {uploadedFile ? 'Replace PDF File' : 'Browse Local Files'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Mode 3: Paste Paper Text */}
        {activeInputMode === 'paste' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Paper Title</label>
                <input
                  type="text"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  placeholder="e.g. Attention Is All You Need"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Authors (comma-separated)</label>
                <input
                  type="text"
                  value={pastedAuthors}
                  onChange={(e) => setPastedAuthors(e.target.value)}
                  placeholder="e.g. Vaswani, Shazeer, Parmar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Paper Abstract, Methodology, or Full Text
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the paper abstract, experimental setup, or paper excerpt..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || (!uploadedFile && !pastedTitle && !pastedText)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/25"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Paper Architecture with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Full Paper Analysis</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          <p className="font-semibold">Analysis Error</p>
          <p className="text-xs text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-8 animate-fade-in">
          {/* Paper Overview Header */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    🟢 Analyzed Research Paper
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Source: {analysisResult.sourceType}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {analysisResult.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  <strong>Authors:</strong> {analysisResult.authors.join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleAddCurrentToLitReview}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition ${
                    isQueued
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                      : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-md'
                  }`}
                >
                  {isQueued ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Added to Review Matrix</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Add to Literature Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Plain-Language Simplified Summary */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
                <FileCheck className="w-4 h-4" />
                <span>Executive Summary (Plain Language)</span>
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed font-serif">
                {analysisResult.simplifiedSummary}
              </p>
            </div>

            {/* The 5 Deep Structural Sections */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Structural Deep-Dive Breakdown
              </h3>

              {/* 1. Objectives */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Target className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    1. Objectives & Central Hypothesis
                  </h4>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <p>
                    <strong className="text-white font-medium">Primary Goal:</strong>{' '}
                    {analysisResult.analysis.objectives.primaryGoal}
                  </p>
                  <p>
                    <strong className="text-white font-medium">Core Hypothesis:</strong>{' '}
                    {analysisResult.analysis.objectives.coreHypothesis}
                  </p>
                  {analysisResult.analysis.objectives.researchQuestions.length > 0 && (
                    <div className="pt-1">
                      <span className="text-white font-medium block mb-1">Target Questions:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {analysisResult.analysis.objectives.researchQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Methodology */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <FlaskConical className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    2. Methodology & Experimental Design
                  </h4>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <p>
                    <strong className="text-white font-medium">Technical Approach:</strong>{' '}
                    {analysisResult.analysis.methodology.approach}
                  </p>
                  <p>
                    <strong className="text-white font-medium">Datasets & Benchmark Subjects:</strong>{' '}
                    {analysisResult.analysis.methodology.datasetOrSubjects}
                  </p>
                  <p>
                    <strong className="text-white font-medium">Experimental Design & Controls:</strong>{' '}
                    {analysisResult.analysis.methodology.experimentalDesign}
                  </p>
                  {analysisResult.analysis.methodology.frameworksAndTools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysisResult.analysis.methodology.frameworksAndTools.map((tool, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Results & Quantitative Metrics */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    3. Results & Quantitative Metrics
                  </h4>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <p>
                    <strong className="text-white font-medium">Comparison with Baselines:</strong>{' '}
                    {analysisResult.analysis.results.comparisonWithBaselines}
                  </p>
                  {analysisResult.analysis.results.keyFindings.length > 0 && (
                    <div>
                      <span className="text-white font-medium block mb-1">Key Empirical Findings:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {analysisResult.analysis.results.keyFindings.map((finding, i) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.analysis.results.quantitativeMetrics.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {analysisResult.analysis.results.quantitativeMetrics.map((metric, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-600/30 font-mono text-xs text-emerald-300">
                          📊 {metric}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Limitations & Threats to Validity */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertOctagon className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    4. Limitations & Threats to Validity
                  </h4>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {analysisResult.analysis.limitations.threatsToValidity.length > 0 && (
                    <div>
                      <span className="text-amber-400 font-medium block mb-1">Threats to Validity:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {analysisResult.analysis.limitations.threatsToValidity.map((threat, i) => (
                          <li key={i}>{threat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.analysis.limitations.computationalOrDataConstraints.length > 0 && (
                    <div className="pt-1">
                      <span className="text-slate-400 font-medium block mb-1">Computational / Sample Constraints:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {analysisResult.analysis.limitations.computationalOrDataConstraints.map((constraint, i) => (
                          <li key={i}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Conclusions & Impact */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Award className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    5. Conclusions & Practical Impact
                  </h4>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <p>
                    <strong className="text-white font-medium">Scholarly Summary:</strong>{' '}
                    {analysisResult.analysis.conclusions.summary}
                  </p>
                  <p>
                    <strong className="text-white font-medium">Real-World & Industrial Impact:</strong>{' '}
                    {analysisResult.analysis.conclusions.practicalImpact}
                  </p>
                  {analysisResult.analysis.conclusions.proposedFutureWork.length > 0 && (
                    <div className="pt-1">
                      <span className="text-purple-300 font-medium block mb-1">Proposed Next Directions:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {analysisResult.analysis.conclusions.proposedFutureWork.map((fw, i) => (
                          <li key={i}>{fw}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive "Ask Paper a Question" tool */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Ask the Paper a Specific Question</span>
              </h3>
              <p className="text-xs text-slate-400">
                Inquire about specific mathematical details, hyperparameter sensitivities, or baseline comparisons from this paper.
              </p>

              <form onSubmit={handleAskPaperQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={paperQuestion}
                  onChange={(e) => setPaperQuestion(e.target.value)}
                  placeholder="e.g. What were the specific learning rate warmup steps and BLEU score gains?"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={qaLoading || !paperQuestion.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
                >
                  {qaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Ask</span>
                </button>
              </form>

              {/* Q&A Stream */}
              {qaHistory.length > 0 && (
                <div className="space-y-3 pt-2">
                  {qaHistory.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                      <p className="font-semibold text-indigo-300">Q: {item.q}</p>
                      <p className="text-slate-300 leading-relaxed font-serif pl-2 border-l-2 border-indigo-500/40">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
