import { CitationStyle, ResearchReport, VerifiedPaper } from '../types/research';

/**
 * Extracts a normalized ArXiv identifier from an arXiv URL or raw ID string.
 */
export function extractArxivId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Check for http(s)://arxiv.org/abs/2301.12345 or /pdf/2301.12345.pdf
  const match = trimmed.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+(?:v[0-9]+)?|[a-zA-Z\-]+(?:\.[a-zA-Z\-]+)?\/[0-9]+)/i);
  if (match && match[1]) {
    return match[1].replace(/\.pdf$/i, '');
  }
  // If it's already an ID like 2301.12345 or 2301.12345v2
  const idMatch = trimmed.match(/^([0-9]+\.[0-9]+(?:v[0-9]+)?|[a-zA-Z\-]+(?:\.[a-zA-Z\-]+)?\/[0-9]+)$/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  return trimmed;
}

/**
 * Normalizes author name into initials and surname for standard citations.
 */
function formatAuthorInitials(fullName: string): { initials: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { initials: '', surname: parts[0] };
  }
  const surname = parts[parts.length - 1];
  const initials = parts
    .slice(0, parts.length - 1)
    .map((name) => `${name[0].toUpperCase()}.`)
    .join(' ');
  return { initials, surname };
}

/**
 * Formats academic citations into APA 7th, IEEE, or Chicago styles.
 */
export function formatCitation(
  paper: {
    title: string;
    authors: string[];
    publishedDate: string;
    arxivUrl?: string;
    doi?: string;
  },
  style: CitationStyle = 'APA'
): string {
  const yearMatch = paper.publishedDate?.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  const title = paper.title.trim().replace(/\.$/, '');
  const url = paper.arxivUrl || (paper.doi ? `https://doi.org/${paper.doi}` : '');
  const arxivId = paper.arxivUrl ? extractArxivId(paper.arxivUrl) : '';

  const authorCount = paper.authors.length;

  if (style === 'IEEE') {
    let authorStr = 'Anon.';
    if (authorCount === 1) {
      const { initials, surname } = formatAuthorInitials(paper.authors[0]);
      authorStr = initials ? `${initials} ${surname}` : surname;
    } else if (authorCount === 2) {
      const a1 = formatAuthorInitials(paper.authors[0]);
      const a2 = formatAuthorInitials(paper.authors[1]);
      authorStr = `${a1.initials ? a1.initials + ' ' : ''}${a1.surname} and ${a2.initials ? a2.initials + ' ' : ''}${a2.surname}`;
    } else if (authorCount > 2) {
      const a1 = formatAuthorInitials(paper.authors[0]);
      authorStr = `${a1.initials ? a1.initials + ' ' : ''}${a1.surname} et al.`;
    }

    const idSuffix = arxivId ? `, arXiv:${arxivId}` : '';
    const urlSuffix = url ? ` [Online]. Available: ${url}` : '';
    return `${authorStr}, "${title},"${idSuffix}, ${year}.${urlSuffix}`;
  }

  if (style === 'Chicago') {
    let authorStr = 'Anonymous';
    if (authorCount === 1) {
      const { initials, surname } = formatAuthorInitials(paper.authors[0]);
      const firstName = paper.authors[0].split(/\s+/)[0];
      authorStr = `${surname}, ${firstName}`;
    } else if (authorCount >= 2) {
      const firstParts = paper.authors[0].split(/\s+/);
      const firstSurname = firstParts[firstParts.length - 1];
      const firstGiven = firstParts.slice(0, -1).join(' ');
      const secondName = paper.authors[1];
      if (authorCount === 2) {
        authorStr = `${firstSurname}, ${firstGiven}, and ${secondName}`;
      } else {
        authorStr = `${firstSurname}, ${firstGiven}, et al.`;
      }
    }

    const archiveNote = arxivId ? ` arXiv preprint arXiv:${arxivId}` : '';
    const urlSuffix = url ? ` ${url}` : '';
    const authorPunct = authorStr.endsWith('.') ? '' : '.';
    return `${authorStr}${authorPunct} "${title}."${archiveNote} (${year}).${urlSuffix}`;
  }

  // Default to APA 7th
  let authorStr = 'Anonymous';
  if (authorCount === 1) {
    const { initials, surname } = formatAuthorInitials(paper.authors[0]);
    authorStr = initials ? `${surname}, ${initials}` : surname;
  } else if (authorCount === 2) {
    const a1 = formatAuthorInitials(paper.authors[0]);
    const a2 = formatAuthorInitials(paper.authors[1]);
    const s1 = a1.initials ? `${a1.surname}, ${a1.initials}` : a1.surname;
    const s2 = a2.initials ? `${a2.surname}, ${a2.initials}` : a2.surname;
    authorStr = `${s1}, & ${s2}`;
  } else if (authorCount > 2) {
    const a1 = formatAuthorInitials(paper.authors[0]);
    const s1 = a1.initials ? `${a1.surname}, ${a1.initials}` : a1.surname;
    authorStr = `${s1}, et al.`;
  }

  const arxivSuffix = arxivId ? ` arXiv preprint arXiv:${arxivId}.` : '.';
  const urlSuffix = url ? ` ${url}` : '';
  return `${authorStr} (${year}). ${title}.${arxivSuffix}${urlSuffix}`.trim();
}

/**
 * Cleans search strings for academic queries, avoiding noisy punctuations while preserving terms.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  return query
    .trim()
    .replace(/[^\w\s\-\+\.:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filter verified papers by term across title, authors, or summary.
 */
export function filterPapers(papers: VerifiedPaper[], query: string, category?: string): VerifiedPaper[] {
  if (!papers || !Array.isArray(papers)) return [];
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedCategory = category?.toLowerCase().trim();

  return papers.filter((paper) => {
    const matchesCategory =
      !normalizedCategory ||
      normalizedCategory === 'all' ||
      paper.primaryCategory?.toLowerCase().includes(normalizedCategory);

    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const matchesTitle = paper.title.toLowerCase().includes(normalizedQuery);
    const matchesSummary = paper.summary.toLowerCase().includes(normalizedQuery);
    const matchesAuthor = paper.authors.some((author) => author.toLowerCase().includes(normalizedQuery));

    return matchesTitle || matchesSummary || matchesAuthor;
  });
}

/**
 * Generates an academic Markdown report representation.
 */
export function generateReportMarkdown(report: ResearchReport): string {
  const lines: string[] = [];

  lines.push(`# ${report.title}`);
  lines.push(`**Research Topic:** ${report.topic}`);
  lines.push(`**Date Generated:** ${new Date(report.generatedAt).toLocaleDateString()} | **Citation Style:** ${report.citationStyle}`);
  lines.push(`**Generated with:** Research Paper Agent (Verified Academic Engine)`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## Abstract');
  lines.push(report.abstract);
  lines.push('');

  lines.push('## 1. Introduction & Background');
  lines.push(report.introduction);
  lines.push('');

  if (report.researchQuestions && report.researchQuestions.length > 0) {
    lines.push('### Core Research Questions');
    report.researchQuestions.forEach((rq, i) => {
      lines.push(`${i + 1}. ${rq}`);
    });
    lines.push('');
  }

  lines.push('## 2. Literature Review & Methodology Survey');
  lines.push(report.methodologyAndSurvey);
  lines.push('');

  lines.push('## 3. Findings & Cross-Study Synthesis');
  lines.push(report.findingsAndSynthesis);
  lines.push('');

  lines.push('## 4. Research Gaps & Future Directions');
  lines.push(report.researchGapsAndOpportunities);
  lines.push('');

  lines.push('## 5. Conclusion');
  lines.push(report.conclusion);
  lines.push('');

  lines.push('## References');
  lines.push('> Note: All references below correspond to verified published preprints and peer-reviewed papers.');
  lines.push('');
  report.verifiedReferences.forEach((ref, i) => {
    lines.push(`[${i + 1}] ${ref.formatted}`);
  });

  return lines.join('\n');
}

/**
 * Generates a clean plain text report for downloading as .txt.
 */
export function generateReportText(report: ResearchReport): string {
  const divider = '='.repeat(76);
  const subDivider = '-'.repeat(76);
  const lines: string[] = [];

  lines.push(divider);
  lines.push(report.title.toUpperCase());
  lines.push(`Research Topic: ${report.topic}`);
  lines.push(`Generated: ${new Date(report.generatedAt).toLocaleString()} | Citation Standard: ${report.citationStyle}`);
  lines.push(divider);
  lines.push('');

  lines.push('ABSTRACT');
  lines.push(subDivider);
  lines.push(report.abstract);
  lines.push('');

  lines.push('1. INTRODUCTION & BACKGROUND');
  lines.push(subDivider);
  lines.push(report.introduction);
  lines.push('');

  if (report.researchQuestions && report.researchQuestions.length > 0) {
    lines.push('RESEARCH QUESTIONS');
    report.researchQuestions.forEach((rq, i) => {
      lines.push(`  RQ${i + 1}: ${rq}`);
    });
    lines.push('');
  }

  lines.push('2. METHODOLOGY & LITERATURE SURVEY');
  lines.push(subDivider);
  lines.push(report.methodologyAndSurvey);
  lines.push('');

  lines.push('3. FINDINGS & CROSS-STUDY SYNTHESIS');
  lines.push(subDivider);
  lines.push(report.findingsAndSynthesis);
  lines.push('');

  lines.push('4. RESEARCH GAPS & FUTURE OPPORTUNITIES');
  lines.push(subDivider);
  lines.push(report.researchGapsAndOpportunities);
  lines.push('');

  lines.push('5. CONCLUSION');
  lines.push(subDivider);
  lines.push(report.conclusion);
  lines.push('');

  lines.push('REFERENCES (VERIFIED ACADEMIC SOURCES)');
  lines.push(subDivider);
  report.verifiedReferences.forEach((ref, idx) => {
    lines.push(`[${idx + 1}] ${ref.formatted}`);
  });

  lines.push('');
  lines.push(divider);
  lines.push('End of Report - Research Paper Agent');

  return lines.join('\n');
}
