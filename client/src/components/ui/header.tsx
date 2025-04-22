import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X, ChevronDown, LogIn } from "lucide-react"
import { Button } from "./button"
import { useTheme } from "./theme-provider"

interface HeaderProps {
  className?: string
  logo?: React.ReactNode
  brandName?: string
}

export default function Header({ 
  className = "",
  logo,
  brandName = "AI Sherpas"
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme } = useTheme()

  return (
    <header className={`bg-gradient-to-r from-slate-800 to-slate-900 text-white ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            {logo}
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">
              {brandName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-orange-400 transition-colors">
              Home
            </Link>
            <Link to="/roadmaps" className="text-white hover:text-orange-400 transition-colors">
              Roadmaps
            </Link>
            <div className="relative group">
              <button className="flex items-center text-white hover:text-orange-400 transition-colors">
                Resources <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="py-1">
                  <Link to="/tutorials" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Tutorials
                  </Link>
                  <Link to="/tools" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Tools
                  </Link>
                  <Link to="/community" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Community
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-red-600 hover:bg-red-700 text-white">Get Started</Button>
              </Link>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pt-4 pb-4 space-y-3">
            <Link to="/" className="block text-white hover:text-orange-400 transition-colors">
              Home
            </Link>
            <Link to="/roadmaps" className="block text-white hover:text-orange-400 transition-colors">
              Roadmaps
            </Link>
            <div className="block text-white hover:text-orange-400 transition-colors">
              Resources
              <div className="pl-4 mt-2 space-y-2">
                <Link to="/tutorials" className="block text-white hover:text-orange-400 transition-colors">
                  Tutorials
                </Link>
                <Link to="/tools" className="block text-white hover:text-orange-400 transition-colors">
                  Tools
                </Link>
                <Link to="/community" className="block text-white hover:text-orange-400 transition-colors">
                  Community
                </Link>
              </div>
            </div>
            <Link to="/login">
              <Button
                variant="outline"
                className="w-full border-white text-white hover:bg-white hover:text-slate-900 mb-2"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Get Started</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
} 