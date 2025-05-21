import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { eq, sql, asc, and, inArray } from 'drizzle-orm';
// Using dynamic import for pg which works better with ESM
import { IStorage, ReportWithMetricsAndRules, FullAICapability, ToolWithMappedCapabilities, AiTool as BaseAiTool } from './storage.ts';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { z } from 'zod'; // Import z for z.infer

// Import Drizzle schema tables and schemas (values)
import { 
  assessments, departments, organizations, users, reports, 
  aiCapabilitiesTable, // Corrected: Was aiCapabilities, should be aiCapabilitiesTable
  jobRoles, jobDescriptions, jobScraperConfigs,
  aiTools as aiToolsTable, // Already aliased
  capabilityToolMapping, assessmentScores, assessmentResponses,
  insertAssessmentSchema,
  userProfiles,
  
  // Import new tables and schemas (values)
  performanceMetrics,
  jobRolePerformanceMetrics,
  metricRules,
  insertPerformanceMetricSchema,
  insertMetricRuleSchema,
  insertJobRolePerformanceMetricSchema,
  organizationScoreWeights as organizationScoreWeightsTable,
  insertOrganizationScoreWeightsSchema as dzInsertOrganizationScoreWeightsSchema,

  // New join tables
  capabilityJobRoles,
  capabilityRoleImpacts

} from '../shared/schema.ts';

// Import types that are explicitly exported from shared/schema.ts
import type {
  User, InsertUser,
  Organization, InsertOrganization,
  Department, InsertDepartment,
  JobRole as BaseJobRole, // Renamed to avoid potential conflicts if we enrich it
  InsertJobRole, JobRoleWithDepartment,
  AICapability as BaseAICapability, // Renamed for clarity
  InsertAICapability,
  Assessment, InsertAssessment, WizardStepData,
  Report, InsertReport,
  JobDescription, InsertJobDescription, ProcessedJobContent,
  JobScraperConfig, InsertJobScraperConfig,
  AiTool, 
  InsertAiTool, 
  CapabilityToolMapping as CapabilityToolMappingType, // Type for the join table
  InsertCapabilityToolMapping,
  AssessmentScoreData,
  AssessmentResponse, InsertAssessmentResponse,
  ReportWithAssessmentDetails,
  PerformanceMetrics, 
  JobRolePerformanceMetrics as JobRolePerformanceMetricsType, 
  MetricRules, 
  OrganizationScoreWeights,
  InsertOrganizationScoreWeights,
  UserProfile,
  InsertUserProfile,
  CapabilityJobRole as CapabilityJobRoleType,
  CapabilityRoleImpact as CapabilityRoleImpactType

} from '../shared/schema.ts';

// Load root .env file for local development
if (process.env.NODE_ENV === 'development') {
  // Ensure dotenv is only loaded if not on Vercel
  if (!process.env.VERCEL_ENV) {
     dotenv.config({ path: '.env' }); 
  }
}

export class PgStorage implements IStorage {
  private db: any; // Drizzle instance
  private pool: Pool | undefined; // Only used for local pg
  private isInitialized: boolean = false;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    try {
      let connectionString: string | undefined;

      // Use Neon connection string on Vercel
      if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
        console.log('Initializing Neon HTTP database connection for Vercel');
        connectionString = process.env.DATABASE_POSTGRES_URL; 
        if (!connectionString) {
          throw new Error('DATABASE_POSTGRES_URL environment variable not set for Vercel environment');
        }
        const sql = neon(connectionString);
        this.db = drizzleNeonHttp(sql);
        this.isInitialized = true;
        console.log('Neon HTTP database connection established');
      } else {
        // Use local DATABASE_URL for local development
        console.log('Initializing standard PostgreSQL connection for local development');
        connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL environment variable not set for local development (check .env file)');
        }
        const pg = await import('pg');
        this.pool = new pg.Pool({ connectionString });
        this.db = drizzleNodePostgres(this.pool);
        this.isInitialized = true;
        console.log('Standard PostgreSQL database connection established');
      }
    } catch (error) {
      console.error('Error initializing database connection:', error);
      throw error;
    }
  }

  // Helper method to ensure DB is initialized before any operation
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initPromise;
    }
  }

  async disconnect(): Promise<void> {
    // Only need to disconnect the pool for local pg connections
    if (this.pool) {
      await this.pool.end();
      console.log('Standard PostgreSQL database connection closed');
    }
    this.isInitialized = false;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  // User Profile methods
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    await this.ensureInitialized();
    const result = await this.db.insert(userProfiles).values(profile).returning();
    return result[0];
  }

  async getUserProfileByAuthId(authId: string): Promise<UserProfile | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(userProfiles).where(eq(userProfiles.auth_id, authId));
    return result[0];
  }

  // Organization methods
  async getOrganization(id: number, authId?: string): Promise<Organization | undefined> {
    await this.ensureInitialized();
    await this.setAuthContext(authId);
    const result = await this.db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }

  async listOrganizations(authId?: string): Promise<Organization[]> {
    await this.ensureInitialized();
    await this.setAuthContext(authId);
    return await this.db.select().from(organizations);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await this.db.insert(organizations).values(org).returning();
    return result[0];
  }

  async deleteOrganization(id: number): Promise<void> {
    await this.ensureInitialized();
    
    // First check if organization exists to prevent error on non-existent ID
    const result = await this.db.select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, id));
  
    if (result.length > 0) {
      await this.db.delete(organizations).where(eq(organizations.id, id));
      console.log(`Deleted organization with ID: ${id}`);
    } else {
      console.warn(`Organization with ID ${id} not found for deletion`);
    }
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await this.db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async listDepartments(): Promise<Department[]> {
    return await this.db.select().from(departments);
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const result = await this.db.insert(departments).values(dept).returning();
    return result[0];
  }

  // JobRole methods
  async getJobRole(id: number): Promise<BaseJobRole | undefined> {
    const result = await this.db.select().from(jobRoles).where(eq(jobRoles.id, id));
    return result[0];
  }

  async listJobRoles(): Promise<JobRoleWithDepartment[]> {
    // Join jobRoles with departments and select department name
    return await this.db
      .select({
        ...jobRoles, // Select all columns from jobRoles
        departmentName: departments.name // Select department name as departmentName
      })
      .from(jobRoles)
      .leftJoin(departments, eq(jobRoles.departmentId, departments.id))
      .orderBy(asc(jobRoles.title)); // Optional: order by title
  }

  async listJobRolesByDepartment(departmentId: number): Promise<JobRoleWithDepartment[]> {
    // Join jobRoles with departments and select department name, filtered by departmentId
    return await this.db
      .select({
        ...jobRoles, // Select all columns from jobRoles
        departmentName: departments.name // Select department name as departmentName
      })
      .from(jobRoles)
      .leftJoin(departments, eq(jobRoles.departmentId, departments.id))
      .where(eq(jobRoles.departmentId, departmentId))
      .orderBy(asc(jobRoles.title)); // Optional: order by title
  }

  async createJobRole(role: InsertJobRole): Promise<BaseJobRole> {
    const result = await this.db.insert(jobRoles).values(role).returning();
    return result[0];
  }

  // AICapability methods
  async getAICapability(id: number): Promise<FullAICapability | undefined> {
    await this.ensureInitialized();
    
    const capabilityResult = await this.db
      .select()
      .from(aiCapabilitiesTable)
      .where(eq(aiCapabilitiesTable.id, id))
      .limit(1);

    if (!capabilityResult.length) {
      return undefined;
    }
    const baseCapability = capabilityResult[0] as BaseAICapability;

    // Fetch Applicable Roles
    const roleRecords = await this.db
      .select({
        id: jobRoles.id,
        title: jobRoles.title,
        departmentId: jobRoles.departmentId,
        description: jobRoles.description,
        keyResponsibilities: jobRoles.keyResponsibilities,
        aiPotential: jobRoles.aiPotential,
      })
      .from(capabilityJobRoles)
      .innerJoin(jobRoles, eq(capabilityJobRoles.jobRoleId, jobRoles.id))
      .where(eq(capabilityJobRoles.capabilityId, baseCapability.id));
    
    const applicableRoles: BaseJobRole[] = roleRecords;

    // Fetch Role Impacts
    const impactRecords = await this.db
      .select()
      .from(capabilityRoleImpacts)
      .where(eq(capabilityRoleImpacts.capabilityId, baseCapability.id));
    
    const roleImpact: Record<string, number> = {};
    impactRecords.forEach((record: CapabilityRoleImpactType) => {
      // Assuming jobRoleId is a number, convert to string for Record key
      roleImpact[String(record.jobRoleId)] = parseFloat(record.impactScore); 
    });

    // Fetch Recommended Tools
    const toolRecords = await this.db
      .select({
        tool_id: aiToolsTable.tool_id,
        tool_name: aiToolsTable.tool_name,
        primary_category: aiToolsTable.primary_category,
        license_type: aiToolsTable.license_type,
        description: aiToolsTable.description,
        website_url: aiToolsTable.website_url,
        tags: aiToolsTable.tags,
        // capability_id: capabilityToolMapping.capability_id // Not needed directly on tool
      })
      .from(capabilityToolMapping)
      .innerJoin(aiToolsTable, eq(capabilityToolMapping.tool_id, aiToolsTable.tool_id))
      .where(eq(capabilityToolMapping.capability_id, baseCapability.id));

    const recommendedTools: AiTool[] = toolRecords;

    return {
      ...baseCapability,
      applicableRoles,
      roleImpact,
      recommendedTools,
    };
  }

  async listAICapabilities(options?: { assessmentId?: string; roleIds?: string[]; categoryFilter?: string[] }): Promise<FullAICapability[]> {
    await this.ensureInitialized();
    
    let query = this.db.select({
      // Select all fields from aiCapabilitiesTable
      ...aiCapabilitiesTable,
      // Use json_agg for related entities if possible, or fetch separately
      // For simplicity now, fetching applicableRoles per capability later or via a complex view
    }).from(aiCapabilitiesTable);

    const conditions = [];
    if (options?.categoryFilter && options.categoryFilter.length > 0) {
      conditions.push(inArray(aiCapabilitiesTable.category, options.categoryFilter));
    }
    // TODO: Add filtering for assessmentId and roleIds if necessary.
    // This would likely involve joins with assessment-related tables or capabilityJobRoles.
    // For assessmentId, it depends on how capabilities are linked to assessments.
    // For roleIds, a join with capabilityJobRoles would be needed:
    // if (options?.roleIds && options.roleIds.length > 0) {
    //   const subQuery = this.db.selectDistinct({ capId: capabilityJobRoles.capabilityId })
    //     .from(capabilityJobRoles)
    //     .where(inArray(capabilityJobRoles.jobRoleId, options.roleIds.map(id => parseInt(id,10)))); // Ensure roleIds are numbers
    //   conditions.push(inArray(aiCapabilitiesTable.id, subQuery.map(r => r.capId)));
    // }

    if (options?.assessmentId) {
      conditions.push(eq(aiCapabilitiesTable.assessmentId, parseInt(options.assessmentId, 10)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const baseCapabilitiesResults = await query as BaseAICapability[];

    // Efficiently fetch related data for all capabilities
    if (baseCapabilitiesResults.length === 0) {
      return [];
    }

    const capabilityIds = baseCapabilitiesResults.map(c => c.id);

    // Fetch all applicable roles for these capabilities
    const allApplicableRolesRecords = await this.db
      .select()
      .from(capabilityJobRoles)
      .innerJoin(jobRoles, eq(capabilityJobRoles.jobRoleId, jobRoles.id))
      .where(inArray(capabilityJobRoles.capabilityId, capabilityIds));

    const rolesByCapabilityId = new Map<number, BaseJobRole[]>();
    allApplicableRolesRecords.forEach((record: { capability_job_roles: CapabilityJobRoleType, job_roles: BaseJobRole }) => {
      const capId = record.capability_job_roles.capabilityId;
      if (!rolesByCapabilityId.has(capId)) {
        rolesByCapabilityId.set(capId, []);
      }
      rolesByCapabilityId.get(capId)!.push(record.job_roles as BaseJobRole);
    });
    
    // Fetch all recommended tools for these capabilities
    const allRecommendedToolsRecords = await this.db
      .select({
          capabilityId: capabilityToolMapping.capability_id, // Keep capabilityId for mapping
          tool_id: aiToolsTable.tool_id,
          tool_name: aiToolsTable.tool_name,
          primary_category: aiToolsTable.primary_category,
          license_type: aiToolsTable.license_type,
          description: aiToolsTable.description,
          website_url: aiToolsTable.website_url,
          tags: aiToolsTable.tags,
      })
      .from(capabilityToolMapping)
      .innerJoin(aiToolsTable, eq(capabilityToolMapping.tool_id, aiToolsTable.tool_id))
      .where(inArray(capabilityToolMapping.capability_id, capabilityIds));

    const toolsByCapabilityId = new Map<number, AiTool[]>();
    allRecommendedToolsRecords.forEach((record: AiTool & { capabilityId: number }) => {
        const capId = record.capabilityId;
        if (!toolsByCapabilityId.has(capId)) {
            toolsByCapabilityId.set(capId, []);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { capabilityId, ...toolData } = record; // Exclude capabilityId from tool object
        toolsByCapabilityId.get(capId)!.push(toolData as AiTool);
    });
    
    // Note: RoleImpacts are not typically fetched in a list view due to volume, 
    // but if needed, a similar pattern to applicableRoles/recommendedTools could be used.

    const fullCapabilities: FullAICapability[] = baseCapabilitiesResults.map(bc => ({
      ...bc,
      applicableRoles: rolesByCapabilityId.get(bc.id) || [],
      recommendedTools: toolsByCapabilityId.get(bc.id) || [],
      roleImpact: undefined, // Explicitly set to undefined for list view
      // roleImpact would be fetched in getAICapability or if explicitly needed here
    }));
    
    return fullCapabilities;
  }

  async createAICapability(capability: InsertAICapability): Promise<BaseAICapability> {
    await this.ensureInitialized();
    const result = await this.db.insert(aiCapabilitiesTable).values(capability).returning();
    return result[0];
  }

  // Assessment methods
  async getAssessment(id: number): Promise<Assessment | undefined> {
    try {
      const result = await this.db.select({
        id: assessments.id,
        title: assessments.title,
        organizationId: assessments.organizationId,
        userId: assessments.userId,
        status: assessments.status,
        createdAt: assessments.createdAt,
        updatedAt: assessments.updatedAt,
        stepData: assessments.stepData,
        industry: assessments.industry,
        industryMaturity: assessments.industryMaturity,
        companyStage: assessments.companyStage,
        strategicFocus: assessments.strategicFocus,
        aiAdoptionScoreInputs: assessments.aiAdoptionScoreInputs
      }).from(assessments).where(eq(assessments.id, id));
      
      if (result.length > 0 && result[0] !== undefined) {
        const assessmentData = result[0] as Assessment;
        if (assessmentData.updatedAt === null || assessmentData.updatedAt === undefined) {
            assessmentData.updatedAt = assessmentData.createdAt || new Date();
        }
        return assessmentData;
      }
      return undefined;

    } catch (error) {
      console.error(`PgStorage.getAssessment(${id}) error:`, error);
      if (error instanceof Error && error.message.includes('updated_at') && !error.message.includes('industry')) {
        console.warn('Missing updated_at column in assessments table. Fetching with raw SQL workaround.');
        const rawResult = await this.db.execute(
          sql`SELECT id, title, organization_id, user_id, status, created_at, updated_at as db_updated_at, step_data, 
                     industry, industry_maturity, company_stage, strategic_focus, ai_adoption_score_inputs 
              FROM assessments
              WHERE id = ${id}`
        );
        
        if (rawResult.rows.length === 0) return undefined;
        
        const row: any = rawResult.rows[0];
        return {
          id: row.id,
          title: row.title,
          organizationId: row.organization_id,
          userId: row.user_id,
          status: row.status,
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
          updatedAt: row.db_updated_at ? new Date(row.db_updated_at) : (row.created_at ? new Date(row.created_at) : new Date()),
          stepData: row.step_data || {},
          industry: row.industry,
          industryMaturity: row.industry_maturity,
          companyStage: row.company_stage,
          strategicFocus: row.strategic_focus,
          aiAdoptionScoreInputs: row.ai_adoption_score_inputs || {}
        } as Assessment;
      }
      throw error;
    }
  }

  async listAssessments(): Promise<Assessment[]> {
    // Try to get assessments, but handle missing updated_at column
    try {
      return await this.db.select().from(assessments);
    } catch (error) {
      // If error is about missing updated_at column
      if (error instanceof Error && error.message.includes('updated_at')) {
        console.error('Missing updated_at column in assessments table. Fetching with workaround.');
        // Use SQL query to select all columns except updated_at
        const result = await this.db.execute(
          sql`SELECT id, title, organization_id, user_id, status, created_at, step_data 
              FROM assessments`
        );
        // Add a default updated_at value to match the schema
        return result.rows.map((row: any) => ({
          ...row,
          updatedAt: row.created_at || new Date(),
        }));
      }
      // Re-throw other errors
      throw error;
    }
  }

  async listAssessmentsByUser(userId: number): Promise<Assessment[]> {
    // Try to get assessments, but handle missing updated_at column
    try {
      return await this.db.select().from(assessments).where(eq(assessments.userId, userId));
    } catch (error) {
      // If error is about missing updated_at column
      if (error instanceof Error && error.message.includes('updated_at')) {
        console.error('Missing updated_at column in assessments table. Fetching with workaround.');
        // Use SQL query to select all columns except updated_at
        const result = await this.db.execute(
          sql`SELECT id, title, organization_id, user_id, status, created_at, step_data 
              FROM assessments
              WHERE user_id = ${userId}`
        );
        // Add a default updated_at value to match the schema
        return result.rows.map((row: any) => ({
          ...row,
          updatedAt: row.created_at || new Date(),
        }));
      }
      // Re-throw other errors
      throw error;
    }
  }

  async createAssessment(assessmentInput: InsertAssessment): Promise<Assessment> {
    const result = await this.db.insert(assessments).values({
      ...assessmentInput,
      status: assessmentInput.status || 'draft',
      stepData: assessmentInput.stepData || {},
      updatedAt: new Date(), // Explicitly set updatedAt on creation too, or ensure schema default handles it
      createdAt: new Date(), // Explicitly set createdAt, or ensure schema default handles it
    }).returning();
    return result[0];
  }

  async updateAssessmentStep(id: number, partialStepData: Partial<WizardStepData>): Promise<Assessment> {
    await this.ensureInitialized();
    const current = await this.getAssessment(id);
    if (!current) {
      throw new Error(`Assessment with ID ${id} not found`);
    }

    // Initialize the main update payload for the assessment record
    const assessmentUpdatePayload: Partial<Omit<Assessment, 'id' | 'createdAt' | 'stepData'> & { updatedAt?: Date }> = {
        updatedAt: new Date(), // Always update the timestamp
    };

    // Deep clone existing step_data to merge with new partial data
    const newStepDataJson = current.stepData ? JSON.parse(JSON.stringify(current.stepData)) : {};
    
    // Handle special field aiAdoptionScoreInputs if present
    if ('aiAdoptionScoreInputs' in partialStepData && partialStepData.aiAdoptionScoreInputs !== undefined) {
      // Update the top-level aiAdoptionScoreInputs field
      assessmentUpdatePayload.aiAdoptionScoreInputs = partialStepData.aiAdoptionScoreInputs;
      // Also store in stepData for consistent access patterns
      newStepDataJson.aiAdoptionScoreInputs = partialStepData.aiAdoptionScoreInputs;
      // Remove from partialStepData to avoid processing again in the loop below
      delete (partialStepData as any).aiAdoptionScoreInputs;
    }

    // Iterate over the keys in the provided partialStepData (e.g., 'basics', 'roles')
    for (const stepKey in partialStepData) {
        if (Object.prototype.hasOwnProperty.call(partialStepData, stepKey)) {
            const key = stepKey as keyof WizardStepData;
            const dataForThisStep = partialStepData[key];
            newStepDataJson[key] = dataForThisStep; // Update the JSON for this specific step

            // If this is the 'basics' step, extract data for dedicated columns
            if (key === 'basics' && dataForThisStep) {
                const basicsData = dataForThisStep as WizardStepData['basics'];
                if (basicsData) {
                    if (basicsData.industry !== undefined) assessmentUpdatePayload.industry = basicsData.industry;
                    if (basicsData.industryMaturity !== undefined) assessmentUpdatePayload.industryMaturity = basicsData.industryMaturity;
                    if (basicsData.companyStage !== undefined) assessmentUpdatePayload.companyStage = basicsData.companyStage;
                    // Assuming 'stakeholders' from wizard basics maps to 'strategicFocus' dedicated column
                    // If 'strategicFocus' is a distinct field in `basicsData`, use that instead.
                    if (basicsData.stakeholders !== undefined) assessmentUpdatePayload.strategicFocus = basicsData.stakeholders;
                    if (basicsData.reportName !== undefined) assessmentUpdatePayload.title = basicsData.reportName; // Update title if reportName changes
                    // Note: organizationId would likely be set at creation and not change here.
                    // status might be updated elsewhere or through a specific field in a step
                }
            }
             // If any step data includes a status update (less common for this specific function)
            if (typeof dataForThisStep === 'object' && dataForThisStep !== null && 'status' in dataForThisStep) {
                assessmentUpdatePayload.status = (dataForThisStep as any).status;
            }
        }
    }
    
    // Add the merged step_data to the main payload
    (assessmentUpdatePayload as any).stepData = newStepDataJson;

    const result = await this.db.update(assessments)
      .set(assessmentUpdatePayload)
      .where(eq(assessments.id, id))
      .returning();

    return result[0];
  }

  async updateAssessmentStatus(id: number, status: string): Promise<Assessment> {
    const result = await this.db.update(assessments)
      .set({ status })
      .where(eq(assessments.id, id))
      .returning();
    
    return result[0];
  }

  async updateAssessmentUserID(id: number, userId: number): Promise<Assessment> {
    console.log(`Updating assessment ID ${id} with default user ID ${userId}`);
    const result = await this.db.update(assessments)
      .set({ userId })
      .where(eq(assessments.id, id))
      .returning();
    
    return result[0];
  }

  async deleteAssessment(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.db.delete(assessments).where(eq(assessments.id, id));
    // Optional: Add logging or check result if needed
    console.log(`Deleted assessment with ID: ${id}`);
  }
  // Report methods
  async getReport(id: number): Promise<ReportWithMetricsAndRules | undefined> {
    await this.ensureInitialized();
    
    // First, get the basic report to find the assessmentId
    const reportResult = await this.db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (reportResult.length === 0 || !reportResult[0]) {
      return undefined;
    }
    
    // Use getReportByAssessment to get the full report data
    const assessmentId = reportResult[0].assessmentId;
    const fullReport = await this.getReportByAssessment(assessmentId);
    
    // If found, return with the correct ID
    if (fullReport) {
      return {
        ...fullReport,
        id: id // Ensure we return the correct report ID
      };
    }
    
    return undefined;
  }

  async getReportByAssessment(assessmentId: number): Promise<ReportWithMetricsAndRules | undefined> {
    await this.ensureInitialized();
    
    // 1. Fetch the base report and assessment details
    const reportResult = await this.db
      .select({
        ...reports,
        assessmentTitle: assessments.title,
        industry: assessments.industry,
        industryMaturity: assessments.industryMaturity,
        companyStage: assessments.companyStage,
        strategicFocus: assessments.strategicFocus,
        organizationName: organizations.name,
      })
      .from(reports)
      .leftJoin(assessments, eq(reports.assessmentId, assessments.id))
      .leftJoin(organizations, eq(assessments.organizationId, organizations.id))
      .where(eq(reports.assessmentId, assessmentId))
      .limit(1);

    if (reportResult.length === 0 || !reportResult[0]) {
      return undefined; // Report or associated assessment not found
    }

    const reportWithAssessment = reportResult[0] as unknown as ReportWithAssessmentDetails;
    
    // Get the full assessment
    const assessmentResult = await this.db
      .select()
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);
      
    const assessment = assessmentResult[0];
    if (!assessment) {
      return undefined;
    }
    
    // Add assessment to the report
    const reportWithAssessmentAndDetails = {
      ...reportWithAssessment,
      assessment
    } as ReportWithMetricsAndRules;
    
    // Ensure stepData is treated as WizardStepData type
    const stepData = assessment.stepData as WizardStepData | null;

    // 2. Extract selected JobRole IDs from stepData (assuming they are stored in stepData.roles as an array of objects with id)
    // Safely access roles and map to IDs, defaulting to an empty array if roles is null, undefined, or not an array
    const selectedJobRoleIds: number[] = Array.isArray(stepData?.roles) 
      ? stepData.roles.map((role: { id?: number }) => role.id).filter((id): id is number => id !== undefined) 
      : [];

    let selectedRoles: BaseJobRole[] = [];
    // RENAME this variable to avoid collision with the imported table schema
    let fetchedPerformanceMetrics: PerformanceMetrics[] = [];
    let metricRulesList: MetricRules[] = []; // Rename to avoid collision

    // 3. Fetch selected JobRoles and their associated PerformanceMetrics if IDs exist
    if (selectedJobRoleIds.length > 0) {
      // Fetch the JobRole details
      selectedRoles = await this.db.select().from(jobRoles).where(inArray(jobRoles.id, selectedJobRoleIds));

      // Fetch PerformanceMetrics linked to these JobRoles
      // This requires joining jobRolePerformanceMetrics and performanceMetrics tables
      const linkedMetrics = await this.db
        .select({ pm: performanceMetrics }) // Here 'performanceMetrics' refers to the TABLE schema
        .from(jobRolePerformanceMetrics)
        // Here 'performanceMetrics' refers to the TABLE schema
        .innerJoin(performanceMetrics, eq(jobRolePerformanceMetrics.performanceMetricId, performanceMetrics.id))
        .where(inArray(jobRolePerformanceMetrics.jobRoleId, selectedJobRoleIds));

      // Assign to the new variable name
      fetchedPerformanceMetrics = linkedMetrics.map((lm: { pm: PerformanceMetrics }) => lm.pm);
    }

    // 4. Fetch all MetricRules - using a simpler query to avoid SQL syntax errors
    try {
      metricRulesList = await this.db.select().from(metricRules);
    } catch (error) {
      console.error('Error fetching metric rules:', error);
      metricRulesList = []; // Default to empty array on error
    }

    // 5. Construct and return the composite object
    return {
      ...reportWithAssessmentAndDetails,
      selectedRoles: selectedRoles,
      performanceMetrics: fetchedPerformanceMetrics, // Use the renamed variable
      metricRules: metricRulesList, // Use the renamed variable
    };
  }

  async listReports(): Promise<Report[]> {
    await this.ensureInitialized();
    try {
      // Try to use Drizzle ORM first
      return await this.db.select().from(reports);
    } catch (error) {
      console.error('Error fetching reports with Drizzle:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      
      // If the error is related to missing columns, try a direct SQL query
      if (errorMessage.includes('column') || errorMessage.includes('does not exist')) {
        try {
          console.log('Using fallback SQL query for reports');
          const result = await this.db.execute(sql`
            SELECT 
              id, 
              assessment_id as "assessmentId", 
              generated_at as "generatedAt", 
              executive_summary as "executiveSummary", 
              prioritization_data as "prioritizationData", 
              ai_suggestions as "aiSuggestions", 
              performance_impact as "performanceImpact", 
              consultant_commentary as "consultantCommentary"
            FROM reports
          `);
          
          return result;
        } catch (fallbackError) {
          console.error('Fallback SQL query failed:', fallbackError);
          return [];
        }
      }
      
      // If not a column error, rethrow
      throw error;
    }
  }

  async createReport(report: InsertReport): Promise<Report> {
    await this.ensureInitialized();
    const result = await this.db.insert(reports).values(report).returning();
    return result[0];
  }

  async updateReportCommentary(id: number, commentary: string): Promise<Report> {
    await this.ensureInitialized();
    
    const result = await this.db.update(reports)
      .set({ 
        consultantCommentary: commentary,
        updatedAt: new Date()
      })
      .where(eq(reports.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Report with id ${id} not found`);
    }
    
    return result[0];
  }

  async updateReport(id: number, reportUpdate: Partial<InsertReport>): Promise<Report> {
    await this.ensureInitialized();
    
    // Create a clean update object, ensuring updatedAt is set
    const updateData = {
      ...reportUpdate,
      updatedAt: new Date()
    };
    
    // Remove any fields that should not be updated directly
    if ('id' in updateData) delete updateData.id;
    if ('assessmentId' in updateData) delete updateData.assessmentId;
    if ('createdAt' in updateData) delete updateData.createdAt;
    
    const result = await this.db.update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Report with id ${id} not found`);
    }
    
    return result[0];
  }

  // Job Description methods
  async getJobDescription(id: number): Promise<JobDescription | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(jobDescriptions).where(eq(jobDescriptions.id, id));
    return result[0];
  }

  async listJobDescriptions(limit: number = 100, offset: number = 0): Promise<JobDescription[]> {
    await this.ensureInitialized();
    return await this.db.select().from(jobDescriptions).limit(limit).offset(offset);
  }

  async listJobDescriptionsByStatus(status: string, limit: number = 100, offset: number = 0): Promise<JobDescription[]> {
    await this.ensureInitialized();
    return await this.db.select().from(jobDescriptions)
      .where(eq(jobDescriptions.status, status))
      .limit(limit)
      .offset(offset);
  }

  async createJobDescription(jobDescription: InsertJobDescription): Promise<JobDescription> {
    await this.ensureInitialized();
    console.log('PgStorage: Creating job description:', jobDescription.title);
    try {
      const now = new Date();
      
      // Ensure keywords is properly formatted as an array of strings
      const keywords = jobDescription.keywords 
        ? Array.isArray(jobDescription.keywords) 
          ? jobDescription.keywords 
          : [String(jobDescription.keywords)]
        : null;
      
      // Create a sanitized object to insert
      const sanitizedJobDescription = {
        ...jobDescription,
        status: jobDescription.status || 'raw',
        company: jobDescription.company || null,
        location: jobDescription.location || null,
        processedContent: null,
        keywords: keywords,
        dateScraped: now,
        dateProcessed: null,
        error: null
      };
      
      // Log the data we're trying to insert for debugging
      console.log('PgStorage: Inserting with data:', JSON.stringify({
        title: sanitizedJobDescription.title,
        company: sanitizedJobDescription.company,
        jobBoard: sanitizedJobDescription.jobBoard,
        keywords: sanitizedJobDescription.keywords
      }));
      
      const result = await this.db.insert(jobDescriptions).values(sanitizedJobDescription).returning();
      console.log('PgStorage: Successfully created job description with ID:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('PgStorage: Error creating job description:', error);
      // Add more detailed error reporting
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if ('stack' in error) {
          console.error('Stack trace:', error.stack);
        }
      }
      throw error;
    }
  }

  async updateJobDescriptionProcessedContent(id: number, processedContent: ProcessedJobContent): Promise<JobDescription> {
    await this.ensureInitialized();
    const now = new Date();
    const result = await this.db.update(jobDescriptions)
      .set({ 
        processedContent, 
        status: 'processed',
        dateProcessed: now
      })
      .where(eq(jobDescriptions.id, id))
      .returning();
    
    return result[0];
  }

  async updateJobDescriptionStatus(id: number, status: string, error?: string): Promise<JobDescription> {
    await this.ensureInitialized();
    const result = await this.db.update(jobDescriptions)
      .set({ 
        status,
        error: error || null
      })
      .where(eq(jobDescriptions.id, id))
      .returning();
    
    return result[0];
  }

  // Job Scraper Config methods
  async getJobScraperConfig(id: number): Promise<JobScraperConfig | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(jobScraperConfigs).where(eq(jobScraperConfigs.id, id));
    return result[0];
  }

  async listJobScraperConfigs(): Promise<JobScraperConfig[]> {
    await this.ensureInitialized();
    return await this.db.select().from(jobScraperConfigs);
  }

  async listActiveJobScraperConfigs(): Promise<JobScraperConfig[]> {
    await this.ensureInitialized();
    return await this.db.select().from(jobScraperConfigs).where(eq(jobScraperConfigs.isActive, true));
  }

  async createJobScraperConfig(config: InsertJobScraperConfig): Promise<JobScraperConfig> {
    await this.ensureInitialized();
    const now = new Date();
    const result = await this.db.insert(jobScraperConfigs).values({
      ...config,
      location: config.location || null,
      keywords: config.keywords || null,
      isActive: config.isActive ?? true,
      cronSchedule: config.cronSchedule || '0 0 * * *', // Default to daily at midnight
      createdAt: now,
      lastRun: null
    }).returning();
    
    return result[0];
  }

  async updateJobScraperConfigLastRun(id: number): Promise<JobScraperConfig> {
    await this.ensureInitialized();
    const now = new Date();
    const result = await this.db.update(jobScraperConfigs)
      .set({ lastRun: now })
      .where(eq(jobScraperConfigs.id, id))
      .returning();
    
    return result[0];
  }

  async updateJobScraperConfigStatus(id: number, isActive: boolean): Promise<JobScraperConfig> {
    await this.ensureInitialized();
    const result = await this.db.update(jobScraperConfigs)
      .set({ isActive })
      .where(eq(jobScraperConfigs.id, id))
      .returning();
    
    return result[0];
  }

  // AITool methods
  async getAITool(id: number): Promise<AiTool | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(aiToolsTable).where(eq(aiToolsTable.tool_id, id));
    return result[0];
  }

  async listAITools(search?: string, category?: string, licenseType?: string): Promise<AiTool[]> {
    await this.ensureInitialized();
    let query = this.db.select().from(aiToolsTable).$dynamic(); 

    const conditions = [];
    if (search) {
      conditions.push(sql`(${aiToolsTable.tool_name} ilike ${`%${search}%`} or ${aiToolsTable.description} ilike ${`%${search}%`})`);
    }
    if (category) {
      conditions.push(eq(aiToolsTable.primary_category, category));
    }
    if (licenseType) {
      conditions.push(eq(aiToolsTable.license_type, licenseType));
    }

    if (conditions.length > 0) {
      query = query.where(sql.join(conditions, sql` and `));
    }
    
    return await query.orderBy(asc(aiToolsTable.tool_name));
  }

  async createAITool(tool: InsertAiTool): Promise<AiTool> { 
    await this.ensureInitialized();
    
    const dbInsertData: InsertAiTool = {
        ...tool, 
        tool_name: tool.tool_name, 
    };

    const result = await this.db.insert(aiToolsTable).values(dbInsertData).returning();
    const newDbTool = result[0];

    if (!newDbTool) {
        throw new Error("Failed to create AI tool, database did not return the created record.");
    }

    return newDbTool;
  }

  async updateAITool(id: number, toolUpdate: Partial<InsertAiTool>): Promise<AiTool> { 
    await this.ensureInitialized();

    const dbUpdateData = toolUpdate;

    if ('tool_id' in dbUpdateData) delete dbUpdateData.tool_id;
    if ('created_at' in dbUpdateData) delete dbUpdateData.created_at;

    const finalUpdateData = { ...dbUpdateData, updated_at: new Date() };

    if (Object.keys(dbUpdateData).length === 0) { 
       // Throw error if only timestamp would be updated (as no other fields were in toolUpdate)
       throw new Error("No fields provided to update for AI Tool.");
    }
    
    const result = await this.db.update(aiToolsTable)
      .set(finalUpdateData)
      .where(eq(aiToolsTable.tool_id, id))
      .returning();
      
    const updatedDbTool = result[0];

     if (!updatedDbTool) {
        throw new Error(`Failed to update AI tool with ID ${id}, record not found or update failed.`);
    }

    return updatedDbTool;
  }

  async deleteAITool(id: number): Promise<void> { 
    await this.ensureInitialized();
    const result = await this.db.delete(aiToolsTable).where(eq(aiToolsTable.tool_id, id)).returning({ deletedId: aiToolsTable.tool_id });
    
    if (result.length === 0) {
       console.warn(`Attempted to delete AI Tool with ID ${id}, but it was not found.`);
    }
  }

  // Assessment Score methods
  async upsertAssessmentScore(score: Omit<AssessmentScoreData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssessmentScoreData> {
    await this.ensureInitialized();
    
    const result = await this.db.insert(assessmentScores)
      .values({
        ...score,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: assessmentScores.wizardStepId,
        set: {
          ...score,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return result[0];
  }

  async getAssessmentScore(wizardStepId: string): Promise<AssessmentScoreData | undefined> {
    await this.ensureInitialized();
    
    const result = await this.db.select()
      .from(assessmentScores)
      .where(eq(assessmentScores.wizardStepId, wizardStepId));
    
    return result[0];
  }

  // Assessment Response methods
  async createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    await this.ensureInitialized();
    
    const result = await this.db.insert(assessmentResponses)
      .values(response)
      .returning();
    
    return result[0];
  }

  async batchCreateAssessmentResponses(responses: InsertAssessmentResponse[]): Promise<AssessmentResponse[]> {
    await this.ensureInitialized();
    
    if (responses.length === 0) {
      return [];
    }
    
    const result = await this.db.insert(assessmentResponses)
      .values(responses)
      .returning();
    
    return result;
  }

  async getAssessmentResponsesByAssessment(assessmentId: number): Promise<AssessmentResponse[]> {
    await this.ensureInitialized();
    
    const result = await this.db.select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.assessmentId, assessmentId));
    
    return result;
  }

  // Performance Metric methods
  async listPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    await this.ensureInitialized();
    return this.db.select().from(performanceMetrics);
  }

  async getPerformanceMetric(id: number): Promise<PerformanceMetrics | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(performanceMetrics).where(eq(performanceMetrics.id, id));
    return result[0];
  }

  async createPerformanceMetric(metric: z.infer<typeof insertPerformanceMetricSchema>): Promise<PerformanceMetrics> {
    await this.ensureInitialized();
    const result = await this.db.insert(performanceMetrics).values(metric).returning();
    return result[0];
  }

  async updatePerformanceMetric(id: number, metric: Partial<z.infer<typeof insertPerformanceMetricSchema>>): Promise<PerformanceMetrics | undefined> {
    await this.ensureInitialized();
    const result = await this.db.update(performanceMetrics).set(metric).where(eq(performanceMetrics.id, id)).returning();
    return result[0];
  }

  async deletePerformanceMetric(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.db.delete(performanceMetrics).where(eq(performanceMetrics.id, id));
  }

  // Job Role Performance Metric Link methods
  async linkJobRoleToMetric(linkData: { jobRoleId: number; performanceMetricId: number; }): Promise<JobRolePerformanceMetricsType> {
    await this.ensureInitialized();
     // Drizzle insert requires a full object, the input 'linkData' matches the schema.
    const result = await this.db.insert(jobRolePerformanceMetrics).values(linkData).returning();
    return result[0];
  }

  async unlinkJobRoleFromMetric(jobRoleId: number, performanceMetricId: number): Promise<void> {
    await this.ensureInitialized();
    await this.db.delete(jobRolePerformanceMetrics).where(
      and(eq(jobRolePerformanceMetrics.jobRoleId, jobRoleId), eq(jobRolePerformanceMetrics.performanceMetricId, performanceMetricId))
    );
  }

  async getMetricsForJobRole(jobRoleId: number): Promise<(PerformanceMetrics & { linkId: number })[]> {
    await this.ensureInitialized();
    // Join jobRolePerformanceMetrics with performanceMetrics to get metric details
    const result = await this.db.select({
      ...performanceMetrics, // Select all columns from performanceMetrics
      linkId: jobRolePerformanceMetrics.jobRoleId // Use jobRoleId from link table as a placeholder for a link ID (or adjust if link table gets its own serial id)
    })
    .from(jobRolePerformanceMetrics)
    .innerJoin(performanceMetrics, eq(jobRolePerformanceMetrics.performanceMetricId, performanceMetrics.id))
    .where(eq(jobRolePerformanceMetrics.jobRoleId, jobRoleId));

    // Need to cast the result to match the return type
    return result as (PerformanceMetrics & { linkId: number })[];
  }

  // Metric Rule methods
  async listMetricRules(): Promise<MetricRules[]> {
    await this.ensureInitialized();
    return this.db.select().from(metricRules);
  }

  async getMetricRule(id: number): Promise<MetricRules | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(metricRules).where(eq(metricRules.id, id));
    return result[0];
  }

  async listMetricRulesByMetric(metricId: number): Promise<MetricRules[]> {
    await this.ensureInitialized();
    return this.db.select().from(metricRules).where(eq(metricRules.metricId, metricId));
  }

  async insertMetricRule(rule: z.infer<typeof insertMetricRuleSchema>): Promise<MetricRules> {
    await this.ensureInitialized();
    const result = await this.db.insert(metricRules).values(rule).returning();
    return result[0];
  }

  async updateMetricRule(id: number, rule: Partial<z.infer<typeof insertMetricRuleSchema>>): Promise<MetricRules | undefined> {
    await this.ensureInitialized();
    const result = await this.db.update(metricRules).set(rule).where(eq(metricRules.id, id)).returning();
    return result[0];
  }

  async deleteMetricRule(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.db.delete(metricRules).where(eq(metricRules.id, id));
  }

  // Organization Score Weights methods (NEW for PgStorage)
  async getOrganizationScoreWeights(organizationId: number): Promise<OrganizationScoreWeights | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select()
      .from(organizationScoreWeightsTable)
      .where(eq(organizationScoreWeightsTable.organizationId, organizationId));
    
    if (result.length === 0) {
      // Automatically create default weights if none exist
      // Use default values defined in the schema
      const defaultWeights: InsertOrganizationScoreWeights = {
        organizationId,
        adoptionRateWeight: 0.2,
        timeSavedWeight: 0.2,
        costEfficiencyWeight: 0.2,
        performanceImprovementWeight: 0.2,
        toolSprawlReductionWeight: 0.2,
      };
      
      // Create the default weights
      const newWeights = await this.upsertOrganizationScoreWeights(defaultWeights);
      return newWeights;
    }
    
    // Drizzle returns numeric types as strings, so we parse them here if needed, or rely on Zod schema on consumption
    // For now, let's assume the select schema transformation handles it, or it's handled by the caller.
    return result[0] as OrganizationScoreWeights;
  }

  async upsertOrganizationScoreWeights(weights: InsertOrganizationScoreWeights): Promise<OrganizationScoreWeights> {
    await this.ensureInitialized();
    const validWeights = dzInsertOrganizationScoreWeightsSchema.parse(weights);

    const result = await this.db
      .insert(organizationScoreWeightsTable)
      .values(validWeights)
      .onConflictDoUpdate({ 
        target: organizationScoreWeightsTable.organizationId, 
        set: { ...validWeights, updatedAt: new Date() } 
      })
      .returning();
    return result[0];
  }

  // New methods for capability-tool mapping
  async mapCapabilityToTool(capabilityId: number, toolId: number): Promise<CapabilityToolMappingType> {
    await this.ensureInitialized();
    const [newMapping] = await this.db
      .insert(capabilityToolMapping)
      .values({ capability_id: capabilityId, tool_id: toolId })
      .returning();
    if (!newMapping) {
      throw new Error("Failed to map capability to tool. Insert operation returned no result.");
    }
    return newMapping;
  }

  async unmapCapabilityFromTool(capabilityId: number, toolId: number): Promise<void> {
    await this.ensureInitialized();
    const result = await this.db
      .delete(capabilityToolMapping)
      .where(and(eq(capabilityToolMapping.capability_id, capabilityId), eq(capabilityToolMapping.tool_id, toolId)))
      .returning(); 
    if (result.length === 0) {
      console.warn(`Attempted to unmap capability ${capabilityId} from tool ${toolId}, but no such mapping was found.`);
    }
  }

  async getToolsForCapability(capabilityId: number): Promise<BaseAiTool[]> {
    await this.ensureInitialized();
    const mappings = await this.db
      .select({ toolId: capabilityToolMapping.tool_id })
      .from(capabilityToolMapping)
      .where(eq(capabilityToolMapping.capability_id, capabilityId));

    if (mappings.length === 0) {
      return [];
    }
    const toolIds = mappings.map((m: { toolId: number }) => m.toolId);
    return this.db.select().from(aiToolsTable).where(inArray(aiToolsTable.tool_id, toolIds));
  }

  async getCapabilitiesForTool(toolId: number): Promise<Pick<BaseAICapability, 'id' | 'name' | 'valueScore'>[]> {
    await this.ensureInitialized();
    const mappings = await this.db
      .select({ capabilityId: capabilityToolMapping.capability_id })
      .from(capabilityToolMapping)
      .where(eq(capabilityToolMapping.tool_id, toolId));

    if (mappings.length === 0) {
      return [];
    }
    const capabilityIds = mappings.map((m: { capabilityId: number }) => m.capabilityId);
    return this.db
      .select({
        id: aiCapabilitiesTable.id,
        name: aiCapabilitiesTable.name,
        valueScore: aiCapabilitiesTable.valueScore
      })
      .from(aiCapabilitiesTable)
      .where(inArray(aiCapabilitiesTable.id, capabilityIds));
  }

  async getTools(options?: { assessmentId?: string; categoryFilter?: string[] }): Promise<ToolWithMappedCapabilities[]> {
    await this.ensureInitialized();
    // Base query for tools
    let query = this.db.select().from(aiToolsTable).$dynamic();

    // Apply filters if provided
    const conditions = [];
    if (options?.categoryFilter && options.categoryFilter.length > 0) {
      conditions.push(inArray(aiToolsTable.primary_category, options.categoryFilter));
    }
    // TODO: Add assessmentId filtering if needed. This would require joining through capabilities 
    // and then assessments, or having a direct link if that makes sense for your data model.
    // For now, assessmentId filtering is not implemented here.
    if (options?.assessmentId) {
      console.warn("getTools: assessmentId filtering is not yet implemented.");
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const tools: BaseAiTool[] = await query;

    // For each tool, fetch its mapped capabilities
    const toolsWithCapabilities: ToolWithMappedCapabilities[] = await Promise.all(
      tools.map(async (tool) => {
        const capabilities = await this.getCapabilitiesForTool(tool.tool_id);
        return { ...tool, mappedCapabilities: capabilities };
      })
    );
    return toolsWithCapabilities;
  }

  // Helper method to set the auth context for RLS policies
  public async setAuthContext(authId?: string): Promise<void> {
    await this.ensureInitialized();
    if (authId) {
      try {
        await this.db.execute(sql`SELECT set_config('app.current_auth_id', ${authId}, true)`);
      } catch (error) {
        console.error('Error setting auth context:', error);
      }
    } else {
      // Clear the auth context if no authId is provided
      await this.db.execute(sql`SELECT set_config('app.current_auth_id', '', true)`);
    }
  }
}

// Create and export a single instance of the storage class
// Use PgStorage for database interactions
export const storage: IStorage = new PgStorage();