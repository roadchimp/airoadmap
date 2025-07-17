import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { calculatePrioritization } from '@/server/lib/engines/prioritizationEngine';
import type { WizardStepData, AssessmentResponse } from '@shared/schema';

// POST /api/prioritize
export async function POST(request: Request) {
  // Security check for internal requests
  console.log('[PRIORITIZE_ROUTE] Received request');
  const internalSecret = request.headers.get('X-Internal-Request-Secret');
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.log(`[PRIORITIZE_ROUTE] Environment: ${process.env.NODE_ENV}`);
  console.log(`[PRIORITIZE_ROUTE] Received X-Internal-Request-Secret: ${internalSecret ? 'Present' : 'Missing'}`);

  // In development, the internal secret is REQUIRED.
  // In production, we assume a different mechanism (like Vercel's private network) handles this.
  if (isDevelopment) {
    if (internalSecret !== process.env.INTERNAL_REQUEST_SECRET) {
      console.error('[PRIORITIZE_ROUTE] Unauthorized: Invalid or missing internal secret in development.');
      return NextResponse.json({ error: 'Unauthorized: Invalid internal secret' }, { status: 401 });
    }
    console.log('[PRIORITIZE_ROUTE] Development authentication successful.');
  } else {
    // Production environment - you might have different checks here
    console.log('[PRIORITIZE_ROUTE] Running in production, skipping local secret check.');
  }

  try {
    const { assessmentId } = await request.json();
    console.log(`[PRIORITIZE_ROUTE] Processing assessmentId: ${assessmentId}`);

    if (!assessmentId || typeof assessmentId !== 'number') {
      console.error(`[PRIORITIZE_ROUTE] Invalid assessmentId: ${assessmentId}`);
      return NextResponse.json({ message: 'Valid assessment ID is required and must be a number' }, { status: 400 });
    }

    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }

    // Get assessment responses for this assessment
    const assessmentResponses = await storage.getAssessmentResponsesByAssessment(assessmentId);
    
    // Fall back to step data if no assessment responses are found
    let stepData = assessment.stepData as WizardStepData;
    if (assessmentResponses && assessmentResponses.length > 0) {
      // Convert assessment responses to WizardStepData format
      stepData = convertResponsesToStepData(assessmentResponses, stepData || {});
    } else if (!stepData) {
      return NextResponse.json({ message: 'Assessment has no data' }, { status: 400 });
    }

    // Calculate prioritization (now async with AI integration)
    const results = await calculatePrioritization(assessmentId, stepData);
    console.log('[PRIORITIZE_ROUTE] Prioritization calculation complete.');

    // Create a report with the results
    const report = await storage.createReport({
      assessmentId,
      executiveSummary: results.executiveSummary,
      prioritizationData: results.prioritizationData,
      aiSuggestions: results.aiSuggestions,
      performanceImpact: results.performanceImpact,
      consultantCommentary: "", // Default empty commentary
      aiAdoptionScoreDetails: results.aiAdoptionScoreDetails,
    });
    console.log(`[PRIORITIZE_ROUTE] Report created with ID: ${report.id}`);

    // Update assessment status to completed
    await storage.updateAssessmentStatus(assessmentId, "completed");
    console.log(`[PRIORITIZE_ROUTE] Assessment status updated for ID: ${assessmentId}`);

    return NextResponse.json(report, { status: 201 });

  } catch (error) {
    const assessmentIdFromBody = await request.json().catch(() => ({})); // Try to get ID for logging
    console.error(`[PRIORITIZE_ROUTE] Error generating prioritization for assessmentId ${assessmentIdFromBody?.assessmentId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating prioritization results';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

/**
 * Convert assessment responses to WizardStepData format
 */
function convertResponsesToStepData(
  responses: AssessmentResponse[],
  existingStepData: WizardStepData = {}
): WizardStepData {
  const stepData: WizardStepData = { ...existingStepData };
  
  for (const response of responses) {
    const identifier = response.questionIdentifier;
    const pathParts = identifier.split('.');
    const stepId = pathParts[0]; // First part is the step ID (e.g., 'basics', 'roles')
    
    if (!stepData[stepId as keyof WizardStepData]) {
      // Initialize the step data with the correct structure based on the step ID
      switch (stepId) {
        case 'basics':
          stepData['basics'] = {
            companyName: '',
            reportName: 'AI Roadmap Report',
            industry: '',
            size: '',
            goals: '',
            stakeholders: [],
            industryMaturity: 'Mature',
            companyStage: 'Mature',
          };
          break;
        case 'roles':
          stepData['roles'] = {
            selectedDepartments: [],
            selectedRoles: []
          };
          break;
        case 'painPoints':
          stepData['painPoints'] = {
            roleSpecificPainPoints: {},
            generalPainPoints: ''
          };
          break;
        case 'workVolume':
          stepData['workVolume'] = {
            roleWorkVolume: {}
          };
          break;
        case 'techStack':
          stepData['techStack'] = {};
          break;
        case 'adoption':
          stepData['adoption'] = {
            roleAdoption: {}
          };
          break;
        case 'scores':
          stepData['scores'] = {
            assessmentScores: { roleScores: {}, timestamp: new Date().toISOString()
           }
          };
          break;
        default:
          console.warn(`Unknown step ID: ${stepId}, skipping initialization`);
          continue;
      }
    }
    
    // Handle different response types
    let value: any = undefined;
    
    if (response.responseText !== null) {
      value = response.responseText;
    } else if (response.responseNumeric !== null) {
      value = response.responseNumeric;
    } else if (response.responseBoolean !== null) {
      value = response.responseBoolean;
    } else if (response.responseJson !== null) {
      value = response.responseJson;
    }
    
    if (value !== undefined) {
      // Set the value at the appropriate path
      setNestedValue(stepData[stepId as keyof WizardStepData], pathParts.slice(1), value);
    }
  }
  
  return stepData;
}

/**
 * Set a value at a nested path in an object
 */
function setNestedValue(obj: any, path: string[], value: any): void {
  if (path.length === 0) return;
  
  let current = obj;
  
  // Navigate to the deepest level, creating objects along the way
  for (let i = 0; i < path.length - 1; i++) {
    const part = path[i];
    
    if (current[part] === undefined) {
      // Check if the next part is a number
      const nextIsNumber = !isNaN(parseInt(path[i + 1], 10));
      
      if (nextIsNumber) {
        current[part] = {};
      } else {
        current[part] = {};
      }
    }
    
    current = current[part];
  }
  
  // Set the value at the deepest level
  current[path[path.length - 1]] = value;
} 