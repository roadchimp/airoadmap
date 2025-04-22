"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Logo from "./logo"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-orange-400 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-white hover:text-orange-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmaps" className="text-white hover:text-orange-400 transition-colors">
              Roadmaps
            </Link>
            <div className="relative group">
              <button className="flex items-center text-white hover:text-orange-400 transition-colors">
                Resources <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="py-1">
                  <Link href="/tutorials" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Tutorials
                  </Link>
                  <Link href="/tools" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Tools
                  </Link>
                  <Link href="/community" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Community
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/login">
              <Button className="bg-red-600 hover:bg-red-700 text-white">Get Started</Button>
            </Link>
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
            <Link href="/" className="block text-white hover:text-orange-400 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="block text-white hover:text-orange-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmaps" className="block text-white hover:text-orange-400 transition-colors">
              Roadmaps
            </Link>
            <div className="block text-white hover:text-orange-400 transition-colors">
              Resources
              <div className="pl-4 mt-2 space-y-2">
                <Link href="/tutorials" className="block text-white hover:text-orange-400 transition-colors">
                  Tutorials
                </Link>
                <Link href="/tools" className="block text-white hover:text-orange-400 transition-colors">
                  Tools
                </Link>
                <Link href="/community" className="block text-white hover:text-orange-400 transition-colors">
                  Community
                </Link>
              </div>
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Get Started</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
