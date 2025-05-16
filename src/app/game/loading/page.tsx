'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const messages = [
  "Compilando preguntas...",
  "Optimizando respuestas...",
  "Calibrando niveles de dificultad...",
  "Despertando a los programadores legendarios...",
  "Preparando la arena de código...",
  "¡Casi listo para el desafío!",
];

// Idealmente, este valor vendría de una constante compartida (ej. exportada de settings/page.tsx)
const MIN_QUESTIONS_REQUIRED = 3; 

export default function LoadingGamePage() {
  const router = useRouter();
  const [loadingMessage, setLoadingMessage] = useState(messages[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const team1Name = localStorage.getItem('team1Name');
    const team2Name = localStorage.getItem('team2Name');
    const gameQuestions = localStorage.getItem('gameQuestions');

    if (!team1Name || !team2Name ) {
      alert("No se encontraron los nombres de los equipos. Por favor, configúralos primero.");
      router.push('/');
      return;
    }
    if (!gameQuestions || JSON.parse(gameQuestions).length < MIN_QUESTIONS_REQUIRED) {
        alert(`No hay suficientes preguntas configuradas (se necesitan al menos ${MIN_QUESTIONS_REQUIRED}). Por favor, ve a configuración.`);
        router.push('/game/settings');
        return;
    }


    let currentMessageIndex = 0;
    const messageInterval = setInterval(() => {
      currentMessageIndex = (currentMessageIndex + 1) % messages.length;
      setLoadingMessage(messages[currentMessageIndex]);
    }, 1500); // Cambia el mensaje cada 1.5 segundos

    const progressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
                clearInterval(progressInterval);
                clearInterval(messageInterval);
                router.push('/game/play');
                return 100;
            }
            return prev + 5; // Incrementa más rápido para simulación
        });
    }, 250); // Actualiza la barra cada 250ms

    // Duración total simulada de la carga ~5 segundos
    const totalLoadTime = 5000; 
    const redirectTimer = setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      router.push('/game/play');
    }, totalLoadTime);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 flex flex-col items-center justify-center p-4 font-mono">
      <div className="terminal-loader mb-8">
        <div className="terminal-header">
          <div className="terminal-title">cargando_juego.sh</div>
          <div className="terminal-controls">
            <div className="control close"></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
        </div>
        <div className="terminal-content">
          <div className="mb-4">
            <div className="flex items-center">
              <span className="text-blue-400 mr-2">$</span>
              <div className="typing-animation">
                Inicializando "100 Programadores Dijeron"...
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
            <div 
              className="bg-green-500 h-2.5 rounded-full transition-all duration-300 ease-linear" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="space-y-2 text-sm mb-6">
            <div className="flex">
              <span className="text-purple-400 mr-2">[SISTEMA]</span>
              <span className="animate-pulse">{loadingMessage}</span>
            </div>
             <div className="flex">
              <span className="text-purple-400 mr-2">[INFO]</span>
              <span>Equipo 1: {typeof window !== 'undefined' ? localStorage.getItem('team1Name') || 'No definido' : 'Cargando...'}</span>
            </div>
            <div className="flex">
              <span className="text-purple-400 mr-2">[INFO]</span>
              <span>Equipo 2: {typeof window !== 'undefined' ? localStorage.getItem('team2Name') || 'No definido' : 'Cargando...'}</span>
            </div>
          </div>

          <div className="mt-6 text-center text-yellow-300 text-xs">
            <p>Mientras esperas, recuerda: un bug al día mantiene al debugger en la bahía... ¡O algo así!</p>
            <p className="cursor-blink mt-2"></p>
          </div>
        </div>
      </div>
    </div>
  );
}