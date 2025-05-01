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
  aiTools, capabilityToolMapping, assessmentScores
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
  AssessmentScoreData
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
    const result = await this.db.select().from(assessments).where(eq(assessments.id, id));
    return result[0];
  }

  async listAssessments(): Promise<Assessment[]> {
    return await this.db.select().from(assessments);
  }

  async listAssessmentsByUser(userId: number): Promise<Assessment[]> {
    return await this.db.select().from(assessments).where(eq(assessments.userId, userId));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const result = await this.db.insert(assessments).values({
      ...assessment,
      status: assessment.status || 'draft',
      stepData: assessment.stepData || null
    }).returning();
    return result[0];
  }

  async updateAssessmentStep(id: number, stepData: Partial<WizardStepData>): Promise<Assessment> {
    // Get current assessment
    const current = await this.getAssessment(id);
    if (!current) {
      throw new Error(`Assessment with ID ${id} not found`);
    }

    // Merge stepData with existing data safely
    let updatedStepData: any = {};
    
    // Only spread if there's existing data and it's an object
    if (current.stepData && typeof current.stepData === 'object') {
      updatedStepData = { ...current.stepData };
    }
    
    // Add the new step data
    updatedStepData = { ...updatedStepData, ...stepData };

    // Update assessment
    const result = await this.db.update(assessments)
      .set({ stepData: updatedStepData })
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

  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    const result = await this.db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }

  async getReportByAssessment(assessmentId: number): Promise<Report | undefined> {
    const result = await this.db.select().from(reports).where(eq(reports.assessmentId, assessmentId));
    return result[0];
  }

  async listReports(): Promise<Report[]> {
    return await this.db.select().from(reports);
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await this.db.insert(reports).values(report).returning();
    return result[0];
  }

  async updateReportCommentary(id: number, commentary: string): Promise<Report> {
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

  // AITool methods (Reverted to use snake_case AiTool type)

  /**
   * Retrieves a single AI tool by its ID.
   * @param id The numeric ID of the AI tool.
   * @returns A promise that resolves to the AiTool object or undefined if not found.
   */
  async getAITool(id: number): Promise<AiTool | undefined> {
    await this.ensureInitialized();
    const result: AiTool[] = await this.db.select().from(aiTools).where(eq(aiTools.tool_id, id));
    return result[0];
  }

  /**
   * Lists AI tools, optionally filtering by search term, category, and license type.
   * @param search Optional search term to filter by tool name or description.
   * @param category Optional category to filter by.
   * @param licenseType Optional license type to filter by.
   * @returns A promise that resolves to an array of AiTool objects.
   */
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

  /**
   * Creates a new AI tool in the database.
   * @param tool An object conforming to InsertAiTool (snake_case, excluding db-generated fields like created_at, updated_at).
   * @returns A promise that resolves to the newly created AiTool object (including db-generated fields).
   */
  async createAITool(tool: InsertAiTool): Promise<AiTool> { 
    await this.ensureInitialized();
    
    const dbInsertData: InsertAiTool = {
        ...tool, 
        tool_name: tool.tool_name, 
    };

    const result: AiTool[] = await this.db.insert(aiTools).values(dbInsertData).returning();
    const newDbTool = result[0];

    if (!newDbTool) {
        throw new Error("Failed to create AI tool, database did not return the created record.");
    }

    return newDbTool;
  }

  /**
   * Updates an existing AI tool by its ID.
   * @param id The numeric ID of the AI tool to update.
   * @param toolUpdate A partial object conforming to InsertAiTool (snake_case) containing the fields to update.
   * @returns A promise that resolves to the updated AiTool object.
   * @throws Error if the tool is not found or if no fields are provided for update.
   */
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
    
    const result: AiTool[] = await this.db.update(aiTools)
      .set(finalUpdateData)
      .where(eq(aiTools.tool_id, id))
      .returning();
      
    const updatedDbTool = result[0];

     if (!updatedDbTool) {
        throw new Error(`Failed to update AI tool with ID ${id}, record not found or update failed.`);
    }

    return updatedDbTool;
  }

  /**
   * Deletes an AI tool by its ID.
   * @param id The numeric ID of the AI tool to delete.
   * @returns A promise that resolves when the deletion is attempted. Logs a warning if the tool was not found.
   */
  async deleteAITool(id: number): Promise<void> { 
    await this.ensureInitialized();
    const result = await this.db.delete(aiTools).where(eq(aiTools.tool_id, id)).returning({ deletedId: aiTools.tool_id });
    
    if (result.length === 0) {
       console.warn(`Attempted to delete AI Tool with ID ${id}, but it was not found.`);
    }
  }

  // CapabilityToolMapping methods
  // These seem okay as they use the specific InsertCapabilityToolMapping type
  async getCapabilityToolMappings(capabilityId: number): Promise<CapabilityToolMapping[]> {
    await this.ensureInitialized();
    return await this.db.select()
      .from(capabilityToolMapping)
      .where(eq(capabilityToolMapping.capability_id, capabilityId));
  }

  async getToolCapabilityMappings(toolId: number): Promise<CapabilityToolMapping[]> {
    await this.ensureInitialized();
    return await this.db.select()
      .from(capabilityToolMapping)
      .where(eq(capabilityToolMapping.tool_id, toolId));
  }

  async createCapabilityToolMapping(mapping: InsertCapabilityToolMapping): Promise<CapabilityToolMapping> {
    await this.ensureInitialized();
    const result = await this.db.insert(capabilityToolMapping)
      .values({
        ...mapping,
      })
      .returning();
    return result[0];
  }

  async deleteCapabilityToolMapping(capabilityId: number, toolId: number): Promise<void> {
    await this.ensureInitialized();
    await this.db.delete(capabilityToolMapping)
      .where(sql`${capabilityToolMapping.capability_id} = ${capabilityId} and ${capabilityToolMapping.tool_id} = ${toolId}`);
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
} 