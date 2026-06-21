import { getEvidenceLevelDetails, summarizeEvidenceSet } from './evidence-ranking-engine.js';

export function buildScientificExplanation(recommendation, evidenceItems = []) {
  const summary = summarizeEvidenceSet(evidenceItems);
  const levelDetails = getEvidenceLevelDetails(summary.bestEvidenceLevel);

  return {
    recommendation,
    reason: 'La raccomandazione e formulata come educazione nutrizionale e collegata alle evidenze scientifiche disponibili nel contesto RAG.',
    evidenceQuality: {
      level: summary.bestEvidenceLevel,
      label: summary.bestEvidenceLabel,
      description: levelDetails.description,
      studiesCount: summary.studiesCount
    },
    limitations: summary.topSources.flatMap((source) => source.limitations || []).slice(0, 4),
    confidence: summary.confidence,
    publicationDates: summary.topSources.map((source) => source.publicationDate).filter(Boolean),
    uncertaintyStatement: summary.bestEvidenceLevel === 'A' || summary.bestEvidenceLevel === 'B'
      ? 'Le prove disponibili sono relativamente robuste, ma l applicabilita individuale puo variare.'
      : 'Le prove disponibili sono limitate o indirette; interpretare l informazione con prudenza.',
    safetyBoundary: 'Informazione educativa: non e una diagnosi, non prescrive farmaci e non modifica terapie.'
  };
}

export function buildExplainabilityContext(ragContext) {
  const documents = ragContext?.documents || [];
  const explanation = buildScientificExplanation('Risposta nutrizionale basata su evidenze disponibili', documents);

  return {
    generatedAt: new Date().toISOString(),
    ...explanation,
    responseChecklist: [
      'Distinguere fatti scientifici, inferenze e ipotesi.',
      'Citare titolo/data/livello evidenza quando si usa una fonte.',
      'Indicare limiti e incertezza se le prove sono incomplete.',
      'Mantenere finalita educativa, informativa e preventiva.'
    ]
  };
}

export default {
  buildScientificExplanation,
  buildExplainabilityContext
};
