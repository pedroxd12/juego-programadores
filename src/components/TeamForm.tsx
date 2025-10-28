'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function TeamForm() {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [turnTime, setTurnTime] = useState(30);
  const [stealTime, setStealTime] = useState(15);
  const router = useRouter();

  // Cargar configuración guardada
  useEffect(() => {
    const savedTime = localStorage.getItem('turnTimeSeconds');
    const savedStealTime = localStorage.getItem('stealTimeSeconds');
    if (savedTime) {
      setTurnTime(parseInt(savedTime));
    }
    if (savedStealTime) {
      setStealTime(parseInt(savedStealTime));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1.trim() || !team2.trim()) {
      alert("Por favor, ingresa un nombre para ambos equipos.");
      return;
    }
    if (turnTime < 10 || turnTime > 300) {
      alert("El tiempo debe estar entre 10 y 300 segundos.");
      return;
    }
    if (stealTime < 5 || stealTime > 120) {
      alert("El tiempo de robo debe estar entre 5 y 120 segundos.");
      return;
    }
    
    localStorage.setItem('team1Name', team1);
    localStorage.setItem('team2Name', team2);
    localStorage.setItem('turnTimeSeconds', turnTime.toString());
    localStorage.setItem('stealTimeSeconds', stealTime.toString());
    router.push('/game/loading');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 bg-opacity-70 p-8 rounded-xl max-w-2xl mx-auto shadow-2xl animate-slide-in-bottom" style={{ animationDelay: '0.3s' }}>
      <h2 className="text-3xl font-bold mb-8 text-yellow-300 text-center">Registra los Equipos</h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="team1" className="block text-lg mb-2 text-gray-200">Nombre del Equipo 1:</label>
          <input
            id="team1"
            type="text"
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
            className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:border-yellow-400 focus:outline-none text-white placeholder-gray-400"
            placeholder="Ej: Los Compiladores"
            required
          />
        </div>
        
        <div>
          <label htmlFor="team2" className="block text-lg mb-2 text-gray-200">Nombre del Equipo 2:</label>
          <input
            id="team2"
            type="text"
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
            className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:border-yellow-400 focus:outline-none text-white placeholder-gray-400"
            placeholder="Ej: Los Intérpretes"
            required
          />
        </div>

        <div>
          <label htmlFor="turnTime" className="block text-lg mb-2 text-gray-200">
            Tiempo por turno: <span className="text-yellow-400">{turnTime} segundos</span>
          </label>
          <input
            id="turnTime"
            type="range"
            min="10"
            max="120"
            step="5"
            value={turnTime}
            onChange={(e) => setTurnTime(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10s</span>
            <span>60s</span>
            <span>120s</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            ⏱️ Si el tiempo se agota, se pierden todas las oportunidades
          </p>
        </div>

        <div>
          <label htmlFor="stealTime" className="block text-lg mb-2 text-gray-200">
            Tiempo para robo: <span className="text-red-400">{stealTime} segundos</span>
          </label>
          <input
            id="stealTime"
            type="range"
            min="5"
            max="60"
            step="5"
            value={stealTime}
            onChange={(e) => setStealTime(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            🎯 Tiempo para intentar robar los puntos acumulados
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          Confirmar Equipos e Iniciar
        </button>
      </div>
    </form>
  );
}