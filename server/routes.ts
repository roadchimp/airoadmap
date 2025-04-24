import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
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
  WizardStepData,
  insertJobDescriptionSchema,
  insertJobScraperConfigSchema,
  ProcessedJobContent
} from "@shared/schema";
import { calculatePrioritization } from "./lib/prioritizationEngine";
import { exportJobsForBatch, processBatchResults } from './batch-processing/batchProcessor';

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
  
  // Job Description routes
  app.get("/api/job-descriptions", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const jobDescriptions = await storage.listJobDescriptions(limit, offset);
    res.json(jobDescriptions);
  });
  
  app.get("/api/job-descriptions/status/:status", async (req: Request, res: Response) => {
    const status = req.params.status;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const jobDescriptions = await storage.listJobDescriptionsByStatus(status, limit, offset);
    res.json(jobDescriptions);
  });
  
  app.get("/api/job-descriptions/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job description ID" });
    }
    
    const jobDescription = await storage.getJobDescription(id);
    if (!jobDescription) {
      return res.status(404).json({ message: "Job description not found" });
    }
    
    res.json(jobDescription);
  });
  
  app.post("/api/job-descriptions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobDescriptionSchema.parse(req.body);
      const jobDescription = await storage.createJobDescription(validatedData);
      res.status(201).json(jobDescription);
    } catch (error) {
      res.status(400).json({ message: "Invalid job description data", error });
    }
  });
  
  app.patch("/api/job-descriptions/:id/process", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job description ID" });
    }
    
    try {
      const processedContent = req.body as ProcessedJobContent;
      const jobDescription = await storage.updateJobDescriptionProcessedContent(id, processedContent);
      res.json(jobDescription);
    } catch (error) {
      res.status(400).json({ message: "Error updating job description processed content", error });
    }
  });
  
  app.patch("/api/job-descriptions/:id/status", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job description ID" });
    }
    
    const { status, error } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "Status is required" });
    }
    
    try {
      const jobDescription = await storage.updateJobDescriptionStatus(id, status, error);
      res.json(jobDescription);
    } catch (error) {
      res.status(400).json({ message: "Error updating job description status", error });
    }
  });
  
  // Job Scraper Config routes
  app.get("/api/job-scraper-configs", async (_req: Request, res: Response) => {
    const configs = await storage.listJobScraperConfigs();
    res.json(configs);
  });
  
  app.get("/api/job-scraper-configs/active", async (_req: Request, res: Response) => {
    const configs = await storage.listActiveJobScraperConfigs();
    res.json(configs);
  });
  
  app.get("/api/job-scraper-configs/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job scraper config ID" });
    }
    
    const config = await storage.getJobScraperConfig(id);
    if (!config) {
      return res.status(404).json({ message: "Job scraper config not found" });
    }
    
    res.json(config);
  });
  
  app.post("/api/job-scraper-configs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobScraperConfigSchema.parse(req.body);
      const config = await storage.createJobScraperConfig(validatedData);
      res.status(201).json(config);
    } catch (error) {
      res.status(400).json({ message: "Invalid job scraper config data", error });
    }
  });
  
  app.patch("/api/job-scraper-configs/:id/last-run", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job scraper config ID" });
    }
    
    try {
      const config = await storage.updateJobScraperConfigLastRun(id);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Error updating job scraper config last run", error });
    }
  });
  
  app.patch("/api/job-scraper-configs/:id/status", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job scraper config ID" });
    }
    
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive is required and must be a boolean" });
    }
    
    try {
      const config = await storage.updateJobScraperConfigStatus(id, isActive);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Error updating job scraper config status", error });
    }
  });
  
  // Job Description Batch Processing routes
  app.post("/api/job-descriptions/batch/export", async (req: Request, res: Response) => {
    try {
      const filepath = await exportJobsForBatch();
      res.json({ 
        success: true, 
        message: 'Job descriptions exported for batch processing',
        filepath: filepath
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error exporting job descriptions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/job-descriptions/batch/process", async (req: Request, res: Response) => {
    const { responsePath } = req.body;
    
    if (!responsePath) {
      return res.status(400).json({ 
        success: false, 
        message: 'Response file path is required' 
      });
    }
    
    try {
      await processBatchResults(responsePath);
      res.json({ 
        success: true, 
        message: 'Batch processing completed successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error processing batch results',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  const httpServer = createServer(app);
  
  // Add WebSocket support for real-time communication
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add specific WS configuration to handle connection issues
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      concurrencyLimit: 10,
      threshold: 1024
    }
  });
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Send a heartbeat every 30 seconds to keep connections alive
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    }, 30000);
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Echo back the message to confirm receipt
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'echo', 
            received: data,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(interval);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(interval);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to AI Prioritization Tool WebSocket',
      timestamp: Date.now()
    }));
  });
  
  return httpServer;
}
