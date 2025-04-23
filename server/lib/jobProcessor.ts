import { JobDescription, ProcessedJobContent } from '@shared/schema';
import { storage } from '../storage';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '', 
});

/**
 * Class for processing job descriptions using Anthropic Claude
 */
export class JobProcessor {
  /**
   * Process a single job description using Claude
   */
  async processJobDescription(jobDescription: JobDescription): Promise<JobDescription> {
    try {
      console.log(`Processing job description: ${jobDescription.id} - ${jobDescription.title}`);
      
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set');
      }
      
      // Create a prompt for Claude
      const prompt = this.createPrompt(jobDescription);
      
      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.2,
        system: "You are an expert at analyzing job descriptions and extracting structured information from them. You provide accurate, detailed analysis of job requirements, responsibilities, skills, and other key information.",
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      // Parse the structured data
      const processedContent = this.parseResponse(response.content[0].text);
      
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
      }
      
      return processedCount;
    } catch (error) {
      console.error('Error processing pending job descriptions:', error);
      return 0;
    }
  }
  
  /**
   * Create a prompt for Claude
   */
  private createPrompt(jobDescription: JobDescription): string {
    return `
I need you to analyze the following job description and extract structured information from it.
The job title is: ${jobDescription.title}
The company is: ${jobDescription.company || 'Not specified'}
The location is: ${jobDescription.location || 'Not specified'}

JOB DESCRIPTION:
${jobDescription.rawContent}

Please extract the following information in JSON format:
1. skills: An array of all skills mentioned in the job description
2. experience: An array of all experience requirements mentioned
3. education: An array of all education requirements mentioned
4. responsibilities: An array of all responsibilities or duties mentioned
5. benefits: An array of all benefits or perks mentioned
6. requiredSkills: An array of skills that are explicitly stated as required
7. preferredSkills: An array of skills that are explicitly stated as preferred or a plus
8. salaryRange: An object with min and max values (if mentioned) and currency
9. jobType: The type of job (full-time, part-time, contract, etc.)
10. industry: The industry this job is in
11. seniorityLevel: The seniority level (entry, mid, senior, etc.)

Return ONLY a valid JSON object with these fields, nothing else. If a field is not mentioned in the job description, include it as an empty array [] or appropriate empty value.
    `;
  }
  
  /**
   * Parse Claude's response into structured data
   */
  private parseResponse(responseText: string): ProcessedJobContent {
    try {
      // Extract JSON from response (in case there's any text before or after)
      const jsonMatch = responseText.match(/({[\s\S]*})/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }
      
      const jsonString = jsonMatch[0];
      const processedContent = JSON.parse(jsonString) as ProcessedJobContent;
      
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
      console.error('Error parsing Claude response:', error);
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