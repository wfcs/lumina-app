// Adaptado de React Bits — Shiny Text (https://reactbits.dev/text-animations/shiny-text).
// Brilho que atravessa o texto a cada ~3 s; parado sob "reduzir movimento" (globals.css).
export function ShinyText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`shiny-text ${className}`}>{children}</span>;
}
