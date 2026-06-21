import { SCIENTIFIC_KNOWLEDGE_BASE, SCIENTIFIC_KNOWLEDGE_VERSION } from './scientific-knowledge-engine.js';

/**
 * In-memory knowledge refresh manager.
 * It tracks scientific knowledge metadata only; it never stores user clinical data.
 */

const DEFAULT_REFRESH_INTERVAL_DAYS = 30;

export function getKnowledgeInventory() {
  const publicationDates = SCIENTIFIC_KNOWLEDGE_BASE
    .map((doc) => doc.publicationDate)
    .filter(Boolean)
    .sort();

  return {
    version: SCIENTIFIC_KNOWLEDGE_VERSION,
    documentsCount: SCIENTIFIC_KNOWLEDGE_BASE.length,
    oldestPublicationDate: publicationDates[0] || null,
    newestPublicationDate: publicationDates[publicationDates.length - 1] || null,
    topics: [...new Set(SCIENTIFIC_KNOWLEDGE_BASE.map((doc) => doc.topic))],
    persistence: 'none'
  };
}

export function getKnowledgeRefreshStatus(referenceDate = new Date(), refreshIntervalDays = DEFAULT_REFRESH_INTERVAL_DAYS) {
  const newestDate = getKnowledgeInventory().newestPublicationDate;
  const newest = newestDate ? new Date(newestDate) : null;
  const ageDays = newest ? Math.floor((referenceDate - newest) / (1000 * 60 * 60 * 24)) : Infinity;

  return {
    status: ageDays <= refreshIntervalDays ? 'updated' : 'review_required',
    ageDays,
    refreshIntervalDays,
    nextReviewDue: newest
      ? new Date(newest.getTime() + refreshIntervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null,
    message: ageDays <= refreshIntervalDays
      ? 'Knowledge base scientifica aggiornata entro la finestra configurata.'
      : 'Knowledge base da revisionare rispetto alla finestra configurata.'
  };
}

export function identifyObsoleteDocuments(referenceDate = new Date(), maxAgeYears = 10) {
  return SCIENTIFIC_KNOWLEDGE_BASE.filter((doc) => {
    if (!doc.publicationDate) return true;
    const ageYears = (referenceDate - new Date(doc.publicationDate)) / (1000 * 60 * 60 * 24 * 365.25);
    return ageYears > maxAgeYears;
  }).map((doc) => ({
    id: doc.id,
    title: doc.title,
    publicationDate: doc.publicationDate,
    reason: `Publication older than ${maxAgeYears} years`
  }));
}

export function buildKnowledgeUpdateContext() {
  return {
    inventory: getKnowledgeInventory(),
    refresh: getKnowledgeRefreshStatus(),
    obsoleteDocuments: identifyObsoleteDocuments(),
    history: [
      {
        version: SCIENTIFIC_KNOWLEDGE_VERSION,
        date: '2026-06-21',
        change: 'Phase 13 scientific RAG knowledge layer initialized.'
      }
    ],
    disclaimer: 'Aggiorna solo metadati e fonti scientifiche, senza persistere dati clinici dell utente.'
  };
}

export default {
  getKnowledgeInventory,
  getKnowledgeRefreshStatus,
  identifyObsoleteDocuments,
  buildKnowledgeUpdateContext
};
