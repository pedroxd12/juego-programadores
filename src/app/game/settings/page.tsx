'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Definición del tipo para una Pregunta individual
export type Answer = {
  text: string;
  points: number;
};

export type Question = {
  id: string; // Usar string para IDs, ej: timestamp o uuid
  text: string;
  answers: Answer[];
};

const POINTS_DISTRIBUTION = [50, 30, 20, 10, 5]; // Puntos para 5 respuestas
const MIN_QUESTIONS_TO_PLAY = 3; // Constante para el mínimo de preguntas

export default function SettingsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newAnswers, setNewAnswers] = useState<string[]>(Array(POINTS_DISTRIBUTION.length).fill(''));
  const [turnTime, setTurnTime] = useState(30);
  const [stealTime, setStealTime] = useState(15);
  const router = useRouter();

  // Cargar preguntas y configuración de tiempo desde localStorage al montar el componente
  useEffect(() => {
    const storedQuestions = localStorage.getItem('gameQuestions');
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    }
    
    const savedTurnTime = localStorage.getItem('turnTimeSeconds');
    const savedStealTime = localStorage.getItem('stealTimeSeconds');
    if (savedTurnTime) {
      setTurnTime(parseInt(savedTurnTime));
    }
    if (savedStealTime) {
      setStealTime(parseInt(savedStealTime));
    }
  }, []);

  // Guardar preguntas en localStorage cada vez que cambien
  useEffect(() => {
    if (questions.length > 0) { // Solo guardar si hay preguntas para evitar un array vacío innecesario
        localStorage.setItem('gameQuestions', JSON.stringify(questions));
    } else {
        localStorage.removeItem('gameQuestions'); // Limpiar si no hay preguntas
    }
  }, [questions]);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuestionText.trim()) {
      alert('Por favor, escribe el texto de la pregunta.');
      return;
    }
    const filledAnswers = newAnswers.filter(a => a.trim() !== '');
    if (filledAnswers.length < 2) { // Requerir al menos 2 respuestas
      alert('Por favor, ingresa al menos dos respuestas.');
      return;
    }

    const newQuestionObj: Question = {
      id: Date.now().toString(), // ID simple basado en timestamp
      text: newQuestionText.trim(),
      answers: filledAnswers.map((ans, idx) => ({
        text: ans.trim(),
        points: POINTS_DISTRIBUTION[idx] || 0 // Asignar puntos según el orden
      })).sort((a, b) => b.points - a.points), // Asegurar orden por puntos
    };

    setQuestions(prevQuestions => [...prevQuestions, newQuestionObj]);
    setNewQuestionText('');
    setNewAnswers(Array(POINTS_DISTRIBUTION.length).fill(''));
  };

  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...newAnswers];
    updatedAnswers[index] = value;
    setNewAnswers(updatedAnswers);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== id));
  };

  const canStartGame = questions.length >= MIN_QUESTIONS_TO_PLAY;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <header className="container mx-auto mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400">Configuración de Preguntas</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </header>

      <main className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-800 rounded-lg p-6 shadow-xl animate-slide-in-left">
          <h2 className="text-2xl font-semibold mb-6 text-teal-300">Agregar Nueva Pregunta</h2>
          
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div>
              <label htmlFor="questionText" className="block mb-2 text-lg">Pregunta:</label>
              <textarea
                id="questionText"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:border-teal-400 focus:outline-none font-mono whitespace-pre-wrap"
                rows={5}
                placeholder="Escribe la pregunta aquí"
                style={{ resize: 'vertical' }}
              />
            </div>
            
            <div>
              <label className="block mb-2 text-lg">Respuestas (la primera es la de mayor puntaje):</label>
              {newAnswers.map((answerText, idx) => (
                <div key={idx} className="mb-3 flex items-center">
                  <span className="w-16 text-yellow-400 text-sm">{POINTS_DISTRIBUTION[idx] || 0} pts:</span>
                  <input
                    type="text"
                    value={answerText}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="flex-grow px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:border-teal-400 focus:outline-none ml-2 font-mono"
                    placeholder={`Respuesta ${idx + 1} (acepta variaciones)`}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-1">
                ✨ Las respuestas aceptan variaciones (acentos, mayúsculas, espacios)
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              Agregar Pregunta
            </button>
          </form>
        </section>

        <section className="bg-gray-800 rounded-lg p-6 shadow-xl animate-fade-in" style={{animationDelay: '0.2s'}}>
          <h2 className="text-2xl font-semibold mb-6 text-sky-300">Preguntas Configuradas ({questions.length})</h2>
          
          {questions.length === 0 ? (
            <p className="text-gray-400 italic">Aún no has agregado ninguna pregunta. ¡Agrega al menos {MIN_QUESTIONS_TO_PLAY} para poder jugar!</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {questions.map((question) => (
                <div key={question.id} className="bg-gray-700 p-4 rounded-lg shadow-md animate-fade-in">
                  <h3 className="font-bold text-lg mb-2 text-gray-100 whitespace-pre-wrap font-mono">{question.text}</h3>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    {question.answers.map((answer, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="text-yellow-400">{answer.points} pts:</span> <span className="whitespace-pre-wrap">{answer.text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
           {questions.length > 0 && !canStartGame && (
            <p className="mt-4 text-yellow-500">
              Necesitas al menos {MIN_QUESTIONS_TO_PLAY} preguntas para iniciar una ronda. ¡Sigue agregando!
            </p>
          )}
          
          {/* Configuración de tiempos */}
          {canStartGame && (
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold mb-4 text-purple-300">⚙️ Configuración de Tiempos</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="turnTime" className="block text-sm mb-2 text-gray-200">
                    Tiempo por turno: <span className="text-yellow-400 font-bold">{turnTime} segundos</span>
                  </label>
                  <input
                    id="turnTime"
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={turnTime}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setTurnTime(newValue);
                      localStorage.setItem('turnTimeSeconds', newValue.toString());
                    }}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10s</span>
                    <span>60s</span>
                    <span>120s</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="stealTime" className="block text-sm mb-2 text-gray-200">
                    Tiempo para robo: <span className="text-red-400 font-bold">{stealTime} segundos</span>
                  </label>
                  <input
                    id="stealTime"
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={stealTime}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setStealTime(newValue);
                      localStorage.setItem('stealTimeSeconds', newValue.toString());
                    }}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5s</span>
                    <span>30s</span>
                    <span>60s</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {canStartGame && (
            <button
                onClick={() => router.push('/game/loading')}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
            >
                Iniciar Juego con Estas Preguntas
            </button>
          )}
        </section>
      </main>
    </div>
  );
}