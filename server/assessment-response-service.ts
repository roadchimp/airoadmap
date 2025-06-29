import { storage } from './storage';
import { InsertAssessmentResponse, WizardStepData } from '../shared/schema';

/**
 * Service to handle assessment responses
 */
export class AssessmentResponseService {
  /**
   * Save responses for a specific assessment step
   * @param assessmentId The assessment ID
   * @param userId The user ID
   * @param stepId The wizard step ID (e.g., 'basics', 'roles')
   * @param stepData The data for this step
   */
  static async saveStepResponses(
    assessmentId: number,
    userId: number,
    stepId: string,
    stepData: any
  ): Promise<void> {
    // Delete any existing responses for this step and assessment
    // Not implemented yet as we don't have a delete method
    
    // Convert the step data to individual responses
    const responses = this.convertStepDataToResponses(
      assessmentId,
      userId,
      stepId,
      stepData
    );
    
    // Save the responses in batch
    if (responses.length > 0) {
      await storage.batchCreateAssessmentResponses(responses);
    }
  }
  
  /**
   * Convert step data to individual responses
   */
  private static convertStepDataToResponses(
    assessmentId: number,
    userId: number,
    stepId: string,
    stepData: any
  ): InsertAssessmentResponse[] {
    const responses: InsertAssessmentResponse[] = [];
    
    // Handle different step types differently
    switch (stepId) {
      case 'basics':
        this.processBasicsStep(assessmentId, userId, stepData, responses);
        break;
      case 'roles':
        this.processRolesStep(assessmentId, userId, stepData, responses);
        break;
      case 'painPoints':
        this.processPainPointsStep(assessmentId, userId, stepData, responses);
        break;
      case 'workVolume':
        this.processWorkVolumeStep(assessmentId, userId, stepData, responses);
        break;
      case 'techStack':
        this.processTechStackStep(assessmentId, userId, stepData, responses);
        break;
      case 'adoption':
        this.processAdoptionStep(assessmentId, userId, stepData, responses);
        break;
      default:
        console.warn(`Unknown step ID: ${stepId}`);
        break;
    }
    
    return responses;
  }
  
  /**
   * Process the 'basics' step data
   */
  private static processBasicsStep(
    assessmentId: number,
    userId: number,
    stepData: any,
    responses: InsertAssessmentResponse[]
  ): void {
    if (!stepData) return;
    
    // Handle simple string fields
    if (stepData.companyName) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'basics.companyName',
        responseText: stepData.companyName
      });
    }
    
    if (stepData.reportName) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'basics.reportName',
        responseText: stepData.reportName
      });
    }
    
    if (stepData.industry) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'basics.industry',
        responseText: stepData.industry
      });
    }
    
    if (stepData.size) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'basics.size',
        responseText: stepData.size
      });
    }
    
    if (stepData.goals) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'basics.goals',
        responseText: stepData.goals
      });
    }
    
    // Handle array fields
    if (stepData.stakeholders && Array.isArray(stepData.stakeholders)) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'basics.stakeholders',
        responseJson: stepData.stakeholders
      });
    }
  }
  
  /**
   * Process the 'roles' step data
   */
  private static processRolesStep(
    assessmentId: number,
    userId: number,
    stepData: any,
    responses: InsertAssessmentResponse[]
  ): void {
    if (!stepData) return;
    
    // Handle selected departments
    if (stepData.selectedDepartments && Array.isArray(stepData.selectedDepartments)) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'roles.selectedDepartments',
        responseJson: stepData.selectedDepartments
      });
    }
    
    // Handle selected roles
    if (stepData.selectedRoles && Array.isArray(stepData.selectedRoles)) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'roles.selectedRoles',
        responseJson: stepData.selectedRoles
      });
    }
    
    // Handle prioritized roles
    if (stepData.prioritizedRoles && Array.isArray(stepData.prioritizedRoles)) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'roles.prioritizedRoles',
        responseJson: stepData.prioritizedRoles
      });
    }
    
    // Handle custom department
    if (stepData.customDepartment) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'roles.customDepartment',
        responseText: stepData.customDepartment
      });
    }
  }
  
  /**
   * Process the 'painPoints' step data
   */
  private static processPainPointsStep(
    assessmentId: number,
    userId: number,
    stepData: any,
    responses: InsertAssessmentResponse[]
  ): void {
    if (!stepData) return;
    
    // Handle general pain points
    if (stepData.generalPainPoints) {
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: 'painPoints.generalPainPoints',
        responseText: stepData.generalPainPoints
      });
    }
    
    // Handle role-specific pain points
    if (stepData.roleSpecificPainPoints) {
      for (const [roleId, painPoints] of Object.entries(stepData.roleSpecificPainPoints)) {
        // Save the pain points for each role
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `painPoints.roleSpecificPainPoints.${roleId}`,
          responseJson: painPoints
        });
        
        // Also save individual fields for easier querying
        const typedPainPoints = painPoints as any;
        if (typedPainPoints.description) {
          responses.push({
            assessmentId,
            userId,
            questionIdentifier: `painPoints.roleSpecificPainPoints.${roleId}.description`,
            responseText: typedPainPoints.description
          });
        }
        
        if (typedPainPoints.severity !== undefined) {
          responses.push({
            assessmentId,
            userId,
            questionIdentifier: `painPoints.roleSpecificPainPoints.${roleId}.severity`,
            responseNumeric: typedPainPoints.severity
          });
        }
        
        if (typedPainPoints.frequency !== undefined) {
          responses.push({
            assessmentId,
            userId,
            questionIdentifier: `painPoints.roleSpecificPainPoints.${roleId}.frequency`,
            responseNumeric: typedPainPoints.frequency
          });
        }
        
        if (typedPainPoints.impact !== undefined) {
          responses.push({
            assessmentId,
            userId,
            questionIdentifier: `painPoints.roleSpecificPainPoints.${roleId}.impact`,
            responseNumeric: typedPainPoints.impact
          });
        }
      }
    }
  }
  
  /**
   * Process the 'workVolume' step data
   */
  private static processWorkVolumeStep(
    assessmentId: number,
    userId: number,
    stepData: any,
    responses: InsertAssessmentResponse[]
  ): void {
    if (!stepData || !stepData.roleWorkVolume) return;
    
    // Handle role work volume data
    for (const [roleId, workVolume] of Object.entries(stepData.roleWorkVolume)) {
      // Save the work volume for each role
      responses.push({
        assessmentId,
        userId,
        questionIdentifier: `workVolume.roleWorkVolume.${roleId}`,
        responseJson: workVolume
      });
      
      // Also save individual fields for easier querying
      const typedWorkVolume = workVolume as any;
      
      if (typedWorkVolume.volume) {
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `workVolume.roleWorkVolume.${roleId}.volume`,
          responseText: typedWorkVolume.volume
        });
      }
      
      if (typedWorkVolume.complexity) {
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `workVolume.roleWorkVolume.${roleId}.complexity`,
          responseText: typedWorkVolume.complexity
        });
      }
      
      if (typedWorkVolume.repetitiveness !== undefined) {
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `workVolume.roleWorkVolume.${roleId}.repetitiveness`,
          responseNumeric: typedWorkVolume.repetitiveness
        });
      }
      
      if (typedWorkVolume.dataDescription) {
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `workVolume.roleWorkVolume.${roleId}.dataDescription`,
          responseText: typedWorkVolume.dataDescription
        });
      }
    }
  }
  
  /**
   * Process the 'techStack' step data
   */
  private static processTechStackStep(
    assessmentId: number,
    userId: number,
    stepData: any,
    responses: InsertAssessmentResponse[]
  ): void {
    if (!stepData) return;
    
    // Handle string fields
    const stringFields = [
      'currentSystems', 'relevantTools', 'integrationChallenges', 
      'securityRequirements', 'dataAccessibility', 'systemsIntegration',
      'dataQuality', 'notes'
    ];
    
    for (const field of stringFields) {
      if (stepData[field]) {
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `techStack.${field}`,
          responseText: stepData[field]
        });
      }
    }
  }
  
  /**
   * Process the 'adoption' step data
   */
  private static processAdoptionStep(
    assessmentId: number,
    userId: number,
    stepData: any,
    responses: InsertAssessmentResponse[]
  ): void {
    if (!stepData) return;
    
    // Handle string fields
    const stringFields = [
      'changeReadiness', 'stakeholderAlignment', 
      'trainingNeeds', 'expectedChallenges', 'successMetrics'
    ];
    
    for (const field of stringFields) {
      if (stepData[field]) {
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `adoption.${field}`,
          responseText: stepData[field]
        });
      }
    }
    
    // Handle role adoption data
    if (stepData.roleAdoption) {
      for (const [roleId, adoption] of Object.entries(stepData.roleAdoption)) {
        // Save the adoption data for each role
        responses.push({
          assessmentId,
          userId,
          questionIdentifier: `adoption.roleAdoption.${roleId}`,
          responseJson: adoption
        });
      }
    }
  }
} 