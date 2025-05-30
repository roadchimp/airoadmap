import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center gap-4">
                <Logo className="h-8" />
              </div>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-white hover:text-gray-300">Home</Link>
              <Link to="/dashboard" className="text-white hover:text-gray-300">Dashboard</Link>
              <Link to="/roadmaps" className="text-white hover:text-gray-300">Roadmaps</Link>
              <div className="relative group">
                <button className="text-white hover:text-gray-300">Resources</button>
              </div>
              <Link to="/signup">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-gradient relative min-h-screen flex items-center justify-center text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your AI Adoption Journey
            <br />
            <span className="text-orange-500">Starts Here</span>
          </h1>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Discover personalized roadmaps to prioritize and measure AI
            capabilities in your Organization
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/roadmaps">
              <Button className="bg-red-600 text-white hover:bg-red-700">
                Explore Roadmaps
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose AI Sherpas?</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Everything you need to implement AI technologies in your organization.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="🎯"
              title="Personalized Learning Paths"
              description="Customized roadmaps based on your experience level and learning goals."
            />
            <FeatureCard
              icon="💡"
              title="Practical Projects"
              description="Hands-on projects to apply your knowledge and build your portfolio."
            />
            <FeatureCard
              icon="📚"
              title="Curated Resources"
              description="The best tutorials, courses, and documentation for each topic."
            />
            <FeatureCard
              icon="👥"
              title="Community Support"
              description="Connect with other learners and experts in the AI community."
            />
          </div>
        </div>
      </div>

      {/* Roadmaps Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Explore AI Roadmaps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RoadmapCard
              title="AI Readiness Assessment"
              level="Beginner"
              description="A comprehensive guide to assess your organization's readiness for AI adoption."
              isNew
            />
            <RoadmapCard
              title="Enterprise AI Implementation"
              level="Intermediate"
              description="Learn how to implement AI solutions across your organization effectively."
            />
            <RoadmapCard
              title="AI Governance Framework"
              level="Advanced"
              description="Establish proper governance and ethical guidelines for AI in your organization."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="p-6 rounded-lg bg-white shadow-sm border">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

interface RoadmapCardProps {
  title: string;
  level: string;
  description: string;
  isNew?: boolean;
}

const RoadmapCard: React.FC<RoadmapCardProps> = ({ title, level, description, isNew }) => {
  return (
    <div className="p-6 rounded-lg bg-white shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        {isNew && (
          <span className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded">
            New
          </span>
        )}
      </div>
      <span className="inline-block px-2 py-1 text-sm bg-gray-100 rounded mb-4">
        {level}
      </span>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Landing; 