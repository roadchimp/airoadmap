import OpenAI from 'openai';
import { WizardStepData, JobRole, Department, InsertAICapability } from '@shared/schema';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Check for required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('AI features will be disabled. Please set these variables in your .env file or Replit Secrets.');
}

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

/**
 * Generate an enhanced executive summary with OpenAI GPT-4
 */
export async function generateEnhancedExecutiveSummary(
  stepData: WizardStepData, 
  prioritizedRoles: any[]
): Promise<string> {
  try {
    if (!openai) {
      return fallbackExecutiveSummary(stepData, prioritizedRoles);
    }

    // Extract relevant data for prompt construction
    const companyName = stepData.basics?.companyName || "your company";
    const industry = stepData.basics?.industry || "your industry";
    const goals = stepData.basics?.goals || "improve efficiency and competitiveness";
    
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
      return cachedResponse;
    }

    // Make the API call
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an AI transformation consultant providing executive-level strategic insights." },
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices[0].message.content || fallbackExecutiveSummary(stepData, prioritizedRoles);
    
    // Cache the response
    cacheResponse(prompt, model, content);
    
    return content;
  } catch (error) {
    console.error('Error generating executive summary with OpenAI:', error);
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
): Promise<Array<Partial<InsertAICapability>>> {
  try {
    if (!openai) {
      return fallbackAICapabilities(role);
    }

    const painPointDescription = painPoints
      ? `Pain points include: Severity: ${painPoints.severity}/5, Frequency: ${painPoints.frequency}/5, Impact: ${painPoints.impact}/5. Description: ${painPoints.description || "Not provided"}`
      : "No specific pain points provided.";

    const prompt = `As an AI transformation consultant, recommend 3-4 specific AI capabilities that would best address the needs of this role:
    
    Role: ${role.title}
    Department: ${department.name}
    Key Responsibilities: ${role.keyResponsibilities ? role.keyResponsibilities.join(", ") : "Not provided"}
    ${painPointDescription}
    
    For each capability, provide a JSON object with the following fields:
    - "name": string (Specific name/title for the capability)
    - "description": string (Brief description of what it does and how it helps this specific role)
    - "category": string (e.g., "Automation", "Analytics", "Content Generation", "Customer Interaction", "Decision Support")
    - "valueScore": number (A score from 1 to 100 representing the potential value to the business for this role. Higher is better.)
    - "feasibilityScore": number (A score from 1 to 100 representing the ease of implementation/technical feasibility. Higher is more feasible.)
    - "impactScore": number (A score from 1 to 100 representing the overall impact this capability could have if implemented successfully for this role. Higher is better.)
    - "priority": string (Suggested priority: "High", "Medium", or "Low")
    - "rank": number (A suggested rank for this capability among the recommendations, e.g., 1, 2, 3)
    - "implementationEffort": string (Qualitative effort: "High", "Medium", "Low")
    - "businessValue": string (Qualitative business value: "Very High", "High", "Medium", "Low")

    Return a JSON array of these objects. For example:
    [{"name": "Automated Report Generation", "description": "...", "category": "Automation", "valueScore": 80, "feasibilityScore": 70, "impactScore": 90, "priority": "High", "rank": 1, "implementationEffort": "Medium", "businessValue": "High"}, ...]
    Ensure the output is ONLY the JSON array.`;

    const model = "gpt-4";
    
    const cachedResponse = getCachedResponse(prompt, model);
    if (cachedResponse) {
      if (Array.isArray(cachedResponse) && cachedResponse.every(c => c.name && typeof c.valueScore === 'number')) {
         return cachedResponse as Array<Partial<InsertAICapability>>;
      } else {
        console.log("Cached response for generateAICapabilityRecommendations has old format, re-fetching.");
      }
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an AI transformation consultant providing specific, actionable recommendations in JSON format." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    try {
      let parsedContent;
      if (content) {
        const rawParsed = JSON.parse(content);
        if (Array.isArray(rawParsed)) {
          parsedContent = rawParsed;
        } else if (typeof rawParsed === 'object' && rawParsed !== null) {
          const arrayKey = Object.keys(rawParsed).find(key => Array.isArray(rawParsed[key]));
          if (arrayKey) {
            parsedContent = rawParsed[arrayKey];
          } else {
            console.warn("AI capability recommendations did not return a direct array or a known keyed array. Attempting to use as is, but might be incorrect.", rawParsed);
            parsedContent = [];
          }
        } else {
          parsedContent = [];
        }
      } else {
        parsedContent = [];
      }
      
      const validatedCapabilities = (Array.isArray(parsedContent) ? parsedContent : []).filter(
        cap => cap && typeof cap.name === 'string' && 
               typeof cap.valueScore === 'number' && 
               typeof cap.feasibilityScore === 'number' &&
               typeof cap.impactScore === 'number'
      ).map(cap => ({
        ...cap,
        valueScore: parseFloat(String(cap.valueScore)),
        feasibilityScore: parseFloat(String(cap.feasibilityScore)),
        impactScore: parseFloat(String(cap.impactScore)),
        rank: cap.rank ? parseInt(String(cap.rank), 10) : undefined,
      }));

      cacheResponse(prompt, model, validatedCapabilities);
      return validatedCapabilities as Array<Partial<InsertAICapability>>;
    } catch (error) {
      console.error("Error parsing JSON response for AI Capabilities:", error, "Raw content:", content);
      return fallbackAICapabilities(role);
    }
  } catch (error) {
    console.error("Error generating AI capability recommendations with OpenAI:", error);
    return fallbackAICapabilities(role);
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
function fallbackAICapabilities(role: JobRole): Array<Partial<InsertAICapability>> {
  console.warn(`Using fallback AI capabilities for role: ${role.title}`);
  // All numeric fields should be strings for InsertAICapability to align with Drizzle's expectation for `numeric` type.
  // Zod's preprocess will handle conversion for fields like feasibilityScore and impactScore.
  return [
    {
      name: `Automated ${role.title} Task Processing`,
      description: `Automates repetitive tasks specific to the ${role.title} role, improving efficiency. (Fallback Data)`,
      category: "Automation",
      valueScore: "65",       // String
      feasibilityScore: "70", // String
      impactScore: "75",       // String
      priority: "Medium",
      rank: 1, // rank is integer, so number is fine
      implementationEffort: "Medium",
      businessValue: "High",
      easeScore: "70",         // String
    },
    {
      name: `${role.title} Data Analysis & Insights`,
      description: `Provides data-driven insights to support ${role.title} decision-making. (Fallback Data)`,
      category: "Analytics",
      valueScore: "75",       // String
      feasibilityScore: "60", // String
      impactScore: "80",       // String
      priority: "High",
      rank: 2, // rank is integer, so number is fine
      implementationEffort: "Medium",
      businessValue: "Very High",
      easeScore: "60",         // String
    }
  ];
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