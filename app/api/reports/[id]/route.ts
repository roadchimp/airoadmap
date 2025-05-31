import { NextRequest, NextResponse } from 'next/server';
import { storage, ToolWithMappedCapabilities, FullAICapability } from '@/server/storage';
import { ReportWithAssessmentDetails } from '@shared/schema';

interface ReportPageData {
  report: ReportWithAssessmentDetails | null;
  capabilities: FullAICapability[];
  tools: ToolWithMappedCapabilities[];
}

// GET /api/reports/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reportId = parseInt(id, 10);

  if (isNaN(reportId)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
  }

  try {
    console.log(`Fetching report with ID: ${reportId}`);
    
    const reportDetails = await storage.getReport(reportId);

    if (!reportDetails) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    console.log(`Successfully fetched report: ${reportId}, assessmentId: ${reportDetails.assessmentId}`);

    // Fetch capabilities and tools using the assessmentId from the report details
    // Ensure reportDetails.assessmentId is valid before using it.
    let capabilities: FullAICapability[] = [];
    let tools: ToolWithMappedCapabilities[] = [];

    if (reportDetails.assessmentId) {
      console.log(`Fetching capabilities for assessmentId: ${reportDetails.assessmentId}`);
      // Fetch capabilities related to the assessment
      try {
        capabilities = await storage.getAssessmentAICapabilities(reportDetails.assessmentId);
        console.log(`Successfully fetched ${capabilities.length} capabilities with scores for assessment`);
        // Enhanced logging to debug capability data
        if (capabilities.length > 0) {
          console.log(`Sample capability data:`, JSON.stringify(capabilities[0], null, 2));
        } else {
          console.log(`No capabilities found with scores for assessment ${reportDetails.assessmentId}`);
        }
      } catch (capError) {
        console.error(`Error fetching capabilities with assessment data: ${capError}`);
        // Fall back to global capabilities if assessment-specific fetch fails
        try {
          capabilities = await storage.listAICapabilities({ assessmentId: String(reportDetails.assessmentId) });
          console.log(`Fallback: fetched ${capabilities.length} global capabilities`);
        } catch (fallbackError) {
          console.error(`Error in fallback capability fetch: ${fallbackError}`);
          capabilities = [];
        }
      }
      
      // Fetch tools relevant to the assessment (if applicable)
      try {
        tools = await storage.getTools({ assessmentId: String(reportDetails.assessmentId) });
        console.log(`Successfully fetched ${tools.length} tools`);
      } catch (toolsError) {
        console.error(`Error fetching tools: ${toolsError}`);
        tools = [];
      }
    } else {
      // Fallback if no assessmentId, though this case should ideally not happen for a valid report
      console.warn(`Report ${reportId} does not have an associated assessmentId. Capabilities and tools might be empty.`);
      try {
        capabilities = await storage.listAICapabilities(); // Fetch all if no assessment context
        tools = await storage.getTools(); // Fetch all if no assessment context
      } catch (fallbackError) {
        console.error(`Error in fallback data fetch: ${fallbackError}`);
      }
    }

    const responseData: ReportPageData = {
      report: reportDetails as unknown as ReportWithAssessmentDetails, // Type cast to satisfy TypeScript
      capabilities,
      tools,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error fetching report data for ID ${reportId}:`, error);
    // More detailed error information
    const errorMessage = error instanceof Error ? 
      `${error.name}: ${error.message}\n${error.stack}` : 
      String(error);
    console.error(`Detailed error: ${errorMessage}`);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
} 