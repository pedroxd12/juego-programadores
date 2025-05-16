import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Renombrado para reflejar el nombre real
import "./globals.css";

const geistSans = Geist({ // Asumiendo que Geist es el nombre correcto del paquete de fuentes
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({ // Asumiendo que Geist_Mono es el nombre correcto
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "100 Programadores Dijeron", // Título del juego
  description: "Un juego de preguntas y respuestas para programadores.", // Descripción
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased animated-background-gradient`}
      >
        {children}
      </body>
    </html>
  );
}