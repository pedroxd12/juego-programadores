// src/app/game/layout.tsx
export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Puedes añadir un fondo específico para el juego o elementos comunes aquí
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      {/* Ejemplo de un header común para las secciones del juego */}
      {/* <header className="p-4 bg-black bg-opacity-20 text-center">
        <h1 className="text-xl font-bold text-yellow-400">100 Programadores Dijeron</h1>
      </header> */}
      <main>{children}</main>
      {/* Ejemplo de un footer común */}
      {/* <footer className="text-center p-4 text-xs text-gray-500">
        Modo Juego Activo
      </footer> */}
    </div>
  );
}