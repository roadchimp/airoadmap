import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-slate-900 py-16 sm:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="h-full w-full" viewBox="0 0 800 800">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M0 60L60 0" stroke="white" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Your AI Adoption Journey
            <span className="block text-orange-500">Starts Here</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            Discover personalized roadmaps to prioritize and measure AI capabilities in your Organization
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              Explore Roadmaps
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
