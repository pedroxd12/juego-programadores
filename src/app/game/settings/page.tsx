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
  const router = useRouter();

  // Cargar preguntas desde localStorage al montar el componente
  useEffect(() => {
    const storedQuestions = localStorage.getItem('gameQuestions');
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
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
                className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:border-teal-400 focus:outline-none"
                rows={3}
                placeholder="Escribe la pregunta aquí..."
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
                    className="flex-grow px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:border-teal-400 focus:outline-none ml-2"
                    placeholder={`Respuesta ${idx + 1}`}
                  />
                </div>
              ))}
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
                  <h3 className="font-bold text-lg mb-2 text-gray-100">{question.text}</h3>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    {question.answers.map((answer, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="text-yellow-400">{answer.points} pts:</span> {answer.text}
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