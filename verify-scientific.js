import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rankEvidence, classifyEvidenceLevel } from './src/lib/engines/evidence-ranking-engine.js';
import { buildEvidenceContext, SCIENTIFIC_KNOWLEDGE_BASE } from './src/lib/engines/scientific-knowledge-engine.js';
import { buildRagContext, deduplicateDocuments } from './src/lib/engines/rag-engine.js';
import { buildExplainabilityContext } from './src/lib/engines/scientific-explainability-engine.js';
import { buildKnowledgeUpdateContext } from './src/lib/engines/knowledge-update-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== STARTING PHASE 13 SCIENTIFIC RAG VALIDATION ===\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`FAIL: ${message}`);
  }
}

// 1. Evidence classification A-E
assert(classifyEvidenceLevel('meta-analysis') === 'A', 'Meta-analysis classified as Level A');
assert(classifyEvidenceLevel('systematic-review') === 'A', 'Systematic review classified as Level A');
assert(classifyEvidenceLevel('randomized-controlled-trial') === 'B', 'RCT classified as Level B');
assert(classifyEvidenceLevel('observational-study') === 'C', 'Observational study classified as Level C');
assert(classifyEvidenceLevel('narrative-review') === 'D', 'Narrative review classified as Level D');
assert(classifyEvidenceLevel('expert-opinion') === 'E', 'Expert opinion classified as Level E');

// 2. Ranking prioritizes highest evidence
const ranked = rankEvidence([
  { title: 'Expert note', sourceType: 'expert-opinion', publicationDate: '2026-01-01' },
  { title: 'RCT', sourceType: 'randomized-controlled-trial', publicationDate: '2020-01-01' },
  { title: 'Meta', sourceType: 'meta-analysis', publicationDate: '2019-01-01' }
]);
assert(ranked[0].evidenceLevel === 'A', 'Ranking prioritizes Level A over newer lower-quality evidence');

// 3. Knowledge base quality
assert(SCIENTIFIC_KNOWLEDGE_BASE.length >= 5, 'Scientific knowledge base contains multiple curated documents');
assert(SCIENTIFIC_KNOWLEDGE_BASE.every(doc => doc.publicationDate && doc.keyPoints?.length && doc.limitations?.length), 'Each scientific document includes date, key points, and limitations');

// 4. Evidence context
const evidenceContext = buildEvidenceContext('Come posso aumentare vitamina D e calcio?');
assert(evidenceContext.sources.length > 0, 'Evidence context retrieves relevant sources');
assert(Boolean(evidenceContext.bestEvidenceLevel), 'Evidence context exposes best evidence level');
assert(evidenceContext.disclaimer.includes('non formula diagnosi'), 'Evidence context includes non-diagnostic disclaimer');

// 5. RAG context
const ragContext = buildRagContext('ferro vegetale vitamina C legumi');
assert(ragContext.documents.length > 0, 'RAG retrieves relevant scientific documents');
assert(ragContext.documents.every(doc => doc.citation && doc.evidenceLevel && doc.limitations), 'RAG documents include citation, evidence level, and limitations');
const deduped = deduplicateDocuments([ragContext.documents[0], ragContext.documents[0]]);
assert(deduped.length === 1, 'RAG deduplicates duplicate documents');

// 6. Explainability
const explainabilityContext = buildExplainabilityContext(ragContext);
assert(explainabilityContext.evidenceQuality?.level, 'Explainability includes evidence quality');
assert(Array.isArray(explainabilityContext.limitations), 'Explainability includes study limitations');
assert(explainabilityContext.safetyBoundary.includes('non e una diagnosi'), 'Explainability includes safety boundary');
assert(explainabilityContext.responseChecklist.some(item => item.includes('Distinguere fatti')), 'Explainability requires fact/inference separation');

// 7. Knowledge refresh
const updateContext = buildKnowledgeUpdateContext();
assert(updateContext.inventory.persistence === 'none', 'Knowledge update manager does not persist user clinical data');
assert(updateContext.inventory.documentsCount === SCIENTIFIC_KNOWLEDGE_BASE.length, 'Knowledge update inventory matches knowledge base');
assert(['updated', 'review_required'].includes(updateContext.refresh.status), 'Knowledge refresh status is explicit');

// 8. AI chat integration
const aiChatPath = path.join(__dirname, 'src/pages/AiChatPage.jsx');
const aiChatContent = fs.readFileSync(aiChatPath, 'utf-8');
assert(aiChatContent.includes('evidenceContext'), 'AiChatPage includes evidenceContext in payload');
assert(aiChatContent.includes('ragContext'), 'AiChatPage includes ragContext in payload');
assert(aiChatContent.includes('explainabilityContext'), 'AiChatPage includes explainabilityContext in payload');
assert(aiChatContent.includes('ScientificEvidenceCard'), 'AiChatPage renders scientific evidence dashboard card');

// 9. Edge function integration and guardrails
const edgePath = path.join(__dirname, 'supabase/functions/ai-nutrition-chat/index.ts');
const edgeContent = fs.readFileSync(edgePath, 'utf-8');
assert(edgeContent.includes('SCIENTIFIC RAG'), 'ai-nutrition-chat contains Scientific RAG instructions');
assert(edgeContent.includes('FATTI VS IPOTESI'), 'ai-nutrition-chat instructs fact vs hypothesis separation');
assert(edgeContent.includes('INCERTEZZA'), 'ai-nutrition-chat instructs uncertainty disclosure');
assert(edgeContent.includes('RAG CONTEXT'), 'ai-nutrition-chat receives RAG context');

// 10. No operational diagnostic/prescriptive language in new scientific modules
const newScientificFiles = [
  'src/lib/engines/scientific-knowledge-engine.js',
  'src/lib/engines/rag-engine.js',
  'src/lib/engines/evidence-ranking-engine.js',
  'src/lib/engines/scientific-explainability-engine.js',
  'src/lib/engines/knowledge-update-manager.js'
];

const prohibitedOperationalPatterns = [
  /diagnostica\s+(il|la|una|un)\b/i,
  /prescrivi\s+/i,
  /modifica\s+la\s+terapia/i,
  /sospendi\s+il\s+farmaco/i,
  /cura\s+la\s+malattia/i
];

let prohibitedLanguageFound = false;
newScientificFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
  prohibitedOperationalPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      prohibitedLanguageFound = true;
      console.error(`Prohibited operational medical language found in ${file}: ${pattern}`);
    }
  });
});
assert(!prohibitedLanguageFound, 'No diagnostic, prescriptive, or therapy-changing operational language in scientific modules');

// 11. No local/session storage writes in new scientific modules
let storageWriteFound = false;
newScientificFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
  if (content.includes('localStorage.setItem') || content.includes('sessionStorage.setItem') || content.includes('indexedDB')) {
    storageWriteFound = true;
    console.error(`Storage write detected in ${file}`);
  }
});
assert(!storageWriteFound, 'No scientific or clinical data persisted locally by new scientific modules');

console.log(`\n=== PHASE 13 SCIENTIFIC RAG VALIDATION COMPLETE: Passed ${testsPassed}/${totalTests} ===`);

if (testsPassed === totalTests) {
  console.log('ALL PHASE 13 SCIENTIFIC RAG TESTS PASSED');
  process.exit(0);
} else {
  console.error('PHASE 13 SCIENTIFIC RAG TESTS FAILED');
  process.exit(1);
}
