import { Moon, HeartPulse, Droplets, Activity, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LifestyleSummaryCard({ lifestyleContext }) {
  const navigate = useNavigate();
  
  if (!lifestyleContext) return null;

  const { sleep, stress, hydration, activities, digestion } = lifestyleContext;
  
  const hasData = sleep || stress || hydration || (activities && activities.length > 0) || digestion;
  
  if (!hasData) {
    return (
      <div 
        onClick={() => navigate('/lifestyle')}
        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors"
      >
        <span className="text-white/60 text-sm">Non hai ancora registrato il lifestyle di oggi.</span>
        <button className="text-lime-400 text-sm font-medium">Compila Diario</button>
      </div>
    );
  }

  const actCount = activities?.length || 0;

  return (
    <div 
      onClick={() => navigate('/lifestyle')}
      className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-2xl p-4 cursor-pointer hover:border-white/20 transition-all flex flex-wrap gap-4 items-center justify-around"
    >
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-indigo-400" />
        <span className="text-white/80 text-sm">{sleep?.duration_hours ? `${sleep.duration_hours}h` : '-'}</span>
      </div>
      <div className="flex items-center gap-2">
        <HeartPulse className="w-4 h-4 text-red-400" />
        <span className="text-white/80 text-sm">{stress?.stress_level ? `${stress.stress_level}/10` : '-'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-cyan-400" />
        <span className="text-white/80 text-sm">{hydration?.water_ml ? `${hydration.water_ml}ml` : '-'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Stethoscope className="w-4 h-4 text-amber-400" />
        <span className="text-white/80 text-sm">{digestion?.quality_score ? `${digestion.quality_score}/5` : '-'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-lime-400" />
        <span className="text-white/80 text-sm">{actCount > 0 ? `${actCount} att.` : '-'}</span>
      </div>
    </div>
  );
}
