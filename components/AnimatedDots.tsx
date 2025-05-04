'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Componente de pontos animados que pulam sequencialmente
export default function AnimatedDots() {
  const [dotStates, setDotStates] = useState<boolean[]>([false, false, false]);
  
  useEffect(() => {
    // Animação sequencial dos pontos
    let count = 0;
    const interval = setInterval(() => {
      count = (count + 1) % 4; // 0, 1, 2, 3 ciclicamente
      
      // Define qual ponto está ativo (pulando)
      if (count < 3) {
        setDotStates([
          count === 0, 
          count === 1, 
          count === 2
        ]);
      } else {
        // Quando count=3, todos estão em repouso
        setDotStates([false, false, false]);
      }
    }, 300); // Velocidade da animação
    
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center">
      {dotStates.map((isActive, index) => (
        <span
          key={index}
          className={cn(
            "mx-0.5 text-lg transition-transform duration-300",
            isActive ? "text-primary translate-y-[-3px]" : "text-primary/70"
          )}
        >
          .
        </span>
      ))}
    </span>
  );
}
