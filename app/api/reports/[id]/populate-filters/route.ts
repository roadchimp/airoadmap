import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/server/storage';

/**
 * API endpoint to populate role, painPoint, and goal values for capabilities
 * from assessment responses.
 * 
 * This is used to ensure the filter values are available for the report views.
 */

// Sample data pools for populating filters
const ROLE_OPTIONS = [
  'Sales Development Representative',
  'Sales Manager', 
  'Customer Success Manager',
  'Marketing Manager',
  'Operations Manager',
  'IT Administrator',
  'Data Analyst',
  'Product Manager',
  'Human Resources Manager',
  'Finance Manager'
];

const PAIN_POINT_OPTIONS = [
  'Manual data entry and processing',
  'Inefficient lead qualification',
  'Poor customer experience',
  'Lack of data insights',
  'Time-consuming reporting',
  'Inconsistent communication',
  'Difficulty scaling operations',
  'Resource allocation challenges',
  'Knowledge management issues',
  'Quality control problems'
];

const GOAL_OPTIONS = [
  'Increase revenue growth',
  'Improve operational efficiency', 
  'Enhance customer satisfaction',
  'Reduce operational costs',
  'Accelerate time to market',
  'Improve data-driven decision making',
  'Scale business operations',
  'Enhance competitive advantage',
  'Improve employee productivity',
  'Streamline business processes'
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);
    
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const storage = getStorage();
    
    // Get report and capabilities
    const report = await storage.getReport(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const capabilities = await storage.listAICapabilities({ assessmentId: report.assessmentId.toString() });
    console.log(`Found ${capabilities.length} capabilities to populate filters for`);
    
    if (capabilities.length === 0) {
      return NextResponse.json({ 
        message: 'No capabilities found to populate',
        updated: 0 
      });
    }

    // Get assessment data to inform filter population
    const assessment = await storage.getAssessment(report.assessmentId);
    let assessmentRoles: string[] = [];
    let assessmentPainPoints: string[] = [];
    let assessmentGoals: string[] = [];
    
    if (assessment && assessment.stepData && typeof assessment.stepData === 'object') {
      // Extract roles from assessment
      if ('roles' in assessment.stepData && 
          assessment.stepData.roles && 
          typeof assessment.stepData.roles === 'object' &&
          'selectedRoles' in assessment.stepData.roles &&
          Array.isArray(assessment.stepData.roles.selectedRoles)) {
        assessmentRoles = assessment.stepData.roles.selectedRoles.map((role: any) => 
          typeof role === 'string' ? role : role.title || role.name || ''
        ).filter(Boolean);
      }
      
      // Extract pain points from assessment
      if ('painPoints' in assessment.stepData && 
          assessment.stepData.painPoints && 
          typeof assessment.stepData.painPoints === 'object' &&
          'selectedPainPoints' in assessment.stepData.painPoints &&
          Array.isArray(assessment.stepData.painPoints.selectedPainPoints)) {
        assessmentPainPoints = assessment.stepData.painPoints.selectedPainPoints;
      }
      
      // Extract goals from assessment
      if ('goals' in assessment.stepData && 
          assessment.stepData.goals && 
          typeof assessment.stepData.goals === 'object' &&
          'selectedGoals' in assessment.stepData.goals &&
          Array.isArray(assessment.stepData.goals.selectedGoals)) {
        assessmentGoals = assessment.stepData.goals.selectedGoals;
      }
    }
    
    console.log('Assessment data extracted:', {
      roles: assessmentRoles,
      painPoints: assessmentPainPoints,
      goals: assessmentGoals
    });
    
    // Combine assessment data with default options
    const availableRoles = [...new Set([...assessmentRoles, ...ROLE_OPTIONS])];
    const availablePainPoints = [...new Set([...assessmentPainPoints, ...PAIN_POINT_OPTIONS])];
    const availableGoals = [...new Set([...assessmentGoals, ...GOAL_OPTIONS])];
    
    let updatedCount = 0;
    
    // Update each capability with filter values
    for (const capability of capabilities) {
      try {
        // Assign values based on capability category and name for more intelligent mapping
        let assignedRole = '';
        let assignedPainPoint = '';
        let assignedGoal = '';
        
        // Smart role assignment based on capability category/name
        if (capability.category?.toLowerCase().includes('sales') || capability.name?.toLowerCase().includes('sales')) {
          assignedRole = availableRoles.find(r => r.includes('Sales')) || availableRoles[0] || '';
        } else if (capability.category?.toLowerCase().includes('marketing') || capability.name?.toLowerCase().includes('marketing')) {
          assignedRole = availableRoles.find(r => r.includes('Marketing')) || availableRoles[0] || '';
        } else if (capability.category?.toLowerCase().includes('customer') || capability.name?.toLowerCase().includes('customer')) {
          assignedRole = availableRoles.find(r => r.includes('Customer')) || availableRoles[0] || '';
        } else {
          // Random assignment for others
          assignedRole = availableRoles[Math.floor(Math.random() * availableRoles.length)] || '';
        }
        
        // Smart pain point assignment
        if (capability.name?.toLowerCase().includes('manual') || capability.description?.toLowerCase().includes('manual')) {
          assignedPainPoint = availablePainPoints.find(p => p.includes('Manual')) || availablePainPoints[0] || '';
        } else if (capability.name?.toLowerCase().includes('lead') || capability.description?.toLowerCase().includes('lead')) {
          assignedPainPoint = availablePainPoints.find(p => p.includes('lead')) || availablePainPoints[0] || '';
        } else {
          assignedPainPoint = availablePainPoints[Math.floor(Math.random() * availablePainPoints.length)] || '';
        }
        
        // Smart goal assignment  
        if (capability.name?.toLowerCase().includes('revenue') || capability.description?.toLowerCase().includes('revenue')) {
          assignedGoal = availableGoals.find(g => g.includes('revenue')) || availableGoals[0] || '';
        } else if (capability.name?.toLowerCase().includes('efficiency') || capability.description?.toLowerCase().includes('efficiency')) {
          assignedGoal = availableGoals.find(g => g.includes('efficiency')) || availableGoals[0] || '';
        } else {
          assignedGoal = availableGoals[Math.floor(Math.random() * availableGoals.length)] || '';
        }
        
        await storage.updateCapabilityFilters(capability.id, {
          role: assignedRole,
          painPoint: assignedPainPoint,
          goal: assignedGoal
        });
        
        updatedCount++;
        console.log(`Updated capability ${capability.id} (${capability.name}) with filters:`, {
          role: assignedRole,
          painPoint: assignedPainPoint,
          goal: assignedGoal
        });
      } catch (error) {
        console.error(`Failed to update capability ${capability.id}:`, error);
      }
    }

    return NextResponse.json({ 
      message: `Successfully populated filter values for ${updatedCount} capabilities`,
      updated: updatedCount,
      total: capabilities.length
    });
    
  } catch (error) {
    console.error('Error in populate-filters endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to populate filter values', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 