import { Mountain, Flag } from "lucide-react"

interface LogoProps {
  className?: string
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Mountain className="h-8 w-8 text-orange-500" />
        <Flag className="h-4 w-4 text-red-600 absolute top-0 right-0" />
      </div>
      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">
        AI Sherpas
      </span>
    </div>
  )
}
