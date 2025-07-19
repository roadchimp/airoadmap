import AssessmentViewClient from "./_components/assessment-view-client";
import { PgStorage } from "@/server/pg-storage";
import { notFound } from "next/navigation";
import { IStorage } from "@/server/storage";
import { Assessment, AssessmentResponse, JobRoleWithDepartment } from "@shared/schema";

// Define params as a Promise
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssessmentViewPage({ params }: PageProps) {
  // Await the params to resolve the Promise
  const { id } = await params;
  const assessmentId = parseInt(id, 10);

  if (isNaN(assessmentId)) {
    notFound();
  }

  const storage: IStorage = new PgStorage();
  let initialAssessmentData: Assessment & { rolesDetailed?: JobRoleWithDepartment[] };
  let assessmentResponses: AssessmentResponse[];

  try {
    const [assessment, responses] = await Promise.all([
      storage.getAssessment(assessmentId),
      storage.getAssessmentResponsesByAssessment(assessmentId)
    ]);

    if (!assessment) throw new Error("Assessment not found");
    
    // Enrich roles: map selected/prioritized role IDs to full objects
    let rolesDetailed: JobRoleWithDepartment[] = [];
    const stepData = assessment.stepData && typeof assessment.stepData === 'object' ? assessment.stepData : {};
    const roles = (stepData as any).roles;
    
    console.log('Server-side - Raw roles data:', roles);
    console.log('Server-side - selectedRoles:', roles?.selectedRoles);
    
    if (roles && (roles.selectedRoles?.length || roles.prioritizedRoles?.length)) {
      // Collect all unique role IDs referenced
      const roleIds = [
        ...(roles.selectedRoles || []),
        ...(roles.prioritizedRoles || [])
      ]
        .map(r => typeof r === 'number' ? r : (typeof r === 'object' && r?.id ? r.id : null))
        .filter((v, i, a) => v != null && a.indexOf(v) === i);
      
      console.log('Server-side - Extracted roleIds:', roleIds);
      
      if (roleIds.length > 0) {
        const allRoles = await storage.listJobRoles();
        console.log('Server-side - All roles from storage:', allRoles.map(r => ({ id: r.id, title: r.title })));
        
        rolesDetailed = allRoles.filter(r => roleIds.includes(r.id));
        console.log('Server-side - Filtered rolesDetailed:', rolesDetailed.map(r => ({ id: r.id, title: r.title })));
        
        // Replace selectedRoles with full role objects for frontend
        if (roles.selectedRoles) {
          roles.selectedRoles = rolesDetailed.filter(role => 
            roles.selectedRoles.some((id: any) => 
              typeof id === 'number' ? id === role.id : (typeof id === 'object' && id?.id === role.id)
            )
          );
          console.log('Server-side - Updated selectedRoles:', roles.selectedRoles.map((r: any) => ({ id: r.id, title: r.title })));
        }
      }
    } else {
      console.log('Server-side - No roles found or roles array is empty');
    }

    console.log('Server-side - Final rolesDetailed:', rolesDetailed.map(r => ({ id: r.id, title: r.title })));
    
    initialAssessmentData = { ...assessment, rolesDetailed };
    assessmentResponses = responses;
  } catch (error) {
    console.error("Failed to fetch assessment data:", error);
    notFound();
  }

  // Fetch all required data in parallel
  const [report, capabilities, tools] = await Promise.all([
    storage.getReportByAssessment(assessmentId),
    storage.listAICapabilities(),
    storage.getTools({ assessmentId: assessmentId.toString() })
  ]);

  return (
    <AssessmentViewClient 
      assessment={initialAssessmentData} 
      report={report || null}
      capabilities={capabilities}
      tools={tools}
    />
  );
}

// Update generateMetadata to handle Promise
export async function generateMetadata({ params }: PageProps) {
  // Await the params here too
  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  
  if (isNaN(assessmentId)) return { title: 'Assessment Not Found' };
  
  const storage: IStorage = new PgStorage();
  const assessment = await storage.getAssessment(assessmentId);
  
  return {
    title: assessment ? `View Assessment: ${assessment.title}` : 'Assessment Not Found',
  };
} 