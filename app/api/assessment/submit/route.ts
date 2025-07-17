import { NextResponse } from 'next/server';
import { AssessmentSession } from '@/lib/session/sessionTypes';
import { storage } from '@/server/storage';
import { insertAssessmentSchema } from '@shared/schema';
import { withAuthAndSecurity } from '../../middleware/AuthMiddleware';
import { z } from 'zod';
import { generateReportForAssessment } from '@/server/lib/services/reportService';

// Helper function to get base URL
function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:3000';
}

async function submitAssessment(request: Request, context: any) {
  try {
    const sessionData: AssessmentSession = await request.json();
    console.log('Received assessment submission:', JSON.stringify(sessionData, null, 2));

    // Get user from context (added by withAuth middleware)
    const user = context.user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in request context' },
        { status: 500 }
      );
    }
    
    // Look up the user profile to get the integer user ID
    let userProfile = await storage.getUserProfileByAuthId(user.id);
    
    // If no user profile exists, create one automatically
    if (!userProfile) {
      console.log(`Creating user profile for auth ID: ${user.id}`);
      userProfile = await storage.createUserProfile({
        auth_id: user.id,
        full_name: user.email?.split('@')[0] || 'User',
      });
      console.log(`Created user profile with ID: ${userProfile.id}`);
    }

    // Extract step data from session with proper typing
    const getStepData = (stepId: string): any => {
      const step = sessionData.steps?.find(s => s.id === stepId);
      return step?.data || {};
    };

    const organizationStep = getStepData('basics') as any;
    const roleStep = getStepData('roleSelection') as any;
    const areasStep = getStepData('areasForImprovement') as any;
    const workVolumeStep = getStepData('workVolume') as any;
    const dataSystemsStep = getStepData('dataSystems') as any;
    const readinessStep = getStepData('readiness') as any;
    const roiStep = getStepData('roiTargets') as any;

    // Get or create organization
    let organizationId = userProfile.organization_id;
    if (!organizationId) {
      // Create a default organization for the user
      const organization = await storage.createOrganization({
        name: organizationStep.basics?.name || 'Unknown Organization',
        industry: organizationStep.basics?.industry || 'Unknown',
        size: organizationStep.basics?.size || 'Unknown',
        description: `Organization for ${user.email}`,
      });
      organizationId = organization.id;
      
      // Update the user's profile with the new organization ID
      await storage.updateUserProfile(userProfile.id, {
        organization_id: organizationId,
      });
    }

    // Transform session data to assessment format
    const assessmentData = {
      userId: userProfile.id,
      organizationId: organizationId,
      title: organizationStep.basics?.reportName || 'AI Transformation Assessment',
      status: 'completed' as const,
      // Add required fields from step data
      industry: organizationStep.basics?.industry || 'Unknown',
      industryMaturity: organizationStep.basics?.industryMaturity || 'Immature',
      companyStage: organizationStep.basics?.companyStage || 'Startup',
      strategicFocus: organizationStep.basics?.strategicFocus || [],
      stepData: {
        basics: {
          companyName: organizationStep.basics?.name || '',
          industry: organizationStep.basics?.industry || '',
          size: organizationStep.basics?.size || '',
          goals: organizationStep.basics?.keyBusinessGoals || '',
          stakeholders: organizationStep.basics?.keyStakeholders || [],
          industryMaturity: organizationStep.basics?.industryMaturity as 'Mature' | 'Immature' || 'Mature',
          companyStage: organizationStep.basics?.companyStage as 'Startup' | 'Early Growth' | 'Scaling' | 'Mature' || 'Mature',
          reportName: organizationStep.basics?.reportName || '',
        },
        roles: {
          selectedDepartments: [],
          selectedRoles: roleStep.roleSelection?.selectedRoles?.map((role: any) => role.id) || [],
          prioritizedRoles: roleStep.roleSelection?.selectedRoles?.map((role: any) => role.id) || [],
        },
        painPoints: {
          roleSpecificPainPoints: areasStep.areasForImprovement?.roleSpecificPainPoints || {},
          generalPainPoints: areasStep.areasForImprovement?.generalPainPoints || '',
        },
        workVolume: {
          roleWorkVolume: workVolumeStep.workVolume?.roleWorkVolume || {},
        },
        techStack: {
          currentSystems: dataSystemsStep.dataSystems?.currentSystems || '',
          // Combine new fields into the legacy 'relevantTools' for now to avoid schema changes.
          // This ensures data is not lost.
          relevantTools: [
            dataSystemsStep.dataSystems?.relevantTools,
            `Integration Challenges: ${dataSystemsStep.dataSystems?.integrationChallenges}`,
            `Security Requirements: ${dataSystemsStep.dataSystems?.securityRequirements}`
          ].filter(Boolean).join('\n\n'),
          dataAvailability: [dataSystemsStep.dataSystems?.dataAccessibility || ''],
          existingAutomation: dataSystemsStep.dataSystems?.systemsIntegration || '',
          dataQuality: parseInt(dataSystemsStep.dataSystems?.dataQuality) || 5,
        },
        adoption: {
          // Combine new readiness fields into existing text fields to avoid schema changes.
          anticipatedTrainingNeeds: [
            `Timeline: ${readinessStep.readiness?.timelineExpectation || 'N/A'}`,
            `Budget: ${readinessStep.readiness?.budgetRange || 'N/A'}`,
            `Risk Tolerance: ${readinessStep.readiness?.riskTolerance || 'N/A'}`,
            `\n---Anticipated Training Needs---\n${readinessStep.readiness?.anticipatedTrainingNeeds || ''}`
          ].join('\n'),
          expectedAdoptionChallenges: [
            `Organizational Readiness: ${readinessStep.readiness?.organizationalReadiness || 'N/A'}`,
            `Stakeholder Alignment: ${readinessStep.readiness?.stakeholderAlignment || 'N/A'}`,
            `\n---Expected Adoption Challenges---\n${readinessStep.readiness?.expectedAdoptionChallenges || ''}`
          ].join('\n'),
          // Transform the success metrics object array into a simple string array.
          successMetrics: (readinessStep.readiness?.successMetrics || []).map((m: { name: string }) => m.name),
          // Keep the additional notes field separate.
          keySuccessMetrics: readinessStep.readiness?.keySuccessMetrics || '',
          roleAdoption: {}
        },
        roiTargets: {
          // Transform goals and metrics from object arrays to simple string arrays.
          primaryGoals: (roiStep.roiTargets?.primaryGoals || []).map((g: { name: string }) => g.name),
          keyMetrics: (roiStep.roiTargets?.keyMetrics || []).map((m: { name: string }) => m.name),
          expectedROI: roiStep.roiTargets?.expectedROI || '',
          timeToValue: roiStep.roiTargets?.timeToValue || '',
        },
        scores: {},
        aiAdoptionScoreInputs: {
          adoptionRateForecast: roiStep.roiTargets?.adoptionRateForecast || 80,
          timeSavingsPerUserHours: roiStep.roiTargets?.timeSavings || 7,
          affectedUserCount: roiStep.roiTargets?.affectedUsers || 120,
          costEfficiencyGainsAmount: roiStep.roiTargets?.costEfficiencyGains || 25000,
          performanceImprovementPercentage: roiStep.roiTargets?.performanceImprovement || 30,
          toolSprawlReductionScore: roiStep.roiTargets?.toolSprawlReduction || 4
        }
      }
    };

    console.log('Transformed assessment data:', JSON.stringify(assessmentData, null, 2));

    // Validate the transformed data
    const validatedData = insertAssessmentSchema.parse(assessmentData);
    
    // Save to database
    const assessment = await storage.createAssessment(validatedData);
    console.log(`Assessment created with ID: ${assessment.id}`);

    // Trigger AI processing/report generation ASYNCHRONOUSLY
    // We call the service directly and don't await it to avoid timeouts.
    generateReportForAssessment(assessment.id).catch(error => {
      // Log the error centrally. This detached promise won't crash the main thread.
      console.error(`[SUBMIT_ROUTE] Background report generation failed for assessment ${assessment.id}:`, error);
    });

    // Prepare the final response immediately
    const finalResponse = {
      message: 'Assessment submitted successfully. Report generation started in background.', 
      assessmentId: assessment.id,
      reportId: null, // Will be available later
      success: true,
      reportGenerating: true
    };

    return NextResponse.json(finalResponse, { status: 201 });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { error: 'Invalid assessment data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const POST = withAuthAndSecurity(submitAssessment); 