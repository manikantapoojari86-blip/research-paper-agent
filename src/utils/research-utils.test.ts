import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractArxivId,
  formatCitation,
  sanitizeSearchQuery,
  filterPapers,
  generateReportMarkdown,
  generateReportText,
} from './research-utils';
import { ResearchReport, VerifiedPaper } from '../types/research';

test('extractArxivId handles full URL and raw ID', () => {
  assert.equal(extractArxivId('https://arxiv.org/abs/1706.03762'), '1706.03762');
  assert.equal(extractArxivId('https://arxiv.org/pdf/1706.03762.pdf'), '1706.03762');
  assert.equal(extractArxivId('2305.18290v1'), '2305.18290v1');
  assert.equal(extractArxivId('cs.AI/0102003'), 'cs.AI/0102003');
});

test('formatCitation formats APA, IEEE, and Chicago styles properly', () => {
  const paper = {
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
    publishedDate: '2017-06-12',
    arxivUrl: 'https://arxiv.org/abs/1706.03762',
  };

  const apa = formatCitation(paper, 'APA');
  assert.ok(apa.includes('Vaswani, A., et al.'), `APA author format expected: ${apa}`);
  assert.ok(apa.includes('(2017). Attention Is All You Need.'), `APA year and title expected: ${apa}`);
  assert.ok(apa.includes('arXiv:1706.03762'), `APA archive reference expected: ${apa}`);

  const ieee = formatCitation(paper, 'IEEE');
  assert.ok(ieee.includes('A. Vaswani et al., "Attention Is All You Need,"'), `IEEE format expected: ${ieee}`);
  assert.ok(ieee.includes('2017.'), `IEEE year expected: ${ieee}`);

  const chicago = formatCitation(paper, 'Chicago');
  assert.ok(chicago.includes('Vaswani, Ashish, et al. "Attention Is All You Need."'), `Chicago format: ${chicago}`);
});

test('sanitizeSearchQuery strips problematic characters and condenses whitespace', () => {
  assert.equal(sanitizeSearchQuery('  quantum   computing! @#$ & LLMs?  '), 'quantum computing LLMs');
  assert.equal(sanitizeSearchQuery('bio-medical: NLP + Transformers'), 'bio-medical: NLP + Transformers');
});

test('filterPapers accurately matches title, author, and category', () => {
  const papers: VerifiedPaper[] = [
    {
      id: '1',
      title: 'Deep Residual Learning for Image Recognition',
      authors: ['Kaiming He', 'Xiangyu Zhang'],
      summary: 'Deeper neural networks are more difficult to train.',
      publishedDate: '2015-12-10',
      arxivUrl: 'https://arxiv.org/abs/1512.03385',
      pdfUrl: 'https://arxiv.org/pdf/1512.03385.pdf',
      primaryCategory: 'cs.CV',
      isVerified: true,
    },
    {
      id: '2',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer'],
      summary: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
      publishedDate: '2017-06-12',
      arxivUrl: 'https://arxiv.org/abs/1706.03762',
      pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
      primaryCategory: 'cs.CL',
      isVerified: true,
    },
  ];

  const matchedByAuthor = filterPapers(papers, 'Kaiming');
  assert.equal(matchedByAuthor.length, 1);
  assert.equal(matchedByAuthor[0].id, '1');

  const matchedByCategory = filterPapers(papers, '', 'cs.CL');
  assert.equal(matchedByCategory.length, 1);
  assert.equal(matchedByCategory[0].id, '2');

  const matchedBoth = filterPapers(papers, 'recurrent', 'cs.CL');
  assert.equal(matchedBoth.length, 1);

  const matchedNone = filterPapers(papers, 'blockchain');
  assert.equal(matchedNone.length, 0);
});

test('generateReportMarkdown and generateReportText produce valid content', () => {
  const mockReport: ResearchReport = {
    id: 'rep-1',
    title: 'Synthesis of Modern Diffusion Models',
    topic: 'Diffusion Models in Generative AI',
    citationStyle: 'APA',
    abstract: 'This report evaluates recent advances in score-based generative modeling.',
    introduction: 'Diffusion models have surpassed GANs in visual fidelity.',
    researchQuestions: ['How do score-based models scale?', 'What are the latency bottlenecks?'],
    methodologyAndSurvey: 'Surveying DDPM, DDIM, and Latent Diffusion.',
    findingsAndSynthesis: 'Classifier-free guidance provides optimal Pareto frontier.',
    researchGapsAndOpportunities: 'Sampling speed remains high-cost for real-time applications.',
    conclusion: 'Diffusion establishes the state of the art in generative modeling.',
    verifiedReferences: [
      {
        formatted: 'Ho, J. et al. (2020). Denoising Diffusion Probabilistic Models. arXiv:2006.11239',
        paperId: '2006.11239',
        url: 'https://arxiv.org/abs/2006.11239',
        isVerified: true,
      },
    ],
    generatedAt: '2026-11-03T12:00:00Z',
  };

  const md = generateReportMarkdown(mockReport);
  assert.ok(md.includes('# Synthesis of Modern Diffusion Models'));
  assert.ok(md.includes('## Abstract'));
  assert.ok(md.includes('1. How do score-based models scale?'));
  assert.ok(md.includes('[1] Ho, J. et al.'));

  const txt = generateReportText(mockReport);
  assert.ok(txt.includes('SYNTHESIS OF MODERN DIFFUSION MODELS'));
  assert.ok(txt.includes('ABSTRACT'));
  assert.ok(txt.includes('RQ1: How do score-based models scale?'));
  assert.ok(txt.includes('REFERENCES (VERIFIED ACADEMIC SOURCES)'));
});
