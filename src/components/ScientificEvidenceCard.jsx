import { BookOpen, CalendarDays, Database, ShieldCheck, TrendingUp } from 'lucide-react';

function formatConfidence(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export default function ScientificEvidenceCard({ evidenceContext, knowledgeContext }) {
  if (!evidenceContext && !knowledgeContext) return null;

  const refresh = knowledgeContext?.refresh;
  const inventory = knowledgeContext?.inventory;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Evidenze scientifiche</h3>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase font-bold">
          RAG
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Livello evidenza
          </div>
          <p className="text-white font-bold">{evidenceContext?.bestEvidenceLabel || 'N/D'}</p>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Confidenza
          </div>
          <p className="text-white font-bold">{formatConfidence(evidenceContext?.confidence)}</p>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
            <Database className="w-3.5 h-3.5" />
            Studi
          </div>
          <p className="text-white font-bold">{evidenceContext?.studiesCount || inventory?.documentsCount || 0}</p>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-white/50 text-[11px] mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Aggiornamento
          </div>
          <p className="text-white font-bold capitalize">{refresh?.status?.replace('_', ' ') || 'N/D'}</p>
        </div>
      </div>

      {inventory?.newestPublicationDate && (
        <p className="text-[11px] text-white/45 leading-relaxed">
          Fonte piu recente: {inventory.newestPublicationDate}. Database scientifico v{inventory.version}.
        </p>
      )}
    </div>
  );
}
