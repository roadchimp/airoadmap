import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { calculatePrioritization } from '@/server/lib/engines/prioritizationEngine';
import type { WizardStepData, AssessmentResponse } from '@shared/schema';

// POST /api/prioritize
export async function POST(request: Request) {
  try {
    const { assessmentId } = await request.json();

    if (!assessmentId || typeof assessmentId !== 'number') {
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

    // Update assessment status to completed
    await storage.updateAssessmentStatus(assessmentId, "completed");

    return NextResponse.json(report, { status: 201 });

  } catch (error) {
    console.error('Error generating prioritization results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating prioritization results';
    return NextResponse.json({ message: errorMessage }, { status: 500 }); // Original used 500
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