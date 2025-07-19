import { NextResponse } from 'next/server';
import { generateEnhancedExecutiveSummary, generateAICapabilityRecommendations, generatePerformanceImpact } from '@/server/lib/services/aiService';
import { WizardStepData, JobRole, Department } from '@shared/schema';

export async function GET() {
  console.log('=== AI Service Test API Route ===');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`OpenAI API Key present: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`OpenAI API Key length: ${process.env.OPENAI_API_KEY?.length || 0}`);
  console.log(`Vercel Environment: ${process.env.VERCEL_ENV}`);
  
  const results: any = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      openaiKeyPresent: !!process.env.OPENAI_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0
    },
    tests: {}
  };

  // Test data
  const testStepData: WizardStepData = {
    basics: {
      companyName: "Test Company Inc",
      reportName: "AI Test Report",
      industry: "Software & Technology",
      size: "Large",
      industryMaturity: "Mature",
      companyStage: "Scaling",
      goals: "Improve efficiency and reduce manual processes"
    }
  };
  
  const testPrioritizedRoles = [
    {
      id: 1,
      title: "Customer Support Agent", 
      department: "Customer Success",
      valueScore: 4.2,
      effortScore: 2.8,
      priority: "high"
    },
    {
      id: 2,
      title: "Sales Representative",
      department: "Sales", 
      valueScore: 3.8,
      effortScore: 3.2,
      priority: "medium"
    }
  ];
  
  const testRole: JobRole = {
    id: 1,
    title: "Customer Support Agent",
    departmentId: 1,
    description: "Handles customer inquiries and support tickets",
    keyResponsibilities: ["Answer customer questions", "Resolve technical issues", "Process refunds"],
    aiPotential: "High",
    level: null,
    skills: [],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  const testDepartment: Department = {
    id: 1,
    name: "Customer Success",
    description: "Customer support and success team", 
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  const testPainPoints = {
    severity: 4,
    frequency: 5,
    impact: 4,
    description: "Long response times and repetitive ticket handling"
  };

  // Test 1: Executive Summary Generation
  console.log('Testing Executive Summary Generation...');
  try {
    const summary = await generateEnhancedExecutiveSummary(1, testStepData, testPrioritizedRoles);
    results.tests.executiveSummary = {
      status: 'success',
      summaryLength: summary.length,
      summaryPreview: summary.substring(0, 100) + '...'
    };
    console.log('✅ Executive Summary Success');
  } catch (error) {
    results.tests.executiveSummary = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    console.error('❌ Executive Summary Failed:', error);
  }

  // Test 2: AI Capability Recommendations
  console.log('Testing AI Capability Recommendations...');
  try {
    const recommendations = await generateAICapabilityRecommendations(testRole, testDepartment, testPainPoints);
    results.tests.aiCapabilityRecommendations = {
      status: 'success',
      recommendationCount: recommendations.length,
      firstRecommendation: recommendations[0]?.capabilityName || 'None'
    };
    console.log('✅ AI Capability Recommendations Success');
  } catch (error) {
    results.tests.aiCapabilityRecommendations = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    console.error('❌ AI Capability Recommendations Failed:', error);
  }

  // Test 3: Performance Impact Generation
  console.log('Testing Performance Impact Generation...');
  try {
    const impact = await generatePerformanceImpact(testRole, testDepartment);
    results.tests.performanceImpact = {
      status: 'success',
      impact: impact
    };
    console.log('✅ Performance Impact Success');
  } catch (error) {
    results.tests.performanceImpact = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    console.error('❌ Performance Impact Failed:', error);
  }

  console.log('=== Test Complete ===');
  
  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Add POST method for manual testing if needed
export async function POST() {
  return GET();
} 