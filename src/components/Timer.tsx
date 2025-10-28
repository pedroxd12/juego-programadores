import React, { useEffect, useState, useRef } from 'react';

interface TimerProps {
  duration: number; // Duración en segundos
  onTimeUp: () => void; // Callback cuando se acaba el tiempo
  isActive: boolean; // Si el timer está activo
  onReset?: () => void; // Callback opcional cuando se resetea
  isStealAttempt?: boolean; // Si es un intento de robo
}

export const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isActive, onReset, isStealAttempt = false }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(isActive);
  const hasCalledTimeUp = useRef(false);

  // Resetear el timer cuando cambia la duración o se reactiva
  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(isActive);
    hasCalledTimeUp.current = false; // Resetear la bandera
    if (onReset && isActive) {
      onReset();
    }
  }, [duration, isActive, onReset]);

  // Countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      // Si el tiempo llegó a 0 y no hemos llamado onTimeUp, llamarlo
      if (timeLeft === 0 && !hasCalledTimeUp.current) {
        hasCalledTimeUp.current = true;
        // Usar setTimeout para evitar setState durante render
        setTimeout(() => {
          onTimeUp();
        }, 0);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp]);

  // Calcular el porcentaje para la barra de progreso
  const percentage = (timeLeft / duration) * 100;
  
  // Determinar color según el tiempo restante
  const getColor = () => {
    if (isStealAttempt) {
      // Colores más intensos para el robo
      if (percentage > 50) return 'bg-orange-500';
      if (percentage > 25) return 'bg-red-500';
      return 'bg-red-700';
    }
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (isStealAttempt) {
      if (percentage > 50) return 'text-orange-400';
      if (percentage > 25) return 'text-red-400';
      return 'text-red-600';
    }
    if (percentage > 50) return 'text-green-400';
    if (percentage > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm ${isStealAttempt ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>
          {isStealAttempt ? '🎯 Tiempo para robar:' : '⏱️ Tiempo restante:'}
        </span>
        <span className={`text-2xl font-bold font-mono ${getTextColor()} ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>
          {timeLeft}s
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {timeLeft <= 5 && timeLeft > 0 && (
        <p className={`text-center text-sm mt-2 animate-bounce ${isStealAttempt ? 'text-orange-400' : 'text-red-400'}`}>
          {isStealAttempt ? '¡Última oportunidad!' : '¡Apúrate!'}
        </p>
      )}
    </div>
  );
};
