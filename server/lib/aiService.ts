import OpenAI from 'openai';
import { WizardStepData, JobRole, Department, InsertAICapability, InsertAssessmentAICapability, capabilityPriorityEnum } from '@shared/schema';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Enhanced environment variable checking with detailed logging
console.log(`[AI Service] Environment: ${process.env.NODE_ENV}`);
console.log(`[AI Service] OpenAI API Key present: ${!!process.env.OPENAI_API_KEY}`);
console.log(`[AI Service] OpenAI API Key length: ${process.env.OPENAI_API_KEY?.length || 0}`);

// Check for required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`[AI Service] CRITICAL: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.error('[AI Service] AI features will be disabled. Please set these variables in Vercel environment settings.');
} else {
  console.log('[AI Service] All required environment variables are present');
}

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (openai) {
  console.log('[AI Service] OpenAI client initialized successfully');
} else {
  console.error('[AI Service] CRITICAL: OpenAI client failed to initialize - API key missing or invalid');
}

// Cache implementation for OpenAI responses
const responseCache = new Map<string, any>();

// Function to get a cache key from a prompt and model
function getCacheKey(prompt: string, model: string): string {
  // Create a hash of the prompt and model to use as a cache key
  return crypto
    .createHash('md5')
    .update(`${prompt}|${model}`)
    .digest('hex');
}

// Function to check if a response is cached
function getCachedResponse(prompt: string, model: string): any | null {
  const cacheKey = getCacheKey(prompt, model);
  if (responseCache.has(cacheKey)) {
    console.log('Using cached OpenAI response');
    return responseCache.get(cacheKey);
  }
  return null;
}

// Function to cache a response
function cacheResponse(prompt: string, model: string, response: any): void {
  const cacheKey = getCacheKey(prompt, model);
  responseCache.set(cacheKey, response);
  
  // Limit cache size to prevent memory leaks
  if (responseCache.size > 1000) {
    // Delete oldest entries if cache is too large
    const keysToDelete = Array.from(responseCache.keys()).slice(0, 100);
    keysToDelete.forEach(key => responseCache.delete(key));
  }
}

// Type for the AI's structured response
interface AIRecommendationResponse {
  capabilityName: string;
  capabilityCategory: string;
  capabilityDescription?: string;
  tags?: string[];
  // Default/Global Scores
  default_business_value?: string | null;
  default_implementation_effort?: string | null;
  default_ease_score?: string | null;
  default_value_score?: string | null;
  default_feasibility_score?: string | null;
  default_impact_score?: string | null;
  // Assessment-Specific Scores & Details
  valueScore?: string | null; // Represent numeric as string for schema
  feasibilityScore?: string | null;
  impactScore?: string | null;
  easeScore?: string | null;
  priority?: typeof capabilityPriorityEnum.enumValues[number] | null;
  rank?: number | null;
  implementationEffort?: string | null;
  businessValue?: string | null;
  assessmentNotes?: string | null;
}

/**
 * Generate an enhanced executive summary with OpenAI GPT-4
 */
export async function generateEnhancedExecutiveSummary(
  stepData: WizardStepData, 
  prioritizedRoles: any[]
): Promise<string> {
  console.log('[AI Service] generateEnhancedExecutiveSummary called');
  console.log(`[AI Service] OpenAI client available: ${!!openai}`);
  
  try {
    if (!openai) {
      console.log('[AI Service] No OpenAI client - using fallback for executive summary');
      return fallbackExecutiveSummary(stepData, prioritizedRoles);
    }

    // Extract relevant data for prompt construction
    const companyName = stepData.basics?.companyName || "your company";
    const industry = stepData.basics?.industry || "your industry";
    const goals = stepData.basics?.goals || "improve efficiency and competitiveness";
    
    console.log(`[AI Service] Generating executive summary for: ${companyName} in ${industry}`);
    
    // Get top prioritized roles
    const topRoles = prioritizedRoles.slice(0, 3).map(role => ({
      title: role.title,
      priority: role.priority,
      valueScore: role.valueScore,
      effortScore: role.effortScore
    }));
    
    // Construct prompt
    const prompt = `Generate an executive summary for AI transformation at ${companyName}, a company in the ${industry} industry. 
    Their primary goals are: ${goals}
    
    The assessment identified these top priority opportunities:
    ${topRoles.map(role => `- ${role.title} (Priority: ${role.priority}, Value: ${role.valueScore}/5, Effort: ${role.effortScore}/5)`).join('\n')}
    
    Write an executive summary (300-400 words) highlighting:
    1. Key opportunities for AI transformation
    2. The expected business outcomes
    3. A high-level implementation approach
    4. Potential strategic benefits
    
    Use a professional, concise tone appropriate for C-level executives.`;

    const model = "gpt-4";
    
    // Check if we have a cached response
    const cachedResponse = getCachedResponse(prompt, model);
    if (cachedResponse) {
      console.log('[AI Service] Using cached response for executive summary');
      return cachedResponse;
    }

    console.log('[AI Service] Making OpenAI API call for executive summary...');
    
    // Make the API call
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an AI transformation consultant providing executive-level strategic insights." },
        { role: "user", content: prompt }
      ]
    });

    console.log('[AI Service] OpenAI API call successful for executive summary');
    
    const content = response.choices[0].message.content || fallbackExecutiveSummary(stepData, prioritizedRoles);
    
    // Cache the response
    cacheResponse(prompt, model, content);
    
    console.log(`[AI Service] Executive summary generated successfully (${content.length} characters)`);
    return content;
  } catch (error) {
    console.error('[AI Service] ERROR generating executive summary with OpenAI:', error);
    console.error('[AI Service] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('[AI Service] Falling back to default executive summary');
    return fallbackExecutiveSummary(stepData, prioritizedRoles);
  }
}

/**
 * Generate AI capability recommendations with OpenAI
 */
export async function generateAICapabilityRecommendations(
  role: JobRole,
  department: Department,
  painPoints: any
): Promise<Array<Partial<InsertAssessmentAICapability & { 
  capabilityName: string; 
  capabilityCategory: string; 
  capabilityDescription?: string; 
  default_business_value?: string | null;
  default_implementation_effort?: string | null;
  default_ease_score?: string | null;
  default_value_score?: string | null;
  default_feasibility_score?: string | null;
  default_impact_score?: string | null;
  tags?: string[] | null;
}>>> {
  console.log('[AI Service] generateAICapabilityRecommendations called');
  console.log(`[AI Service] Role: ${role.title}, Department: ${department.name}`);
  console.log(`[AI Service] OpenAI client available: ${!!openai}`);
  
  try {
    if (!openai) {
      console.log('[AI Service] No OpenAI client - using fallback for AI capabilities');
      return fallbackAICapabilities(role, department);
    }

    const painPointDescription = painPoints
      ? `Pain points include: Severity: ${painPoints.severity}/5, Frequency: ${painPoints.frequency}/5, Impact: ${painPoints.impact}/5. Description: ${painPoints.description || "Not provided"}`
      : "No specific pain points provided for this role.";

    console.log(`[AI Service] Pain points for ${role.title}: ${painPointDescription}`);

    const prompt = `
Context:
Role: ${role.title}
Department: ${department.name}
${painPointDescription}

Based on the provided context, identify and recommend 3-5 AI capabilities.
For each AI capability, provide the following information in a JSON array format. Each object in the array should represent one AI capability:

1.  "capabilityName": A concise name for the AI capability (e.g., "Automated Data Entry", "Predictive Maintenance Analytics").
2.  "capabilityCategory": A general category for this capability (e.g., "Automation", "Analytics", "Content Generation", "Decision Support").
3.  "capabilityDescription": (Optional) A brief general description of what this AI capability does.
4.  "tags": (Optional) An array of 2-3 relevant global tags for this capability (e.g., ["data_processing", "efficiency", "nlp"]).

5.  "default_business_value": (Optional) The general, typical business value this capability offers (e.g., "Low", "Medium", "High", "Very High").
6.  "default_implementation_effort": (Optional) The general, typical effort to implement this capability (e.g., "Low", "Medium", "High").
7.  "default_ease_score": (Optional) A general score (0-100) indicating how easy this capability is to implement typically.
8.  "default_value_score": (Optional) A general score (0-100) indicating the typical value this capability provides.
9.  "default_feasibility_score": (Optional) A general score (0-100) indicating the typical technical feasibility.
10. "default_impact_score": (Optional) A general score (0-100) indicating the typical impact this capability can have.

Now, for the *specific context of the Role (${role.title}) and Department (${department.name})*:
11. "valueScore": A score (0-100) for the potential value this capability offers *to this specific role/department*.
12. "feasibilityScore": A score (0-100) for the technical feasibility of implementing this capability *for this specific role/department*.
13. "impactScore": (Optional) A score (0-100) for the potential impact this capability can have *on this specific role/department*.
14. "easeScore": (Optional) A score (0-100) for how easy it would be to implement this capability *for this specific role/department*.
15. "priority": The priority for implementing this capability *for this role/department* ("High", "Medium", or "Low").
16. "rank": (Optional) A numerical rank (e.g., 1, 2, 3) for this capability recommendation *within this assessment context*.
17. "implementationEffort": The estimated effort to implement this capability *for this specific role/department* (e.g., "Low", "Medium", "High").
18. "businessValue": The estimated business value this capability would bring *to this specific role/department* (e.g., "Low", "Medium", "High", "Very High").
19. "assessmentNotes": (Optional) Brief notes or justification for why this capability is recommended for *this specific role/department*, considering their pain points.

Return ONLY a valid JSON array of these objects. Example of one object:
{
  "capabilityName": "AI-Powered Email Triage",
  "capabilityCategory": "Productivity Automation",
  "capabilityDescription": "Automatically categorizes and prioritizes incoming emails for faster response.",
  "tags": ["email", "automation", "nlp"],
  "default_business_value": "Medium",
  "default_implementation_effort": "Medium",
  "default_ease_score": "70",
  "default_value_score": "75",
  "default_feasibility_score": "80",
  "default_impact_score": "60",
  "valueScore": "85",
  "feasibilityScore": "75",
  "impactScore": "80",
  "easeScore": "70",
  "priority": "High",
  "rank": 1,
  "implementationEffort": "Medium",
  "businessValue": "High",
  "assessmentNotes": "Addresses significant time lost to manual email sorting, directly impacting ${role.title}'s efficiency in the ${department.name} department."
}
`;

    console.log('[AI Service] Making OpenAI API call for AI capability recommendations...');

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Or your preferred model
      messages: [
        { role: "system", content: "You are an expert AI strategy consultant. You provide detailed, structured AI capability recommendations in JSON format." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, // Request JSON output
      temperature: 0.3,
    });

    console.log('[AI Service] OpenAI API call successful for AI capability recommendations');

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("[AI Service] OpenAI returned empty content for AI capabilities.");
      return fallbackAICapabilities(role, department);
    }

    console.log(`[AI Service] Received AI capabilities response (${content.length} characters)`);

    try {
      // Assuming the response is an object with a key (e.g., "recommendations") that holds the array
      const parsedResponse = JSON.parse(content);
      let recommendationsArray: AIRecommendationResponse[];

      // Check if the parsed response is directly an array or an object containing the array
      if (Array.isArray(parsedResponse)) {
        recommendationsArray = parsedResponse;
      } else if (parsedResponse && typeof parsedResponse === 'object' && Array.isArray(Object.values(parsedResponse)[0])) {
        // Common case: { "recommendations": [...] } or similar
        recommendationsArray = Object.values(parsedResponse)[0] as AIRecommendationResponse[];
      } else {
        console.error("[AI Service] Parsed OpenAI response is not in the expected array format:", parsedResponse);
        return fallbackAICapabilities(role, department);
      }
      
      console.log(`[AI Service] Successfully parsed ${recommendationsArray.length} AI capability recommendations`);
      
      return recommendationsArray.map(rec => ({
        // Global capability fields
        capabilityName: rec.capabilityName,
        capabilityCategory: rec.capabilityCategory,
        capabilityDescription: rec.capabilityDescription,
        tags: rec.tags,
        default_business_value: rec.default_business_value,
        default_implementation_effort: rec.default_implementation_effort,
        default_ease_score: rec.default_ease_score ? String(rec.default_ease_score) : null,
        default_value_score: rec.default_value_score ? String(rec.default_value_score) : null,
        default_feasibility_score: rec.default_feasibility_score ? String(rec.default_feasibility_score) : null,
        default_impact_score: rec.default_impact_score ? String(rec.default_impact_score) : null,
        // AssessmentAICapability fields
        valueScore: rec.valueScore ? String(rec.valueScore) : null,
        feasibilityScore: rec.feasibilityScore ? String(rec.feasibilityScore) : null,
        impactScore: rec.impactScore ? String(rec.impactScore) : null,
        easeScore: rec.easeScore ? String(rec.easeScore) : null,
        priority: rec.priority,
        rank: rec.rank,
        implementationEffort: rec.implementationEffort,
        businessValue: rec.businessValue,
        assessmentNotes: rec.assessmentNotes,
      }));
    } catch (e) {
      console.error("[AI Service] Error parsing OpenAI response JSON:", e);
      console.error("[AI Service] Problematic AI response content:", content);
      return fallbackAICapabilities(role, department);
    }

  } catch (error) {
    console.error("[AI Service] ERROR generating AI capability recommendations:", error);
    console.error('[AI Service] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('[AI Service] Falling back to default AI capabilities');
    return fallbackAICapabilities(role, department);
  }
}

/**
 * Generate performance impact predictions with OpenAI
 */
export async function generatePerformanceImpact(
  role: JobRole,
  department: Department
): Promise<any> {
  try {
    if (!openai) {
      return fallbackPerformanceImpact(role);
    }

    const prompt = `Based on industry benchmarks and known AI implementation outcomes, predict the performance improvements for this role:
    
    Role: ${role.title}
    Department: ${department.name}
    Key Responsibilities: ${role.keyResponsibilities ? role.keyResponsibilities.join(", ") : "Not provided"}`;

    const model = "gpt-4";
    
    // Check if we have a cached response
    const cachedResponse = getCachedResponse(prompt, model);
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an AI transformation analyst providing realistic performance predictions." },
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices[0].message.content;
    try {
      const parsedContent = JSON.parse(content || '{"metrics":[], "estimatedAnnualRoi": 0}');
      
      // Cache the response
      cacheResponse(prompt, model, parsedContent);
      
      return parsedContent;
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return fallbackPerformanceImpact(role);
    }
  } catch (error) {
    console.error("Error generating performance impact predictions with OpenAI:", error);
    return fallbackPerformanceImpact(role);
  }
}

/**
 * Fallback function for executive summary
 */
function fallbackExecutiveSummary(stepData: WizardStepData, prioritizedRoles: any[]): string {
  const companyName = stepData.basics?.companyName || "your company";
  const topRoles = prioritizedRoles.slice(0, 2);
  
  // Extract unique departments safely
  const departmentSet = new Set<string>();
  topRoles.forEach(item => {
    if (item && item.department) {
      departmentSet.add(item.department);
    }
  });
  const departments = Array.from(departmentSet);
  
  return `Based on our analysis of ${companyName}'s current processes and roles, we've identified significant opportunities for AI transformation that could lead to efficiency gains and cost savings.

The assessment reveals that ${departments.join(" and ") || "key functional"} functions have the highest potential for immediate AI impact with relatively low implementation barriers. We estimate potential time savings of 15-20 hours per week per agent in ${topRoles[0]?.title || "key roles"} through AI-assisted processes and automation.

Our recommended approach is a phased implementation starting with these high-impact, low-effort areas to demonstrate quick wins and build organizational momentum for broader AI adoption.`;
}

/**
 * Fallback function for AI capabilities
 */
function fallbackAICapabilities(role: JobRole, department: Department): Array<Partial<InsertAssessmentAICapability & { 
  capabilityName: string; 
  capabilityCategory: string; 
  capabilityDescription?: string; 
  default_business_value?: string | null;
  default_implementation_effort?: string | null;
  default_ease_score?: string | null;
  default_value_score?: string | null;
  default_feasibility_score?: string | null;
  default_impact_score?: string | null;
  tags?: string[] | null;
}>> {
  console.warn(`Using fallback AI capabilities for role: ${role.title} in ${department.name}`);
  const capabilities = [
    {
      capabilityName: `Automated ${role.title} Task Processing`,
      capabilityCategory: "Automation",
      capabilityDescription: `Automates repetitive tasks specific to the ${role.title} role. (Fallback Data)`,
      tags: ["automation", role.title.toLowerCase().replace(/\s+/g, '_')],
      default_business_value: "Medium",
      default_implementation_effort: "Medium",
      default_ease_score: "60",
      default_value_score: "65",
      default_feasibility_score: "70",
      default_impact_score: "55",
      valueScore: "70", 
      feasibilityScore: "65",
      impactScore: "60",
      easeScore: "60",
      priority: "Medium" as typeof capabilityPriorityEnum.enumValues[number],
      rank: 1,
      implementationEffort: "Medium",
      businessValue: "High",
      assessmentNotes: `Significant potential to reduce manual workload for ${role.title} in ${department.name}. (Fallback Data)`
    },
    {
      capabilityName: `AI-Powered Decision Support for ${department.name}`,
      capabilityCategory: "Analytics & Decision Support",
      capabilityDescription: `Provides data-driven insights to aid ${role.title} in making informed decisions. (Fallback Data)`,
      tags: ["analytics", "decision_support", department.name.toLowerCase().replace(/\s+/g, '_')],
      default_business_value: "High",
      default_implementation_effort: "High",
      default_ease_score: "50",
      default_value_score: "75",
      default_feasibility_score: "60",
      default_impact_score: "70",
      valueScore: "80",
      feasibilityScore: "55",
      impactScore: "75",
      easeScore: "50",
      priority: "High" as typeof capabilityPriorityEnum.enumValues[number],
      rank: 2,
      implementationEffort: "High",
      businessValue: "Very High",
      assessmentNotes: `Could enhance strategic decision-making for ${role.title} by leveraging data analytics. (Fallback Data)`
    }
  ];
  // Ensure all returned objects match the complex partial type
  return capabilities.map(cap => ({
    ...cap, // Spread all defined properties
    // Explicitly ensure all numeric scores that should be strings are strings
    default_ease_score: cap.default_ease_score ? String(cap.default_ease_score) : null,
    default_value_score: cap.default_value_score ? String(cap.default_value_score) : null,
    default_feasibility_score: cap.default_feasibility_score ? String(cap.default_feasibility_score) : null,
    default_impact_score: cap.default_impact_score ? String(cap.default_impact_score) : null,
    valueScore: cap.valueScore ? String(cap.valueScore) : null,
    feasibilityScore: cap.feasibilityScore ? String(cap.feasibilityScore) : null,
    impactScore: cap.impactScore ? String(cap.impactScore) : null,
    easeScore: cap.easeScore ? String(cap.easeScore) : null,
  }));
}

/**
 * Fallback function for performance impact
 */
function fallbackPerformanceImpact(role: JobRole): any {
  const title = role.title.toLowerCase();
  let metrics = [];
  let estimatedRoi = 150000;
  
  if (title.includes("customer support") || title.includes("service")) {
    metrics = [
      { name: "Time per ticket", improvement: 45 },
      { name: "Customer satisfaction", improvement: 20 },
      { name: "Agent capacity", improvement: 35 }
    ];
    estimatedRoi = 280000;
  } else if (title.includes("sales")) {
    metrics = [
      { name: "RFP response time", improvement: 30 },
      { name: "Proposal quality", improvement: 25 },
      { name: "Deal analysis time", improvement: 40 }
    ];
    estimatedRoi = 320000;
  } else if (title.includes("marketing") || title.includes("content")) {
    metrics = [
      { name: "Content creation time", improvement: 35 },
      { name: "Campaign analysis", improvement: 30 }
    ];
    estimatedRoi = 190000;
  } else {
    metrics = [
      { name: "Process efficiency", improvement: 30 },
      { name: "Error reduction", improvement: 25 }
    ];
    estimatedRoi = 150000;
  }
  
  return {
    metrics,
    estimatedAnnualRoi: estimatedRoi
  };
}

export async function generateAIResponse(prompt: string): Promise<string> {
  if (!openai) {
    return 'AI features are currently disabled. Please configure the required API keys.';
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Error generating AI response. Please try again later.';
  }
}