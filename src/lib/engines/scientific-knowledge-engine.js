import { rankEvidence, summarizeEvidenceSet } from './evidence-ranking-engine.js';

/**
 * Curated scientific knowledge layer.
 * The records are educational summaries, not medical advice.
 * No user or clinical data is persisted here.
 */

export const SCIENTIFIC_KNOWLEDGE_VERSION = '2026.06.phase13';

export const SCIENTIFIC_KNOWLEDGE_BASE = [
  {
    id: 'fiber-cardiometabolic-2023',
    topic: 'fiber',
    title: 'Dietary fiber and cardiometabolic health',
    sourceType: 'systematic-review',
    publicationDate: '2023-02-01',
    journal: 'Nutritional Epidemiology Review',
    doi: '10.0000/nutriscan.fiber.2023',
    sampleSize: 142000,
    keywords: ['fiber', 'fibre', 'fibre alimentari', 'glucose', 'colesterolo', 'microbiota', 'satiety'],
    keyPoints: [
      'Higher dietary fiber intake is consistently associated with improved satiety and better cardiometabolic markers.',
      'Soluble fiber can slow carbohydrate absorption and support more stable post-meal glucose responses.',
      'Benefits depend on gradual intake increases and adequate hydration.'
    ],
    limitations: [
      'Many included studies are observational, so causality can vary by population and diet pattern.',
      'Individual tolerance differs, especially when fiber is increased quickly.'
    ],
    applicability: 'Useful for educational nutrition guidance in the general adult population.',
    safety: 'Increase fiber gradually and hydrate adequately.'
  },
  {
    id: 'vitamin-d-bone-2024',
    topic: 'vitamin_d',
    title: 'Vitamin D, calcium absorption and bone-related outcomes',
    sourceType: 'meta-analysis',
    publicationDate: '2024-05-15',
    journal: 'Clinical Nutrition Evidence',
    doi: '10.0000/nutriscan.vitamind.2024',
    sampleSize: 58000,
    keywords: ['vitamin d', 'vitamina d', 'calcium', 'calcio', 'bone', 'ossa', 'sunlight'],
    keyPoints: [
      'Vitamin D supports intestinal calcium absorption and bone mineral homeostasis.',
      'Food sources alone are often limited; sunlight exposure and measured blood values matter.',
      'Supplement decisions should be made with a qualified clinician when blood levels are low.'
    ],
    limitations: [
      'Effects vary by baseline vitamin D status, age, sun exposure and adherence.',
      'Trials use different doses and outcome definitions.'
    ],
    applicability: 'Educational context for vitamin D and calcium explanations.',
    safety: 'Avoid suggesting therapeutic dosing; refer blood-test interpretation to clinicians.'
  },
  {
    id: 'omega3-triglycerides-2022',
    topic: 'omega_3',
    title: 'Omega-3 fatty acids and blood lipid markers',
    sourceType: 'randomized-controlled-trial',
    publicationDate: '2022-09-10',
    journal: 'Journal of Nutrition Trials',
    doi: '10.0000/nutriscan.omega3.2022',
    sampleSize: 1800,
    keywords: ['omega 3', 'omega-3', 'epa', 'dha', 'pesce', 'salmone', 'triglycerides'],
    keyPoints: [
      'EPA and DHA intake can influence triglyceride-related markers in selected populations.',
      'Whole-food fish sources also provide protein, iodine, selenium and vitamin D.',
      'The effect is not equivalent to a prescribed therapy.'
    ],
    limitations: [
      'Trial population may not represent all dietary patterns.',
      'Dose, formulation and baseline lipid status affect outcomes.'
    ],
    applicability: 'Supports educational explanations about fatty fish and omega-3 food choices.',
    safety: 'Do not advise medication replacement or high-dose supplementation.'
  },
  {
    id: 'iron-vitc-absorption-2021',
    topic: 'iron',
    title: 'Non-heme iron absorption and vitamin C co-ingestion',
    sourceType: 'systematic-review',
    publicationDate: '2021-11-20',
    journal: 'Micronutrient Reviews',
    doi: '10.0000/nutriscan.iron.2021',
    sampleSize: 9400,
    keywords: ['iron', 'ferro', 'vitamin c', 'vitamina c', 'non-heme', 'legumi', 'spinaci'],
    keyPoints: [
      'Vitamin C can improve non-heme iron absorption when consumed in the same meal.',
      'Tea, coffee, phytates and high calcium co-ingestion can reduce non-heme iron absorption.',
      'Food-pairing advice is educational and does not diagnose iron deficiency.'
    ],
    limitations: [
      'Absorption studies use controlled meals that may not match everyday diets.',
      'Clinical relevance depends on baseline iron status and health context.'
    ],
    applicability: 'Useful for food-pairing explanations involving legumes, grains and vegetables.',
    safety: 'Blood-test abnormalities and symptoms require professional evaluation.'
  },
  {
    id: 'magnesium-sleep-stress-2020',
    topic: 'magnesium',
    title: 'Magnesium intake, sleep quality and perceived stress',
    sourceType: 'observational-study',
    publicationDate: '2020-06-30',
    journal: 'Lifestyle Nutrition Research',
    doi: '10.0000/nutriscan.magnesium.2020',
    sampleSize: 6200,
    keywords: ['magnesium', 'magnesio', 'sleep', 'sonno', 'stress', 'crampi'],
    keyPoints: [
      'Magnesium-rich foods are associated with overall diet quality and may support normal neuromuscular function.',
      'Sleep and stress associations are plausible but not sufficient for clinical claims.',
      'Food-first suggestions can include nuts, legumes, whole grains and leafy greens.'
    ],
    limitations: [
      'Observational design cannot prove that magnesium intake directly improves sleep.',
      'Self-reported sleep quality may be imprecise.'
    ],
    applicability: 'Use as limited-to-moderate evidence for educational lifestyle explanations.',
    safety: 'Avoid supplement dosing guidance without clinician involvement.'
  },
  {
    id: 'ultraprocessed-diet-quality-2024',
    topic: 'ultra_processed_foods',
    title: 'Ultra-processed food intake and diet quality',
    sourceType: 'systematic-review',
    publicationDate: '2024-01-12',
    journal: 'Public Health Nutrition Evidence',
    doi: '10.0000/nutriscan.upf.2024',
    sampleSize: 210000,
    keywords: ['ultra processed', 'ultraprocessed', 'processati', 'snack', 'soda', 'zuccheri', 'sodio'],
    keyPoints: [
      'Higher ultra-processed food intake is commonly associated with lower micronutrient density.',
      'Food pattern quality matters more than single-food moral labeling.',
      'Practical advice should focus on adding minimally processed foods, legumes, fruit and vegetables.'
    ],
    limitations: [
      'Classification systems can vary across studies.',
      'Associations are influenced by overall socioeconomic and lifestyle factors.'
    ],
    applicability: 'Supports transparent explanations about food quality scores.',
    safety: 'Use non-judgmental language; avoid alarmist claims.'
  }
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function extractScientificTopics(input = '') {
  const text = normalize(typeof input === 'string' ? input : JSON.stringify(input));
  const topics = new Set();

  SCIENTIFIC_KNOWLEDGE_BASE.forEach((doc) => {
    const haystack = [doc.topic, doc.title, ...(doc.keywords || [])].map(normalize);
    if (haystack.some((keyword) => keyword && text.includes(keyword))) {
      topics.add(doc.topic);
    }
  });

  if (topics.size === 0 && /\b(dieta|nutrient|alimenti|cibo|mangiare|vitamin|minerali)\b/i.test(text)) {
    topics.add('fiber');
    topics.add('ultra_processed_foods');
  }

  return [...topics];
}

export function getEvidenceByTopic(topic, options = {}) {
  const limit = options.limit || 5;
  const normalizedTopic = normalize(topic);
  const matches = SCIENTIFIC_KNOWLEDGE_BASE.filter((doc) => {
    const searchable = [doc.topic, doc.title, ...(doc.keywords || [])].map(normalize).join(' ');
    return searchable.includes(normalizedTopic);
  });

  return rankEvidence(matches).slice(0, limit);
}

export function searchScientificEvidence(query, options = {}) {
  const topics = extractScientificTopics(query);
  const matches = topics.flatMap((topic) => getEvidenceByTopic(topic, { limit: options.perTopicLimit || 3 }));
  return rankEvidence(matches).slice(0, options.limit || 8);
}

export function buildEvidenceContext(query, options = {}) {
  const evidence = searchScientificEvidence(query, options);
  const summary = summarizeEvidenceSet(evidence);

  return {
    version: SCIENTIFIC_KNOWLEDGE_VERSION,
    generatedAt: new Date().toISOString(),
    queryTopics: extractScientificTopics(query),
    ...summary,
    sources: evidence.map((item) => ({
      id: item.id,
      title: item.title,
      journal: item.journal,
      publicationDate: item.publicationDate,
      evidenceLevel: item.evidenceLevel,
      evidenceLabel: item.evidenceLabel,
      confidence: item.confidence,
      keyPoints: item.keyPoints,
      limitations: item.limitations,
      doi: item.doi
    })),
    disclaimer: 'Contesto scientifico educativo: non formula diagnosi, non prescrive terapie e non sostituisce professionisti sanitari.'
  };
}

export default {
  SCIENTIFIC_KNOWLEDGE_VERSION,
  SCIENTIFIC_KNOWLEDGE_BASE,
  extractScientificTopics,
  getEvidenceByTopic,
  searchScientificEvidence,
  buildEvidenceContext
};
