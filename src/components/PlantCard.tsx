import React from 'react';
import { Leaf, Calendar, Trash2, ArrowRight } from 'lucide-react';
import { Plant, PLANT_STATUSES } from '../types';

interface PlantCardProps {
  key?: React.Key;
  plant: Plant;
  currentUserUid?: string | null;
  isWriterAuthorized?: boolean;
  onSelect: (plantId: string) => void;
  onDelete: (plantId: string) => void | Promise<void>;
}

export default function PlantCard({ plant, currentUserUid, isWriterAuthorized, onSelect, onDelete }: PlantCardProps) {
  const isOwner = !!isWriterAuthorized;

  // Calculate days elapsed from start date
  const calculateDays = (dateStr: string) => {
    const start = new Date(dateStr);
    const today = new Date();
    // Reset hours for exact days calculation
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Inizia nel futuro 🚀';
    if (diffDays === 0) return 'Giorno 0 (Oggi!) 🌱';
    if (diffDays === 1) return 'Da 1 giorno';
    return `Da ${diffDays} giorni`;
  };

  const formattedDate = new Date(plant.startDate).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="group bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/5 transition duration-300 flex flex-col h-full relative" id={`plant-card-${plant.id}`}>
      
      {/* Cover Image */}
      <div className="relative aspect-video sm:aspect-[4/3] overflow-hidden bg-slate-950 flex-shrink-0">
        <img
          src={plant.imageUrl}
          referrerPolicy="no-referrer"
          alt={plant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
        
        {/* Growth Age Badge */}
        <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 text-[10px] sm:text-xs font-black tracking-tight px-2.5 py-1 rounded-full shadow-lg font-mono">
          {calculateDays(plant.startDate)}
        </span>

        {/* Delete button (Owner only) */}
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Sei sicuro di voler eliminare "${plant.name}" e tutto il suo diario dell'evoluzione?`)) {
                onDelete(plant.id);
              }
            }}
            className="absolute top-3 right-3 p-2 bg-slate-950/60 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 rounded-lg text-slate-300 transition backdrop-blur-sm"
            title="Elimina pianta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Details Block */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Line */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight group-hover:text-emerald-400 transition truncate">
              {plant.name}
              {plant.nickname && (
                <span className="text-emerald-400 font-sans italic font-medium ml-1.5">
                  "{plant.nickname}"
                </span>
              )}
            </h4>
          </div>

          {/* Description Snippet */}
          <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed font-normal min-h-[50px]">
            {plant.description || "Nessuna descrizione specificata ancora. Aggiungi i dettagli iniziali!"}
          </p>
        </div>

        {/* Info row */}
        <div className="border-t border-white/[0.06] pt-4 mt-auto">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-4 font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inizio: {formattedDate}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Autore</span>
              <span className="text-white font-medium truncate max-w-[100px] block">
                {isOwner ? 'Tu 🙋‍♂️' : plant.ownerName}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelect(plant.id)}
            className="w-full flex items-center justify-center gap-1 bg-white/[0.04] hover:bg-emerald-500 hover:text-slate-950 border border-white/[0.08] hover:border-transparent text-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition duration-200"
          >
            <span>Apri Diario Evolutivo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
