import React, { useState } from 'react';
import {
  ScrollText,
  Download,
  Copy,
  Check,
  Sparkles,
  FileText,
  Printer,
  BookOpen,
  HelpCircle,
  Layers,
  AlertTriangle,
  Award,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { CitationStyle, ResearchReport, VerifiedPaper } from '../types/research';
import { generateReportMarkdown, generateReportText } from '../utils/research-utils';

interface ReportGeneratorProps {
  selectedPapers: VerifiedPaper[];
  initialTopic?: string;
  onSaveToHistory: (type: 'report', title: string, subtitle: string, payload: any) => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  selectedPapers,
  initialTopic = '',
  onSaveToHistory,
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Advances in Transformer Architectures and Context Optimization');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
  const [researchQuestionsText, setResearchQuestionsText] = useState(
    '1. What architectural innovations solve quadratic attention scaling?\n2. What are the empirical trade-offs between perplexity and KV cache memory?'
  );
  const [customNotes, setCustomNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active section scroll indicator or highlight
  const [activeSection, setActiveSection] = useState<string>('abstract');

  const handleGenerateReport = async () => {
    if (!topic.trim()) return;

    setGenerating(true);
    setError(null);

    const questionsList = researchQuestionsText
      .split('\n')
      .map((q) => q.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((q) => q.length > 0);

    try {
      const response = await fetch('/api/research/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          researchQuestions: questionsList,
          papers: selectedPapers,
          citationStyle,
          customNotes: customNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const generated: ResearchReport = await response.json();
      setReport(generated);
      onSaveToHistory('report', generated.title, `${generated.citationStyle} report (${generated.verifiedReferences.length} refs)`, generated);
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize research report.');
    } finally {
      setGenerating(false);
    }
  };

  // Download plain text report
  const handleDownloadText = () => {
    if (!report) return;
    const txt = generateReportText(report);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.topic.replace(/[^a-zA-Z0-9]/g, '_')}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Markdown report
  const handleDownloadMarkdown = () => {
    if (!report) return;
    const md = generateReportMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.topic.replace(/[^a-zA-Z0-9]/g, '_')}_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy full report to clipboard
  const handleCopyReport = async () => {
    if (!report) return;
    const md = generateReportMarkdown(report);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Printable view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Configuration Header */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl print:hidden">
        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Automated Publication-Grade Report Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Generate Structured Academic Report
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Synthesize formal reports with abstract, background, methodology survey, cross-study findings, research gaps, conclusions, and verified citations in APA, IEEE, or Chicago style.
          </p>
        </div>

        <div className="space-y-5 pt-2 border-t border-slate-800">
          {/* Topic & Citation Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="report-topic-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Report Topic / Title *
              </label>
              <input
                id="report-topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Modern Parameter-Efficient Fine-Tuning Paradigms"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="citation-style-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Citation Standard
              </label>
              <select
                id="citation-style-select"
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="APA">APA 7th Edition (Author, Year)</option>
                <option value="IEEE">IEEE Reference Standard [1]</option>
                <option value="Chicago">Chicago Manual of Style 17th</option>
              </select>
            </div>
          </div>

          {/* Research Questions */}
          <div>
            <label htmlFor="report-questions-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Research Questions (one per line)
            </label>
            <textarea
              id="report-questions-input"
              rows={2}
              value={researchQuestionsText}
              onChange={(e) => setResearchQuestionsText(e.target.value)}
              placeholder="1. Question 1&#10;2. Question 2"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Custom Notes */}
          <div>
            <label htmlFor="report-notes-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Researcher Hypotheses & Specific Focus Notes</span>
              <span className="text-[11px] text-slate-400 font-normal">Optional</span>
            </label>
            <textarea
              id="report-notes-input"
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Focus on memory vs latency trade-offs, emphasize low-compute settings..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Verified Literature Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                Citing <strong className="text-white font-semibold">{selectedPapers.length}</strong> verified academic papers from your literature shelf.
              </span>
            </div>
            {selectedPapers.length === 0 && (
              <span className="text-amber-400 text-[11px]">
                Tip: Add papers in Topic Explorer for verified bibliographic references.
              </span>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerateReport}
              disabled={generating || !topic.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/25"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Academic Prose with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Full Research Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm print:hidden">
          <p className="font-semibold">Generation Failed</p>
          <p className="text-xs text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Generated Report View */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          {/* Navigation Sidebar (Table of contents) */}
          <div className="lg:col-span-1 space-y-4 print:hidden">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sticky top-28 shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Report Sections
              </h4>
              <nav className="space-y-1 text-xs">
                {[
                  { id: 'abstract', label: 'Abstract' },
                  { id: 'intro', label: '1. Introduction' },
                  { id: 'questions', label: 'Research Questions' },
                  { id: 'methodology', label: '2. Methodology Survey' },
                  { id: 'findings', label: '3. Findings & Synthesis' },
                  { id: 'gaps', label: '4. Research Gaps' },
                  { id: 'conclusion', label: '5. Conclusion' },
                  { id: 'references', label: 'References' },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#section-${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`block px-3 py-2 rounded-lg font-medium transition ${
                      activeSection === item.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Download / Export Actions */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.md)</span>
                </button>
                <button
                  onClick={handleDownloadText}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download (.txt)</span>
                </button>
                <button
                  onClick={handleCopyReport}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>

          {/* Report Document Body */}
          <div className="lg:col-span-3 space-y-8">
            <article className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0">
              {/* Report Header */}
              <div className="border-b border-slate-800 pb-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Academic Research Report
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Standard: {report.citationStyle}
                  </span>
                  <span className="text-xs text-slate-400">
                    Generated: {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-tight">
                  {report.title}
                </h1>
                <p className="text-xs text-slate-400">
                  <strong>Domain:</strong> {report.topic} • <strong>Compiled by:</strong> Research Paper Agent
                </p>
              </div>

              {/* Abstract */}
              <section id="section-abstract" className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Abstract
                </h2>
                <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-sm font-serif text-slate-200 leading-relaxed italic">
                    {report.abstract}
                  </p>
                </div>
              </section>

              {/* 1. Introduction */}
              <section id="section-intro" className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-1.5 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>1. Introduction & Theoretical Background</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                  {report.introduction}
                </p>
              </section>

              {/* Research Questions */}
              {report.researchQuestions && report.researchQuestions.length > 0 && (
                <section id="section-questions" className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Investigated Research Questions</span>
                  </h3>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    {report.researchQuestions.map((rq, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                        <span className="font-mono text-cyan-400 font-bold">RQ{idx + 1}:</span>
                        <span>{rq}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Methodology & Literature Survey */}
              <section id="section-methodology" className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-1.5 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>2. Methodology & Literature Survey</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                  {report.methodologyAndSurvey}
                </p>
              </section>

              {/* 3. Findings & Cross-Study Synthesis */}
              <section id="section-findings" className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-1.5 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>3. Findings & Cross-Study Synthesis</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                  {report.findingsAndSynthesis}
                </p>
              </section>

              {/* 4. Research Gaps & Opportunities */}
              <section id="section-gaps" className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-1.5 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>4. Unaddressed Research Gaps & Frontiers</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                  {report.researchGapsAndOpportunities}
                </p>
              </section>

              {/* 5. Conclusion */}
              <section id="section-conclusion" className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-1.5 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>5. Conclusion</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                  {report.conclusion}
                </p>
              </section>

              {/* Verified References */}
              <section id="section-references" className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    References ({report.citationStyle} Standard)
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    🟢 Verified Literature
                  </span>
                </div>
                <div className="space-y-2">
                  {report.verifiedReferences.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No explicit external papers were queued in the literature shelf for this run. Grounded on theoretical domain principles.
                    </p>
                  ) : (
                    report.verifiedReferences.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed flex items-start justify-between gap-3"
                      >
                        <div>
                          <span className="text-indigo-400 font-bold mr-2">[{idx + 1}]</span>
                          <span>{ref.formatted}</span>
                        </div>
                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-400 p-1 flex-shrink-0"
                            title="Open verified paper"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </article>
          </div>
        </div>
      )}
    </div>
  );
};
