import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function VoiceMealInput({ onTranscription }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Errore accesso microfono:", err);
      alert("Impossibile accedere al microfono. Verifica i permessi.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      // Supabase Edge Functions con FormData richiedono che il blob sia aggiunto così
      formData.append('file', audioBlob, 'audio.webm');

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });

      if (error) throw error;
      if (data && data.text) {
        onTranscription(data.text);
      }
    } catch (err) {
      console.error("Errore trascrizione:", err);
      alert("Errore durante la trascrizione dell'audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl w-full">
      <div className="mb-6 text-center">
        <h3 className="text-white font-bold text-xl">Usa la voce</h3>
        <p className="text-white/50 text-sm mt-1">Es: "Ho mangiato 150g di salmone e 2 uova"</p>
      </div>

      {isProcessing ? (
        <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        </div>
      ) : isRecording ? (
        <button
          onClick={stopRecording}
          className="w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center transition-all shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-pulse"
        >
          <Square className="w-10 h-10 text-white fill-white" />
        </button>
      ) : (
        <button
          onClick={startRecording}
          className="w-24 h-24 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-105"
        >
          <Mic className="w-10 h-10 text-black" />
        </button>
      )}
      
      <p className="text-white/50 text-sm mt-6 font-medium">
        {isProcessing ? "Elaborazione in corso..." : isRecording ? "Registrazione in corso... Tocca per fermare" : "Tocca il microfono per parlare"}
      </p>
    </div>
  );
}
