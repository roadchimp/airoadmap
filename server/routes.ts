import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertOrganizationSchema, 
  insertDepartmentSchema, 
  insertJobRoleSchema, 
  insertAICapabilitySchema,
  insertAssessmentSchema,
  insertReportSchema,
  wizardStepDataSchema,
  WizardStepData
} from "@shared/schema";
import { calculatePrioritization } from "./lib/prioritizationEngine";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Department routes
  app.get("/api/departments", async (_req: Request, res: Response) => {
    const departments = await storage.listDepartments();
    res.json(departments);
  });
  
  // Job Role routes
  app.get("/api/job-roles", async (_req: Request, res: Response) => {
    const roles = await storage.listJobRoles();
    res.json(roles);
  });
  
  app.get("/api/job-roles/department/:departmentId", async (req: Request, res: Response) => {
    const departmentId = parseInt(req.params.departmentId);
    if (isNaN(departmentId)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }
    
    const roles = await storage.listJobRolesByDepartment(departmentId);
    res.json(roles);
  });
  
  app.post("/api/job-roles", async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobRoleSchema.parse(req.body);
      const jobRole = await storage.createJobRole(validatedData);
      res.status(201).json(jobRole);
    } catch (error) {
      res.status(400).json({ message: "Invalid job role data", error });
    }
  });
  
  // AI Capability routes
  app.get("/api/ai-capabilities", async (_req: Request, res: Response) => {
    const capabilities = await storage.listAICapabilities();
    res.json(capabilities);
  });
  
  app.post("/api/ai-capabilities", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAICapabilitySchema.parse(req.body);
      const capability = await storage.createAICapability(validatedData);
      res.status(201).json(capability);
    } catch (error) {
      res.status(400).json({ message: "Invalid AI capability data", error });
    }
  });
  
  // Assessment routes
  app.get("/api/assessments", async (_req: Request, res: Response) => {
    const assessments = await storage.listAssessments();
    res.json(assessments);
  });
  
  app.get("/api/assessments/user/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const assessments = await storage.listAssessmentsByUser(userId);
    res.json(assessments);
  });
  
  app.get("/api/assessments/:id", async (req: Request, res: Response) => {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    
    res.json(assessment);
  });
  
  app.post("/api/assessments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      res.status(400).json({ message: "Invalid assessment data", error });
    }
  });
  
  app.patch("/api/assessments/:id/step", async (req: Request, res: Response) => {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    try {
      const stepData = req.body;
      // Partially validate the step data - we don't validate the entire schema
      // since this is a partial update of a specific step
      const assessment = await storage.updateAssessmentStep(assessmentId, stepData);
      res.json(assessment);
    } catch (error) {
      res.status(400).json({ message: "Error updating assessment step", error });
    }
  });
  
  app.patch("/api/assessments/:id/status", async (req: Request, res: Response) => {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    const { status } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "Status is required" });
    }
    
    try {
      const assessment = await storage.updateAssessmentStatus(assessmentId, status);
      res.json(assessment);
    } catch (error) {
      res.status(400).json({ message: "Error updating assessment status", error });
    }
  });
  
  // Report routes
  app.get("/api/reports", async (_req: Request, res: Response) => {
    const reports = await storage.listReports();
    res.json(reports);
  });
  
  app.get("/api/reports/:id", async (req: Request, res: Response) => {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }
    
    const report = await storage.getReport(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    res.json(report);
  });
  
  app.get("/api/reports/assessment/:assessmentId", async (req: Request, res: Response) => {
    const assessmentId = parseInt(req.params.assessmentId);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    const report = await storage.getReportByAssessment(assessmentId);
    if (!report) {
      return res.status(404).json({ message: "Report not found for this assessment" });
    }
    
    res.json(report);
  });
  
  app.post("/api/reports", async (req: Request, res: Response) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid report data", error });
    }
  });
  
  app.patch("/api/reports/:id/commentary", async (req: Request, res: Response) => {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }
    
    const { commentary } = req.body;
    if (!commentary || typeof commentary !== "string") {
      return res.status(400).json({ message: "Commentary is required" });
    }
    
    try {
      const report = await storage.updateReportCommentary(reportId, commentary);
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: "Error updating report commentary", error });
    }
  });
  
  // Generate Prioritization Results
  app.post("/api/prioritize", async (req: Request, res: Response) => {
    const { assessmentId } = req.body;
    
    if (!assessmentId || typeof assessmentId !== "number") {
      return res.status(400).json({ message: "Valid assessment ID is required" });
    }
    
    try {
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      const stepData = assessment.stepData as WizardStepData;
      if (!stepData) {
        return res.status(400).json({ message: "Assessment has no step data" });
      }
      
      // Calculate prioritization (now async with AI integration)
      const results = await calculatePrioritization(stepData);
      
      // Create a report with the results
      const report = await storage.createReport({
        assessmentId,
        executiveSummary: results.executiveSummary,
        prioritizationData: results.prioritizationData,
        aiSuggestions: results.aiSuggestions,
        performanceImpact: results.performanceImpact,
        consultantCommentary: ""
      });
      
      // Update assessment status to completed
      await storage.updateAssessmentStatus(assessmentId, "completed");
      
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Error generating prioritization results", error });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
