'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { BarChart, FileText, ClipboardList, Route, Target, Gauge, ChartBar, Clock, Library, Settings, Home, ChevronLeft, ChevronRight } from "lucide-react";

// Define interfaces directly here for simplicity, or move to types file
interface FeatureCardProps {
  icon: React.ReactNode;
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

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-[#1a202c]">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center gap-4">
                <Logo className="h-8" />
              </div>
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-white hover:text-gray-300">Home</Link>
              <Link href="/dashboard" className="text-white hover:text-gray-300">Dashboard</Link>
              <Link href="/roadmaps" className="text-white hover:text-gray-300">Roadmaps</Link>
              <a href="https://www.samsena.com/ai/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">Resources</a>
              <Link href="/login">
                <Button className="bg-red-600 text-white border-transparent hover:bg-red-700">
                  Sign In
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
            <Link href="/roadmaps">
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
          <h2 className="text-3xl font-bold text-center mb-12">Accelerate Your Organization's AI Transformation</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          AI Sherpas guides your team from uncertainty to clarity with:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<ClipboardList />}
              title="AI Readiness Assessment"
              description="Instantly benchmark your current GTM and operational processes to pinpoint where AI can drive the most impact."
            />
            <FeatureCard
              icon={<Route />}
              title="Tailored Roadmaps"
              description="Receive step-by-step, stage-specific plans for AI adoption—whether you're a startup, scaling SaaS, or mature enterprise."
            />
            <FeatureCard
              icon={<Target />}
              title="Actionable Insights"
              description="Get prioritized recommendations on where to automate, when to upskill, and how to measure ROI, all mapped to your business's growth and complexity."
            />
            <FeatureCard
              icon={<Gauge />}
              title="Continuous Benchmarking"
              description="Track your AI adoption progress against industry standards and your own KPIs, ensuring you're always moving forward."
            />
              <FeatureCard
              icon={<ChartBar />}
              title="Expert-Backed Guidance"
              description="Leverage proven frameworks, case studies, and best practices to avoid common pitfalls and maximize results."
            />
          </div>
        </div>
      </div>

      {/* Roadmaps Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Explore AI Roadmaps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Placeholder Roadmap Cards */}
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
      
      {/* Footer */}
      <footer className="py-6 bg-[#1a202c] text-white">
        <div className="container mx-auto px-3 text-center">
        <p className="text-gray-400 text-xs"> Copyright 2025 Sam Sena and AI Sherpas, LLC.</p>
        <p className="text-gray-400 text-xs"> - </p>
          <p className="text-gray-400 text-xs">All content, materials, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software on this website are the property of Sam Sena or its content suppliers and are protected by United States and international copyright laws. Trademark Disclaimer: All company names, product names, logos, and trademarks mentioned or displayed on this website are the property of their respective owners. No claim is made to the exclusive right to use such trademarks apart from their display in connection with AI adoption assessment and educational purposes. The use of any trademark on this site does not imply endorsement by the trademark owner. Use At Your Own Risk: This AI adoption assessment tool is provided for informational and educational purposes only. The analysis, recommendations, and insights generated are based on user-provided data and should not be considered as professional consulting advice. Users assume full responsibility for any business decisions made based on the results from this tool. Samsena makes no warranties, express or implied, regarding the accuracy, completeness, or reliability of the assessment results. Limited License: You may use this website for personal, non-commercial evaluation of AI adoption strategies. Any reproduction, distribution, or modification of the content without prior written permission is prohibited. </p>
          <p className="text-gray-400 text-xs">Questions or concerns about this notice? Contact us at [contact@tool-kit.ai].</p>
        </div>
      </footer>
    </div>
  );
} 