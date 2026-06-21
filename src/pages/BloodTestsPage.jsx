import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import healthEngine from '../lib/health-engine';
import lifestyleEngine from '../lib/lifestyle-engine';
import medicalKnowledgeEngine from '../lib/engines/medical-knowledge-engine';
import SubscriptionManager from '../lib/operations/subscription-manager.js';
import { 
  FileText, Upload, Calendar, AlertCircle, CheckCircle, Info, TrendingUp, 
  Droplet, ShieldAlert, Loader2, ArrowRight, Activity, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

export default function BloodTestsPage() {
  const { user } = useAuth();
  
  // Data States (Stored only in component state, never in localStorage/sessionStorage)
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reports, setReports] = useState([]);
  const [biomarkers, setBiomarkers] = useState([]);
  const [healthProfile, setHealthProfile] = useState(null);
  const [medications, setMedications] = useState([]);
  const [lifestyleContext, setLifestyleContext] = useState(null);
  
  // UI States
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedBiomarkerName, setSelectedBiomarkerName] = useState('Ferro');
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [consentSaving, setConsentSaving] = useState(false);

  // Load baseline user & clinical context
  useEffect(() => {
    if (!user) return;
    loadAllData();
  }, [user]);

  async function loadAllData() {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Fetch Health Profile (for consent check)
      const profile = await healthEngine.getHealthProfile(user.id);
      setHealthProfile(profile);

      if (profile?.privacy_consent) {
        // Parallelize queries for reports, biomarkers, medications, and lifestyle context
        const [reportsRes, biomarkersRes, medsRes, lsRes] = await Promise.all([
          supabase
            .from('blood_test_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('test_date', { ascending: false }),
          supabase
            .from('blood_test_biomarkers')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
          healthEngine.getMedications(user.id).catch(e => { console.error(e); return []; }),
          lifestyleEngine.getTodayLifestyleContext(user.id).catch(e => { console.error(e); return null; })
        ]);

        if (reportsRes.error) throw reportsRes.error;
        const reportsData = reportsRes.data || [];
        setReports(reportsData);

        if (reportsData.length > 0) {
          setSelectedReportId(reportsData[0].id);
        }

        if (biomarkersRes.error) throw biomarkersRes.error;
        setBiomarkers(biomarkersRes.data || []);

        setMedications((medsRes || []).filter(m => m.is_active));
        setLifestyleContext(lsRes);
      }
    } catch (err) {
      console.error("Error loading blood test data:", err);
      setErrorMessage("Errore nel caricamento dei dati: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Privacy Consent Approval
  const handleConsentAccept = async () => {
    setConsentSaving(true);
    try {
      const updated = await healthEngine.saveHealthProfile(user.id, {
        privacy_consent: true,
        privacy_consent_date: new Date().toISOString()
      });
      setHealthProfile(updated);
      await loadAllData();
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossibile salvare il consenso privacy.");
    } finally {
      setConsentSaving(false);
    }
  };

  // Extract PDF text using CDN-loaded PDFJS worker
  const parsePdfTextOnClient = async (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result);
          // Load PDFJS from cdnjs script tag if not globally available
          if (typeof window.pdfjsLib === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            document.head.appendChild(script);
            await new Promise((r) => {
              script.onload = r;
            });
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          }
          
          const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            text += pageText + "\n";
          }
          resolve(text);
        } catch (e) {
          reject(e);
        }
      };
      fileReader.onerror = () => reject(new Error("File reading failed"));
      fileReader.readAsArrayBuffer(file);
    });
  };

  // Upload report handler
  const handleFileUpload = async (file) => {
    if (!file) return;

    const tier = SubscriptionManager.getUserTier(user);
    if (tier === 'free' && reports.length >= 3) {
      setErrorMessage("Limite di 3 caricamenti referti raggiunto per il piano Free. Esegui l'upgrade a Pro per caricamenti illimitati.");
      return;
    }
    
    // Validation
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPdf && !isImage) {
      setErrorMessage("Formato file non supportato. Caricare solo file PDF, JPG o PNG.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Il file supera il limite massimo di 5MB.");
      return;
    }

    setProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let textContent = "";
      if (isPdf) {
        console.log("Client-side PDF text extraction starting...");
        textContent = await parsePdfTextOnClient(file);
      }

      // Generate Report UUID on client to satisfy `{user_id}/{report_id}/{filename}` path requirement
      const reportId = crypto.randomUUID();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${reportId}/${sanitizedFileName}`;

      console.log(`Uploading file to private storage: ${filePath}`);
      const { error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Invoke Supabase Edge Function to extract biomarkers
      const { data: functionData, error: functionErr } = await supabase.functions.invoke('analyze-blood-test', {
        body: { filePath, textContent }
      });

      if (functionErr) throw functionErr;
      if (functionData.error) throw new Error(functionData.error);

      setSuccessMessage("Referto analizzato ed estratto con successo!");
      await loadAllData();
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossibile analizzare il referto: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Filtering data for current selected report
  const currentBiomarkers = useMemo(() => {
    if (!selectedReportId) return [];
    return biomarkers.filter(b => b.report_id === selectedReportId);
  }, [biomarkers, selectedReportId]);

  // Filtering data for Recharts trend
  const trendData = useMemo(() => {
    if (!selectedBiomarkerName) return [];
    return biomarkers
      .filter(b => b.biomarker_name.toLowerCase() === selectedBiomarkerName.toLowerCase())
      .map(b => {
        const report = reports.find(r => r.id === b.report_id);
        return {
          date: report ? new Date(report.test_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/D',
          value: Number(b.value),
          min_range: b.min_range != null ? Number(b.min_range) : null,
          max_range: b.max_range != null ? Number(b.max_range) : null,
          unit: b.unit
        };
      })
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
      });
  }, [biomarkers, selectedBiomarkerName, reports]);

  // Unified health/diet cross-referencing insights
  const clinicalInsights = useMemo(() => {
    if (currentBiomarkers.length === 0) return [];
    const insights = [];

    currentBiomarkers.forEach(b => {
      const name = b.biomarker_name.toLowerCase();
      const val = Number(b.value);
      const isLow = b.status === 'low';
      const isHigh = b.status === 'high';

      // 1. Ferro / Ferritina low
      if (name.includes('ferro') || name.includes('ferritina') || name.includes('sideremia')) {
        if (isLow) {
          let recs = "Si consiglia di inserire alimenti ricchi di Ferro Eme animale (come carni rosse magre, cozze o fegato) che hanno elevata biodisponibilità (★★★★★).";
          
          if (healthProfile?.profile?.diet_type === 'vegan' || healthProfile?.profile?.diet_type === 'vegetarian') {
            recs = "Avendo una dieta vegetale, si consiglia di consumare fonti di Ferro non-eme (come lenticchie, ceci, semi di zucca) associandole nello stesso pasto a fonti di Vitamina C (limone, kiwi, agrumi, peperoni) per triplicare l'assorbimento (sinergia 🟢 Alta affidabilità), ed evitare di assumere tè, caffè o latticini nello stesso pasto (competizione Ferro ↔ Calcio/Tannini).";
          }
          
          // Levotiroxina interaction check
          const hasLevo = medications.some(m => m.medication_name.toLowerCase().includes('levotiroxina') || m.medication_name.toLowerCase().includes('eutirox'));
          let warning = "";
          if (hasLevo) {
            warning = "Possibile interazione. Non modificare la terapia senza consultare il medico. Calcio e Ferro riducono l'assorbimento della levotiroxina. Assumere il farmaco a digiuno lontano da queste fonti.";
          }

          insights.push({
            title: `Valore di ${b.biomarker_name} basso (${val} ${b.unit})`,
            type: 'warning',
            description: recs,
            warning: warning
          });
        }
      }

      // 2. Vitamina D low
      if (name.includes('vitamina d') || name.includes('25-oh')) {
        if (isLow) {
          let recs = "La sola alimentazione copre solo una minima parte del fabbisogno (fonti discrete: salmone selvaggio, sgombro, uova, funghi). La sintesi principale avviene tramite l'esposizione solare.";
          
          if (lifestyleContext?.sleep?.quality_score <= 3 || (lifestyleContext?.stress && Number(lifestyleContext.stress.stress_level) >= 6)) {
            recs += " Si consiglia inoltre di garantire un apporto adeguato di Magnesio (mandorle, spinaci, semi di zucca), che funge da cofattore essenziale per attivare la Vitamina D a livello di fegato e reni, supportando anche il rilassamento muscolare e la gestione dello stress.";
          }

          insights.push({
            title: `Vitamina D al di sotto del range di riferimento (${val} ${b.unit})`,
            type: 'warning',
            description: recs,
            warning: "Se il deficit persiste o è marcato, discutere con il proprio medico l'opportunità di dosare o integrare la vitamina D per via orale."
          });
        }
      }

      // 3. Vitamina B12 low
      if (name.includes('b12') || name.includes('cobalamina')) {
        if (isLow) {
          let recs = "La Vitamina B12 è assente negli alimenti vegetali. Se segui una dieta vegana o vegetariana, l'integrazione con B12 attiva è fondamentale.";
          
          // Metformina interaction check
          const hasMetformin = medications.some(m => m.medication_name.toLowerCase().includes('metformina'));
          let warning = "";
          if (hasMetformin) {
            warning = "Possibile interazione. Non modificare la terapia senza consultare il medico. L'uso cronico di metformina riduce l'assorbimento di Vitamina B12.";
          }

          insights.push({
            title: `Vitamina B12 sotto il target raccomandato (${val} ${b.unit})`,
            type: 'warning',
            description: recs,
            warning: warning
          });
        }
      }

      // 4. Colesterolo high
      if (name.includes('colesterolo') && isHigh) {
        insights.push({
          title: `Livelli di ${b.biomarker_name} superiori al desiderato (${val} ${b.unit})`,
          type: 'info',
          description: "Si raccomanda di incrementare l'apporto di fibre solubili (avena, orzo, legumi, mele) che riducono l'assorbimento del colesterolo a livello intestinale (sinergia con l'acqua). Ridurre il consumo di grassi saturi e di alimenti ultra-processati.",
          warning: "Questo suggerimento è a scopo puramente educativo. Per escludere rischi cardiovascolari, condividere sempre il referto con il proprio medico."
        });
      }
    });

    return insights;
  }, [currentBiomarkers, healthProfile, medications, lifestyleContext]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  // Privacy Consent Gate
  if (!healthProfile?.privacy_consent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/5 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <ShieldAlert className="w-12 h-12 text-amber-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Consenso Privacy Esami del Sangue</h2>
          <p className="text-white/70 mb-6 leading-relaxed">
            I referti delle analisi del sangue e i biomarcatori estratti sono considerati <b>dati sanitari sensibili</b>. 
            <br/><br/>
            Per consentirti l'upload, l'analisi automatica tramite AI e la visualizzazione dello storico, abbiamo bisogno del tuo esplicito consenso al trattamento.
            <br/><br/>
            I file vengono salvati in un bucket privato crittografato e i dati estratti nel database sicuro Supabase. <b>Nessun dato medico viene mai salvato nel localStorage o sessionStorage del browser</b> e nessuno tranne te può accedervi.
          </p>
          <button
            onClick={handleConsentAccept}
            disabled={consentSaving}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {consentSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Acconsento al trattamento dei miei dati medici
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Droplet className="w-7 h-7 text-rose-500" /> Esami del Sangue
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Carica i tuoi referti in formato PDF o immagine per tracciare i biomarcatori e monitorare i trend.
          </p>
        </div>
        
        {/* Warnings */}
        <div className="text-xs text-white/30 max-w-sm bg-white/5 border border-white/5 p-3 rounded-xl">
          🔍 I dati estratti sono ad esclusivo uso informativo. Non sostituiscono il parere del medico.
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-start gap-2 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Upload & Report list on left, Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upload & History */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Upload Card */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass-card-static p-6 border-2 border-dashed rounded-3xl transition-all text-center flex flex-col items-center justify-center min-h-[220px] ${
              dragOver ? 'border-lime-400 bg-lime-400/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            {processing ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 text-lime-400 animate-spin mx-auto" />
                <p className="text-white font-semibold">Analisi del referto...</p>
                <p className="text-xs text-white/40">Estrazione dei biomarcatori con AI Vision/OCR</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-lime-400 mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Carica un nuovo referto</p>
                  <p className="text-xs text-white/40 mt-1">Trascina qui il file o seleziona dal computer</p>
                </div>
                <input 
                  type="file" 
                  id="blood-test-file-input" 
                  className="hidden" 
                  accept="application/pdf, image/jpeg, image/png"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />
                <button 
                  onClick={() => document.getElementById('blood-test-file-input').click()}
                  className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl text-xs transition-all"
                >
                  Sfoglia file
                </button>
                <p className="text-[10px] text-white/30">PDF o Immagine, max 5MB</p>
              </div>
            )}
          </div>

          {/* Report History List */}
          <div className="glass-card-static p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/50" /> Storico Analisi
            </h3>
            
            {reports.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-6">Nessun referto inserito.</p>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 font-sans">
                {reports.map((r) => {
                  const dateStr = new Date(r.test_date).toLocaleDateString('it-IT', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  });
                  const isSelected = r.id === selectedReportId;
                  
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReportId(r.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                        isSelected 
                          ? 'bg-white/10 border-lime-400/30 text-white' 
                          : 'bg-white/5 border-transparent text-white/60 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${isSelected ? 'text-lime-400' : 'text-white/40'}`} />
                        <div>
                          <p className="text-xs font-semibold">{dateStr}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Referto caricato</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-40" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: Biomarkers Details */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Biomarkers Table */}
          <div className="glass-card-static p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-white/50" /> Risultati Biomarcatori
              </h3>
              {reports.length > 0 && selectedReportId && (
                <span className="text-[10px] bg-white/5 text-white/50 px-2 py-1 rounded-md">
                  Data Referto: {new Date(reports.find(r => r.id === selectedReportId)?.test_date).toLocaleDateString('it-IT')}
                </span>
              )}
            </div>

            {currentBiomarkers.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                Seleziona un referto o caricane uno nuovo per visualizzare i risultati.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40">
                      <th className="py-2">Biomarcatore</th>
                      <th className="py-2 text-right">Valore</th>
                      <th className="py-2 text-center">Stato</th>
                      <th className="py-2 text-right">Range di Riferimento</th>
                      <th className="py-2 text-center">Grafico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBiomarkers.map((b) => {
                      const isLow = b.status === 'low';
                      const isHigh = b.status === 'high';
                      const isNormal = b.status === 'normal';
                      
                      return (
                        <tr 
                          key={b.id} 
                          className={`border-b border-white/5 hover:bg-white/2 cursor-pointer transition-all ${
                            selectedBiomarkerName.toLowerCase() === b.biomarker_name.toLowerCase() ? 'bg-lime-400/5' : ''
                          }`}
                          onClick={() => setSelectedBiomarkerName(b.biomarker_name)}
                        >
                          <td className="py-3 font-semibold text-white">{b.biomarker_name}</td>
                          <td className="py-3 text-right font-mono text-white/80">{b.value} {b.unit}</td>
                          <td className="py-3 text-center">
                            {isNormal && <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px]">🟢 Normale</span>}
                            {isLow && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full text-[10px]">🔴 Basso</span>}
                            {isHigh && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-[10px]">🔴 Alto</span>}
                            {!isNormal && !isLow && !isHigh && <span className="px-2 py-0.5 bg-white/5 text-white/40 rounded-full text-[10px]">❓ Sconosciuto</span>}
                          </td>
                          <td className="py-3 text-right text-white/40 font-mono">
                            {b.min_range != null && b.max_range != null ? `${b.min_range} - ${b.max_range}` : 'N/D'}
                          </td>
                          <td className="py-3 text-center">
                            <button 
                              className={`p-1.5 rounded-lg transition-all ${
                                selectedBiomarkerName.toLowerCase() === b.biomarker_name.toLowerCase() 
                                  ? 'bg-lime-500 text-black' 
                                  : 'bg-white/5 text-white/40 hover:text-white'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBiomarkerName(b.biomarker_name);
                              }}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Second Section: Trend Graph & Insights */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Trend Graph (2 columns) */}
          <div className="glass-card-static p-6 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white/50" /> Storico e Trend: <span className="text-lime-400">{selectedBiomarkerName}</span>
            </h3>
            
            {trendData.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-xs">
                Seleziona un biomarcatore dalla tabella per vedere l'andamento storico.
              </div>
            ) : (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0f', borderColor: 'rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                      itemStyle={{ color: '#fff', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name={selectedBiomarkerName} 
                      stroke="#84cc16" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#84cc16' }}
                    />
                    {trendData[0]?.min_range != null && (
                      <ReferenceLine y={trendData[0].min_range} stroke="#22d3ee" strokeDasharray="3 3" label={{ value: 'Min', fill: '#22d3ee', fontSize: 9, position: 'insideTopLeft' }} />
                    )}
                    {trendData[0]?.max_range != null && (
                      <ReferenceLine y={trendData[0].max_range} stroke="#ea580c" strokeDasharray="3 3" label={{ value: 'Max', fill: '#ea580c', fontSize: 9, position: 'insideBottomLeft' }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Insights (1 column) */}
          <div className="glass-card-static p-6 space-y-4 lg:col-span-1 flex flex-col">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-white/50" /> Insight e Correlazioni
            </h3>

            {clinicalInsights.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/30 text-xs">
                <CheckCircle className="w-8 h-8 text-green-500/40 mb-2" />
                Nessun alert nutrizionale rilevato per i biomarcatori estratti.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[250px] pr-1 flex-1">
                {clinicalInsights.map((insight, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {insight.title}
                    </h4>
                    <p className="text-[11px] text-white/70 leading-relaxed">{insight.description}</p>
                    {insight.warning && (
                      <p className="text-[10px] text-amber-500 font-semibold leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                        {insight.warning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4 border-t border-white/5 text-[9px] text-white/30 leading-normal text-justify">
              AVVISO MEDICO: NutriScan AI non effettua diagnosi cliniche né prescrive terapie. I valori estratti devono essere confermati e interpretati da un medico. Non modificare alcun dosaggio farmacologico senza consultare il medico.
            </div>
          </div>

        </div>
      )}

      {/* Persistent Medical Disclaimer always visible */}
      <div className="text-[10px] text-white/20 border border-white/5 bg-white/[0.01] p-4 rounded-2xl leading-relaxed text-justify">
        <b>AVVERTENZA MEDICO-LEGALE OBBLIGATORIA:</b> NutriScan AI è un'applicazione web con finalità esclusivamente didattiche ed educative per promuovere stili di vita sani. Questo software, incluse le funzionalità di scansione dei referti e l'estrazione automatica dei biomarcatori tramite intelligenza artificiale, non costituisce un dispositivo medico, non fornisce pareri clinici, diagnosi, prescrizioni o consigli terapeutici. Non ignorare o ritardare mai la consultazione di un medico professionista per via delle informazioni lette in questa applicazione. In caso di dubbi sui valori estratti o per qualsiasi variazione di regimi dietetici o terapie farmacologiche in atto, fare sempre riferimento al proprio medico curante o a uno specialista sanitario.
      </div>

    </div>
  );
}
