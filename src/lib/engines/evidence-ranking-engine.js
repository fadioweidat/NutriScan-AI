/**
 * Evidence Ranking Engine - Phase 13
 * Pure scientific-source ranking. No clinical data, no persistence.
 */

export const EVIDENCE_LEVELS = {
  A: {
    rank: 1,
    label: 'Livello A',
    sourceTypes: ['meta-analysis', 'systematic-review'],
    description: 'Meta-analisi e revisioni sistematiche',
    baseConfidence: 0.92
  },
  B: {
    rank: 2,
    label: 'Livello B',
    sourceTypes: ['randomized-controlled-trial', 'rct'],
    description: 'Randomized Controlled Trial',
    baseConfidence: 0.82
  },
  C: {
    rank: 3,
    label: 'Livello C',
    sourceTypes: ['observational-study', 'cohort-study', 'case-control-study'],
    description: 'Studi osservazionali',
    baseConfidence: 0.66
  },
  D: {
    rank: 4,
    label: 'Livello D',
    sourceTypes: ['narrative-review'],
    description: 'Review narrative',
    baseConfidence: 0.52
  },
  E: {
    rank: 5,
    label: 'Livello E',
    sourceTypes: ['expert-opinion', 'guideline-commentary'],
    description: 'Opinioni di esperti',
    baseConfidence: 0.38
  }
};

const TYPE_TO_LEVEL = Object.entries(EVIDENCE_LEVELS).reduce((acc, [level, config]) => {
  config.sourceTypes.forEach((type) => {
    acc[type] = level;
  });
  return acc;
}, {});

export function classifyEvidenceLevel(sourceType = '') {
  return TYPE_TO_LEVEL[String(sourceType).toLowerCase()] || 'E';
}

export function getEvidenceLevelDetails(level) {
  return EVIDENCE_LEVELS[level] || EVIDENCE_LEVELS.E;
}

export function calculateRecencyScore(publicationDate, referenceDate = new Date()) {
  if (!publicationDate) return 0.4;
  const published = new Date(publicationDate);
  if (Number.isNaN(published.getTime())) return 0.4;

  const ageYears = Math.max(0, (referenceDate - published) / (1000 * 60 * 60 * 24 * 365.25));
  if (ageYears <= 2) return 1;
  if (ageYears <= 5) return 0.85;
  if (ageYears <= 10) return 0.65;
  return 0.45;
}

export function calculateEvidenceConfidence(evidence) {
  const level = evidence.evidenceLevel || classifyEvidenceLevel(evidence.sourceType);
  const levelDetails = getEvidenceLevelDetails(level);
  const recency = calculateRecencyScore(evidence.publicationDate);
  const sampleSize = Number(evidence.sampleSize || 0);
  const sampleBonus = sampleSize >= 10000 ? 0.05 : sampleSize >= 1000 ? 0.03 : sampleSize >= 100 ? 0.01 : 0;
  const limitationPenalty = Math.min(0.18, (evidence.limitations || []).length * 0.03);

  return Number(Math.max(0.2, Math.min(0.98, levelDetails.baseConfidence * recency + sampleBonus - limitationPenalty)).toFixed(2));
}

export function rankEvidence(evidenceItems = []) {
  return [...evidenceItems]
    .map((item) => {
      const evidenceLevel = item.evidenceLevel || classifyEvidenceLevel(item.sourceType);
      return {
        ...item,
        evidenceLevel,
        evidenceLabel: getEvidenceLevelDetails(evidenceLevel).label,
        confidence: item.confidence ?? calculateEvidenceConfidence({ ...item, evidenceLevel })
      };
    })
    .sort((a, b) => {
      const levelDiff = getEvidenceLevelDetails(a.evidenceLevel).rank - getEvidenceLevelDetails(b.evidenceLevel).rank;
      if (levelDiff !== 0) return levelDiff;

      const confidenceDiff = Number(b.confidence || 0) - Number(a.confidence || 0);
      if (confidenceDiff !== 0) return confidenceDiff;

      return new Date(b.publicationDate || 0) - new Date(a.publicationDate || 0);
    });
}

export function summarizeEvidenceSet(evidenceItems = []) {
  const ranked = rankEvidence(evidenceItems);
  const best = ranked[0] || null;
  const byLevel = ranked.reduce((acc, item) => {
    acc[item.evidenceLevel] = (acc[item.evidenceLevel] || 0) + 1;
    return acc;
  }, {});

  return {
    bestEvidenceLevel: best?.evidenceLevel || 'E',
    bestEvidenceLabel: best?.evidenceLabel || EVIDENCE_LEVELS.E.label,
    confidence: best?.confidence || 0,
    studiesCount: ranked.length,
    byLevel,
    topSources: ranked.slice(0, 5)
  };
}

export default {
  EVIDENCE_LEVELS,
  classifyEvidenceLevel,
  getEvidenceLevelDetails,
  calculateEvidenceConfidence,
  calculateRecencyScore,
  rankEvidence,
  summarizeEvidenceSet
};
