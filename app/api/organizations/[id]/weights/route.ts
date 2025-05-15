import { storage } from "@/server/storage";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationScoreWeights } from "@/server/lib/aiAdoptionScoreEngine";

/**
 * GET /api/organizations/:id/weights
 * Retrieves organization score weights (will create defaults if not exists)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = parseInt(params.id, 10);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: "Invalid organization ID" }, { status: 400 });
    }

    console.log(`Processing weights request for organization ID: ${organizationId}`);
    
    // Get the organization to verify it exists
    const organization = await storage.getOrganization(organizationId);
    console.log(`Found organization:`, organization);
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Try to get weights with default fallbacks
    try {
      // Use the helper function imported from aiAdoptionScoreEngine that handles defaults
      console.log(`Fetching weights using industry: ${organization.industry || 'Other'}, companyStage: ${organization.size || 'Mature'}`);
      
      const weights = await getOrganizationScoreWeights(
        organizationId,
        organization.industry || "Other",  // Use organization's industry or default to "Other"
        organization.size || "Mature"      // Use organization's size as a proxy for company stage, or default to "Mature"
      );
      
      console.log(`Successfully retrieved weights:`, weights);
      
      return NextResponse.json({ 
        success: true,
        weights
      });
    } catch (weightsError) {
      // If there's an error with the database, just return default weights
      console.error("Error retrieving from database, using DEFAULT_WEIGHTS:", weightsError);
      
      // Use default weights as a fallback
      const defaultWeights = {
        organizationId: organizationId,
        adoptionRateWeight: 0.2,
        timeSavedWeight: 0.2,
        costEfficiencyWeight: 0.2,
        performanceImprovementWeight: 0.2,
        toolSprawlReductionWeight: 0.2,
      };
      
      return NextResponse.json({ 
        success: true,
        weights: defaultWeights
      });
    }
  } catch (error) {
    console.error("Error retrieving organization score weights:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    
    return NextResponse.json(
      { error: "Failed to retrieve organization score weights" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/:id/weights
 * Updates organization score weights 
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = parseInt(params.id, 10);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: "Invalid organization ID" }, { status: 400 });
    }

    // Get the organization to verify it exists
    const organization = await storage.getOrganization(organizationId);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Parse the weights from the request body
    const updatedWeights = await req.json();
    
    // Ensure the organizationId is correct
    updatedWeights.organizationId = organizationId;

    // Validate the weights - ensure values sum to approximately 1.0
    const sum = Number(updatedWeights.adoptionRateWeight) +
                Number(updatedWeights.timeSavedWeight) +
                Number(updatedWeights.costEfficiencyWeight) +
                Number(updatedWeights.performanceImprovementWeight) +
                Number(updatedWeights.toolSprawlReductionWeight);
    
    if (Math.abs(sum - 1.0) > 0.05) { // Allow small deviation
      return NextResponse.json(
        { error: `Weight values must sum to approximately 1.0. Current sum: ${sum.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Update the weights
    const result = await storage.upsertOrganizationScoreWeights(updatedWeights);

    return NextResponse.json({ 
      success: true,
      weights: result
    });
  } catch (error) {
    console.error("Error updating organization score weights:", error);
    return NextResponse.json(
      { error: "Failed to update organization score weights" },
      { status: 500 }
    );
  }
} 