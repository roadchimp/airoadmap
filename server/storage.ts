import { eq } from "drizzle-orm";
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
  ProcessedJobContent,
  AiTool,
  AssessmentScoreData,
  InsertAiTool,
  AssessmentResponse,
  InsertAssessmentResponse
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
  updateAssessmentUserID(id: number, userId: number): Promise<Assessment>;
  deleteAssessment(id: number): Promise<void>;
  
  // Report methods
  getReport(id: number): Promise<Report | undefined>;
  getReportByAssessment(assessmentId: number): Promise<Report | undefined>;
  listReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReportCommentary(id: number, commentary: string): Promise<Report>;
  
  // Assessment Response methods
  createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse>;
  batchCreateAssessmentResponses(responses: InsertAssessmentResponse[]): Promise<AssessmentResponse[]>;
  getAssessmentResponsesByAssessment(assessmentId: number): Promise<AssessmentResponse[]>;
  
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

  // AI Tool methods - USE snake_case type
  getAITool(id: number): Promise<AiTool | undefined>;
  listAITools(search?: string, category?: string, licenseType?: string): Promise<AiTool[]>;
  createAITool(tool: InsertAiTool): Promise<AiTool>;
  updateAITool(id: number, toolUpdate: Partial<InsertAiTool>): Promise<AiTool>;
  deleteAITool(id: number): Promise<void>;

  // Assessment Score methods
  upsertAssessmentScore(score: Omit<AssessmentScoreData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssessmentScoreData>;
  getAssessmentScore(wizardStepId: string): Promise<AssessmentScoreData | undefined>;
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
  private aiTools: Map<number, AiTool>;
  private assessmentScores: Map<string, AssessmentScoreData>;
  private assessmentResponses: Map<number, AssessmentResponse>;
  private deletedAssessments: Map<number, Assessment>;
  private userIdCounter: number;
  private orgIdCounter: number;
  private deptIdCounter: number;
  private roleIdCounter: number;
  private capabilityIdCounter: number;
  private assessmentIdCounter: number;
  private reportIdCounter: number;
  private jobDescriptionIdCounter: number;
  private jobScraperConfigIdCounter: number;
  private aiToolIdCounter: number;
  private assessmentResponseIdCounter: number;
  
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
    this.aiTools = new Map();
    this.assessmentScores = new Map();
    this.assessmentResponses = new Map();
    this.deletedAssessments = new Map();
    this.userIdCounter = 1;
    this.orgIdCounter = 1;
    this.deptIdCounter = 1;
    this.roleIdCounter = 1;
    this.capabilityIdCounter = 1;
    this.assessmentIdCounter = 1;
    this.reportIdCounter = 1;
    this.jobDescriptionIdCounter = 1;
    this.jobScraperConfigIdCounter = 1;
    this.aiToolIdCounter = 1;
    this.assessmentResponseIdCounter = 1;
    
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
    const now = new Date(); // Get current timestamp
    // Explicitly define the object type and handle potential undefined -> null conversions
    const aiCapability: AICapability = { 
      id: id,
      name: capability.name,
      category: capability.category,
      description: capability.description ?? null,
      implementationEffort: capability.implementationEffort ?? null,
      businessValue: capability.businessValue ?? null,
      easeScore: capability.easeScore ?? null,
      valueScore: capability.valueScore ?? null,
      // Ensure migrated fields default to null if undefined
      primary_category: capability.primary_category ?? null,
      license_type: capability.license_type ?? null,
      website_url: capability.website_url ?? null,
      tags: capability.tags ?? null, // Assuming AICapability allows null tags array
      createdAt: now,
      updatedAt: now
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
    this.assessments.set(id, newAssessment as Assessment);
    return newAssessment as Assessment;
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
    
    this.assessments.set(id, updatedAssessment as Assessment);
    return updatedAssessment as Assessment;
  }
  
  async updateAssessmentUserID(id: number, userId: number): Promise<Assessment> {
    const assessment = this.assessments.get(id);
    if (!assessment) {
      throw new Error(`Assessment with id ${id} not found`);
    }
    
    const updatedAssessment = {
      ...assessment,
      userId
    };
    
    this.assessments.set(id, updatedAssessment as Assessment);
    return updatedAssessment as Assessment;
  }
  
  async deleteAssessment(id: number): Promise<void> {
    const assessment = this.assessments.get(id);
    if (!assessment) {
      throw new Error(`Assessment with id ${id} not found`);
    }
    this.deletedAssessments.set(id, assessment);
    this.assessments.delete(id);
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

  // AI Tool methods - USE snake_case type
  async getAITool(id: number): Promise<AiTool| undefined> {
    return this.aiTools.get(id);
  }

  async listAITools(search?: string, category?: string, licenseType?: string): Promise<AiTool[]> {
    let tools = Array.from(this.aiTools.values());

    if (search) {
      const searchLower = search.toLowerCase();
      tools = tools.filter(tool => 
        tool.tool_name.toLowerCase().includes(searchLower) ||
        (tool.description ?? '').toLowerCase().includes(searchLower) ||
        (tool.primary_category ?? '').toLowerCase().includes(searchLower) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (category) {
      tools = tools.filter(tool => tool.primary_category === category);
    }

    if (licenseType) {
      tools = tools.filter(tool => tool.license_type === licenseType);
    }

    return tools;
  }

  async createAITool(tool: InsertAiTool): Promise<AiTool> {
    const id = this.aiToolIdCounter++;
    const now = new Date();
    
    // Explicitly define the AiTool object to match the schema
    const newTool: AiTool = {
      tool_id: id, 
      tool_name: tool.tool_name, // Required
      primary_category: tool.primary_category ?? null,
      license_type: tool.license_type ?? null,
      description: tool.description ?? null,
      website_url: tool.website_url ?? null,
      tags: tool.tags ?? null, 
      created_at: now,
      updated_at: now
    };
    
    this.aiTools.set(id, newTool);
    return newTool;
  }

  async updateAITool(id: number, toolUpdate: Partial<InsertAiTool>): Promise<AiTool> {
    const existingTool = await this.getAITool(id);
    if (!existingTool) {
      throw new Error(`AI Tool with id ${id} not found`);
    }

    // Note: Spreading toolUpdate might overwrite tool_id if it exists in InsertAiTool
    const updatedTool: AiTool = {
      ...existingTool,
      ...toolUpdate, 
      updated_at: new Date()
    };
    this.aiTools.set(id, updatedTool);
    return updatedTool;
  }

  async deleteAITool(id: number): Promise<void> {
    this.aiTools.delete(id);
  }

  // Assessment Score methods
  async upsertAssessmentScore(score: Omit<AssessmentScoreData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssessmentScoreData> {
    const now = new Date();
    const existingScore = this.assessmentScores.get(score.wizardStepId);
    
    const scoreData: AssessmentScoreData = {
      id: existingScore?.id || score.wizardStepId, // Use existing ID or step ID as fallback
      ...score,
      createdAt: existingScore?.createdAt || now,
      updatedAt: now
    };
    
    this.assessmentScores.set(score.wizardStepId, scoreData);
    return scoreData;
  }

  async getAssessmentScore(wizardStepId: string): Promise<AssessmentScoreData | undefined> {
    return this.assessmentScores.get(wizardStepId);
  }

  // Assessment Response methods
  async createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const responseId = this.assessmentResponseIdCounter++;
    const newResponse: AssessmentResponse = {
      ...response,
      responseId,
      createdAt: new Date(),
      // Ensure all response fields have null as default when undefined
      responseText: response.responseText ?? null,
      responseNumeric: response.responseNumeric ?? null,
      responseBoolean: response.responseBoolean ?? null,
      responseJson: response.responseJson ?? null
    };
    this.assessmentResponses.set(responseId, newResponse);
    return newResponse;
  }

  async batchCreateAssessmentResponses(responses: InsertAssessmentResponse[]): Promise<AssessmentResponse[]> {
    const createdResponses: AssessmentResponse[] = [];
    
    for (const response of responses) {
      const createdResponse = await this.createAssessmentResponse(response);
      createdResponses.push(createdResponse);
    }
    
    return createdResponses;
  }

  async getAssessmentResponsesByAssessment(assessmentId: number): Promise<AssessmentResponse[]> {
    return Array.from(this.assessmentResponses.values())
      .filter(response => response.assessmentId === assessmentId);
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
        id: 0, // Placeholder ID, will be ignored by createAICapability
        name: "Automated Document Processing",
        category: "Document Management",
        description: "AI-powered document processing and analysis",
        implementationEffort: "Medium" as const,
        businessValue: "High" as const,
        easeScore: "Medium",
        valueScore: "High",
        tags: [] // Use empty array instead of null
      },
      {
        id: 0, // Placeholder ID
        name: "Predictive Analytics",
        category: "Data Analysis",
        description: "Advanced predictive modeling and forecasting",
        implementationEffort: "High" as const,
        businessValue: "Very High" as const,
        easeScore: "Low",
        valueScore: "Very High",
        tags: [] // Use empty array instead of null
      },
      {
        id: 0, // Placeholder ID
        name: "Natural Language Processing",
        category: "Text Analysis",
        description: "Understanding and processing human language",
        implementationEffort: "Medium" as const,
        businessValue: "High" as const,
        easeScore: "Medium",
        valueScore: "High",
        tags: [] // Use empty array instead of null
      },
      {
        id: 0, // Placeholder ID
        name: "Image Recognition",
        category: "Computer Vision",
        description: "AI-powered image analysis and recognition",
        implementationEffort: "High" as const,
        businessValue: "Medium" as const,
        easeScore: "Low",
        valueScore: "Medium",
        tags: [] // Use empty array instead of null
      },
      {
        id: 0, // Placeholder ID
        name: "Process Automation",
        category: "Workflow",
        description: "Automating repetitive business processes",
        implementationEffort: "Low" as const,
        businessValue: "High" as const,
        easeScore: "High",
        valueScore: "High",
        tags: [] // Use empty array instead of null
      }
    ];

    sampleCapabilities.forEach(capability => {
      // No need for casting now as the types match
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
  if (process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL) {
    console.log('Using PostgreSQL storage implementation');
    storageInstance = new PgStorage();
  } else {
    console.log('No DATABASE_URL or DATABASE_POSTGRES_URL found, using in-memory storage');
    storageInstance = new MemStorage();
  }
} catch (err) {
  console.error('Error initializing PgStorage, falling back to MemStorage:', err);
  storageInstance = new MemStorage();
}

// Export the selected storage implementation
export const storage = storageInstance;