// Adaptado de React Bits — Border Glow (https://reactbits.dev/components/border-glow).
// Borda com luz girando (ciano → pêssego) para marcar a ação nº 1. Parada sob "reduzir movimento".
export function BorderGlow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-glow ${className}`}>{children}</div>;
}
