import { NextResponse } from 'next/server';
import { AssessmentSession } from '@/lib/session/sessionTypes';
import { storage } from '@/server/storage';
import { insertAssessmentSchema } from '@shared/schema';
import { withAuthAndSecurity } from '../../middleware/AuthMiddleware';
import { z } from 'zod';

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
          relevantTools: dataSystemsStep.dataSystems?.relevantTools || '',
          integrationChallenges: dataSystemsStep.dataSystems?.integrationChallenges || '',
          securityRequirements: dataSystemsStep.dataSystems?.securityRequirements || '',
          dataAvailability: [dataSystemsStep.dataSystems?.dataAccessibility || ''],
          existingAutomation: dataSystemsStep.dataSystems?.systemsIntegration || '',
          dataQuality: parseInt(dataSystemsStep.dataSystems?.dataQuality) || 5,
        },
        adoption: {
          timelineExpectation: readinessStep.readiness?.timelineExpectation || '',
          budgetRange: readinessStep.readiness?.budgetRange || '',
          riskTolerance: readinessStep.readiness?.riskTolerance || '',
          successMetrics: readinessStep.readiness?.successMetrics || [],
          organizationalReadiness: readinessStep.readiness?.organizationalReadiness || '',
          stakeholderAlignment: readinessStep.readiness?.stakeholderAlignment || '',
          anticipatedTrainingNeeds: readinessStep.readiness?.anticipatedTrainingNeeds || '',
          expectedAdoptionChallenges: readinessStep.readiness?.expectedAdoptionChallenges || '',
          keySuccessMetrics: readinessStep.readiness?.keySuccessMetrics || '',
          roleAdoption: {}
        },
        roiTargets: {
          expectedROI: roiStep.roiTargets?.expectedROI || '',
          timeToValue: roiStep.roiTargets?.timeToValue || '',
          primaryGoals: roiStep.roiTargets?.primaryGoals || [],
          keyMetrics: roiStep.roiTargets?.keyMetrics || [],
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
    // Don't wait for completion to avoid timeouts
    const triggerReportGeneration = async () => {
      try {
        console.log('Triggering AI report generation asynchronously...');
        const baseUrl = getBaseUrl();
        const automationToken = process.env.VERCEL_AUTOMATION_TOKEN;

        if (!automationToken) {
          console.error('CRITICAL: VERCEL_AUTOMATION_TOKEN is not set. Report generation will fail.');
          return;
        }
        
        const reportResponse = await fetch(`${baseUrl}/api/prioritize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${automationToken}`,
          },
          body: JSON.stringify({ assessmentId: assessment.id }),
        });

        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          console.log(`Report generated with ID: ${reportData.id}`);
        } else {
          console.error('Failed to generate report:', await reportResponse.text());
        }
      } catch (reportError) {
        console.error('Error triggering report generation:', reportError);
      }
    };

    // Fire and forget - don't await this
    triggerReportGeneration();

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