import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

/**
 * API endpoint to populate role, painPoint, and goal values for capabilities
 * from assessment responses.
 * 
 * This is used to ensure the filter values are available for the report views.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    // Get the report to find the associated assessment
    const report = await storage.getReport(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const assessmentId = report.assessmentId;
    
    // Get assessment responses
    const responses = await storage.getAssessmentResponsesByAssessment(assessmentId);
    if (!responses || responses.length === 0) {
      return NextResponse.json({ error: 'No assessment responses found' }, { status: 404 });
    }

    // Get capabilities for this assessment
    const capabilities = await storage.getAssessmentAICapabilities(assessmentId);
    
    // Extract role, painPoint, and goal values from responses
    const roleResponses = responses.filter(r => r.questionIdentifier.includes('role'));
    const painPointResponses = responses.filter(r => r.questionIdentifier.includes('pain') || r.questionIdentifier.includes('challenge'));
    const goalResponses = responses.filter(r => r.questionIdentifier.includes('goal') || r.questionIdentifier.includes('objective'));

    // Log what we found for debugging
    console.log(`Found ${roleResponses.length} role responses, ${painPointResponses.length} pain point responses, ${goalResponses.length} goal responses`);
    
    // Extract values - use responseText instead of response
    const roles = roleResponses.map(r => r.responseText).filter(Boolean);
    const painPoints = painPointResponses.map(r => r.responseText).filter(Boolean);
    const goals = goalResponses.map(r => r.responseText).filter(Boolean);

    // Update capabilities with these values
    // This is a simplified approach - in a real implementation, you'd want to
    // match capabilities to specific roles, pain points, and goals more intelligently
    const updates = [];
    for (const capability of capabilities) {
      // For simplicity, we're just assigning the first value of each type to each capability
      // In a real implementation, you'd want to be more sophisticated about this mapping
      const update = {
        id: capability.id,
        role: roles.length > 0 ? roles[0] : null,
        painPoint: painPoints.length > 0 ? painPoints[0] : null,
        goal: goals.length > 0 ? goals[0] : null
      };
      
      // Update the capability in the database
      // Note: You'll need to add a method to storage.ts to support this update
      // updates.push(storage.updateCapabilityFilters(update.id, update));
      
      // For now, just log what we would update
      updates.push(update);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Found ${roles.length} roles, ${painPoints.length} pain points, ${goals.length} goals`,
      updates: updates.slice(0, 5) // Just show a sample of the updates
    });
  } catch (error) {
    console.error('Error populating filters:', error);
    return NextResponse.json({ error: 'Failed to populate filters' }, { status: 500 });
  }
} 