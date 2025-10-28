import React from 'react';

interface CodeBlockProps {
  code: string;
  inline?: boolean;
}

/**
 * Componente para renderizar bloques de código
 * Detecta si el texto contiene código y lo formatea apropiadamente
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ code, inline = false }) => {
  if (inline) {
    return (
      <code className="bg-gray-900 text-cyan-300 px-2 py-1 rounded font-mono text-sm whitespace-pre-wrap">
        {code}
      </code>
    );
  }

  return (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm whitespace-pre">
      <code>{code}</code>
    </pre>
  );
};

/**
 * Detecta si un texto contiene código
 * Busca patrones comunes de código de programación
 */
export function hasCodePattern(text: string): boolean {
  const codePatterns = [
    /```/,                          // Markdown code blocks
    /function\s+\w+\s*\(/,         // Funciones
    /const\s+\w+\s*=/,             // Const declarations
    /let\s+\w+\s*=/,               // Let declarations
    /var\s+\w+\s*=/,               // Var declarations
    /class\s+\w+/,                 // Clases
    /import\s+.*from/,             // Imports
    /export\s+(default\s+)?/,      // Exports
    /=>\s*{/,                      // Arrow functions
    /\w+\.\w+\(/,                  // Method calls
    /\w+\[["']\w+["']\]/,         // Array/object access
    /{[\s\S]*:\s*[\s\S]*}/,       // Objetos
    /if\s*\(.*\)\s*{/,            // If statements
    /for\s*\(.*\)\s*{/,           // For loops
    /while\s*\(.*\)\s*{/,         // While loops
    /def\s+\w+\s*\(/,             // Python functions
    /public\s+\w+/,               // Java/C# public
    /private\s+\w+/,              // Java/C# private
  ];

  return codePatterns.some(pattern => pattern.test(text));
}

/**
 * Renderiza texto con soporte para código
 * Detecta bloques de código markdown (```) o patrones de código
 */
export const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Detectar bloques de código con ```
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Agregar texto antes del bloque de código
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{beforeText}</span>);
    }

    // Agregar el bloque de código
    const codeContent = match[2];
    parts.push(
      <div key={`code-${match.index}`} className="my-2">
        <CodeBlock code={codeContent} />
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Agregar el texto restante
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    
    // Detectar código inline entre backticks simples
    const inlineCodeRegex = /`([^`]+)`/g;
    const inlineParts: React.ReactNode[] = [];
    let inlineLastIndex = 0;
    let inlineMatch;

    while ((inlineMatch = inlineCodeRegex.exec(remainingText)) !== null) {
      if (inlineMatch.index > inlineLastIndex) {
        inlineParts.push(
          <span key={`inline-text-${inlineLastIndex}`} className="whitespace-pre-wrap">
            {remainingText.substring(inlineLastIndex, inlineMatch.index)}
          </span>
        );
      }

      inlineParts.push(
        <CodeBlock key={`inline-code-${inlineMatch.index}`} code={inlineMatch[1]} inline />
      );

      inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
    }

    if (inlineLastIndex < remainingText.length) {
      inlineParts.push(
        <span key={`inline-text-end`} className="whitespace-pre-wrap">{remainingText.substring(inlineLastIndex)}</span>
      );
    }

    parts.push(<span key={`text-end`}>{inlineParts}</span>);
  }

  // Si no se encontraron bloques de código pero el texto parece contener código
  if (parts.length === 0 && hasCodePattern(text)) {
    return (
      <div className="my-2">
        <CodeBlock code={text} />
      </div>
    );
  }

  // Si no hay formato especial, solo devolver el texto con espacios preservados
  return <span className="whitespace-pre-wrap">{parts.length > 0 ? parts : text}</span>;
};
