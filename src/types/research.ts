export interface VerifiedPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  publishedDate: string;
  updatedDate?: string;
  arxivUrl: string;
  pdfUrl: string;
  primaryCategory: string;
  doi?: string;
  journalRef?: string;
  isVerified: boolean;
}

export interface TopicAnalysis {
  topic: string;
  overview: string;
  simpleExplanation: string; // Feynman / intuitive breakdown
  corePillars: {
    title: string;
    description: string;
    keyTerminology: string[];
  }[];
  researchQuestions: string[];
  subDisciplines: string[];
  suggestedKeywords: string[];
  theoreticalFoundations: string[];
}

export interface PaperSectionAnalysis {
  objectives: {
    primaryGoal: string;
    researchQuestions: string[];
    coreHypothesis: string;
  };
  methodology: {
    approach: string;
    frameworksAndTools: string[];
    datasetOrSubjects: string;
    experimentalDesign: string;
  };
  results: {
    keyFindings: string[];
    quantitativeMetrics: string[];
    comparisonWithBaselines: string;
  };
  limitations: {
    threatsToValidity: string[];
    untestedScenarios: string[];
    computationalOrDataConstraints: string[];
  };
  conclusions: {
    summary: string;
    practicalImpact: string;
    proposedFutureWork: string[];
  };
}

export interface PaperAnalysis {
  id: string;
  title: string;
  authors: string[];
  sourceType: 'pdf_upload' | 'arxiv_paper' | 'text_input';
  pdfFileName?: string;
  analysis: PaperSectionAnalysis;
  simplifiedSummary: string;
  analyzedAt: string;
}

export interface ComparisonMatrixItem {
  paperTitle: string;
  authors: string;
  year?: string;
  focusArea: string;
  methodology: string;
  keyStrengths: string;
  limitations: string;
  tradeOffs: string;
}

export interface ResearchGap {
  title: string;
  description: string;
  importance: 'critical' | 'moderate' | 'emerging';
  suggestedInvestigation: string;
}

export interface LiteratureReview {
  id: string;
  topic: string;
  papersCount: number;
  synthesisOverview: string;
  thematicClusters: {
    theme: string;
    description: string;
    contributingPapers: string[];
  }[];
  comparisonMatrix: ComparisonMatrixItem[];
  researchGaps: ResearchGap[];
  futureDirections: string[];
  generatedAt: string;
}

export type CitationStyle = 'APA' | 'IEEE' | 'Chicago';

export interface ResearchReport {
  id: string;
  title: string;
  topic: string;
  citationStyle: CitationStyle;
  abstract: string;
  introduction: string;
  researchQuestions: string[];
  methodologyAndSurvey: string;
  findingsAndSynthesis: string;
  researchGapsAndOpportunities: string;
  conclusion: string;
  verifiedReferences: {
    formatted: string;
    paperId: string;
    url?: string;
    isVerified: boolean;
  }[];
  generatedAt: string;
}

export interface ConceptExplanation {
  concept: string;
  depth: 'simple' | 'undergraduate' | 'expert';
  analogy: string;
  formalDefinition: string;
  technicalMechanism: string[];
  practicalApplication: string;
  commonMisconceptions: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'topic' | 'paper' | 'lit_review' | 'report';
  title: string;
  subtitle: string;
  payload: any;
}
