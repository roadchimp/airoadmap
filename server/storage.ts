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
    const user: User = { ...insertUser, id };
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
    const organization: Organization = { ...org, id };
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
    const department: Department = { ...dept, id };
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
    const jobRole: JobRole = { ...role, id };
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
    const aiCapability: AICapability = { ...capability, id };
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
    const newAssessment: Assessment = { ...assessment, id, createdAt };
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
    const newReport: Report = { ...report, id, generatedAt };
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
  
  // Initialize sample data for the application
  private initializeSampleData() {
    // Create user
    const user: User = {
      id: this.userIdCounter++,
      username: "consultant",
      password: "password123", // In a real app, this would be hashed
      fullName: "Consultant User",
      email: "consultant@example.com",
      role: "consultant"
    };
    this.users.set(user.id, user);
    
    // Create departments
    const departments: Department[] = [
      { id: this.deptIdCounter++, name: "Sales & Marketing", description: "Handles all sales and marketing activities" },
      { id: this.deptIdCounter++, name: "Customer Support", description: "Provides support to customers" },
      { id: this.deptIdCounter++, name: "Finance", description: "Manages financial operations" },
      { id: this.deptIdCounter++, name: "Human Resources", description: "Handles employee management and recruitment" },
      { id: this.deptIdCounter++, name: "Engineering", description: "Develops and maintains products" },
      { id: this.deptIdCounter++, name: "Operations", description: "Oversees day-to-day business operations" }
    ];
    
    departments.forEach(dept => this.departments.set(dept.id, dept));
    
    // Create job roles
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
    
    // Create AI capabilities
    const capabilities: AICapability[] = [
      {
        id: this.capabilityIdCounter++,
        name: "Natural Language Understanding",
        category: "NLP",
        description: "Ability to understand and interpret human language",
        implementationEffort: "Medium",
        businessValue: "High"
      },
      {
        id: this.capabilityIdCounter++,
        name: "Response Generation",
        category: "NLP",
        description: "Generate human-like text responses",
        implementationEffort: "Medium",
        businessValue: "High"
      },
      {
        id: this.capabilityIdCounter++,
        name: "Knowledge Base Integration",
        category: "Information Retrieval",
        description: "Connect to and retrieve information from knowledge repositories",
        implementationEffort: "Low",
        businessValue: "High"
      },
      {
        id: this.capabilityIdCounter++,
        name: "RFP Response Automation",
        category: "Document Processing",
        description: "Extract questions and generate draft responses for RFPs",
        implementationEffort: "Medium",
        businessValue: "High"
      },
      {
        id: this.capabilityIdCounter++,
        name: "Sales Data Analysis",
        category: "Data Analysis",
        description: "Analyze sales data to identify trends and opportunities",
        implementationEffort: "Medium",
        businessValue: "High"
      },
      {
        id: this.capabilityIdCounter++,
        name: "Content Generation",
        category: "Content Creation",
        description: "Generate marketing copy, blog posts, and other content",
        implementationEffort: "Low",
        businessValue: "Medium"
      }
    ];
    
    capabilities.forEach(cap => this.aiCapabilities.set(cap.id, cap));
  }
}

export const storage = new MemStorage();
