import { NextResponse } from 'next/server';
import { generateEnhancedExecutiveSummary, generateAICapabilityRecommendations, generatePerformanceImpact } from '../../../server/lib/aiService';
import { WizardStepData, JobRole, Department } from '../../../shared/schema';

export async function GET() {
  try {
    console.log('[Test API] Starting AI service diagnostics...');
    
    // Simple test data
    const testStepData: WizardStepData = {
      basics: {
        companyName: "Test Company",
        reportName: "AI Diagnostics Test Report",
        industry: "Software & Technology",
        size: "Medium",
        industryMaturity: "Mature",
        companyStage: "Scaling",
        goals: "Improve efficiency"
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
      }
    ];
    
    const testRole: JobRole = {
      id: 1,
      title: "Customer Support Agent",
      departmentId: 1,
      description: "Handles customer inquiries",
      keyResponsibilities: ["Answer questions", "Resolve issues"],
      aiPotential: "High"
    };
    
    const testDepartment: Department = {
      id: 1,
      name: "Customer Success",
      description: "Customer support team"
    };
    
    const testPainPoints = {
      severity: 4,
      frequency: 5,
      impact: 4,
      description: "Long response times"
    };

    console.log('[Test API] Testing executive summary...');
    const summary = await generateEnhancedExecutiveSummary(testStepData, testPrioritizedRoles);
    
    console.log('[Test API] Testing AI capabilities...');
    const capabilities = await generateAICapabilityRecommendations(testRole, testDepartment, testPainPoints);
    
    console.log('[Test API] Testing performance impact...');
    const impact = await generatePerformanceImpact(testRole, testDepartment);
    
    console.log('[Test API] All tests completed successfully');
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      openaiKeyPresent: !!process.env.OPENAI_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      results: {
        executiveSummary: {
          success: !!summary,
          length: summary?.length || 0,
          preview: summary?.substring(0, 100) || 'No content'
        },
        aiCapabilities: {
          success: !!capabilities && capabilities.length > 0,
          count: capabilities?.length || 0,
          firstCapability: capabilities?.[0]?.capabilityName || 'None'
        },
        performanceImpact: {
          success: !!impact,
          estimatedRoi: impact?.estimatedAnnualRoi || 0,
          metricsCount: impact?.metrics?.length || 0
        }
      }
    });
    
  } catch (error) {
    console.error('[Test API] Error during AI service test:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV,
      openaiKeyPresent: !!process.env.OPENAI_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0
    }, { status: 500 });
  }
} 