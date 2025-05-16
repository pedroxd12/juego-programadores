import React from 'react';

type TeamScoreProps = {
  team: {
    name: string;
    score: number;
    strikes: number;
  };
  isCurrent: boolean;
  isTeam1: boolean; // Para diferenciar colores o estilos si es necesario
  maxStrikes: number;
};

export const TeamScore: React.FC<TeamScoreProps> = ({ team, isCurrent, isTeam1, maxStrikes }) => {
  const bgColor = isTeam1 ? 'bg-blue-800' : 'bg-red-800';
  const ringColor = isTeam1 ? 'ring-blue-400' : 'ring-red-400';
  
  // Parpadeo si está a 1 strike de alcanzar el máximo
  const shouldBlinkStrikes = team.strikes === maxStrikes - 1;

  return (
    <div className={`rounded-xl p-6 shadow-lg transition-all duration-300
                    ${isCurrent ? `ring-4 ${ringColor} scale-105` : 'opacity-80'} 
                    ${bgColor} animate-fade-in`}>
      <h2 className="text-2xl md:text-3xl font-bold mb-3 truncate text-gray-100" title={team.name}>{team.name}</h2>
      <p className="text-4xl md:text-5xl font-bold mb-5 text-yellow-300 score-update" key={team.score}>{team.score} pts</p>
      
      <div className="flex space-x-2 justify-center md:justify-start">
        {[...Array(maxStrikes)].map((_, idx) => (
          <div 
            key={idx} 
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300
                        ${idx < team.strikes ? 'bg-red-500 text-white strike-x' : 'bg-gray-600 opacity-50'}
                        ${idx < team.strikes && shouldBlinkStrikes ? 'animate-strike-blink' : ''}`}
          >
            {idx < team.strikes ? 'X' : ''}
          </div>
        ))}
      </div>
    </div>
  );
};