import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  Users,
  Database,
  Calendar,
  AlertCircle,
  Camera,
  Heart,
  HelpCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Header, { UserState } from './components/Header';
import PlantCard from './components/PlantCard';
import PlantDetail from './components/PlantDetail';
import AddPlantModal from './components/AddPlantModal';

import AuthModal from './components/AuthModal';
import { subscribeToPlants, createPlant, deletePlant, getSinglePlant } from './db';
import { Plant } from './types';
import { isFirebaseMock } from './firebase';
import { MOCK_STARTER_PLANTS, MOCK_STARTER_LOGS } from './presets';

export default function App() {
  const [user, setUser] = useState<UserState | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Parse direct shared links on boot (e.g. ?plantId=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('plantId');
    if (sharedId) {
      setSelectedPlantId(sharedId);
    }
  }, []);

  // Pre-populate localStorage with lovely mock data on first boot if offline
  useEffect(() => {
    if (isFirebaseMock) {
      const existingPlants = localStorage.getItem('plant_tracker_plants');
      if (!existingPlants) {
        localStorage.setItem('plant_tracker_plants', JSON.stringify(MOCK_STARTER_PLANTS));
        Object.entries(MOCK_STARTER_LOGS).forEach(([plantId, logs]) => {
          localStorage.setItem(`plant_tracker_logs_${plantId}`, JSON.stringify(logs));
        });
      }
    }
  }, []);

  // Subscribe to real-time sync of plants
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPlants((fetchedPlants) => {
      setPlants(fetchedPlants);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync selected plant details
  useEffect(() => {
    if (!selectedPlantId) {
      setSelectedPlant(null);
      return;
    }

    const unsubscribe = getSinglePlant(selectedPlantId, (matchedPlant) => {
      setSelectedPlant(matchedPlant);
    });

    return unsubscribe;
  }, [selectedPlantId]);

  const handleGoogleLogin = async () => {
    try {
      const { auth, GoogleAuthProvider, signInWithPopup, isFirebaseMock } = await import('./firebase');
      if (isFirebaseMock) {
        setUser({
          uid: 'demo_owner',
          displayName: 'Giardiniere',
          email: 'loliodioliva231@gmail.com',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
        });
        return;
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Auth sign-in error:", err);
    }
  };

  const isAuthorizedWriter = !!user;

  const handleSavePlant = async (newPlantMeta: Omit<Plant, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>) => {
    if (!user) throw new Error("Devi effettuare l'accesso per poter salvare.");
    
    try {
      const newId = await createPlant({
        ...newPlantMeta,
        ownerId: user.uid,
        ownerName: user.displayName || 'Giardiniere'
      });
      console.log("Newly created plant ID:", newId);
    } catch (err) {
      console.error("Failed to save plant:", err);
      throw err;
    }
  };

  const handleDeletePlant = async (plantId: string) => {
    try {
      await deletePlant(plantId);
      if (selectedPlantId === plantId) {
        handleBackToGallery();
      }
    } catch (err) {
      console.error("Failed to delete plant:", err);
    }
  };

  const handleBackToGallery = () => {
    // Clean query parameters to avoid locking shared view on browser navigate back
    window.history.replaceState({}, '', window.location.pathname);
    setSelectedPlantId(null);
    setSelectedPlant(null);
  };

  // Filter & Search Logic
  const filteredPlants = plants.filter((plant) => {
    const query = searchQuery.toLowerCase();
    return (
      plant.name.toLowerCase().includes(query) ||
      (plant.nickname && plant.nickname.toLowerCase().includes(query)) ||
      (plant.ownerName && plant.ownerName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-900 flex flex-col justify-between">
      
      {/* Dynamic Header navbar */}
      <Header
        user={user}
        setUser={setUser}
      />

      <main className="flex-grow pb-16">
        
        {/* VIEW 1: SELECTED PLANT TIMELINE DETAIL VIEW */}
        {selectedPlantId ? (
          selectedPlant ? (
            <PlantDetail
              plant={selectedPlant}
              currentUserUid={user?.uid}
              isWriterAuthorized={isAuthorizedWriter}
              onBack={handleBackToGallery}
            />
          ) : (
            <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Diario Botanico Non Trovato</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Il link di condivisione che hai utilizzato potrebbe essere obsoleto, oppure la pianta è stata rimossa dal proprietario.
                </p>
              </div>
              <button
                onClick={handleBackToGallery}
                className="bg-slate-900 border border-white/[0.08] hover:border-slate-500 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
              >
                Vai alla Galleria Principale
              </button>
            </div>
          )
        ) : (
          
          /* VIEW 2: ALL PLANTS DASHBOARD IN ITALIAN */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="plants-gallery-screen">
            
            {/* Hero Welcome banner */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-white/[0.06] rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-emerald-500/5 to-transparent pointer-events-none" />
              
              <div className="max-w-xl text-center lg:text-left space-y-3 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full font-mono">
                  🌱 Custodia & Progresso Botanico
                </span>
                <h2 className="text-2xl sm:text-3.5xl font-black text-white tracking-tight leading-none">
                  Mostra l'Evoluzione dei tuoi Germogli in Tempo Reale
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Crea un diario fotografico cronologico per le tue piante d'appartamento, piantine da seme o talee. Copia il link magico e condividilo con un'amica per rendere partecipe chiunque dei progressi e della cura botanica!
                </p>

                {/* If guest or unlogged in, advise how to login */}
                {!user && (
                  <div className="pt-2">
                    <p className="text-[11px] text-emerald-400 font-medium">
                      🔒 Accesso Riservato: Solo il proprietario abilitato può pubblicare moduli e caricare progressi. Tutti gli altri visitatori possono guardare in tempo reale!
                    </p>
                  </div>
                )}
              </div>

              {/* Graphic stats card */}
              <div className="bg-slate-950/80 border border-white/[0.08] rounded-2xl p-5 w-full lg:w-72 flex-shrink-0 flex flex-col gap-3.5 backdrop-blur-md relative z-10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Stato delle Colture</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                    <span className="text-2xl font-black font-mono text-emerald-400">{plants.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Piante Sotto Cura</span>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                    <span className="text-2xl font-black font-mono text-indigo-400">
                      {plants.filter(p => p.ownerId === user?.uid).length}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">I Tuoi Diari</span>
                  </div>
                </div>
                {user ? (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-slate-950 py-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10 border-t border-white/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Inizia Diario Pianta</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-slate-950 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/10 border-t border-white/20 cursor-pointer"
                  >
                    <span>Registrati / Accedi</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Search Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/[0.05]" id="gallery-controls-bar">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca piante per nome, soprannome o curatore..."
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4.5 w-full sm:w-auto justify-end text-xs">
                
                <span className="text-slate-700 hidden sm:inline">|</span>
                <span className="text-slate-400 font-mono">Visualizzati: {filteredPlants.length} su {plants.length}</span>
              </div>
            </div>

            {/* Main Plants Catalog Grid */}
            {loading ? (
              <div className="py-24 text-center space-y-2">
                <Sprout className="w-10 h-10 text-emerald-400 mx-auto animate-spin" />
                <p className="text-xs text-slate-400 animate-pulse">Sintonizzazione dei canali botanici in tempo reale...</p>
              </div>
            ) : filteredPlants.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-slate-900 border border-white/[0.06] rounded-3xl p-8" id="empty-plants-container">
                <Sprout className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="max-w-xs mx-auto space-y-1">
                  <h3 className="text-base font-bold text-white">Nessuna Pianta Trovata</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {searchQuery
                      ? "Nessuna pianta registrata corrisponde ai parametri di ricerca impostati."
                      : "Non sono ancora state registrate piante nel database principale di condivisione."}
                  </p>
                </div>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-emerald-400 underline hover:text-emerald-300"
                  >
                    Reimposta ricerca
                  </button>
                ) : user ? (
                  isAuthorizedWriter ? (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black px-4.5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/10 border-t border-white/20"
                    >
                      <span>Inaugura il Primo Diario 🌱</span>
                    </button>
                  ) : (
                    <p className="text-xs text-amber-400 font-normal">Connesso come Ospite • Registrazione e pubblicazione disabilitati.</p>
                  )
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Accedi con Google per Iniziare
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    currentUserUid={user?.uid}
                    isWriterAuthorized={isAuthorizedWriter}
                    onSelect={(id) => setSelectedPlantId(id)}
                    onDelete={handleDeletePlant}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-white/[0.05] bg-slate-950 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[11px] text-slate-500 font-mono space-y-1">
          <p>Botanica Evolution © {new Date().getFullYear()} • Sincronizzazione in tempo reale per custodi di piante.</p>
          <p>Disegnata con eleganza naturale utilizzando React 19 e Tailwind CSS.</p>
        </div>
      </footer>

      {/* Floating Add Button for Quick Access */}
      {user && isAuthorizedWriter && !selectedPlantId && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 p-4 sm:p-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition z-40 shadow-emerald-500/20 border-t border-white/30 cursor-pointer"
          title="Aggiungi una pianta"
          id="floating-add-plant-btn"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}

      {/* MODAL COVERS */}
      {showAddModal && (
        <AddPlantModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSavePlant}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(fetchedUser) => {
            setUser(fetchedUser);
          }}
        />
      )}

    </div>
  );
}
