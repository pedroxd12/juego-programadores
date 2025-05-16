'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { TeamScore } from '@/components/TeamScore';
import { Question as QuestionType } from '@/app/game/settings/page';

type Team = {
  name: string;
  score: number;
  strikes: number;
};

const GamePhase = {
  INITIAL_LOADING : 'INITIAL_LOADING',
  CHOOSING_STARTING_TEAM: 'CHOOSING_STARTING_TEAM',
  ROUND_LOADING : 'ROUND_LOADING',
  QUESTION : 'QUESTION',
  REVEAL : 'REVEAL',
  STEAL_ATTEMPT : 'STEAL_ATTEMPT',
  GAME_OVER : 'GAME_OVER',
}

type MessageType = 'steal-opportunity' | 'steal-outcome' | 'info' | null;

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
  const [revealedAnswers, setRevealedAnswers] = useState<string[]>([]);
  const [pointsAccumulatedThisRound, setPointsAccumulatedThisRound] = useState(0);
  
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null);
  const [roundWinnerTeamId, setRoundWinnerTeamId] = useState<number | null>(null); 
  const [gamePhase, setGamePhase] = useState(GamePhase.INITIAL_LOADING);
  const [roundMessage, setRoundMessage] = useState<string | null>(null);
  const [messageTypeForCss, setMessageTypeForCss] = useState<MessageType>(null);

  useEffect(() => {
    if (gamePhase === GamePhase.INITIAL_LOADING) {
      const team1Name = localStorage.getItem('team1Name') || 'Equipo Alpha';
      const team2Name = localStorage.getItem('team2Name') || 'Equipo Beta';
      setTeam1(prev => ({ ...prev, name: team1Name, score: 0, strikes: 0 }));
      setTeam2(prev => ({ ...prev, name: team2Name, score: 0, strikes: 0 }));

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
      setGamePhase(GamePhase.CHOOSING_STARTING_TEAM);
    }
  }, [gamePhase, router]);

  useEffect(() => {
    if (gamePhase === GamePhase.CHOOSING_STARTING_TEAM && questionsForCurrentSession.length > 0 && team1.name && team2.name) {
      const initialStartingTeam = Math.random() < 0.5 ? 1 : 2;
      setCurrentTeamId(initialStartingTeam);
      
      if (currentQuestionIndex === 0) {
        setRoundWinnerTeamId(initialStartingTeam); 
      }
      
      const startingTeamName = initialStartingTeam === 1 ? team1.name : team2.name;
      setRoundMessage(`Eligiendo equipo al azar... ¡Comienza ${startingTeamName}!`);
      setMessageTypeForCss('info');
      setTimeout(() => {
        setRoundMessage(null);
        setMessageTypeForCss(null);
        setGamePhase(GamePhase.ROUND_LOADING);
      }, ROUND_MESSAGE_DURATION);
    }
  }, [gamePhase, questionsForCurrentSession.length, team1.name, team2.name, currentQuestionIndex]);


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

        const teamToStart = roundWinnerTeamId || currentTeamId;
        setCurrentTeamId(teamToStart); 

        const startingTeamName = teamToStart === 1 ? team1.name : team2.name;
        setRoundMessage(`Ronda ${currentQuestionIndex + 1}. ¡Turno para ${startingTeamName}!`);
        setMessageTypeForCss('info');
        setTimeout(() => {
          setRoundMessage(null);
          setMessageTypeForCss(null);
          setGamePhase(GamePhase.QUESTION);
        }, ROUND_MESSAGE_DURATION);

      } else {
        setGamePhase(GamePhase.GAME_OVER);
      }
    }
  }, [gamePhase, currentQuestionIndex, questionsForCurrentSession, team1.name, team2.name, roundWinnerTeamId, currentTeamId]);


  const handleExitGame = () => {
    router.push('/');
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !userAnswer.trim() || gamePhase !== GamePhase.QUESTION || currentTeamId === null) return;

    const submittedAnswerText = userAnswer.trim().toLowerCase();
    const correctAnswer = currentQuestion.answers.find(
      ans => ans.text.toLowerCase() === submittedAnswerText && !revealedAnswers.includes(ans.text.toLowerCase())
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
      }
    } else { 
      currentTeamSetState(prev => {
        const newStrikes = prev.strikes + 1;
        if (newStrikes >= MAX_STRIKES) {
          setRoundMessage(`¡${otherTeam.name}, ${MAX_STRIKES} strikes para ${currentProcessingTeam.name}! Oportunidad de ROBO por ${pointsAccumulatedThisRound} puntos.`);
          setMessageTypeForCss('steal-opportunity');
          setCurrentTeamId(currentTeamId === 1 ? 2 : 1); 
          setGamePhase(GamePhase.STEAL_ATTEMPT);
        }
        return { ...prev, strikes: newStrikes };
      });
    }
    setUserAnswer('');
  };

  const handleStealAttemptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !userAnswer.trim() || gamePhase !== GamePhase.STEAL_ATTEMPT || currentTeamId === null) return;

    const stealingTeamId = currentTeamId;
    const originalTeamId = stealingTeamId === 1 ? 2 : 1; 

    const stealingTeamSetState = stealingTeamId === 1 ? setTeam1 : setTeam2;
    const originalTeamSetState = originalTeamId === 1 ? setTeam1 : setTeam2; 
    
    const stealingTeam = stealingTeamId === 1 ? team1 : team2;
    const originalTeam = originalTeamId === 1 ? team1 : team2;

    const submittedAnswerText = userAnswer.trim().toLowerCase();
    const correctAnswerFoundForSteal = currentQuestion.answers.find(
      ans => ans.text.toLowerCase() === submittedAnswerText && !revealedAnswers.includes(ans.text.toLowerCase())
    );

    let message = "";
    let pointsToAward = pointsAccumulatedThisRound; 

    if (correctAnswerFoundForSteal) {
      pointsToAward += correctAnswerFoundForSteal.points; 
      stealingTeamSetState(prev => ({ ...prev, score: prev.score + pointsToAward }));
      setRevealedAnswers(prev => [...prev, correctAnswerFoundForSteal.text.toLowerCase()]);
      message = `¡${stealingTeam.name} ROBÓ ${pointsToAward} PUNTOS!`;
      setRoundWinnerTeamId(stealingTeamId); 
    } else {
      originalTeamSetState(prev => ({ ...prev, score: prev.score + pointsToAward }));
      message = `¡${stealingTeam.name} falló el robo! ${originalTeam.name} se lleva los ${pointsToAward} puntos acumulados.`;
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

  if (gamePhase === GamePhase.INITIAL_LOADING || gamePhase === GamePhase.CHOOSING_STARTING_TEAM || gamePhase === GamePhase.ROUND_LOADING) {
    let loadingMessageText = "Cargando datos del juego...";
    if (gamePhase === GamePhase.CHOOSING_STARTING_TEAM && !roundMessage) loadingMessageText = "Decidiendo quién empieza...";
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

  if (!currentQuestion || currentTeamId === null || !team1.name || !team2.name) {
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

  const activeTeam = currentTeamId === 1 ? team1 : team2;
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
              {' '}{activeTeam.name}
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
                className="flex-grow px-4 py-3 rounded bg-slate-700 border border-slate-600 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-400"
                placeholder={gamePhase === GamePhase.STEAL_ATTEMPT ? `¡${activeTeam.name}, tu respuesta para robar!` : "Escribe tu respuesta aquí..."}
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