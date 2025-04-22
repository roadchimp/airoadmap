import Header from "../components/ui/header"
import RoadmapCard from "../components/ui/roadmap-card"
import HeroSection from "../components/ui/hero-section"
import FeatureSection from "../components/ui/feature-section"
import "./globals.css"

export default function Page() {
  return (
    <>
      <Header />
      <HeroSection />
      <FeatureSection />
      <div className="container mx-auto py-12">
        <h2 className="text-3xl font-bold mb-6 text-center">Explore AI Roadmaps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Roadmap Cards - Replace with dynamic data */}
          <RoadmapCard
            id="roadmap-1"
            title="AI Readiness Assessment"
            description="A comprehensive guide to assess your organization's readiness for AI adoption."
            category="Assessment"
            difficulty="Beginner"
            popularity={45}
            isNew={true}
          />
          <RoadmapCard
            id="roadmap-2"
            title="Enterprise AI Implementation"
            description="Learn how to implement AI solutions across your organization effectively."
            category="Implementation"
            difficulty="Intermediate"
            popularity={62}
          />
          <RoadmapCard
            id="roadmap-3"
            title="AI Governance Framework"
            description="Establish proper governance and ethical guidelines for AI in your organization."
            category="Governance"
            difficulty="Advanced"
            popularity={38}
          />
        </div>
      </div>
    </>
  )
}
