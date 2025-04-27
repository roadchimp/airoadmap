import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { eq, sql } from 'drizzle-orm';
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
  JobRole, InsertJobRole,
  AICapability, InsertAICapability,
  Assessment, InsertAssessment, WizardStepData,
  Report, InsertReport,
  JobDescription, InsertJobDescription, ProcessedJobContent,
  JobScraperConfig, InsertJobScraperConfig,
  AiTool, InsertAiTool,
  CapabilityToolMapping, InsertCapabilityToolMapping,
  AITool, AssessmentScoreData
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

  async listJobRoles(): Promise<JobRole[]> {
    return await this.db.select().from(jobRoles);
  }

  async listJobRolesByDepartment(departmentId: number): Promise<JobRole[]> {
    return await this.db.select().from(jobRoles).where(eq(jobRoles.departmentId, departmentId));
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

  // AI Tools methods
  async getAITool(id: number): Promise<AITool | undefined> {
    await this.ensureInitialized();
    const result = await this.db.select().from(aiTools).where(eq(aiTools.toolId, id));
    if (!result[0]) return undefined;
    
    const tool = result[0] as AiTool;
    return {
      id: tool.toolId,
      tool_name: tool.toolName,
      description: tool.description || "",
      website_url: tool.websiteUrl || "",
      license_type: (tool.licenseType as 'Open Source' | 'Commercial' | 'Freemium' | 'Unknown') || 'Unknown',
      primary_category: tool.primaryCategory || "",
      tags: tool.tags as string[] || [],
      created_at: tool.createdAt,
      updated_at: tool.updatedAt
    };
  }

  async listAITools(search?: string, category?: string, licenseType?: string): Promise<AITool[]> {
    await this.ensureInitialized();
    let query = this.db.select().from(aiTools);
    
    if (search) {
      query = query.where(sql`LOWER(tool_name) LIKE LOWER(${'%' + search + '%'})`);
    }
    if (category) {
      query = query.where(eq(aiTools.primaryCategory, category));
    }
    if (licenseType) {
      query = query.where(eq(aiTools.licenseType, licenseType));
    }
    
    const results = await query;
    return results.map((result: AiTool) => ({
      id: result.toolId,
      tool_name: result.toolName,
      description: result.description || "",
      website_url: result.websiteUrl || "",
      license_type: (result.licenseType as 'Open Source' | 'Commercial' | 'Freemium' | 'Unknown') || 'Unknown',
      primary_category: result.primaryCategory || "",
      tags: result.tags as string[] || [],
      created_at: result.createdAt,
      updated_at: result.updatedAt
    }));
  }

  async createAITool(tool: Omit<AITool, "id" | "created_at" | "updated_at">): Promise<AITool> {
    await this.ensureInitialized();
    const now = new Date();
    const result = await this.db.insert(aiTools).values({
      toolName: tool.tool_name,
      description: tool.description,
      websiteUrl: tool.website_url,
      licenseType: tool.license_type,
      primaryCategory: tool.primary_category,
      tags: tool.tags || null,
      createdAt: now,
      updatedAt: now
    }).returning();

    return {
      id: result[0].toolId,
      tool_name: result[0].toolName,
      description: result[0].description,
      website_url: result[0].websiteUrl,
      license_type: result[0].licenseType,
      primary_category: result[0].primaryCategory,
      tags: result[0].tags,
      created_at: result[0].createdAt,
      updated_at: result[0].updatedAt
    };
  }

  async updateAITool(id: number, tool: Partial<Omit<AITool, "id" | "created_at" | "updated_at">>): Promise<AITool> {
    await this.ensureInitialized();
    const now = new Date();
    const updates: any = {
      updatedAt: now
    };
    
    if (tool.tool_name) updates.toolName = tool.tool_name;
    if (tool.description !== undefined) updates.description = tool.description;
    if (tool.website_url !== undefined) updates.websiteUrl = tool.website_url;
    if (tool.license_type !== undefined) updates.licenseType = tool.license_type;
    if (tool.primary_category !== undefined) updates.primaryCategory = tool.primary_category;
    if (tool.tags !== undefined) updates.tags = tool.tags;
    
    const result = await this.db.update(aiTools)
      .set(updates)
      .where(eq(aiTools.toolId, id))
      .returning();

    return {
      id: result[0].toolId,
      tool_name: result[0].toolName,
      description: result[0].description,
      website_url: result[0].websiteUrl,
      license_type: result[0].licenseType,
      primary_category: result[0].primaryCategory,
      tags: result[0].tags,
      created_at: result[0].createdAt,
      updated_at: result[0].updatedAt
    };
  }

  async deleteAITool(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await this.db.delete(aiTools)
      .where(eq(aiTools.toolId, id))
      .returning();
    return result.length > 0;
  }

  // Capability Tool Mapping methods
  async getCapabilityToolMappings(capabilityId: number): Promise<CapabilityToolMapping[]> {
    await this.ensureInitialized();
    return await this.db.select()
      .from(capabilityToolMapping)
      .where(eq(capabilityToolMapping.capabilityId, capabilityId));
  }

  async getToolCapabilityMappings(toolId: number): Promise<CapabilityToolMapping[]> {
    await this.ensureInitialized();
    return await this.db.select()
      .from(capabilityToolMapping)
      .where(eq(capabilityToolMapping.toolId, toolId));
  }

  async createCapabilityToolMapping(mapping: InsertCapabilityToolMapping): Promise<CapabilityToolMapping> {
    await this.ensureInitialized();
    const result = await this.db.insert(capabilityToolMapping)
      .values({
        ...mapping,
        notes: mapping.notes || null
      })
      .returning();
    return result[0];
  }

  async deleteCapabilityToolMapping(mappingId: number): Promise<void> {
    await this.ensureInitialized();
    await this.db.delete(capabilityToolMapping)
      .where(eq(capabilityToolMapping.mappingId, mappingId));
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