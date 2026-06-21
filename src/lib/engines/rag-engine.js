import { searchScientificEvidence } from './scientific-knowledge-engine.js';
import { rankEvidence, summarizeEvidenceSet } from './evidence-ranking-engine.js';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function deduplicateDocuments(documents = []) {
  const seen = new Map();

  documents.forEach((doc) => {
    const key = doc.doi || doc.id || normalizeText(doc.title);
    if (!seen.has(key)) seen.set(key, doc);
  });

  return [...seen.values()];
}

export function retrieveRelevantDocuments(query, options = {}) {
  const maxDocuments = options.maxDocuments || 6;
  const documents = searchScientificEvidence(query, { limit: maxDocuments * 2 });
  return rankEvidence(deduplicateDocuments(documents)).slice(0, maxDocuments);
}

export function buildRagContext(query, options = {}) {
  const maxKeyPoints = options.maxKeyPoints || 3;
  const documents = retrieveRelevantDocuments(query, options);
  const summary = summarizeEvidenceSet(documents);

  return {
    query: String(query || '').slice(0, 500),
    generatedAt: new Date().toISOString(),
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      publicationDate: doc.publicationDate,
      evidenceLevel: doc.evidenceLevel,
      evidenceLabel: doc.evidenceLabel,
      confidence: doc.confidence,
      keyPoints: (doc.keyPoints || []).slice(0, maxKeyPoints),
      limitations: doc.limitations || [],
      citation: `${doc.title}. ${doc.journal}. ${doc.publicationDate}. ${doc.doi}.`
    })),
    retrievalSummary: {
      studiesCount: summary.studiesCount,
      bestEvidenceLevel: summary.bestEvidenceLevel,
      confidence: summary.confidence
    },
    instructions: [
      'Use only relevant evidence from this context when citing scientific support.',
      'Prefer the highest available evidence level.',
      'If evidence is limited or indirect, state that uncertainty explicitly.',
      'Do not diagnose, prescribe, alter therapy, or replace a healthcare professional.'
    ]
  };
}

export default {
  deduplicateDocuments,
  retrieveRelevantDocuments,
  buildRagContext
};
