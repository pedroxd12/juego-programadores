import React from 'react';
import { Question } from '@/app/game/settings/page'; // Importar el tipo Question
import { FormattedText } from './CodeBlock';

type QuestionDisplayProps = {
  question: Question;
  revealedAnswers: string[]; // Array de textos de respuestas reveladas
  isCorrectlyAnswered: (answerText: string) => boolean; // Función para saber si una respuesta fue adivinada
};

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, revealedAnswers, isCorrectlyAnswered }) => {
  return (
    <div className="bg-gray-800 bg-opacity-80 rounded-xl p-6 md:p-8 shadow-2xl backdrop-blur-sm animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-sky-300 animate-slide-in-bottom whitespace-pre-wrap" style={{ animationDelay: '0.1s' }}>
        <FormattedText text={question.text} />
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.answers.map((answer, idx) => {
          const isRevealed = revealedAnswers.includes(answer.text.toLowerCase());
          const wasGuessed = isCorrectlyAnswered(answer.text.toLowerCase());

          return (
            <div 
              key={idx} 
              className={`p-4 rounded-lg border-2 transition-all duration-500 ease-out transform 
                          ${isRevealed ? 'border-green-500 bg-green-800 bg-opacity-50 animate-fade-in' : 'border-gray-600 bg-gray-700 hover:border-yellow-500 hover:scale-105'}`}
              style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
            >
              {isRevealed ? (
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-grow text-lg text-gray-100 whitespace-pre-wrap">
                    <FormattedText text={answer.text} />
                  </div>
                  <span className={`font-bold px-3 py-1 rounded text-sm flex-shrink-0 ${wasGuessed ? 'bg-yellow-500 text-yellow-900' : 'bg-green-400 text-green-900'}`}>
                    {answer.points} pts
                  </span>
                </div>
              ) : (
                // Placeholder para respuestas no reveladas, más interactivo
                <div className="h-8 flex items-center justify-center text-gray-400 text-2xl font-mono cursor-default">
                  <span>{idx + 1}. ???</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};