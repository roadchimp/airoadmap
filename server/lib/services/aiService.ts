import OpenAI from 'openai';
import { WizardStepData, JobRole, Department, InsertAICapability, InsertAssessmentAICapability, capabilityPriorityEnum } from '@shared/schema';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Determine if we're in build/deploy context
// We're in build time ONLY during static generation, not during serverless function execution
const isVercelBuild = process.env.VERCEL && 
                      process.env.NEXT_PHASE === 'phase-production-build';

// Enhanced environment variable checking with detailed logging
console.log(`[AI Service] Environment: ${process.env.NODE_ENV}`);
console.log(`[AI Service] Is Vercel Build: ${isVercelBuild}`);
console.log('[AI Service] Build detection variables:');
console.log(`[AI Service] - VERCEL: ${process.env.VERCEL}`);
console.log(`[AI Service] - NEXT_PHASE: ${process.env.NEXT_PHASE}`);
console.log(`[AI Service] - NEXT_RUNTIME: ${process.env.NEXT_RUNTIME}`);
console.log(`[AI Service] - VERCEL_URL: ${process.env.VERCEL_URL}`);
console.log(`[AI Service] All environment variables check:`);
console.log(`[AI Service] - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[AI Service] - VERCEL_ENV: ${process.env.VERCEL_ENV}`);
console.log(`[AI Service] - Available env vars starting with 'OPENAI': ${Object.keys(process.env).filter(key => key.startsWith('OPENAI')).join(', ')}`);
console.log(`[AI Service] - Raw OPENAI_API_KEY value type: ${typeof process.env.OPENAI_API_KEY}`);
console.log(`[AI Service] - Raw OPENAI_API_KEY first 10 chars: ${process.env.OPENAI_API_KEY?.substring(0, 10) || 'undefined'}`);
console.log(`[AI Service] OpenAI API Key present: ${!!process.env.OPENAI_API_KEY}`);
console.log(`[AI Service] OpenAI API Key length: ${process.env.OPENAI_API_KEY?.length || 0}`);

// Declare openai at module level
let openai: OpenAI | null = null;

// Skip initialization during build time
if (isVercelBuild) {
  console.log('[AI Service] Skipping OpenAI client initialization during build time');
} else {
  // Check for required environment variables with multiple possible names/cases
  const possibleOpenAIKeys = [
    'OPENAI_API_KEY',
    'openai_api_key', 
    'OPENAI_API_TOKEN',
    'OPEN_AI_API_KEY',
    'OPENAI_SECRET_KEY'
  ];

  let openaiApiKey = null;
  let foundKeyName = null;

  for (const keyName of possibleOpenAIKeys) {
    if (process.env[keyName]) {
      openaiApiKey = process.env[keyName];
      foundKeyName = keyName;
      console.log(`[AI Service] Found OpenAI API key with name: ${keyName}`);
      break;
    }
  }

  if (!openaiApiKey) {
    console.log(`[AI Service] No OpenAI API key found. Checked: ${possibleOpenAIKeys.join(', ')}`);
  }

  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !openaiApiKey); // Use our found key instead

  if (missingEnvVars.length > 0) {
    console.error(`[AI Service] CRITICAL: Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.error('[AI Service] AI features will be disabled. Please set these variables in Vercel environment settings.');
  } else {
    console.log('[AI Service] All required environment variables are present');
    console.log(`[AI Service] Using OpenAI API key from: ${foundKeyName}`);
  }

  // Initialize OpenAI client if API key is available
  openai = openaiApiKey 
    ? new OpenAI({ apiKey: openaiApiKey })
    : null;

  if (openai) {
    console.log('[AI Service] OpenAI client initialized successfully');
  } else {
    console.error('[AI Service] CRITICAL: OpenAI client failed to initialize - API key missing or invalid');
  }
}

// Alternative function to get OpenAI client at runtime (in case env vars aren't available at module load)
function getRuntimeOpenAIClient(): OpenAI | null {
  // Skip during build time
  if (isVercelBuild) {
    console.log('[AI Service] Skipping OpenAI client initialization during build time');
    return null;
  }
  
  const runtimeKey = process.env.OPENAI_API_KEY || process.env.openai_api_key || process.env.OPENAI_API_TOKEN;
  
  if (runtimeKey) {
    console.log('[AI Service] Found OpenAI API key at runtime, creating client');
    return new OpenAI({ apiKey: runtimeKey });
  }
  
  console.log('[AI Service] No OpenAI API key found at runtime');
  return null;
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
  assessmentId: number,
  stepData: WizardStepData, 
  prioritizedItems: any[], // Changed from prioritizedRoles to be more generic
  options: { noCache?: boolean } = {}
): Promise<string> {
  console.log('[AI Service] generateEnhancedExecutiveSummary called');
  
  // Skip OpenAI calls during build time
  if (isVercelBuild) {
    console.log('[AI Service] Skipping OpenAI call during build - using fallback for executive summary');
    return fallbackExecutiveSummary(stepData, prioritizedItems);
  }
  
  // Try module-level client first, then runtime client
  let workingOpenAI = openai;
  if (!workingOpenAI) {
    console.log('[AI Service] Module-level OpenAI client not available, trying runtime client...');
    workingOpenAI = getRuntimeOpenAIClient();
  }
  
  console.log(`[AI Service] OpenAI client available: ${!!workingOpenAI}`);
  
  try {
    if (!workingOpenAI) {
      console.log('[AI Service] No OpenAI client available - using fallback for executive summary');
      return fallbackExecutiveSummary(stepData, prioritizedItems);
    }

    // Extract relevant data for prompt construction
    const companyName = stepData.basics?.companyName || "your company";
    const industry = stepData.basics?.industry || "your industry";
    const goals = stepData.basics?.goals || "improve efficiency and competitiveness";
    
    console.log(`[AI Service] Generating executive summary for: ${companyName} in ${industry}`);
    
    // Get top prioritized roles
    const topRoles = prioritizedItems.slice(0, 3).map(item => ({
      name: item.name, // Changed from title to name
      priority: item.priority,
      valueScore: item.valueScore,
      effortScore: item.effortScore
    }));
    
    // Construct prompt
    const prompt = `Generate an executive summary for AI transformation at ${companyName}, a company in the ${industry} industry. 
    Their primary goals are: ${goals}
    
    The assessment identified these top priority opportunities:
    ${topRoles.map(item => `- ${item.name} (Priority: ${item.priority}, Value: ${item.valueScore}/5, Effort: ${item.effortScore}/5)`).join('\n')}
    
    Write an executive summary (300-400 words) highlighting:
    1. Key opportunities for AI transformation
    2. The expected business outcomes
    3. A high-level implementation approach
    4. Potential strategic benefits
    
    Use a professional, concise tone appropriate for C-level executives.`;

    const model = "gpt-4";
    
    // Check if we have a cached response, bypass if noCache is true
    if (!options.noCache) {
      const cachedResponse = getCachedResponse(prompt, model);
      if (cachedResponse) {
        console.log('[AI Service] Using cached response for executive summary');
        return cachedResponse;
      }
    } else {
      console.log('[AI Service] Bypassing cache for executive summary generation.');
    }

    console.log('[AI Service] Making OpenAI API call for executive summary...');
    
    // Make the API call
    const response = await workingOpenAI.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an AI transformation consultant providing executive-level strategic insights." },
        { role: "user", content: prompt }
      ],
      seed: assessmentId,
    });

    console.log('[AI Service] OpenAI API call successful for executive summary');
    
    const content = response.choices[0].message.content || fallbackExecutiveSummary(stepData, prioritizedItems);
    
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
    return fallbackExecutiveSummary(stepData, prioritizedItems);
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
  
  // Skip OpenAI calls during build time
  if (isVercelBuild) {
    console.log('[AI Service] Skipping OpenAI call during build - using fallback for AI capability recommendations');
    return fallbackAICapabilities(role, department);
  }
  
  // Try module-level client first, then runtime client
  let workingOpenAI = openai;
  if (!workingOpenAI) {
    console.log('[AI Service] Module-level OpenAI client not available, trying runtime client...');
    workingOpenAI = getRuntimeOpenAIClient();
  }
  
  console.log(`[AI Service] OpenAI client available: ${!!workingOpenAI}`);
  
  try {
    if (!workingOpenAI) {
      console.log('[AI Service] No OpenAI client available - using fallback for AI capabilities');
      return fallbackAICapabilities(role, department);
    }

    // Construct a more detailed prompt
    const painPointsDescription = `Pain points include: Severity: ${painPoints.severity || 'N/A'}/5, Frequency: ${painPoints.frequency || 'N/A'}/5, Impact: ${painPoints.impact || 'N/A'}/5. Description: ${painPoints.description || 'Not specified'}`;
    console.log(`[AI Service] Pain points for ${role.title}: ${painPointsDescription}`);

    const prompt = `
      For a ${role.title} in the ${department.name} department, who faces these challenges: ${painPointsDescription}.
      
      Identify the top 10 most impactful AI capabilities that could address these issues. For each capability:
      1.  Provide a clear 'capabilityName' and 'capabilityCategory' (e.g., 'Content Generation', 'Data Analysis', 'Automation').
      2.  Write a concise 'capabilityDescription' (1-2 sentences).
      3.  Estimate the 'businessValue' (e.g., 'High', 'Medium', 'Low') and 'implementationEffort' (e.g., 'High', 'Medium', 'Low').
      4.  Calculate a 'valueScore' (0-100) based on this formula: (Severity * 5 + Frequency * 4 + Impact * 6). This score MUST be based on the user's pain point input.
      5.  Provide a 'feasibilityScore' (0-100) based on your expert assessment of how technically achievable this capability is for a typical company in this industry.
      6.  Suggest 2-3 specific, real-world AI tools that can deliver this capability in the 'recommendedTools' field as an array of strings.
      7.  Provide relevant 'tags' as an array of strings.
      
      Return the response as a JSON object with a single key "recommendations" that contains an array of these capability objects.
      Example of a single object in the array:
      {
        "capabilityName": "Automated Content Briefs",
        "capabilityCategory": "Content Generation",
        "capabilityDescription": "Automatically generates detailed content briefs for writers, including keywords, topics, and structure.",
        "businessValue": "High",
        "implementationEffort": "Low",
        "valueScore": "90",
        "feasibilityScore": "80",
        "assessmentNotes": "Directly addresses the time-consuming nature of content planning and ensures SEO alignment.",
        "recommendedTools": ["SurferSEO", "Frase.io", "Clearscope"],
        "tags": ["seo", "content marketing", "automation"]
      }
    `;

    const model = "gpt-4";
    
    // Check if we have a cached response
    const cachedResponse = getCachedResponse(prompt, model);
    if (cachedResponse) {
      console.log('[AI Service] Using cached response for AI capability recommendations');
      return cachedResponse;
    }

    console.log('[AI Service] Making OpenAI API call for AI capability recommendations...');

    const response = await workingOpenAI.chat.completions.create({
      model: "gpt-4-turbo-preview", // Or your preferred model
      messages: [
        { role: "system", content: "You are an AI transformation consultant providing specific, actionable capability recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    console.log('[AI Service] OpenAI API call successful for AI capability recommendations');

    const content = JSON.parse(response.choices[0].message.content || '{ "recommendations": [] }');
    const recommendations = content.recommendations || (Array.isArray(content) ? content : [content]);
    
    console.log(`[AI Service] Successfully parsed ${Array.isArray(recommendations) ? recommendations.length : 0} AI capability recommendations`);

    // Ensure the output is always an array
    if (Array.isArray(recommendations)) {
      return recommendations.map(rec => ({
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
    } else {
      console.error("[AI Service] Parsed OpenAI response is not in the expected format:", recommendations);
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
  console.log('[AI Service] generatePerformanceImpact called');
  console.log(`[AI Service] Role: ${role.title}, Department: ${department.name}`);
  console.log(`[AI Service] OpenAI client available: ${!!openai}`);
  
  // Skip OpenAI calls during build time
  if (isVercelBuild) {
    console.log('[AI Service] Skipping OpenAI call during build - using fallback for performance impact');
    return fallbackPerformanceImpact(role);
  }
  
  // Try module-level client first, then runtime client
  let workingOpenAI = openai;
  if (!workingOpenAI) {
    console.log('[AI Service] Module-level OpenAI client not available, trying runtime client...');
    workingOpenAI = getRuntimeOpenAIClient();
  }
  
  console.log(`[AI Service] OpenAI client available: ${!!workingOpenAI}`);
  
  try {
    if (!workingOpenAI) {
      console.log('[AI Service] No OpenAI client available - using fallback for performance impact');
      return fallbackPerformanceImpact(role);
    }

    const prompt = `Based on industry benchmarks and known AI implementation outcomes, predict the performance improvements for this role. Return your response as a valid JSON object with the following structure:

{
  "metrics": [
    {"name": "metric name", "improvement": percentage_number},
    {"name": "another metric", "improvement": percentage_number}
  ],
  "estimatedAnnualRoi": dollar_amount_number
}

Role: ${role.title}
Department: ${department.name}
Key Responsibilities: ${role.keyResponsibilities ? role.keyResponsibilities.join(", ") : "Not provided"}

Return ONLY the JSON object, no additional text.`;

    const model = "gpt-4-turbo-preview";
    
    // Check if we have a cached response
    const cachedResponse = getCachedResponse(prompt, model);
    if (cachedResponse) {
      console.log('[AI Service] Using cached response for performance impact');
      return cachedResponse;
    }

    console.log('[AI Service] Making OpenAI API call for performance impact...');

    const response = await workingOpenAI.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an AI transformation analyst providing realistic performance predictions. Return only valid JSON objects." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    console.log('[AI Service] OpenAI API call successful for performance impact');

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("[AI Service] OpenAI returned empty content for performance impact.");
      return fallbackPerformanceImpact(role);
    }

    console.log(`[AI Service] Received performance impact response (${content.length} characters)`);
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Validate the structure
      if (!parsedContent.metrics || !Array.isArray(parsedContent.metrics) || typeof parsedContent.estimatedAnnualRoi !== 'number') {
        console.error("[AI Service] Invalid performance impact structure:", parsedContent);
        return fallbackPerformanceImpact(role);
      }
      
      // Cache the response
      cacheResponse(prompt, model, parsedContent);
      
      console.log('[AI Service] Performance impact generated successfully');
      return parsedContent;
    } catch (error) {
      console.error("[AI Service] Error parsing performance impact JSON:", error);
      console.error("[AI Service] Problematic content:", content);
      console.log('[AI Service] Falling back to default performance impact');
      return fallbackPerformanceImpact(role);
    }
  } catch (error) {
    console.error("[AI Service] ERROR generating performance impact predictions with OpenAI:", error);
    console.error('[AI Service] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('[AI Service] Falling back to default performance impact');
    return fallbackPerformanceImpact(role);
  }
}

/**
 * Fallback function for executive summary
 */
function fallbackExecutiveSummary(stepData: WizardStepData, prioritizedItems: any[]): string {
  const companyName = stepData.basics?.companyName || "your company";
  const topRoles = prioritizedItems.slice(0, 2);
  
  // Extract unique departments safely
  const departmentSet = new Set<string>();
  topRoles.forEach(item => {
    if (item && item.department) {
      departmentSet.add(item.department);
    }
  });
  const departments = Array.from(departmentSet);
  
  return `Based on our analysis of ${companyName}'s current processes and roles, we've identified significant opportunities for AI transformation that could lead to efficiency gains and cost savings.

The assessment reveals that ${departments.join(" and ") || "key functional"} functions have the highest potential for immediate AI impact with relatively low implementation barriers. We estimate potential time savings of 15-20 hours per week per agent in ${topRoles[0]?.name || "key roles"} through AI-assisted processes and automation.

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
  console.log('[AI Service] generateAIResponse called');
  
  // Skip OpenAI calls during build time
  if (isVercelBuild) {
    console.log('[AI Service] Skipping OpenAI call during build - using fallback response');
    return "This is a fallback response during build time. The AI service is not available during static site generation.";
  }
  
  // Try module-level client first, then runtime client
  let workingOpenAI = openai;
  if (!workingOpenAI) {
    console.log('[AI Service] Module-level OpenAI client not available, trying runtime client...');
    workingOpenAI = getRuntimeOpenAIClient();
  }
  
  if (!workingOpenAI) {
    console.error('[AI Service] No OpenAI client available for generating AI response');
    return 'AI features are currently disabled. Please configure the required API keys.';
  }

  try {
    const completion = await workingOpenAI.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Error generating AI response. Please try again later.';
  }
}