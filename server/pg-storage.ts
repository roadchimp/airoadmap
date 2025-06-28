import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { eq, sql, asc, and, inArray } from 'drizzle-orm';
// Using dynamic import for pg which works better with ESM
import { IStorage, ReportWithMetricsAndRules, FullAICapability, ToolWithMappedCapabilities, AiTool as BaseAiTool } from './storage.ts';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { z } from 'zod'; // Import z for z.infer
import { DepartmentRoleSummary } from './storage';

// Import Drizzle schema tables and schemas (values)
import { 
  assessments, departments, organizations, reports, 
  aiCapabilitiesTable,
  assessmentAICapabilitiesTable, // Add this import
  jobRoles, jobDescriptions, jobScraperConfigs,
  aiTools as aiToolsTable,
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
  CapabilityRoleImpact as CapabilityRoleImpactType,
  AssessmentAICapability, // Add this import
  InsertAssessmentAICapability, // Add this import
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
      if (process.env.VERCEL_ENV === 'production') {
        console.log('Initializing Neon HTTP database connection for Vercel production');
        connectionString = process.env.DATABASE_POSTGRES_URL; 
        if (!connectionString) {
          throw new Error('DATABASE_POSTGRES_URL environment variable not set for Vercel environment');
        }
        const sql = neon(connectionString);
        this.db = drizzleNeonHttp(sql);
        this.isInitialized = true;
        console.log('Neon HTTP database connection established');
      }  else if (process.env.VERCEL_ENV === 'preview') {
        // Use Neon HTTP connection for preview environment (Each branch has its own preview URL)
        console.log('Initializing Neon HTTP database connection for Vercel preview');
        connectionString = process.env.DATABASE_PREVIEW_URL; 
        if (!connectionString) {
          throw new Error('DATABASE_PREVIEW_URL environment variable not set for Vercel environment');
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

  async updateUserProfile(id: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    await this.ensureInitialized();
    const result = await this.db.update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error(`User profile with ID ${id} not found.`);
    }
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

  async getDepartmentRoleSummary(): Promise<DepartmentRoleSummary[]> {
    await this.ensureInitialized();
    try {
      // First, try to refresh the view. This is the fast path if the view exists.
      await this.db.execute(sql`REFRESH MATERIALIZED VIEW mv_department_role_summary;`);
    } catch (error: any) {
      // If the refresh fails because the view doesn't exist (code 42P01), create it.
      if (error.code === '42P01') {
        console.log("Materialized view 'mv_department_role_summary' not found. Creating it now.");
        
        // Drop the view if it exists in a broken state
        await this.db.execute(sql`DROP MATERIALIZED VIEW IF EXISTS mv_department_role_summary;`);

        await this.db.execute(sql`
          CREATE MATERIALIZED VIEW mv_department_role_summary AS
          SELECT
              d.id AS department_id,
              d.name AS department_name,
              d.description AS department_description,
              COALESCE(
                  json_agg(
                      json_build_object(
                          'id', jr.id,
                          'title', jr.title,
                          'departmentId', jr.department_id,
                          'description', jr.description,
                          'is_active', jr.is_active,
                          'created_at', jr.created_at,
                          'updated_at', jr.updated_at,
                          'keyResponsibilities', to_jsonb(jr.key_responsibilities),
                          'skills', to_jsonb(jr.skills)
                          -- Conditionally add columns if they exist.
                          -- 'level', (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_roles' AND column_name='level') THEN jr.level ELSE NULL END),
                          -- 'aiPotential', (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_roles' AND column_name='ai_potential') THEN jr.ai_potential ELSE NULL END)
                      )
                  ) FILTER (WHERE jr.id IS NOT NULL),
                  '[]'::json
              ) AS roles
          FROM
              departments d
          LEFT JOIN
              job_roles jr ON d.id = jr.department_id
          GROUP BY
              d.id, d.name, d.description
          ORDER BY
              d.name;
        `);
        // Also create the index for future refreshes
        await this.db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_department_role_summary_department_id ON mv_department_role_summary (department_id);`);
        console.log("Successfully created materialized view and index.");
      } else {
        // For any other error, re-throw it.
        console.error("Error refreshing materialized view:", error);
        throw error;
      }
    }
    // Now that the view is guaranteed to exist and be fresh, query it.
    const result = await this.db.execute(sql`SELECT * FROM mv_department_role_summary;`);
    
    const rows = result.rows || result; // neon http returns array directly, node-pg returns object with rows

    // The 'roles' column can be returned as a JSON string, so we need to parse it.
    if (Array.isArray(rows)) {
        return rows.map((row: any) => ({
            ...row,
            roles: typeof row.roles === 'string' ? JSON.parse(row.roles) : row.roles,
        }));
    }

    return []; // Return empty array if no data
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

    // Note: assessmentId filtering is handled via the assessmentAICapabilities table
    if (options?.assessmentId) {
      console.log("assessmentId filtering in listAICapabilities is not implemented with the new schema");
      // This would require joining with assessmentAICapabilities table
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

  async updateCapabilityFilters(id: number, update: { role?: string | null; painPoint?: string | null; goal?: string | null }): Promise<BaseAICapability> {
    await this.ensureInitialized();
    
    const updateValues: any = {};
    if (update.role !== undefined) updateValues.role = update.role;
    if (update.painPoint !== undefined) updateValues.painPoint = update.painPoint;
    if (update.goal !== undefined) updateValues.goal = update.goal;
    
    const result = await this.db.update(aiCapabilitiesTable)
      .set(updateValues)
      .where(eq(aiCapabilitiesTable.id, id))
      .returning();
    
    if (!result || result.length === 0) {
      throw new Error(`Capability with ID ${id} not found`);
    }
    
    return result[0];
  }

  /**
   * Find an existing AI capability by name and category or create a new one if it doesn't exist
   */
  async findOrCreateGlobalAICapability(
    capabilityName: string, 
    capabilityCategory: string, 
    description?: string,
    defaults?: {
      default_business_value?: string | null;
      default_implementation_effort?: string | null;
      default_ease_score?: string | null;
      default_value_score?: string | null;
      default_feasibility_score?: string | null;
      default_impact_score?: string | null;
      tags?: string[];
    }
  ): Promise<BaseAICapability> {
    await this.ensureInitialized();
    
    // First try to find an existing capability with the same name and category
    const existingCapability = await this.db
      .select()
      .from(aiCapabilitiesTable)
      .where(
        and(
          eq(aiCapabilitiesTable.name, capabilityName),
          eq(aiCapabilitiesTable.category, capabilityCategory)
        )
      )
      .limit(1);
    
    if (existingCapability.length > 0) {
      return existingCapability[0] as BaseAICapability;
    }
    
    // If not found, create a new global capability
    const newCapability: InsertAICapability = {
      name: capabilityName,
      category: capabilityCategory,
      description: description || null,
      default_business_value: defaults?.default_business_value || null,
      default_implementation_effort: defaults?.default_implementation_effort || null,
      default_ease_score: defaults?.default_ease_score || null,
      default_value_score: defaults?.default_value_score || null,
      default_feasibility_score: defaults?.default_feasibility_score || null,
      default_impact_score: defaults?.default_impact_score || null,
      tags: defaults?.tags || [],
    };
    
    const result = await this.db.insert(aiCapabilitiesTable).values(newCapability).returning();
    return result[0] as BaseAICapability;
  }

  /**
   * Create an assessment-specific AI capability link
   */
  async createAssessmentAICapability(
    data: InsertAssessmentAICapability
  ): Promise<AssessmentAICapability> {
    await this.ensureInitialized();
    
    // Import the Zod schema to validate and transform the data
    const { insertAssessmentAICapabilitySchema } = await import('../shared/schema');
    
    // Validate and transform the data to ensure numeric scores
    const validatedData = insertAssessmentAICapabilitySchema.parse(data);
    
    // Check if this assessment-capability pair already exists
    const existingLink = await this.db
      .select()
      .from(assessmentAICapabilitiesTable)
      .where(
        and(
          eq(assessmentAICapabilitiesTable.assessmentId, validatedData.assessmentId),
          eq(assessmentAICapabilitiesTable.aiCapabilityId, validatedData.aiCapabilityId)
        )
      )
      .limit(1);
      
    if (existingLink.length > 0) {
      // If it exists, update it with new values
      const updatedLink = await this.db
        .update(assessmentAICapabilitiesTable)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(assessmentAICapabilitiesTable.assessmentId, validatedData.assessmentId),
            eq(assessmentAICapabilitiesTable.aiCapabilityId, validatedData.aiCapabilityId)
          )
        )
        .returning();
        
      return updatedLink[0] as AssessmentAICapability;
    }
    
    // If not, create a new link
    const result = await this.db
      .insert(assessmentAICapabilitiesTable)
      .values(validatedData)
      .returning();
      
    return result[0] as AssessmentAICapability;
  }

  /**
   * Get AI capabilities for an assessment with both global and assessment-specific data
   */
  async getAssessmentAICapabilities(assessmentId: number): Promise<FullAICapability[]> {
    await this.ensureInitialized();
    
    // Join aiCapabilitiesTable with assessmentAICapabilitiesTable to get both global and assessment-specific data
    const joinedCapabilities = await this.db
      .select({
        ...aiCapabilitiesTable, // Select ALL columns from aiCapabilitiesTable
        
        // Assessment-specific fields (these will overwrite if names clash, which is fine if intended)
        assessmentId_specific: assessmentAICapabilitiesTable.assessmentId, // Alias to avoid clash with aiCapabilitiesTable.assessment_id if it exists
        valueScore: assessmentAICapabilitiesTable.valueScore,
        feasibilityScore: assessmentAICapabilitiesTable.feasibilityScore,
        impactScore: assessmentAICapabilitiesTable.impactScore,
        easeScore: assessmentAICapabilitiesTable.easeScore,
        priority_specific: assessmentAICapabilitiesTable.priority, // Alias to avoid clash
        rank_specific: assessmentAICapabilitiesTable.rank, // Alias to avoid clash
        implementationEffort_specific: assessmentAICapabilitiesTable.implementationEffort, // Alias
        businessValue_specific: assessmentAICapabilitiesTable.businessValue, // Alias
        assessmentNotes: assessmentAICapabilitiesTable.assessmentNotes
      })
      .from(aiCapabilitiesTable)
      .innerJoin(
        assessmentAICapabilitiesTable,
        eq(aiCapabilitiesTable.id, assessmentAICapabilitiesTable.aiCapabilityId)
      )
      .where(eq(assessmentAICapabilitiesTable.assessmentId, assessmentId));
    
    // If no results, return empty array
    if (joinedCapabilities.length === 0) {
      return [];
    }
    
    // Get all capability IDs to fetch related data
    const capabilityIds = joinedCapabilities.map((c: { id: number }) => c.id);
    
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
        capabilityId: capabilityToolMapping.capability_id,
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
       
      const { capabilityId, ...toolData } = record;
      toolsByCapabilityId.get(capId)!.push(toolData as AiTool);
    });
    
    // Combine all data into FullAICapability objects
    const fullCapabilities: FullAICapability[] = joinedCapabilities.map((jc: any) => {
      // Now jc contains all fields from aiCapabilitiesTable directly
      // plus the aliased assessment-specific fields.
      const baseCapability: BaseAICapability = {
        id: jc.id,
        name: jc.name,
        category: jc.category,
        description: jc.description,
        implementation_effort: jc.implementation_effort,
        business_value: jc.business_value,
        ease_score: jc.ease_score,
        value_score: jc.value_score,
        primary_category: jc.primary_category,
        license_type: jc.license_type,
        website_url: jc.website_url,
        tags: jc.tags,
        default_implementation_effort: jc.default_implementation_effort,
        default_business_value: jc.default_business_value,
        default_ease_score: jc.default_ease_score,
        default_value_score: jc.default_value_score,
        default_feasibility_score: jc.default_feasibility_score,
        default_impact_score: jc.default_impact_score,
        feasibility_score: jc.feasibility_score, // This is from aiCapabilitiesTable global
        impact_score: jc.impact_score, // This is from aiCapabilitiesTable global
        priority: jc.priority, // This is from aiCapabilitiesTable global
        rank: jc.rank, // This is from aiCapabilitiesTable global
        implementation_factors: jc.implementation_factors,
        quick_implementation: jc.quick_implementation,
        has_dependencies: jc.has_dependencies,
        recommended_tools: jc.recommended_tools,
        applicable_roles: jc.applicable_roles,
        role_impact: jc.role_impact,
        assessment_id: jc.assessment_id, // This is from aiCapabilitiesTable global (FK to assessments)
        is_duplicate: jc.is_duplicate, // Added missing field
        merged_into_id: jc.merged_into_id, // Added missing field
        createdAt: jc.createdAt,
        updatedAt: jc.updatedAt
      };
      
      // Add assessment-specific fields using the aliases
      return {
        ...baseCapability,
        assessmentId: jc.assessmentId_specific, // Use the aliased assessmentId from assessmentAICapabilitiesTable
        valueScore: jc.valueScore,
        feasibilityScore: jc.feasibilityScore,
        impactScore: jc.impactScore, // This is the assessment-specific one
        easeScore: jc.easeScore,
        priority: jc.priority_specific, // Use the aliased assessment-specific priority
        rank: jc.rank_specific, // Use the aliased assessment-specific rank
        implementationEffort: jc.implementationEffort_specific, // Use aliased assessment-specific effort
        businessValue: jc.businessValue_specific, // Use aliased assessment-specific value
        assessmentNotes: jc.assessmentNotes,
        applicableRoles: rolesByCapabilityId.get(jc.id) || [],
        recommendedTools: toolsByCapabilityId.get(jc.id) || [],
        roleImpact: undefined // Not fetching role impacts for the list view
      };
    });
    
    return fullCapabilities;
  }

  // Assessment methods
  async getAssessment(id: number, userId?: number): Promise<Assessment | undefined> {
    await this.ensureInitialized();
    
    const result = await this.db.select()
      .from(assessments)
      .where(and(
        eq(assessments.id, id),
        userId ? eq(assessments.userId, userId) : undefined // Add user scoping only if userId is provided
      ));
      
    return result[0];
  }

  async getReportByAssessmentId(assessmentId: number): Promise<Report | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(reports).where(eq(reports.assessmentId, assessmentId));
    return result[0];
  }

  async getAssessmentRaw(id: number, userId: number): Promise<Assessment | undefined> {
    const result = await this.db.execute(
      sql`SELECT * FROM assessments 
          WHERE id = ${id} AND user_id = ${userId}`
    );
    return result.rows[0] as Assessment | undefined;
  }

  async getAssessmentsForUser(userId: number, organizationId: number): Promise<Assessment[]> {
    await this.ensureInitialized();
    const isAdmin = userId === 1; // samsena@gmail.com

    if (isAdmin) {
      // Admin sees all assessments
      return await this.db.select().from(assessments).orderBy(sql`${assessments.updatedAt} desc`);
    }

    if (!organizationId) {
      // User is not associated with any organization, return empty array
      return [];
    }

    // Regular user sees assessments for their organization
    return await this.db.select()
      .from(assessments)
      .where(eq(assessments.organizationId, organizationId))
      .orderBy(sql`${assessments.updatedAt} desc`);
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

  async updateAssessmentStep(id: number, partialStepData: Partial<WizardStepData>, strategicFocus?: string[]): Promise<Assessment> {
    await this.ensureInitialized();
    const current = await this.getAssessment(id, 0);
    if (!current) {
      throw new Error(`Assessment with ID ${id} not found`);
    }

    // Initialize the main update payload for the assessment record
    const assessmentUpdatePayload: Partial<Omit<Assessment, 'id' | 'createdAt' | 'stepData'> & { updatedAt?: Date }> = {
        updatedAt: new Date(), // Always update the timestamp
    };

    // Handle strategicFocus if provided directly as a parameter
    if (strategicFocus !== undefined) {
      assessmentUpdatePayload.strategicFocus = strategicFocus;
    }

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
                    // Only use stakeholders from basics if strategicFocus wasn't provided directly
                    if (basicsData.stakeholders !== undefined && strategicFocus === undefined) {
                        assessmentUpdatePayload.strategicFocus = basicsData.stakeholders;
                    }
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

    // 2. Extract selected JobRole IDs from stepData (assuming they are stored in stepData.roles.selectedRoles as an array of objects with id)
    // Safely access roles and map to IDs, defaulting to an empty array if roles is null, undefined, or not an array
    const selectedJobRoleIds: number[] = Array.isArray(stepData?.roles?.selectedRoles) 
      ? stepData.roles.selectedRoles.map((role: { id?: number }) => role.id).filter((id): id is number => id !== undefined) 
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

    // 6. Fetch AI Capabilities for the assessment
    const capabilities = await this.getAssessmentAICapabilities(assessmentId);

    // 5. Construct and return the composite object
    return {
      ...reportWithAssessmentAndDetails,
      selectedRoles: selectedRoles,
      performanceMetrics: fetchedPerformanceMetrics, // Use the renamed variable
      metricRules: metricRulesList, // Use the renamed variable
      capabilities: capabilities,
    };
  }

  async listReports(): Promise<Report[]> {
    await this.ensureInitialized();
    try {
      // Use Drizzle ORM to fetch reports
      const reportsList = await this.db.select().from(reports);
      return reportsList;
    } catch (error) {
      console.error('Error fetching reports with Drizzle, falling back to raw SQL:', error);
      // Fallback to raw SQL if ORM fails
      const result = await this.db.execute(sql`SELECT * FROM reports`);
      // The raw SQL query result might have a different structure, ensure it's mapped correctly
      // This mapping depends on the raw result format, which could be result.rows, result, etc.
      // Adjust this part based on how your DB driver returns raw query results.
      return result.rows || result;
    }
  }

  async listReportsForUser(userProfile: UserProfile): Promise<Report[]> {
    await this.ensureInitialized();
    if (!userProfile?.id) {
        console.warn("listReportsForUser called without a user profile id.");
        return [];
    }
    return await this.db.select().from(reports).where(eq(reports.userId, userProfile.id));
  }

  async createReport(report: InsertReport): Promise<Report> {
    await this.ensureInitialized();

    if (!report.assessmentId) {
      throw new Error('assessmentId is required to create a report');
    }

    // Fetch the assessment to get the userId
    const relatedAssessment = await this.db.select({ userId: assessments.userId }).from(assessments).where(eq(assessments.id, report.assessmentId));
    if (!relatedAssessment || relatedAssessment.length === 0) {
      throw new Error(`Assessment with ID ${report.assessmentId} not found.`);
    }
    const userId = relatedAssessment[0].userId;

    const reportToInsert = {
      ...report,
      userId: userId,
    };

    const result = await this.db.insert(reports).values(reportToInsert).returning();
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
    
    // First check if a tool with the same name already exists
    const existingTools = await this.db
      .select()
      .from(aiToolsTable)
      .where(eq(aiToolsTable.tool_name, tool.tool_name))
      .limit(1);
    
    if (existingTools.length > 0) {
      console.log(`Tool with name "${tool.tool_name}" already exists, returning existing tool`);
      return existingTools[0];
    }
    
    // If no existing tool found, create a new one
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
    
    try {
      // No need to stringify - the schema can now accept numeric values directly
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
    } catch (error) {
      console.error("Error updating organization score weights:", error);
      console.error("Input weights:", weights);
      throw error;
    }
  }

  // New methods for capability-tool mapping
  async mapCapabilityToTool(capabilityId: number, toolId: number): Promise<CapabilityToolMappingType> {
    await this.ensureInitialized();
    const [newMapping] = await this.db
      .insert(capabilityToolMapping)
      .values({ capability_id: capabilityId, tool_id: toolId })
      .onConflictDoNothing({ target: [capabilityToolMapping.capability_id, capabilityToolMapping.tool_id] })
      .returning();
    
    if (!newMapping) {
      // If no row was returned, it means the mapping already exists
      // Get the existing mapping
      const existingMapping = await this.db
        .select()
        .from(capabilityToolMapping)
        .where(and(
          eq(capabilityToolMapping.capability_id, capabilityId),
          eq(capabilityToolMapping.tool_id, toolId)
        ))
        .limit(1);
      
      if (existingMapping.length === 0) {
        throw new Error("Failed to map capability to tool and couldn't find existing mapping.");
      }
      
      return existingMapping[0];
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
    return this.db.select().from(aiToolsTable).where(inArray(aiToolsTable.tool_id, toolIds as number[]));
  }

  // New methods for capability-job role mapping
  async mapCapabilityToJobRole(capabilityId: number, jobRoleId: number): Promise<void> {
    await this.ensureInitialized();
    
    // Insert or update capability-job role mapping
    await this.db
      .insert(capabilityJobRoles)
      .values({ 
        capabilityId: capabilityId, 
        jobRoleId: jobRoleId 
      })
      .onConflictDoNothing({ target: [capabilityJobRoles.capabilityId, capabilityJobRoles.jobRoleId] });
  }

  async mapCapabilityToJobRoleWithImpact(capabilityId: number, jobRoleId: number, impactScore: number): Promise<void> {
    await this.ensureInitialized();
    
    // Insert or update capability-job role mapping
    await this.db
      .insert(capabilityJobRoles)
      .values({ 
        capabilityId: capabilityId, 
        jobRoleId: jobRoleId 
      })
      .onConflictDoNothing({ target: [capabilityJobRoles.capabilityId, capabilityJobRoles.jobRoleId] });
      
    // Insert or update the impact score
    await this.db
      .insert(capabilityRoleImpacts)
      .values({
        capabilityId: capabilityId,
        jobRoleId: jobRoleId,
        impactScore: impactScore.toString() // Convert to string for numeric field
      })
      .onConflictDoUpdate({
        target: [capabilityRoleImpacts.capabilityId, capabilityRoleImpacts.jobRoleId],
        set: { impactScore: impactScore.toString() }
      });
  }

  async unmapCapabilityFromJobRole(capabilityId: number, jobRoleId: number): Promise<void> {
    await this.ensureInitialized();
    const result = await this.db
      .delete(capabilityJobRoles)
      .where(and(
        eq(capabilityJobRoles.capabilityId, capabilityId), 
        eq(capabilityJobRoles.jobRoleId, jobRoleId)
      ))
      .returning(); 
    if (result.length === 0) {
      console.warn(`Attempted to unmap capability ${capabilityId} from job role ${jobRoleId}, but no such mapping was found.`);
    }
  }

  async getJobRolesForCapability(capabilityId: number): Promise<BaseJobRole[]> {
    await this.ensureInitialized();
    const mappings = await this.db
      .select({ jobRoleId: capabilityJobRoles.jobRoleId })
      .from(capabilityJobRoles)
      .where(eq(capabilityJobRoles.capabilityId, capabilityId));

    if (mappings.length === 0) {
      return [];
    }
    const jobRoleIds = mappings.map((m: { jobRoleId: number }) => m.jobRoleId);
    return this.db.select().from(jobRoles).where(inArray(jobRoles.id, jobRoleIds));
  }

  async getCapabilitiesForTool(toolId: number): Promise<Pick<BaseAICapability, 'id' | 'name' | 'category' | 'description'>[]> {
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
        category: aiCapabilitiesTable.category,
        description: aiCapabilitiesTable.description
      })
      .from(aiCapabilitiesTable)
      .where(inArray(aiCapabilitiesTable.id, capabilityIds));
  }

  async getTools(options?: { assessmentId?: string; categoryFilter?: string[] }): Promise<ToolWithMappedCapabilities[]> {
    await this.ensureInitialized();
    console.log("getTools: Received options", options);

    if (options?.assessmentId) {
      console.log(`getTools: Filtering by assessmentId: ${options.assessmentId}`);
      
      const assessmentIdNum = parseInt(options.assessmentId, 10);
      if (isNaN(assessmentIdNum)) {
        console.error("getTools: Invalid assessmentId provided");
        return [];
      }

      // 1. Get all capability IDs for the given assessment
      const assessmentCapabilities = await this.db
        .select({ capabilityId: assessmentAICapabilitiesTable.aiCapabilityId })
        .from(assessmentAICapabilitiesTable)
        .where(eq(assessmentAICapabilitiesTable.assessmentId, assessmentIdNum));
      
      const capabilityIds = assessmentCapabilities.map((ac: {capabilityId: number | null}) => ac.capabilityId).filter((id: number | null): id is number => id !== null);

      if (capabilityIds.length === 0) {
        console.log(`getTools: No capabilities found for assessmentId: ${options.assessmentId}`);
        return [];
      }
      console.log(`getTools: Found ${capabilityIds.length} capabilities for assessment.`);

      // 2. Get all tool IDs linked to these capabilities
      const toolMappings = await this.db
        .select({ toolId: capabilityToolMapping.tool_id })
        .from(capabilityToolMapping)
        .where(inArray(capabilityToolMapping.capability_id, capabilityIds));

      const toolIds = [...new Set(toolMappings.map((m: {toolId: number}) => m.toolId))];

      if (toolIds.length === 0) {
        console.log(`getTools: No tools found for the capabilities of assessmentId: ${options.assessmentId}`);
        return [];
      }
      console.log(`getTools: Found ${toolIds.length} tools for assessment.`);
      
      // 3. Fetch the tools with the identified IDs
      const tools = await this.db
        .select()
        .from(aiToolsTable)
        .where(inArray(aiToolsTable.tool_id, toolIds as number[]));

      // 4. For each tool, fetch its associated capabilities
      const toolsWithCapabilities = await Promise.all(
        tools.map(async (tool: any) => {
          const capabilities = await this.getCapabilitiesForTool(tool.tool_id);
          return { ...tool, capabilities };
        })
      );
      return toolsWithCapabilities;

    } else {
      console.warn("getTools: assessmentId filtering is not yet implemented.");
      // Fallback to original implementation if no assessmentId
      const tools = await this.db.select().from(aiToolsTable);
      
      // For each tool, fetch its associated capabilities
      const toolsWithCapabilities = await Promise.all(
        tools.map(async (tool: any) => {
          const capabilities = await this.getCapabilitiesForTool(tool.tool_id);
          return { ...tool, capabilities };
        })
      );
      return toolsWithCapabilities;
    }
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

  /**
   * Get a list of capability IDs that have been identified as duplicates
   * This is used by the batch processor to filter out duplicate capabilities
   */
  async getDuplicateCapabilityIds(): Promise<number[]> {
    try {
      await this.ensureInitialized();
      
      // Query the existing duplicate_capabilities table
      const result = await this.db.execute(sql`
        SELECT duplicate_id FROM duplicate_capabilities
      `);
      
      // Extract the IDs from the result
      const duplicateIds = result.rows.map((row: { duplicate_id: string | number }) => parseInt(String(row.duplicate_id), 10));
      
      console.log(`Found ${duplicateIds.length} duplicate capability IDs`);
      return duplicateIds;
    } catch (error) {
      console.error('Error getting duplicate capability IDs:', error);
      // Return empty array on error to avoid blocking the batch processor
      return [];
    }
  }

  async listAssessmentsForUser(userProfile: UserProfile): Promise<Assessment[]> {
    await this.ensureInitialized();
    const isAdmin = userProfile.id === 1; // samsena@gmail.com

    if (isAdmin) {
      // Admin sees all assessments
      return await this.db.select().from(assessments).orderBy(sql`${assessments.updatedAt} desc`);
    }

    if (!userProfile.organization_id) {
      // User is not associated with any organization, return empty array
      return [];
    }

    // Regular user sees assessments for their organization
    return await this.db.select()
      .from(assessments)
      .where(eq(assessments.organizationId, userProfile.organization_id))
      .orderBy(sql`${assessments.updatedAt} desc`);
  }
}

// Create and export a single instance of the storage class
// Use PgStorage for database interactions
export const storage: IStorage = new PgStorage();