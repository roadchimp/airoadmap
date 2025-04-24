import { JobDescription, ProcessedJobContent } from '@shared/schema';
import { storage } from '../storage';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Class for processing job descriptions using OpenAI GPT-4
 */
export class JobProcessor {
  /**
   * Process a single job description using GPT-4
   */
  async processJobDescription(jobDescription: JobDescription): Promise<JobDescription> {
    try {
      console.log(`Processing job description: ${jobDescription.id} - ${jobDescription.title}`);
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      
      // Create a prompt for GPT-4
      const prompt = this.createPrompt(jobDescription);
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing job descriptions and extracting structured information from them. You provide accurate, detailed analysis of job requirements, responsibilities, skills, and other key information. You ONLY respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      
      // Parse the structured data
      const processedContent = this.parseResponse(response.choices[0].message.content || '{}');
      
      // Update job description with processed content
      const updatedJobDescription = await storage.updateJobDescriptionProcessedContent(
        jobDescription.id,
        processedContent
      );
      
      return updatedJobDescription;
    } catch (error) {
      console.error(`Error processing job description ${jobDescription.id}:`, error);
      
      // Update job description with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateJobDescriptionStatus(
        jobDescription.id,
        'error',
        errorMessage
      );
      
      return jobDescription;
    }
  }
  
  /**
   * Process all unprocessed job descriptions
   */
  async processAllPendingJobDescriptions(): Promise<number> {
    try {
      // Get all job descriptions with 'raw' status
      const pendingJobDescriptions = await storage.listJobDescriptionsByStatus('raw');
      
      console.log(`Processing ${pendingJobDescriptions.length} pending job descriptions`);
      
      let processedCount = 0;
      
      // Process each job description
      for (const jobDescription of pendingJobDescriptions) {
        await this.processJobDescription(jobDescription);
        processedCount++;
        
        // Add a small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return processedCount;
    } catch (error) {
      console.error('Error processing pending job descriptions:', error);
      return 0;
    }
  }
  
  /**
   * Create a prompt for GPT-4
   */
  private createPrompt(jobDescription: JobDescription): string {
    return `
Analyze this job description and extract structured information in JSON format.

Job Title: ${jobDescription.title}
Company: ${jobDescription.company || 'Not specified'}
Location: ${jobDescription.location || 'Not specified'}

Job Description:
${jobDescription.rawContent}

Extract and return ONLY a JSON object with these fields:
{
  "skills": [], // Array of all skills mentioned
  "experience": [], // Array of all experience requirements
  "education": [], // Array of all education requirements
  "responsibilities": [], // Array of all responsibilities/duties
  "benefits": [], // Array of all benefits/perks
  "requiredSkills": [], // Array of explicitly required skills
  "preferredSkills": [], // Array of preferred/nice-to-have skills
  "salaryRange": { // Object with salary info if mentioned
    "min": null,
    "max": null,
    "currency": null
  },
  "jobType": "", // full-time, part-time, contract, etc.
  "industry": "", // Industry this job is in
  "seniorityLevel": "" // entry, mid, senior, etc.
}

If any field is not mentioned in the job description, include it as an empty array [] or appropriate empty value.
Return ONLY the JSON object, no additional text.`;
  }
  
  /**
   * Parse GPT-4's response into structured data
   */
  private parseResponse(responseText: string): ProcessedJobContent {
    try {
      const processedContent = JSON.parse(responseText) as ProcessedJobContent;
      
      // Ensure all arrays exist even if not in response
      return {
        skills: processedContent.skills || [],
        experience: processedContent.experience || [],
        education: processedContent.education || [],
        responsibilities: processedContent.responsibilities || [],
        benefits: processedContent.benefits || [],
        requiredSkills: processedContent.requiredSkills || [],
        preferredSkills: processedContent.preferredSkills || [],
        salaryRange: processedContent.salaryRange || {},
        jobType: processedContent.jobType || '',
        industry: processedContent.industry || '',
        seniorityLevel: processedContent.seniorityLevel || ''
      };
    } catch (error) {
      console.error('Error parsing GPT-4 response:', error);
      console.error('Response text:', responseText);
      
      // Return default empty structure
      return {
        skills: [],
        experience: [],
        education: [],
        responsibilities: [],
        benefits: [],
        requiredSkills: [],
        preferredSkills: [],
        salaryRange: {},
        jobType: '',
        industry: '',
        seniorityLevel: ''
      };
    }
  }
} 