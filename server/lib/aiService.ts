import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { WizardStepData, JobRole, Department } from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Check for required environment variables
const requiredEnvVars = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('AI features will be disabled. Please set these variables in your .env file or Replit Secrets.');
}

// Initialize API clients
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Generate an enhanced executive summary with Anthropic Claude
 */
export async function generateEnhancedExecutiveSummary(
  stepData: WizardStepData, 
  prioritizedRoles: any[]
): Promise<string> {
  try {
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

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    // Safely extract text content
    const content = message.content[0];
    return typeof content === 'object' && 'text' in content ? content.text : String(content);
  } catch (error) {
    console.error('Error generating executive summary with Anthropic:', error);
    // Fallback to basic summary generation
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
): Promise<any[]> {
  try {
    const painPointDescription = painPoints ? 
      `Pain points include: Severity: ${painPoints.severity}/5, Frequency: ${painPoints.frequency}/5, Impact: ${painPoints.impact}/5. Description: ${painPoints.description || 'Not provided'}` :
      'No specific pain points provided.';
    
    const prompt = `As an AI transformation consultant, recommend 3-4 specific AI capabilities that would best address the needs of this role:
    
    Role: ${role.title}
    Department: ${department.name}
    Key Responsibilities: ${role.keyResponsibilities ? role.keyResponsibilities.join(', ') : 'Not provided'}
    ${painPointDescription}
    
    For each capability, provide:
    1. A specific name/title for the capability
    2. A brief description of what it does and how it helps this specific role
    
    Return the response as JSON in this format:
    [
      {
        "name": "Capability Name",
        "description": "Brief description of how it helps"
      }
    ]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI transformation consultant providing specific, actionable recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || '[]');
    return result;
  } catch (error) {
    console.error('Error generating AI capability recommendations with OpenAI:', error);
    // Fallback to basic suggestions
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
    const prompt = `Based on industry benchmarks and known AI implementation outcomes, predict the performance improvements for this role:
    
    Role: ${role.title}
    Department: ${department.name}
    Key Responsibilities: ${role.keyResponsibilities ? role.keyResponsibilities.join(', ') : 'Not provided'}
    
    Return your analysis as JSON with:
    1. 2-3 key metrics that would be improved
    2. An estimated percentage improvement for each metric
    3. An estimated annual ROI in dollars
    
    Format:
    {
      "metrics": [
        {"name": "Metric Name", "improvement": percentageValue}
      ],
      "estimatedAnnualRoi": dollarValue
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI transformation analyst providing realistic performance predictions." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || '{"metrics":[], "estimatedAnnualRoi": 0}');
    return result;
  } catch (error) {
    console.error('Error generating performance impact predictions with OpenAI:', error);
    // Fallback to basic impact estimation
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
function fallbackAICapabilities(role: JobRole): any[] {
  const title = role.title.toLowerCase();
  
  if (title.includes("customer support") || title.includes("service")) {
    return [
      { name: "Natural Language Understanding", description: "For ticket categorization and automatic routing" },
      { name: "Response Generation", description: "For template-based replies to common questions" },
      { name: "Knowledge Base Integration", description: "To quickly pull relevant documentation" }
    ];
  } else if (title.includes("sales")) {
    return [
      { name: "RFP Response Automation", description: "For extracting key questions and generating draft responses" },
      { name: "Sales Data Analysis", description: "For identifying trends and opportunities" },
      { name: "Client Interaction Summarization", description: "For automatically creating call summaries and follow-up tasks" }
    ];
  } else if (title.includes("marketing") || title.includes("content")) {
    return [
      { name: "Content Generation", description: "For creating draft marketing materials" },
      { name: "Social Media Analysis", description: "For tracking campaign performance" },
      { name: "A/B Testing Automation", description: "For optimizing messaging and creative variants" }
    ];
  } else {
    return [
      { name: "Workflow Automation", description: "For streamlining repetitive tasks" },
      { name: "Document Processing", description: "For extracting and organizing information" },
      { name: "Decision Support System", description: "For data-driven recommendations based on historical patterns" }
    ];
  }
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