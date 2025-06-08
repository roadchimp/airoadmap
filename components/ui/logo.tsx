'use client';
import { cn } from "@/lib/session/utils";
import { Mountains } from "@phosphor-icons/react";


interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Phosphor Mountains icon */}
      <Mountains size={32} color="#FF8C42" weight="regular" className="h-8 w-8" />
      
      {showText && (
        <div className="text-2xl font-bold" style={{ 
          background: 'linear-gradient(to right, #FF8C42, #FF5733)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent'
        }}>
          AI Sherpas
        </div>
      )}
    </div>
  )
} 