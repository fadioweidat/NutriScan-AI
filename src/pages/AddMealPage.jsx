import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import engine from '../lib/nutrition-engine';
import { parseMealText } from '../lib/meal-parser';
import VoiceMealInput from '../components/VoiceMealInput';
import FoodSearch from '../components/FoodSearch';
import PhotoUpload from '../components/PhotoUpload';
import { searchFoods } from '../lib/search-engine.js';
import { enqueueAction } from '../lib/offline-db';
import { isOnline } from '../lib/sync-manager';

import { searchOpenFoodFactsByBarcode } from '../lib/openFoodFacts.js';
import BarcodeScanner from '../components/BarcodeScanner';
import {
  Coffee, Sun, Moon, Cookie, ArrowLeft, Loader2,
  Check, Plus, Sparkles, Mic, Type, AlertTriangle, 
  Search, Camera, Trash2, Edit2, ScanBarcode, Database, Save
} from 'lucide-react';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Colazione', icon: Coffee },
  { key: 'lunch', label: 'Pranzo', icon: Sun },
  { key: 'dinner', label: 'Cena', icon: Moon },
  { key: 'snack', label: 'Snack', icon: Cookie },
];

export default function AddMealPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [mealType, setMealType] = useState('lunch');
  const [inputMode, setInputMode] = useState('photo'); // 'voice' | 'text' | 'photo'
  const [textInput, setTextInput] = useState('');
  
  const [dbFoods, setDbFoods] = useState([]);
  
  const [parsedItems, setParsedItems] = useState(null); // Array of preview items
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Per la correzione manuale (indica l'indice dell'item in correzione del DB)
  const [correctingIndex, setCorrectingIndex] = useState(null);

  // Stato per la tab Barcode
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [scannedFoodResult, setScannedFoodResult] = useState(null);
  const [offSearching, setOffSearching] = useState(false);

  useEffect(() => {
    // Carica tutti i cibi per fare il match locale
    const fetchFoods = async () => {
      const { data } = await supabase.from('foods').select('*, food_nutrients(*)');
      if (data) setDbFoods(data);
    };
    fetchFoods();
  }, []);

  const handleAnalyzeText = async (textToAnalyze = textInput) => {
    if (!textToAnalyze.trim()) {
      setError("Inserisci cosa hai mangiato.");
      return;
    }
    setError('');
    setAnalyzing(true);
    
    // 1. Parsing RegEx
    const rawParsed = parseMealText(textToAnalyze);
    if (rawParsed.length === 0) {
      setError("Non sono riuscito a capire. Riprova con '150g salmone'.");
      setAnalyzing(false);
      return;
    }

    try {
      // 2. Matching con il DB (senza confidence per il testo)
      const processed = await Promise.all(rawParsed.map(async (item) => {
        const keyword = item.food.toLowerCase().trim();
        const searchResults = await searchFoods(keyword, 1);
        const match = searchResults[0] 
                   || dbFoods.find(f => f.name.toLowerCase() === keyword) 
                   || dbFoods.find(f => f.name.toLowerCase().includes(keyword));

        if (match) {
          return {
            ...item,
            matchedFood: match,
            isMatched: true,
            nutrients: engine.calculateMealNutrients(match, item.quantityGrams)
          };
        }

        return {
          ...item,
          matchedFood: null,
          isMatched: false,
          nutrients: null
        };
      }));

      setParsedItems(processed);
    } catch (err) {
      console.error("Errore ricerca alimenti:", err);
      setError("Ricerca alimenti non riuscita. Riprova tra poco.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVoiceTranscription = (text) => {
    setTextInput(text);
    handleAnalyzeText(text);
  };

  const handlePhotoAnalysis = async ({ base64 }) => {
    setError('');
    setAnalyzing(true);
    
    try {
      const { data, error: funcErr } = await supabase.functions.invoke('photo-meal-analysis', {
        body: { image: base64 }
      });

      if (funcErr) throw funcErr;
      if (data?.error) throw new Error(data.error);

      const aiResults = data.result || [];
      if (aiResults.length === 0) {
        setError("Nessun alimento riconosciuto. Inserisci manualmente.");
        setAnalyzing(false);
        return;
      }

      // Match locale con confidence
      const processed = await Promise.all(aiResults.map(async (item) => {
        const keyword = item.food.toLowerCase().trim();
        const searchResults = await searchFoods(keyword, 1);
        const match = searchResults[0] 
                   || dbFoods.find(f => f.name.toLowerCase() === keyword) 
                   || dbFoods.find(f => f.name.toLowerCase().includes(keyword));

        return {
          food: item.food,
          quantityGrams: item.estimated_grams || 100,
          confidence: item.confidence || 0,
          matchedFood: match || null,
          isMatched: !!match,
          nutrients: match ? engine.calculateMealNutrients(match, item.estimated_grams || 100) : null
        };
      }));

      setParsedItems(processed);
    } catch (err) {
      console.error("Errore analisi foto:", err);
      setError("Analisi non riuscita, riprova o inserisci manualmente.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualCorrection = (foodObject) => {
    if (correctingIndex === null) return;
    
    const updated = [...parsedItems];
    const item = updated[correctingIndex];
    item.matchedFood = foodObject;
    item.isMatched = true;
    item.confidence = 1; // Utente ha corretto manualmente, confidence 100%
    item.nutrients = engine.calculateMealNutrients(foodObject, item.quantityGrams);
    
    setParsedItems(updated);
    setCorrectingIndex(null);
  };

  const updateQuantity = (idx, newGrams) => {
    const updated = [...parsedItems];
    const item = updated[idx];
    const validGrams = Math.max(1, newGrams);
    item.quantityGrams = validGrams;
    if (item.isMatched && item.matchedFood) {
      item.nutrients = engine.calculateMealNutrients(item.matchedFood, validGrams);
    }
    setParsedItems(updated);
  };

  const removeParsedItem = (idx) => {
    const updated = parsedItems.filter((_, i) => i !== idx);
    setParsedItems(updated.length > 0 ? updated : null);
  };

  const handleConfirmSave = async () => {
    if (!mealType) {
      setError("Seleziona il tipo di pasto.");
      return;
    }

    const allMatched = parsedItems.every(i => i.isMatched);
    if (!allMatched) {
      setError("Correggi gli alimenti non trovati prima di salvare.");
      return;
    }

    setSaving(true);
    setError('');

    try {
      const inserts = parsedItems.map(item => ({
        user_id: user.id,
        food_id: item.matchedFood.id,
        food_name: item.matchedFood.name,
        meal_type: mealType,
        quantity_grams: item.quantityGrams,
        entry_date: new Date().toISOString().split('T')[0]
      }));

      // Offline support: save to IndexedDB queue instead of directly hitting supabase
      if (!isOnline()) {
        await Promise.all(inserts.map(ins => enqueueAction('insert', 'meal_entries', ins)));
        setSaved(true);
        return;
      }

      const { error: insertErr } = await supabase.from('meal_entries').insert(inserts);
      
      if (insertErr) {
        console.error('[MEAL_SAVE_ERROR]', {
          message: insertErr.message,
          details: insertErr.details,
          hint: insertErr.hint,
          code: insertErr.code,
          payload: inserts
        });
        throw insertErr;
      }

      setSaved(true);
    } catch (err) {
      console.error("Errore salvataggio multiplo:", err);
      setError("Impossibile salvare il pasto.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setParsedItems(null);
    setTextInput('');
    setSaved(false);
    setError('');
    setCorrectingIndex(null);
    setScannedBarcode(null);
    setScannedFoodResult(null);
  };

  const handleBarcodeScanned = async (barcode) => {
    setScannedBarcode(barcode);
    setError('');
    setScannedFoodResult({ loading: true, type: null, data: null });

    try {
      const results = await searchFoods(barcode, 1);
      if (results && results.length > 0) {
        setScannedFoodResult({ loading: false, type: 'local', data: results[0] });
      } else {
        setScannedFoodResult({ loading: false, type: 'not_found', data: null });
      }
    } catch (err) {
      setError("Errore durante la ricerca del barcode.");
      setScannedFoodResult(null);
    }
  };

  const handleSearchOFF = async () => {
    if (!scannedBarcode) return;
    setOffSearching(true);
    setError('');
    try {
      const offResult = await searchOpenFoodFactsByBarcode(scannedBarcode);
      if (offResult) {
        setScannedFoodResult({ loading: false, type: 'off', data: offResult });
      } else {
        setScannedFoodResult({ loading: false, type: 'off_not_found', data: null });
      }
    } catch (err) {
      setError("Errore durante la ricerca su Open Food Facts.");
    } finally {
      setOffSearching(false);
    }
  };

  const handleAddScannedFood = (food) => {
    const newItem = {
      food: food.name,
      quantityGrams: 100, // default
      confidence: 1, // manual add
      matchedFood: food,
      isMatched: true,
      nutrients: engine.calculateMealNutrients(food, 100)
    };
    setParsedItems(prev => prev ? [...prev, newItem] : [newItem]);
    
    // Reset scanner
    setScannedBarcode(null);
    setScannedFoodResult(null);
  };

  const cancelScan = () => {
    setScannedBarcode(null);
    setScannedFoodResult(null);
  };

  // Renderer per il feedback di Confidence
  const renderConfidenceBadge = (confidence) => {
    if (confidence === undefined || confidence === null) return null;
    
    if (confidence < 0.60) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold mt-2">
          <AlertTriangle className="w-3 h-3" />
          Verifica manualmente questo alimento
        </div>
      );
    } else if (confidence < 0.80) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-semibold mt-2">
          <AlertTriangle className="w-3 h-3" />
          Verifica consigliata ({(confidence*100).toFixed(0)}%)
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-lime-500/10 text-lime-400/70 rounded text-xs mt-2">
        <Check className="w-3 h-3" />
        AI Confidence: {(confidence*100).toFixed(0)}%
      </div>
    );
  };

  if (saved) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-surface-light to-surface border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 to-cyan-400 opacity-50"></div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-lime-500/20 border border-lime-500/30 mb-6 animate-bounce">
            <Check className="w-10 h-10 text-lime-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 flex justify-center items-center gap-2">
            Pasto Salvato! <Sparkles className="w-6 h-6 text-cyan-400" />
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left">
            <p className="text-white/60 text-sm font-semibold mb-3 uppercase tracking-wider">Riepilogo Inserimento:</p>
            <ul className="space-y-2">
              {parsedItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-lime-400" />
                  <span className="font-semibold text-lime-400">{item.quantityGrams}g</span> di {item.matchedFood.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Nuovo pasto
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-4 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-lime-500/20"
            >
              Vai alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Aggiungi Pasto</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2 animate-slide-down">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Se abbiamo la preview analizzata da confermare/modificare */}
      {parsedItems ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden animate-scale-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50"></div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Check className="w-6 h-6 text-cyan-400" />
            Alimenti rilevati
          </h2>

          <div className="space-y-4 mb-8">
            {parsedItems.map((item, idx) => {
              const needsWarning = item.confidence !== undefined && item.confidence < 0.60;
              return (
                <div key={idx} className={`p-4 rounded-2xl border transition-all ${!item.isMatched || needsWarning ? 'bg-red-500/5 border-red-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'} flex flex-col gap-4`}>
                  
                  {/* Top row: Name, Warning, and Actions */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.isMatched && !needsWarning ? <Check className="w-4 h-4 text-lime-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                        <span className="font-bold text-white text-lg">
                          {item.isMatched ? item.matchedFood.name : `"${item.food}"`}
                        </span>
                      </div>
                      {renderConfidenceBadge(item.confidence)}
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCorrectingIndex(idx)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors border border-white/10"
                        title="Cambia Alimento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeParsedItem(idx)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Edit grammi e Kcal */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-sm">Quantità:</span>
                      <div className="flex items-center bg-black/40 rounded-lg border border-white/10 px-2 py-1">
                        <input 
                          type="number"
                          value={item.quantityGrams}
                          onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 0)}
                          className="w-16 bg-transparent text-white font-bold text-center focus:outline-none"
                          min="1"
                        />
                        <span className="text-white/40 text-sm ml-1">g</span>
                      </div>
                    </div>

                    {!item.isMatched ? (
                      <button 
                        onClick={() => setCorrectingIndex(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold"
                      >
                        <Search className="w-3 h-3" /> Cerca alimento
                      </button>
                    ) : (
                      <p className="text-cyan-400 font-bold">{Math.round(item.nutrients?.calories || 0)} kcal</p>
                    )}
                  </div>
                  
                  {/* Modale Inline di Correzione solo per questo item */}
                  {correctingIndex === idx && (
                    <div className="mt-4 p-4 bg-black/40 border border-white/10 rounded-2xl animate-scale-in">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-medium text-sm">Cambia: "{item.isMatched ? item.matchedFood.name : item.food}"</h3>
                        <button onClick={() => setCorrectingIndex(null)} className="text-white/40 hover:text-white text-xs">Annulla</button>
                      </div>
                      <FoodSearch onSelect={handleManualCorrection} />
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={saving || !parsedItems.every(i => i.isMatched)}
              className="flex-[2] py-4 bg-lime-500 hover:bg-lime-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold rounded-xl transition-all shadow-lg shadow-lime-500/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Salvataggio..." : "Conferma Pasto"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Step 1: Meal Type */}
          <div className="animate-fade-in">
            <h3 className="text-white/60 text-sm font-medium mb-3 ml-1">
              1. Quando lo hai mangiato?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MEAL_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = mealType === type.key;
                return (
                  <button
                    key={type.key}
                    onClick={() => setMealType(type.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-lime-500/15 border-lime-500/50 shadow-lg shadow-lime-500/10'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-lime-400' : 'text-white/50'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-lime-400' : 'text-white/70'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Input Intelligente */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3 ml-1">
              <h3 className="text-white/60 text-sm font-medium">
                2. Cosa hai mangiato?
              </h3>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 overflow-x-auto">
                <button
                  onClick={() => setInputMode('voice')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${inputMode === 'voice' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                >
                  <Mic className="w-3 h-3" /> Voce
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${inputMode === 'text' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                >
                  <Type className="w-3 h-3" /> Testo
                </button>
                <button
                  onClick={() => setInputMode('photo')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${inputMode === 'photo' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                >
                  <Camera className="w-3 h-3" /> Foto
                </button>
                <button
                  onClick={() => setInputMode('barcode')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${inputMode === 'barcode' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                >
                  <ScanBarcode className="w-3 h-3" /> Barcode
                </button>
              </div>
            </div>

            {inputMode === 'barcode' && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                {!scannedFoodResult ? (
                  <BarcodeScanner onScan={handleBarcodeScanned} isScanning={inputMode === 'barcode'} />
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <ScanBarcode className="w-5 h-5 text-cyan-400" />
                        Risultato Scansione
                      </h3>
                      <button onClick={cancelScan} className="text-white/50 hover:text-white text-sm">
                        Scansiona altro
                      </button>
                    </div>

                    {scannedFoodResult.loading && (
                      <div className="flex flex-col items-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
                        <p className="text-white/60">Ricerca nel database...</p>
                      </div>
                    )}

                    {!scannedFoodResult.loading && scannedFoodResult.type === 'local' && (
                      <div className="bg-lime-500/10 border border-lime-500/30 p-5 rounded-2xl flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-semibold text-lime-400 mb-1">Trovato nel database interno!</p>
                          <p className="text-xl font-bold text-white">{scannedFoodResult.data.name}</p>
                          <p className="text-sm text-white/50 mt-1">{scannedFoodResult.data.brand} • {scannedFoodResult.data.calories} kcal/100g</p>
                        </div>
                        <button
                          onClick={() => handleAddScannedFood(scannedFoodResult.data)}
                          className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-lime-500/20"
                        >
                          Aggiungi al pasto
                        </button>
                      </div>
                    )}

                    {!scannedFoodResult.loading && scannedFoodResult.type === 'off' && (
                      <div className="bg-cyan-500/10 border border-cyan-500/30 p-5 rounded-2xl flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                            <Database className="w-4 h-4" /> Importato da Open Food Facts
                          </p>
                          <p className="text-xl font-bold text-white">{scannedFoodResult.data.name}</p>
                          <p className="text-sm text-white/50 mt-1">{scannedFoodResult.data.brand} • {scannedFoodResult.data.calories} kcal/100g</p>
                        </div>
                        <button
                          onClick={() => handleAddScannedFood(scannedFoodResult.data)}
                          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                        >
                          Salva e Aggiungi al pasto
                        </button>
                      </div>
                    )}

                    {!scannedFoodResult.loading && scannedFoodResult.type === 'not_found' && (
                      <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex flex-col gap-4 text-center">
                        <div>
                          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-lg font-bold text-white">Prodotto non trovato</p>
                          <p className="text-sm text-white/60">Il codice {scannedBarcode} non è nel nostro database.</p>
                        </div>
                        <button
                          onClick={handleSearchOFF}
                          disabled={offSearching}
                          className="w-full py-3 flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
                        >
                          {offSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                          Cerca su Open Food Facts
                        </button>
                      </div>
                    )}

                    {!scannedFoodResult.loading && scannedFoodResult.type === 'off_not_found' && (
                      <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex flex-col gap-4 text-center">
                        <div>
                          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-lg font-bold text-white">Sconosciuto</p>
                          <p className="text-sm text-white/60">Il prodotto {scannedBarcode} non esiste nemmeno su Open Food Facts. Prova a inserirlo manualmente nel tab Testo.</p>
                        </div>
                        <button
                          onClick={() => setInputMode('text')}
                          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
                        >
                          Vai a Inserimento Manuale
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {inputMode === 'voice' && (
              <VoiceMealInput onTranscription={handleVoiceTranscription} />
            )}

            {inputMode === 'text' && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                
                {/* 1. Modalità: Ricerca e Aggiunta Diretta */}
                <div>
                   <h4 className="text-white font-medium mb-3">Cerca e aggiungi singolo alimento:</h4>
                   <FoodSearch 
                      onSelect={(food) => {
                        const newItem = {
                          food: food.name,
                          quantityGrams: 100,
                          confidence: 1,
                          matchedFood: food,
                          isMatched: true,
                          nutrients: engine.calculateMealNutrients(food, 100)
                        };
                        setParsedItems(prev => prev ? [...prev, newItem] : [newItem]);
                      }} 
                      placeholder="Es. banana, pollo, rice..." 
                   />
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-white/40 text-sm font-medium">OPPURE</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                {/* 2. Modalità: Frase complessa */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Analizza frase complessa:
                  </h4>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Es: 2 uova e una banana&#10;Oppure: 150g salmone e 30g mandorle"
                    rows={3}
                    className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-lg"
                  />
                  <button
                    onClick={() => handleAnalyzeText()}
                    disabled={analyzing || !textInput.trim()}
                    className="w-full mt-4 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {analyzing ? "Analisi in corso..." : "Analizza Pasto"}
                  </button>
                </div>
              </div>
            )}

            {inputMode === 'photo' && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
                    <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                    <p className="text-white font-medium text-lg">Analisi AI in corso...</p>
                    <p className="text-white/50 text-sm">Identificazione alimenti e grammature stimate</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-white font-bold text-lg">Fotografa il tuo piatto</h3>
                      <p className="text-white/50 text-sm mt-1">L'Intelligenza Artificiale riconoscerà cibo e quantità</p>
                    </div>
                    <PhotoUpload 
                      onPhotoSelected={handlePhotoAnalysis} 
                    />
                  </>
                )}
              </div>
            )}
            
          </div>
        </>
      )}
    </div>
  );
}
