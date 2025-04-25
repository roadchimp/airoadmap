import { 
  User, InsertUser, 
  Organization, InsertOrganization,
  Department, InsertDepartment,
  JobRole, InsertJobRole,
  AICapability, InsertAICapability,
  Assessment, InsertAssessment,
  Report, InsertReport,
  WizardStepData,
  HeatmapData,
  AISuggestion,
  PerformanceImpact,
  PrioritizedItem,
  JobDescription, InsertJobDescription,
  JobScraperConfig, InsertJobScraperConfig,
  ProcessedJobContent
} from "../shared/schema.ts";

import { PgStorage } from './pg-storage.ts';

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  listOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Department methods
  getDepartment(id: number): Promise<Department | undefined>;
  listDepartments(): Promise<Department[]>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  
  // JobRole methods
  getJobRole(id: number): Promise<JobRole | undefined>;
  listJobRoles(): Promise<JobRole[]>;
  listJobRolesByDepartment(departmentId: number): Promise<JobRole[]>;
  createJobRole(role: InsertJobRole): Promise<JobRole>;
  
  // AICapability methods
  getAICapability(id: number): Promise<AICapability | undefined>;
  listAICapabilities(): Promise<AICapability[]>;
  createAICapability(capability: InsertAICapability): Promise<AICapability>;
  
  // Assessment methods
  getAssessment(id: number): Promise<Assessment | undefined>;
  listAssessments(): Promise<Assessment[]>;
  listAssessmentsByUser(userId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessmentStep(id: number, stepData: Partial<WizardStepData>): Promise<Assessment>;
  updateAssessmentStatus(id: number, status: string): Promise<Assessment>;
  
  // Report methods
  getReport(id: number): Promise<Report | undefined>;
  getReportByAssessment(assessmentId: number): Promise<Report | undefined>;
  listReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReportCommentary(id: number, commentary: string): Promise<Report>;
  
  // Job Description methods
  getJobDescription(id: number): Promise<JobDescription | undefined>;
  listJobDescriptions(limit?: number, offset?: number): Promise<JobDescription[]>;
  listJobDescriptionsByStatus(status: string, limit?: number, offset?: number): Promise<JobDescription[]>;
  createJobDescription(jobDescription: InsertJobDescription): Promise<JobDescription>;
  updateJobDescriptionProcessedContent(id: number, processedContent: ProcessedJobContent): Promise<JobDescription>;
  updateJobDescriptionStatus(id: number, status: string, error?: string): Promise<JobDescription>;
  
  // Job Scraper Config methods
  getJobScraperConfig(id: number): Promise<JobScraperConfig | undefined>;
  listJobScraperConfigs(): Promise<JobScraperConfig[]>;
  listActiveJobScraperConfigs(): Promise<JobScraperConfig[]>;
  createJobScraperConfig(config: InsertJobScraperConfig): Promise<JobScraperConfig>;
  updateJobScraperConfigLastRun(id: number): Promise<JobScraperConfig>;
  updateJobScraperConfigStatus(id: number, isActive: boolean): Promise<JobScraperConfig>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private organizations: Map<number, Organization>;
  private departments: Map<number, Department>;
  private jobRoles: Map<number, JobRole>;
  private aiCapabilities: Map<number, AICapability>;
  private assessments: Map<number, Assessment>;
  private reports: Map<number, Report>;
  private jobDescriptions: Map<number, JobDescription>;
  private jobScraperConfigs: Map<number, JobScraperConfig>;
  
  private userIdCounter: number;
  private orgIdCounter: number;
  private deptIdCounter: number;
  private roleIdCounter: number;
  private capabilityIdCounter: number;
  private assessmentIdCounter: number;
  private reportIdCounter: number;
  private jobDescriptionIdCounter: number;
  private jobScraperConfigIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.departments = new Map();
    this.jobRoles = new Map();
    this.aiCapabilities = new Map();
    this.assessments = new Map();
    this.reports = new Map();
    this.jobDescriptions = new Map();
    this.jobScraperConfigs = new Map();
    
    this.userIdCounter = 1;
    this.orgIdCounter = 1;
    this.deptIdCounter = 1;
    this.roleIdCounter = 1;
    this.capabilityIdCounter = 1;
    this.assessmentIdCounter = 1;
    this.reportIdCounter = 1;
    this.jobDescriptionIdCounter = 1;
    this.jobScraperConfigIdCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'consultant' // Ensure role is always defined
    };
    this.users.set(id, user);
    return user;
  }
  
  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }
  
  async listOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }
  
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = this.orgIdCounter++;
    const organization = { 
      ...org, 
      id,
      description: org.description || null // Ensure description is never undefined
    };
    this.organizations.set(id, organization);
    return organization;
  }
  
  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }
  
  async listDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }
  
  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const id = this.deptIdCounter++;
    const department = { 
      ...dept, 
      id,
      description: dept.description || null // Ensure description is never undefined
    };
    this.departments.set(id, department);
    return department;
  }
  
  // JobRole methods
  async getJobRole(id: number): Promise<JobRole | undefined> {
    return this.jobRoles.get(id);
  }
  
  async listJobRoles(): Promise<JobRole[]> {
    return Array.from(this.jobRoles.values());
  }
  
  async listJobRolesByDepartment(departmentId: number): Promise<JobRole[]> {
    return Array.from(this.jobRoles.values()).filter(
      (role) => role.departmentId === departmentId
    );
  }
  
  async createJobRole(role: InsertJobRole): Promise<JobRole> {
    const id = this.roleIdCounter++;
    const jobRole = { 
      ...role, 
      id,
      description: role.description || null,
      keyResponsibilities: role.keyResponsibilities || null,
      aiPotential: role.aiPotential || null
    };
    this.jobRoles.set(id, jobRole);
    return jobRole;
  }
  
  // AICapability methods
  async getAICapability(id: number): Promise<AICapability | undefined> {
    return this.aiCapabilities.get(id);
  }
  
  async listAICapabilities(): Promise<AICapability[]> {
    return Array.from(this.aiCapabilities.values());
  }
  
  async createAICapability(capability: InsertAICapability): Promise<AICapability> {
    const id = this.capabilityIdCounter++;
    const aiCapability = { 
      ...capability, 
      id,
      description: capability.description || null,
      implementationEffort: capability.implementationEffort || null,
      businessValue: capability.businessValue || null,
      easeScore: capability.easeScore || null,
      valueScore: capability.valueScore || null
    };
    this.aiCapabilities.set(id, aiCapability);
    return aiCapability;
  }
  
  // Assessment methods
  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }
  
  async listAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }
  
  async listAssessmentsByUser(userId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(
      (assessment) => assessment.userId === userId
    );
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const createdAt = new Date();
    const newAssessment = { 
      ...assessment, 
      id, 
      createdAt,
      status: assessment.status || 'draft',
      stepData: assessment.stepData || null
    };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }
  
  async updateAssessmentStep(id: number, stepData: Partial<WizardStepData>): Promise<Assessment> {
    const assessment = this.assessments.get(id);
    if (!assessment) {
      throw new Error(`Assessment with id ${id} not found`);
    }
    
    const updatedAssessment = {
      ...assessment,
      stepData: {
        ...(assessment.stepData || {}),
        ...stepData
      }
    };
    
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  async updateAssessmentStatus(id: number, status: string): Promise<Assessment> {
    const assessment = this.assessments.get(id);
    if (!assessment) {
      throw new Error(`Assessment with id ${id} not found`);
    }
    
    const updatedAssessment = {
      ...assessment,
      status
    };
    
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }
  
  async getReportByAssessment(assessmentId: number): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find(
      (report) => report.assessmentId === assessmentId
    );
  }
  
  async listReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }
  
  async createReport(report: InsertReport): Promise<Report> {
    const id = this.reportIdCounter++;
    const generatedAt = new Date();
    const newReport = { 
      ...report, 
      id, 
      generatedAt,
      executiveSummary: report.executiveSummary || null,
      prioritizationData: report.prioritizationData || null,
      aiSuggestions: report.aiSuggestions || null,
      performanceImpact: report.performanceImpact || null,
      consultantCommentary: report.consultantCommentary || null
    };
    this.reports.set(id, newReport);
    return newReport;
  }

  async updateReportCommentary(id: number, commentary: string): Promise<Report> {
    const report = this.reports.get(id);
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }
    
    const updatedReport = {
      ...report,
      consultantCommentary: commentary
    };
    
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  // Job Description methods
  async getJobDescription(id: number): Promise<JobDescription | undefined> {
    return this.jobDescriptions.get(id);
  }
  
  async listJobDescriptions(limit: number = 100, offset: number = 0): Promise<JobDescription[]> {
    const allJobDescriptions = Array.from(this.jobDescriptions.values());
    return allJobDescriptions.slice(offset, offset + limit);
  }
  
  async listJobDescriptionsByStatus(status: string, limit: number = 100, offset: number = 0): Promise<JobDescription[]> {
    const filteredJobDescriptions = Array.from(this.jobDescriptions.values())
      .filter(jd => jd.status === status);
    return filteredJobDescriptions.slice(offset, offset + limit);
  }
  
  async createJobDescription(jobDescription: InsertJobDescription): Promise<JobDescription> {
    const id = this.jobDescriptionIdCounter++;
    const now = new Date();
    const newJobDescription: JobDescription = {
      ...jobDescription,
      id,
      status: jobDescription.status || 'raw',
      company: jobDescription.company || null,
      location: jobDescription.location || null,
      processedContent: null,
      keywords: jobDescription.keywords || null,
      dateScraped: now,
      dateProcessed: null,
      error: null
    };
    this.jobDescriptions.set(id, newJobDescription);
    return newJobDescription;
  }
  
  async updateJobDescriptionProcessedContent(id: number, processedContent: ProcessedJobContent): Promise<JobDescription> {
    const jobDescription = this.jobDescriptions.get(id);
    if (!jobDescription) {
      throw new Error(`JobDescription with id ${id} not found`);
    }
    
    const updatedJobDescription = {
      ...jobDescription,
      processedContent
    };
    
    this.jobDescriptions.set(id, updatedJobDescription);
    return updatedJobDescription;
  }
  
  async updateJobDescriptionStatus(id: number, status: string, error?: string): Promise<JobDescription> {
    const jobDescription = this.jobDescriptions.get(id);
    if (!jobDescription) {
      throw new Error(`JobDescription with id ${id} not found`);
    }
    
    const updatedJobDescription = {
      ...jobDescription,
      status,
      error: error || null
    };
    
    this.jobDescriptions.set(id, updatedJobDescription);
    return updatedJobDescription;
  }
  
  // Job Scraper Config methods
  async getJobScraperConfig(id: number): Promise<JobScraperConfig | undefined> {
    return this.jobScraperConfigs.get(id);
  }
  
  async listJobScraperConfigs(): Promise<JobScraperConfig[]> {
    return Array.from(this.jobScraperConfigs.values());
  }
  
  async listActiveJobScraperConfigs(): Promise<JobScraperConfig[]> {
    return Array.from(this.jobScraperConfigs.values())
      .filter(config => config.isActive);
  }
  
  async createJobScraperConfig(config: InsertJobScraperConfig): Promise<JobScraperConfig> {
    const id = this.jobScraperConfigIdCounter++;
    const now = new Date();
    const newConfig: JobScraperConfig = {
      ...config,
      id,
      createdAt: now,
      location: config.location || null,
      keywords: config.keywords || null,
      isActive: config.isActive ?? true,
      cronSchedule: config.cronSchedule || '0 0 * * *', // Default to daily at midnight
      lastRun: null
    };
    this.jobScraperConfigs.set(id, newConfig);
    return newConfig;
  }
  
  async updateJobScraperConfigLastRun(id: number): Promise<JobScraperConfig> {
    const config = this.jobScraperConfigs.get(id);
    if (!config) {
      throw new Error(`JobScraperConfig with id ${id} not found`);
    }
    
    const updatedConfig = {
      ...config,
      lastRun: new Date()
    };
    
    this.jobScraperConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
  
  async updateJobScraperConfigStatus(id: number, isActive: boolean): Promise<JobScraperConfig> {
    const config = this.jobScraperConfigs.get(id);
    if (!config) {
      throw new Error(`JobScraperConfig with id ${id} not found`);
    }
    
    const updatedConfig = {
      ...config,
      isActive
    };
    
    this.jobScraperConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  private initializeSampleData() {
    // Create sample user
    const user: User = {
      id: this.userIdCounter++,
      username: "consultant",
      password: "password123", // In a real app, this would be hashed
      fullName: "Consultant User",
      email: "consultant@example.com",
      role: "consultant"
    };
    this.users.set(user.id, user);

    // Create sample departments
    const departments: Department[] = [
      { id: this.deptIdCounter++, name: "Sales & Marketing", description: "Handles all sales and marketing activities" },
      { id: this.deptIdCounter++, name: "Customer Support", description: "Provides support to customers" },
      { id: this.deptIdCounter++, name: "Finance", description: "Manages financial operations" },
      { id: this.deptIdCounter++, name: "Human Resources", description: "Handles employee management and recruitment" },
      { id: this.deptIdCounter++, name: "Engineering", description: "Develops and maintains products" },
      { id: this.deptIdCounter++, name: "Operations", description: "Oversees day-to-day business operations" }
    ];
    departments.forEach(dept => this.departments.set(dept.id, dept));

    // Create sample job roles
    const jobRoles: JobRole[] = [
      {
        id: this.roleIdCounter++,
        title: "Sales Operations Specialist",
        departmentId: 1, // Sales & Marketing
        description: "Manages RFP responses, sales data analysis, and CRM maintenance",
        keyResponsibilities: ["Manage RFP responses", "Maintain sales data", "Perform CRM analysis", "Create sales reports", "Support proposal creation"],
        aiPotential: "High"
      },
      {
        id: this.roleIdCounter++,
        title: "Content Marketing Manager",
        departmentId: 1, // Sales & Marketing
        description: "Creates and distributes content for marketing campaigns",
        keyResponsibilities: ["Create marketing content", "Manage editorial calendar", "Coordinate content distribution", "Analyze content performance", "Develop content strategy"],
        aiPotential: "Medium"
      },
      {
        id: this.roleIdCounter++,
        title: "Digital Marketing Specialist",
        departmentId: 1, // Sales & Marketing
        description: "Manages online advertising and campaign analysis",
        keyResponsibilities: ["Manage online ad campaigns", "Analyze marketing data", "Optimize conversion rates", "Report on marketing KPIs", "Conduct A/B testing"],
        aiPotential: "Medium"
      },
      {
        id: this.roleIdCounter++,
        title: "Customer Support Agent",
        departmentId: 2, // Customer Support
        description: "Handles tier 1 customer inquiries via chat, email, and phone",
        keyResponsibilities: ["Handle customer inquiries", "Troubleshoot basic issues", "Escalate complex problems", "Maintain customer records", "Follow up on resolved issues"],
        aiPotential: "High"
      },
      {
        id: this.roleIdCounter++,
        title: "Technical Support Specialist",
        departmentId: 2, // Customer Support
        description: "Resolves complex technical issues and product-specific problems",
        keyResponsibilities: ["Diagnose technical problems", "Provide advanced troubleshooting", "Document solutions", "Train junior support staff", "Contribute to knowledge base"],
        aiPotential: "Medium"
      }
    ];
    jobRoles.forEach(role => this.jobRoles.set(role.id, role));

    // Sample AI Capabilities
    const sampleCapabilities = [
      {
        name: "Automated Document Processing",
        category: "Document Management",
        description: "AI-powered document processing and analysis",
        implementationEffort: "Medium",
        businessValue: "High",
        easeScore: "Medium",
        valueScore: "High"
      },
      {
        name: "Predictive Analytics",
        category: "Data Analysis",
        description: "Advanced predictive modeling and forecasting",
        implementationEffort: "High",
        businessValue: "Very High",
        easeScore: "Low",
        valueScore: "Very High"
      },
      {
        name: "Natural Language Processing",
        category: "Text Analysis",
        description: "Understanding and processing human language",
        implementationEffort: "Medium",
        businessValue: "High",
        easeScore: "Medium",
        valueScore: "High"
      },
      {
        name: "Image Recognition",
        category: "Computer Vision",
        description: "AI-powered image analysis and recognition",
        implementationEffort: "High",
        businessValue: "Medium",
        easeScore: "Low",
        valueScore: "Medium"
      },
      {
        name: "Process Automation",
        category: "Workflow",
        description: "Automating repetitive business processes",
        implementationEffort: "Low",
        businessValue: "High",
        easeScore: "High",
        valueScore: "High"
      }
    ];

    sampleCapabilities.forEach(capability => {
      this.createAICapability(capability);
    });

    // Add sample job scraper configs
    this.createJobScraperConfig({
      name: "LinkedIn Tech Jobs",
      targetWebsite: "linkedin",
      keywords: ["software engineer", "web developer", "frontend", "backend"],
      location: "San Francisco",
      isActive: true,
      cronSchedule: "0 0 * * *"
    });
    
    this.createJobScraperConfig({
      name: "Indeed Data Science",
      targetWebsite: "indeed",
      keywords: ["data scientist", "machine learning", "AI", "data analyst"],
      location: "Remote",
      isActive: true,
      cronSchedule: "0 12 * * *"
    });
  }
}

// Create storage instance based on environment
let storageInstance: IStorage;

try {
  // Check if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL storage implementation');
    storageInstance = new PgStorage();
  } else {
    console.log('DATABASE_URL not set, using in-memory storage implementation');
    storageInstance = new MemStorage();
  }
} catch (error) {
  console.error('Error initializing PostgreSQL storage, falling back to in-memory storage:', error);
  storageInstance = new MemStorage();
}

// Export the selected storage implementation
export const storage = storageInstance;