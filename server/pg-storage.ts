import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { eq, sql, asc } from 'drizzle-orm';
// Using dynamic import for pg which works better with ESM
import { IStorage } from './storage.ts';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Import the schema
import { 
  assessments, departments, organizations, users, reports, 
  aiCapabilities, jobRoles, jobDescriptions, jobScraperConfigs,
  aiTools, capabilityToolMapping, assessmentScores, assessmentResponses,
  insertAssessmentSchema,
  ReportWithAssessmentDetails
} from '../shared/schema.ts';

// Import types
import type {
  User, InsertUser,
  Organization, InsertOrganization,
  Department, InsertDepartment,
  JobRole, InsertJobRole, JobRoleWithDepartment,
  AICapability, InsertAICapability,
  Assessment, InsertAssessment, WizardStepData,
  Report, InsertReport,
  JobDescription, InsertJobDescription, ProcessedJobContent,
  JobScraperConfig, InsertJobScraperConfig,
  AiTool, // DB Type (snake_case) - THIS IS THE ONE TO USE
  InsertAiTool, // DB Insert Type (snake_case)
  CapabilityToolMapping, InsertCapabilityToolMapping,
  AssessmentScoreData,
  AssessmentResponse, InsertAssessmentResponse
  // AITool // REMOVE References to this non-existent type
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

  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    const result = await this.db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }

  async listOrganizations(): Promise<Organization[]> {
    return await this.db.select().from(organizations);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await this.db.insert(organizations).values(org).returning();
    return result[0];
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
  async getJobRole(id: number): Promise<JobRole | undefined> {
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

  async createJobRole(role: InsertJobRole): Promise<JobRole> {
    const result = await this.db.insert(jobRoles).values(role).returning();
    return result[0];
  }

  // AICapability methods
  async getAICapability(id: number): Promise<AICapability | undefined> {
    const result = await this.db.select().from(aiCapabilities).where(eq(aiCapabilities.id, id));
    return result[0];
  }

  async listAICapabilities(): Promise<AICapability[]> {
    return await this.db.select().from(aiCapabilities);
  }

  async createAICapability(capability: InsertAICapability): Promise<AICapability> {
    const result = await this.db.insert(aiCapabilities).values(capability).returning();
    return result[0];
  }

  // Assessment methods
  async getAssessment(id: number): Promise<Assessment | undefined> {
    // Try to get assessment, but handle missing updated_at column
    try {
      const result = await this.db.select().from(assessments).where(eq(assessments.id, id));
      return result[0];
    } catch (error) {
      // If error is about missing updated_at column
      if (error instanceof Error && error.message.includes('updated_at')) {
        console.error('Missing updated_at column in assessments table. Fetching with workaround.');
        // Use SQL query to select all columns except updated_at
        const result = await this.db.execute(
          sql`SELECT id, title, organization_id, user_id, status, created_at, step_data 
              FROM assessments
              WHERE id = ${id}`
        );
        // Add a default updated_at value to match the schema
        if (result.rows.length === 0) return undefined;
        
        return {
          ...result.rows[0],
          updatedAt: result.rows[0].created_at || new Date(),
        };
      }
      // Re-throw other errors
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
  async getReport(id: number): Promise<ReportWithAssessmentDetails | undefined> {
    await this.ensureInitialized();
    const result = await this.db
      .select({
        // Select all fields from reports table
        ...reports,
        // Select specific fields from assessments table
        assessmentTitle: assessments.title,
        industry: assessments.industry,
        industryMaturity: assessments.industryMaturity,
        companyStage: assessments.companyStage,
        strategicFocus: assessments.strategicFocus,
        // Select organization name from organizations table
        organizationName: organizations.name,
      })
      .from(reports)
      .leftJoin(assessments, eq(reports.assessmentId, assessments.id))
      .leftJoin(organizations, eq(assessments.organizationId, organizations.id))
      .where(eq(reports.id, id));
    
    return result[0] as ReportWithAssessmentDetails | undefined;
  }

  async getReportByAssessment(assessmentId: number): Promise<ReportWithAssessmentDetails | undefined> {
    await this.ensureInitialized();
    const result = await this.db
      .select({
        // Select all fields from reports table
        ...reports,
        // Select specific fields from assessments table
        assessmentTitle: assessments.title,
        industry: assessments.industry,
        industryMaturity: assessments.industryMaturity,
        companyStage: assessments.companyStage,
        strategicFocus: assessments.strategicFocus,
        // Select organization name from organizations table
        organizationName: organizations.name,
      })
      .from(reports)
      .leftJoin(assessments, eq(reports.assessmentId, assessments.id))
      .leftJoin(organizations, eq(assessments.organizationId, organizations.id))
      .where(eq(reports.assessmentId, assessmentId));
      
    return result[0] as ReportWithAssessmentDetails | undefined;
  }

  async listReports(): Promise<Report[]> {
    await this.ensureInitialized();
    return await this.db.select().from(reports);
  }

  async createReport(report: InsertReport): Promise<Report> {
    await this.ensureInitialized();
    const result = await this.db.insert(reports).values(report).returning();
    return result[0];
  }

  async updateReportCommentary(id: number, commentary: string): Promise<Report> {
    await this.ensureInitialized();
    const result = await this.db.update(reports)
      .set({ commentary })
      .where(eq(reports.id, id))
      .returning();
    
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
    const result = await this.db.select().from(aiTools).where(eq(aiTools.tool_id, id));
    return result[0];
  }

  async listAITools(search?: string, category?: string, licenseType?: string): Promise<AiTool[]> {
    await this.ensureInitialized();
    let query = this.db.select().from(aiTools).$dynamic(); 

    const conditions = [];
    if (search) {
      conditions.push(sql`(${aiTools.tool_name} ilike ${`%${search}%`} or ${aiTools.description} ilike ${`%${search}%`})`);
    }
    if (category) {
      conditions.push(eq(aiTools.primary_category, category));
    }
    if (licenseType) {
      conditions.push(eq(aiTools.license_type, licenseType));
    }

    if (conditions.length > 0) {
      query = query.where(sql.join(conditions, sql` and `));
    }
    
    return await query.orderBy(asc(aiTools.tool_name));
  }

  async createAITool(tool: InsertAiTool): Promise<AiTool> { 
    await this.ensureInitialized();
    
    const dbInsertData: InsertAiTool = {
        ...tool, 
        tool_name: tool.tool_name, 
    };

    const result = await this.db.insert(aiTools).values(dbInsertData).returning();
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
    
    const result = await this.db.update(aiTools)
      .set(finalUpdateData)
      .where(eq(aiTools.tool_id, id))
      .returning();
      
    const updatedDbTool = result[0];

     if (!updatedDbTool) {
        throw new Error(`Failed to update AI tool with ID ${id}, record not found or update failed.`);
    }

    return updatedDbTool;
  }

  async deleteAITool(id: number): Promise<void> { 
    await this.ensureInitialized();
    const result = await this.db.delete(aiTools).where(eq(aiTools.tool_id, id)).returning({ deletedId: aiTools.tool_id });
    
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
}