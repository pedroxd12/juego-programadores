'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { TeamScore } from '@/components/TeamScore';
import { Timer } from '@/components/Timer';
import { Question as QuestionType } from '@/app/game/settings/page';
import { isAnswerValid } from '@/utils/textUtils';

type Team = {
  name: string;
  score: number;
  strikes: number;
};

const GamePhase = {
  INITIAL_LOADING : 'INITIAL_LOADING',
  ROUND_LOADING : 'ROUND_LOADING',
  FACE_OFF : 'FACE_OFF', // Nueva fase: ambos equipos compiten por responder primero
  QUESTION : 'QUESTION',
  REVEAL : 'REVEAL',
  STEAL_ATTEMPT : 'STEAL_ATTEMPT',
  GAME_OVER : 'GAME_OVER',
}

type MessageType = 'steal-opportunity' | 'steal-outcome' | 'info' | 'face-off' | null;

const MAX_STRIKES = 3;
const QUESTIONS_PER_GAME_SESSION = 3; 
const ROUND_MESSAGE_DURATION = 3500; 
const ANSWER_REVEAL_DURATION = 4000; 

export default function GamePage() {
  const router = useRouter();

  const [team1, setTeam1] = useState<Team>({ name: 'Equipo 1', score: 0, strikes: 0 });
  const [team2, setTeam2] = useState<Team>({ name: 'Equipo 2', score: 0, strikes: 0 });
  const [questionsForCurrentSession, setQuestionsForCurrentSession] = useState<QuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [team1FaceOffAnswer, setTeam1FaceOffAnswer] = useState(''); // Respuesta separada para equipo 1 en Face-Off
  const [team2FaceOffAnswer, setTeam2FaceOffAnswer] = useState(''); // Respuesta separada para equipo 2 en Face-Off
  const [revealedAnswers, setRevealedAnswers] = useState<string[]>([]);
  const [pointsAccumulatedThisRound, setPointsAccumulatedThisRound] = useState(0);
  
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null);
  const [roundWinnerTeamId, setRoundWinnerTeamId] = useState<number | null>(null); 
  const [gamePhase, setGamePhase] = useState(GamePhase.INITIAL_LOADING);
  const [roundMessage, setRoundMessage] = useState<string | null>(null);
  const [messageTypeForCss, setMessageTypeForCss] = useState<MessageType>(null);
  
  // Estados para el temporizador
  const [turnTimeSeconds, setTurnTimeSeconds] = useState(30);
  const [stealTimeSeconds, setStealTimeSeconds] = useState(15);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // Para forzar reset del timer

  useEffect(() => {
    if (gamePhase === GamePhase.INITIAL_LOADING) {
      const team1Name = localStorage.getItem('team1Name') || 'Equipo Alpha';
      const team2Name = localStorage.getItem('team2Name') || 'Equipo Beta';
      const savedTurnTime = localStorage.getItem('turnTimeSeconds');
      const savedStealTime = localStorage.getItem('stealTimeSeconds');
      
      setTeam1(prev => ({ ...prev, name: team1Name, score: 0, strikes: 0 }));
      setTeam2(prev => ({ ...prev, name: team2Name, score: 0, strikes: 0 }));
      
      const turnTime = savedTurnTime ? parseInt(savedTurnTime) : 30;
      const stealTime = savedStealTime ? parseInt(savedStealTime) : 15;
      
      setTurnTimeSeconds(turnTime);
      setStealTimeSeconds(stealTime);

      const storedQuestionsRaw = localStorage.getItem('gameQuestions');
      if (!storedQuestionsRaw) {
        alert('No hay preguntas configuradas. Por favor, ve a la página de configuración.');
        router.push('/game/settings');
        return;
      }

      const parsedQuestions: QuestionType[] = JSON.parse(storedQuestionsRaw);
      const questionsToPlayCount = Math.min(parsedQuestions.length, QUESTIONS_PER_GAME_SESSION);

      if (parsedQuestions.length < 1) { 
        alert(`Se necesitan al menos 1 pregunta para jugar.`);
        router.push('/game/settings');
        return;
      }
      
      const shuffled = [...parsedQuestions].sort(() => 0.5 - Math.random());
      setQuestionsForCurrentSession(shuffled.slice(0, questionsToPlayCount));
      setCurrentQuestionIndex(0);
      setRoundWinnerTeamId(null); 
      setCurrentTeamId(null); 
      setGamePhase(GamePhase.ROUND_LOADING); // Ir directo a ROUND_LOADING
    }
  }, [gamePhase, router]);

  useEffect(() => {
    if (gamePhase === GamePhase.ROUND_LOADING && questionsForCurrentSession.length > 0) {
      if (currentQuestionIndex < questionsForCurrentSession.length) {
        const q = questionsForCurrentSession[currentQuestionIndex];
        setCurrentQuestion(q);
        setRevealedAnswers([]);
        setPointsAccumulatedThisRound(0);
        setTeam1(prev => ({ ...prev, strikes: 0 }));
        setTeam2(prev => ({ ...prev, strikes: 0 }));
        setUserAnswer('');
        setIsTimerActive(false); // Desactivar timer durante carga
        setCurrentTeamId(null); // Resetear equipo actual para el Face-Off

        setRoundMessage(`Ronda ${currentQuestionIndex + 1} - ¡FACE-OFF! El primero en responder correctamente gana el control.`);
        setMessageTypeForCss('face-off');
        setTimeout(() => {
          setRoundMessage(null);
          setMessageTypeForCss(null);
          setGamePhase(GamePhase.FACE_OFF); // Cambiar a Face-Off
          setIsTimerActive(false); // Sin timer en Face-Off
        }, ROUND_MESSAGE_DURATION);

      } else {
        setGamePhase(GamePhase.GAME_OVER);
      }
    }
  }, [gamePhase, currentQuestionIndex, questionsForCurrentSession]);


  const handleExitGame = () => {
    router.push('/');
  };

  const handleFaceOffSubmit = (e: React.FormEvent, teamId: number) => {
    e.preventDefault();
    
    // Obtener la respuesta del equipo correcto
    const teamAnswer = teamId === 1 ? team1FaceOffAnswer : team2FaceOffAnswer;
    
    if (!currentQuestion || !teamAnswer.trim() || gamePhase !== GamePhase.FACE_OFF) return;

    const submittedAnswerText = teamAnswer.trim();
    // Verificar si la respuesta es correcta usando validación flexible
    const correctAnswer = currentQuestion.answers.find(
      ans => isAnswerValid(submittedAnswerText, ans.text, 0.75)
    );

    if (correctAnswer) {
      // ¡Respuesta correcta! Este equipo gana el control
      const winningTeamName = teamId === 1 ? team1.name : team2.name;
      setCurrentTeamId(teamId);
      setRoundWinnerTeamId(teamId);
      
      // Revelar la respuesta del Face-Off
      setRevealedAnswers([correctAnswer.text.toLowerCase()]);
      setPointsAccumulatedThisRound(correctAnswer.points);
      
      setRoundMessage(`¡${winningTeamName} respondió correctamente en el Face-Off! Tienen el control de la ronda.`);
      setMessageTypeForCss('info');
      
      // Limpiar ambas respuestas de Face-Off
      setTeam1FaceOffAnswer('');
      setTeam2FaceOffAnswer('');
      setUserAnswer('');
      
      setTimeout(() => {
        setRoundMessage(null);
        setMessageTypeForCss(null);
        setGamePhase(GamePhase.QUESTION);
        setIsTimerActive(true);
        setTimerKey(prev => prev + 1);
      }, ROUND_MESSAGE_DURATION);
    } else {
      // Respuesta incorrecta, el otro equipo obtiene el control automáticamente
      const failingTeamName = teamId === 1 ? team1.name : team2.name;
      const winningTeamId = teamId === 1 ? 2 : 1;
      const winningTeamName = winningTeamId === 1 ? team1.name : team2.name;
      
      setCurrentTeamId(winningTeamId);
      setRoundWinnerTeamId(winningTeamId);
      
      setRoundMessage(`${failingTeamName} falló. ¡${winningTeamName} obtiene el control de la ronda!`);
      setMessageTypeForCss('info');
      
      // Limpiar ambas respuestas de Face-Off
      setTeam1FaceOffAnswer('');
      setTeam2FaceOffAnswer('');
      setUserAnswer('');
      
      setTimeout(() => {
        setRoundMessage(null);
        setMessageTypeForCss(null);
        setGamePhase(GamePhase.QUESTION);
        setIsTimerActive(true);
        setTimerKey(prev => prev + 1);
      }, ROUND_MESSAGE_DURATION);
    }
  };

  const handleTimeUp = () => {
    if (gamePhase !== GamePhase.QUESTION && gamePhase !== GamePhase.STEAL_ATTEMPT) return;
    
    setIsTimerActive(false);
    const currentProcessingTeam = currentTeamId === 1 ? team1 : team2;
    const currentTeamSetState = currentTeamId === 1 ? setTeam1 : setTeam2;
    
    if (gamePhase === GamePhase.QUESTION) {
      // Cuando se acaba el tiempo, se asigna 1 strike
      currentTeamSetState(prev => {
        const newStrikes = prev.strikes + 1;
        const otherTeamId = currentTeamId === 1 ? 2 : 1;
        const otherTeam = currentTeamId === 1 ? team2 : team1;
        
        if (newStrikes >= MAX_STRIKES) {
          // Si ahora tiene 3 strikes, dar oportunidad de robo
          setCurrentTeamId(otherTeamId);
          setGamePhase(GamePhase.STEAL_ATTEMPT);
          
          // Mostrar mensaje Y activar timer inmediatamente
          setRoundMessage(`¡Se acabó el tiempo! ${MAX_STRIKES} strikes para ${currentProcessingTeam.name}. Oportunidad de ROBO para ${otherTeam.name} por ${pointsAccumulatedThisRound} puntos.`);
          setMessageTypeForCss('steal-opportunity');
          
          // Activar timer INMEDIATAMENTE para el robo
          setIsTimerActive(true);
          setTimerKey(prev => prev + 1);
          
          // Solo ocultar el mensaje después, pero el timer ya está corriendo
          setTimeout(() => {
            setRoundMessage(null);
            setMessageTypeForCss(null);
          }, ROUND_MESSAGE_DURATION);
        } else {
          // Aún no tiene 3 strikes, reiniciar el timer para que continúe
          setIsTimerActive(true);
          setTimerKey(prev => prev + 1);
        }
        
        return { ...prev, strikes: newStrikes };
      });
    } else if (gamePhase === GamePhase.STEAL_ATTEMPT) {
      // Si se acaba el tiempo en el robo, el equipo original gana los puntos
      const stealingTeamId = currentTeamId;
      const originalTeamId = stealingTeamId === 1 ? 2 : 1;
      const originalTeamSetState = originalTeamId === 1 ? setTeam1 : setTeam2;
      const originalTeam = originalTeamId === 1 ? team1 : team2;
      const stealingTeam = stealingTeamId === 1 ? team1 : team2;

      originalTeamSetState(prev => ({ ...prev, score: prev.score + pointsAccumulatedThisRound }));
      setRoundMessage(`¡Se acabó el tiempo! ${stealingTeam.name} no pudo robar. ${originalTeam.name} se lleva ${pointsAccumulatedThisRound} puntos.`);
      setMessageTypeForCss('steal-outcome');
      setRoundWinnerTeamId(originalTeamId);
      setGamePhase(GamePhase.REVEAL);
      
      setTimeout(() => {
        setRoundMessage(null);
        setMessageTypeForCss(null);
        revealAllAnswersAndProceed();
      }, ROUND_MESSAGE_DURATION + 500);
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !userAnswer.trim() || gamePhase !== GamePhase.QUESTION || currentTeamId === null) return;

    // Desactivar timer al enviar respuesta
    setIsTimerActive(false);

    const submittedAnswerText = userAnswer.trim();
    // Usar validación flexible con similitud de texto
    const correctAnswer = currentQuestion.answers.find(
      ans => !revealedAnswers.includes(ans.text.toLowerCase()) && 
             isAnswerValid(submittedAnswerText, ans.text, 0.75) // 75% de similitud
    );

    const currentProcessingTeam = currentTeamId === 1 ? team1 : team2;
    const currentTeamSetState = currentTeamId === 1 ? setTeam1 : setTeam2;
    const otherTeam = currentTeamId === 1 ? team2 : team1;

    if (correctAnswer) {
      const newRevealedAnswers = [...revealedAnswers, correctAnswer.text.toLowerCase()];
      setRevealedAnswers(newRevealedAnswers);
      const newPointsThisRound = pointsAccumulatedThisRound + correctAnswer.points;
      setPointsAccumulatedThisRound(newPointsThisRound);
      
      const allAnswersNowRevealed = currentQuestion.answers.every(
        ans => newRevealedAnswers.includes(ans.text.toLowerCase())
      );

      if (allAnswersNowRevealed) {
        currentTeamSetState(prev => ({ ...prev, score: prev.score + newPointsThisRound }));
        setRoundWinnerTeamId(currentTeamId); 
        setRoundMessage(`¡${currentProcessingTeam.name} limpió el tablero y gana ${newPointsThisRound} puntos!`);
        setMessageTypeForCss('info');
        setGamePhase(GamePhase.REVEAL);
        setTimeout(() => {
          setRoundMessage(null);
          setMessageTypeForCss(null);
          revealAllAnswersAndProceed();
        }, ROUND_MESSAGE_DURATION);
      } else {
        // Reactivar timer si no se completó el tablero
        setIsTimerActive(true);
        setTimerKey(prev => prev + 1);
      }
    } else { 
      currentTeamSetState(prev => {
        const newStrikes = prev.strikes + 1;
        if (newStrikes >= MAX_STRIKES) {
          // Cambiar equipo y fase primero
          setCurrentTeamId(currentTeamId === 1 ? 2 : 1);
          setGamePhase(GamePhase.STEAL_ATTEMPT);
          
          // Mostrar mensaje Y activar timer inmediatamente
          setRoundMessage(`¡${otherTeam.name}, ${MAX_STRIKES} strikes para ${currentProcessingTeam.name}! Oportunidad de ROBO por ${pointsAccumulatedThisRound} puntos.`);
          setMessageTypeForCss('steal-opportunity');
          
          // Activar timer INMEDIATAMENTE para el robo
          setIsTimerActive(true);
          setTimerKey(prev => prev + 1);
          
          // Solo ocultar el mensaje después, pero el timer ya está corriendo
          setTimeout(() => {
            setRoundMessage(null);
            setMessageTypeForCss(null);
          }, ROUND_MESSAGE_DURATION);
        } else {
          // Aún no hay 3 strikes, el mismo equipo continúa
          // Reactivar timer inmediatamente para el mismo equipo
          setIsTimerActive(true);
          setTimerKey(prev => prev + 1);
        }
        return { ...prev, strikes: newStrikes };
      });
    }
    setUserAnswer('');
  };

  const handleStealAttemptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !userAnswer.trim() || gamePhase !== GamePhase.STEAL_ATTEMPT || currentTeamId === null) return;

    // Desactivar timer al enviar respuesta de robo
    setIsTimerActive(false);

    const stealingTeamId = currentTeamId;
    const originalTeamId = stealingTeamId === 1 ? 2 : 1; 

    const stealingTeamSetState = stealingTeamId === 1 ? setTeam1 : setTeam2;
    const originalTeamSetState = originalTeamId === 1 ? setTeam1 : setTeam2; 
    
    const stealingTeam = stealingTeamId === 1 ? team1 : team2;
    const originalTeam = originalTeamId === 1 ? team1 : team2;

    const submittedAnswerText = userAnswer.trim();
    // Usar validación flexible con similitud de texto
    const correctAnswerFoundForSteal = currentQuestion.answers.find(
      ans => !revealedAnswers.includes(ans.text.toLowerCase()) && 
             isAnswerValid(submittedAnswerText, ans.text, 0.75) // 75% de similitud
    );

    let message = "";

    if (correctAnswerFoundForSteal) {
      // ROBO EXITOSO: El equipo que roba gana TODOS los puntos acumulados + la respuesta correcta
      const pointsToAward = pointsAccumulatedThisRound + correctAnswerFoundForSteal.points;
      stealingTeamSetState(prev => ({ ...prev, score: prev.score + pointsToAward }));
      setRevealedAnswers(prev => [...prev, correctAnswerFoundForSteal.text.toLowerCase()]);
      message = `¡${stealingTeam.name} ROBÓ ${pointsToAward} PUNTOS!`;
      setRoundWinnerTeamId(stealingTeamId); 
    } else {
      // ROBO FALLIDO: El equipo original se queda con los puntos acumulados
      originalTeamSetState(prev => ({ ...prev, score: prev.score + pointsAccumulatedThisRound }));
      message = `¡${stealingTeam.name} falló el robo! ${originalTeam.name} se lleva los ${pointsAccumulatedThisRound} puntos acumulados.`;
      setRoundWinnerTeamId(originalTeamId); 
    }
    
    setRoundMessage(message);
    setMessageTypeForCss('steal-outcome');
    setUserAnswer('');
    setGamePhase(GamePhase.REVEAL); 
    setTimeout(() => {
      setRoundMessage(null);
      setMessageTypeForCss(null);
      revealAllAnswersAndProceed();
    }, ROUND_MESSAGE_DURATION + 500); 
  };
  
  const revealAllAnswersAndProceed = () => {
    if (!currentQuestion) return;
    const allAnswerTexts = currentQuestion.answers.map(a => a.text.toLowerCase());
    setRevealedAnswers(allAnswerTexts); 
    
    setTimeout(() => {
      nextRoundOrQuestion();
    }, ANSWER_REVEAL_DURATION); 
  };

  const nextRoundOrQuestion = () => {
    setRoundMessage(null);
    setMessageTypeForCss(null);
    
    if (roundWinnerTeamId) {
      setCurrentTeamId(roundWinnerTeamId); 
    } else {
      setCurrentTeamId(prev => (prev === 1 ? 2 : 1)); 
    }

    if (currentQuestionIndex < questionsForCurrentSession.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setGamePhase(GamePhase.ROUND_LOADING); 
    } else {
      setGamePhase(GamePhase.GAME_OVER); 
    }
  };

  if (gamePhase === GamePhase.INITIAL_LOADING || gamePhase === GamePhase.ROUND_LOADING) {
    let loadingMessageText = "Cargando datos del juego...";
    if (gamePhase === GamePhase.ROUND_LOADING && !roundMessage && currentQuestionIndex < questionsForCurrentSession.length) loadingMessageText = `Preparando Ronda ${currentQuestionIndex + 1}...`;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-slate-200 bg-slate-900">
        {roundMessage && messageTypeForCss && (
          <div className={ 
            messageTypeForCss === 'steal-opportunity' ? "steal-points-message" :
            messageTypeForCss === 'steal-outcome' ? "steal-outcome-fade-message" :
            "round-info-message" 
          }>
            {roundMessage}
          </div>
        )}
        {!roundMessage && (
            <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-xl">{loadingMessageText}</p>
            </div>
        )}
         <button
            onClick={handleExitGame}
            className="mt-8 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
            Salir del Juego
        </button>
      </div>
    );
  }
  
  if (gamePhase === GamePhase.GAME_OVER) {
    const winner = team1.score > team2.score ? team1 : (team2.score > team1.score ? team2 : null);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in text-slate-200 bg-slate-900">
        <div className="text-center bg-slate-800 bg-opacity-90 p-8 md:p-12 rounded-xl shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-cyan-400">¡Juego Terminado!</h1>
          {winner ? (
            <h2 className="text-3xl mb-8">
              Ganador: <span className="text-green-400">{winner.name}</span> con {winner.score} puntos!
            </h2>
          ) : (
            <h2 className="text-3xl mb-8 text-amber-400">¡Es un empate con {team1.score} puntos!</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-2xl text-cyan-400">{team1.name}</h3>
              <p className="text-4xl font-bold">{team1.score} pts</p>
            </div>
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-2xl text-orange-400">{team2.name}</h3>
              <p className="text-4xl font-bold">{team2.score} pts</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => {
                setGamePhase(GamePhase.INITIAL_LOADING); 
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 w-full sm:w-auto"
            >
              Jugar de Nuevo
            </button>
            <button
              onClick={() => router.push('/game/settings')}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 w-full sm:w-auto"
            >
              Configurar Preguntas
            </button>
            <button
              onClick={handleExitGame}
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 w-full sm:w-auto"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !team1.name || !team2.name) {
     return ( 
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-slate-200 bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-xl">Preparando pregunta...</p>
        </div>
        {roundMessage && messageTypeForCss && (
           <div className={
            messageTypeForCss === 'steal-opportunity' ? "steal-points-message" :
            messageTypeForCss === 'steal-outcome' ? "steal-outcome-fade-message" :
            "round-info-message"
          }>
            {roundMessage}
          </div>
        )}
         <button
            onClick={handleExitGame}
            className="mt-8 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
            Salir del Juego
        </button>
      </div>
    );
  }

  // Renderizado especial para FACE-OFF
  if (gamePhase === GamePhase.FACE_OFF && currentQuestion) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col text-slate-100">
        {roundMessage && messageTypeForCss && (
          <div className={messageTypeForCss === 'face-off' ? "round-info-message bg-purple-600" : "round-info-message"}>
            {roundMessage}
          </div>
        )}
        
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-400 mb-4 animate-pulse">
            ⚡ FACE-OFF ⚡
          </h1>
          <p className="text-xl text-gray-300">
            ¡El primer equipo en responder correctamente gana el control!
          </p>
          <button
            onClick={handleExitGame}
            className="mt-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Salir
          </button>
        </header>

        <main className="container mx-auto flex-grow flex flex-col items-center">
          <div className="w-full max-w-4xl mb-8">
            <QuestionDisplay 
              question={currentQuestion} 
              revealedAnswers={revealedAnswers}
              isCorrectlyAnswered={(answerText) => revealedAnswers.includes(answerText.toLowerCase())}
            />
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Formulario Equipo 1 */}
            <div className="bg-cyan-900 bg-opacity-30 p-6 rounded-xl border-2 border-cyan-500">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center">{team1.name}</h3>
              <form onSubmit={(e) => handleFaceOffSubmit(e, 1)} className="space-y-4">
                <input
                  type="text"
                  value={team1FaceOffAnswer}
                  onChange={(e) => setTeam1FaceOffAnswer(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-slate-700 border border-cyan-500 focus:border-cyan-300 focus:outline-none text-white"
                  placeholder="Escribe tu respuesta..."
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  disabled={!team1FaceOffAnswer.trim()}
                >
                  Responder
                </button>
              </form>
            </div>

            {/* Formulario Equipo 2 */}
            <div className="bg-orange-900 bg-opacity-30 p-6 rounded-xl border-2 border-orange-500">
              <h3 className="text-2xl font-bold text-orange-400 mb-4 text-center">{team2.name}</h3>
              <form onSubmit={(e) => handleFaceOffSubmit(e, 2)} className="space-y-4">
                <input
                  type="text"
                  value={team2FaceOffAnswer}
                  onChange={(e) => setTeam2FaceOffAnswer(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-slate-700 border border-orange-500 focus:border-orange-300 focus:outline-none text-white"
                  placeholder="Escribe tu respuesta..."
                />
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  disabled={!team2FaceOffAnswer.trim()}
                >
                  Responder
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const activeTeam = currentTeamId ? (currentTeamId === 1 ? team1 : team2) : null;
  const activeTeamColor = currentTeamId === 1 ? 'text-cyan-400' : 'text-orange-400'; 
  // Removed unused variables:
  // const team1Color = 'cyan'; 
  // const team2Color = 'orange';


  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col text-slate-100"> 
      {roundMessage && messageTypeForCss && (
         <div className={
            messageTypeForCss === 'steal-opportunity' ? "steal-points-message" : 
            messageTypeForCss === 'steal-outcome' ? "steal-outcome-fade-message" :
            "round-info-message" 
          }>
          {roundMessage}
        </div>
      )}
      <header className="mb-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-slate-200">
            Pregunta {currentQuestionIndex + 1} de {questionsForCurrentSession.length} - Turno de: 
            <span className={`${activeTeamColor} font-semibold`}>
              {' '}{activeTeam?.name || 'Determinando...'}
            </span>
            {(gamePhase === GamePhase.QUESTION || gamePhase === GamePhase.STEAL_ATTEMPT) && 
             <span className="text-amber-300"> ({pointsAccumulatedThisRound} pts en juego{gamePhase === GamePhase.STEAL_ATTEMPT ? " - ¡ROBO!" : ""})</span>}
          </h1>
          <button
            onClick={handleExitGame}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            Salir
          </button>
        </div>
        
        {/* Temporizador */}
        {(gamePhase === GamePhase.QUESTION || gamePhase === GamePhase.STEAL_ATTEMPT) && (
          <div className="container mx-auto px-4 mt-4">
            <Timer 
              key={timerKey}
              duration={gamePhase === GamePhase.STEAL_ATTEMPT ? stealTimeSeconds : turnTimeSeconds}
              isActive={isTimerActive}
              isPaused={isTimerPaused}
              onTimeUp={handleTimeUp}
              isStealAttempt={gamePhase === GamePhase.STEAL_ATTEMPT}
            />
          </div>
        )}
      </header>

      <main className="container mx-auto flex-grow flex flex-col items-center w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
          <div className="lg:col-span-1">
            <TeamScore 
              team={team1} 
              isCurrent={currentTeamId === 1}
              isTeam1={true} 
              maxStrikes={MAX_STRIKES}
            />
          </div>
          <div className="lg:col-span-1 order-first lg:order-none">
            <QuestionDisplay 
              question={currentQuestion} 
              revealedAnswers={revealedAnswers}
              isCorrectlyAnswered={(answerText) => revealedAnswers.includes(answerText.toLowerCase())}
            />
          </div>
          <div className="lg:col-span-1">
            <TeamScore 
              team={team2} 
              isCurrent={currentTeamId === 2}
              isTeam1={false} 
              maxStrikes={MAX_STRIKES}
            />
          </div>
        </div>

        {(gamePhase === GamePhase.QUESTION || gamePhase === GamePhase.STEAL_ATTEMPT) && (
          <form 
            onSubmit={gamePhase === GamePhase.STEAL_ATTEMPT ? handleStealAttemptSubmit : handleAnswerSubmit} 
            className="mt-auto w-full max-w-xl p-4 bg-slate-800 bg-opacity-70 rounded-lg shadow-xl backdrop-blur-sm" 
          >
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onFocus={() => setIsTimerPaused(true)}
                onBlur={() => setIsTimerPaused(false)}
                className="flex-grow px-4 py-3 rounded bg-slate-700 border border-slate-600 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-400"
                placeholder={gamePhase === GamePhase.STEAL_ATTEMPT ? `¡${activeTeam?.name || 'Equipo'}, tu respuesta para robar!` : "Escribe tu respuesta aquí..."}
                disabled={gamePhase === GamePhase.REVEAL || gamePhase === GamePhase.GAME_OVER}
                autoFocus
              />
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={gamePhase === GamePhase.REVEAL || gamePhase === GamePhase.GAME_OVER || !userAnswer.trim()}
              >
                {gamePhase === GamePhase.STEAL_ATTEMPT ? "¡Intentar Robo!" : "Enviar Respuesta"}
              </button>
            </div>
          </form>
        )}
        {gamePhase === GamePhase.REVEAL && !roundMessage && (
          <div className="mt-8 text-center">
            <p className="text-xl text-amber-300 animate-pulse">Revelando todas las respuestas...</p>
          </div>
        )}
      </main>
    </div>
  );
}