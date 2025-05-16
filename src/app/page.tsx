import Link from 'next/link';
import { TeamForm } from '@/components/TeamForm'; // Asegúrate que la ruta sea correcta

export default function Home() {
  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
      <main className="container mx-auto px-4 py-16 text-center animate-fade-in">
        {/* Simulación de código como fondo o elemento visual */}
        <div className="absolute inset-0 overflow-hidden z-0 opacity-10">
          <pre className="text-xs text-green-400 animate-pulse" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.2' }}>
            {`
            // Fragmento de código decorativo
            function* gameLoop(questions) {
              let score = 0;
              for (const q of questions) {
                const answer = yield ask(q.text);
                if (isCorrect(answer, q.correctAnswer)) {
                  score += q.points;
                }
              }
              return score;
            }
            `}
          </pre>
        </div>

        <div className="relative z-10"> {/* Contenido principal por encima del fondo */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-yellow-400">100</span> Programadores Dijeron
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
            versión ITLAC 
          </p>

          <div className="mb-12 inline-block text-left bg-black bg-opacity-30 p-4 rounded-lg shadow-xl">
            <div className="typing-animation text-lg md:text-xl font-mono">
              <span className="text-purple-400">const</span> juego = <span className="text-teal-300">new</span> DinamicaRetadora<span className="text-pink-400">()</span>;
            </div>
            <div className="typing-animation-delay text-lg md:text-xl font-mono">
              juego.<span className="text-sky-400">iniciarDesafio</span><span className="text-pink-400">()</span>;
            </div>
          </div>

          <TeamForm />

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-lg mx-auto animate-slide-in-bottom" style={{ animationDelay: '0.4s' }}>
            <Link href="/game/loading" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg">
              ¡A Jugar!
            </Link>
            <Link href="/game/settings" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg">
              Configurar Preguntas
            </Link>
          </div>

          <div className="mt-20 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p>Desarrollado @club Crocoders</p>
            <p className="mt-1">¡Demuestra lo aprendido y diviértete!</p>
          </div>
        </div>
      </main>
    </div>
  );
}