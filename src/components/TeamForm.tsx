'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TeamForm() {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1.trim() || !team2.trim()) {
      alert("Por favor, ingresa un nombre para ambos equipos.");
      return;
    }
    localStorage.setItem('team1Name', team1); // Usar nombres de key más descriptivos
    localStorage.setItem('team2Name', team2);
    router.push('/game/loading'); // Redirigir a la pantalla de carga del juego
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