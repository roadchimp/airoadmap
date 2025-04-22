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
  PrioritizedItem
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private organizations: Map<number, Organization>;
  private departments: Map<number, Department>;
  private jobRoles: Map<number, JobRole>;
  private aiCapabilities: Map<number, AICapability>;
  private assessments: Map<number, Assessment>;
  private reports: Map<number, Report>;
  
  private userIdCounter: number;
  private orgIdCounter: number;
  private deptIdCounter: number;
  private roleIdCounter: number;
  private capabilityIdCounter: number;
  private assessmentIdCounter: number;
  private reportIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.departments = new Map();
    this.jobRoles = new Map();
    this.aiCapabilities = new Map();
    this.assessments = new Map();
    this.reports = new Map();
    
    this.userIdCounter = 1;
    this.orgIdCounter = 1;
    this.deptIdCounter = 1;
    this.roleIdCounter = 1;
    this.capabilityIdCounter = 1;
    this.assessmentIdCounter = 1;
    this.reportIdCounter = 1;
    
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
      businessValue: capability.businessValue || null
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
    
    const updatedStepData = {
      ...(assessment.stepData as WizardStepData || {}),
      ...stepData
    };
    
    const updatedAssessment = {
      ...assessment,
      stepData: updatedStepData
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