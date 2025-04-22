import { Mountain, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Mountain 
          className="h-6 w-6 text-[#FF8C42]" // Warm orange color
          strokeWidth={2}
        />
        <Flag 
          className="h-3 w-3 text-red-600 absolute -top-1 left-1/2 transform -translate-x-1/2" 
          strokeWidth={2}
        />
      </div>
      {showText && (
        <span className="text-2xl font-bold bg-gradient-to-r from-[#FF8C42] to-[#FF5733] bg-clip-text text-transparent">
          AI Sherpas
        </span>
      )}
    </div>
  )
} 