import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
// Using dynamic import for pg which works better with ESM
import { IStorage } from './storage.ts';

// Import the schema
import { 
  assessments, departments, organizations, users, reports, 
  aiCapabilities, jobRoles, jobDescriptions, jobScraperConfigs
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
  JobScraperConfig, InsertJobScraperConfig
} from '../shared/schema.ts';

export class PgStorage implements IStorage {
  private db: any; // Use any to avoid TypeScript errors for now
  private pool: any;
  private isInitialized: boolean = false;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    try {
      // Check if database URL is available
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // Dynamically import pg
      const pg = await import('pg');
      
      // Initialize PostgreSQL connection
      this.pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      });
      
      // Initialize Drizzle ORM
      this.db = drizzle(this.pool);
      this.isInitialized = true;
      console.log('PostgreSQL database connection established');
    } catch (error) {
      console.error('Error initializing PostgreSQL connection:', error);
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
    await this.ensureInitialized();
    if (this.pool) {
      await this.pool.end();
      console.log('PostgreSQL database connection closed');
    }
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
} 