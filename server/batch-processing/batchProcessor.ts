import fs from 'fs';
import path from 'path';
import { JobDescription, ProcessedJobContent } from '@shared/schema';
import { storage } from '../storage';

const BATCH_DIR = path.join(process.cwd(), 'server', 'batch-processing');
const REQUESTS_DIR = path.join(BATCH_DIR, 'requests');
const RESPONSES_DIR = path.join(BATCH_DIR, 'responses');

// Ensure directories exist
[BATCH_DIR, REQUESTS_DIR, RESPONSES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Formats a job description for OpenAI batch processing
 */
function formatJobForBatch(jobDescription: JobDescription): string {
  const prompt = `Analyze this job description and extract structured information in JSON format.

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

  // Format for OpenAI batch processing
  return JSON.stringify({
    messages: [
      {
        role: 'system',
        content: 'You are an expert at analyzing job descriptions and extracting structured information from them. You provide accurate, detailed analysis of job requirements, responsibilities, skills, and other key information. You ONLY respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  });
}

/**
 * Exports unprocessed job descriptions to a JSONL file for batch processing
 */
export async function exportJobsForBatch(): Promise<string> {
  // Get all unprocessed job descriptions
  const jobDescriptions = await storage.listJobDescriptionsByStatus('raw');
  
  if (jobDescriptions.length === 0) {
    throw new Error('No unprocessed job descriptions found');
  }
  
  // Create a timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `batch_${timestamp}.jsonl`;
  const filepath = path.join(REQUESTS_DIR, filename);
  
  // Create JSONL content
  const jsonlContent = jobDescriptions
    .map(job => formatJobForBatch(job))
    .join('\n');
  
  // Write to file
  fs.writeFileSync(filepath, jsonlContent, 'utf8');
  
  // Create a manifest file with job IDs for later processing
  const manifestPath = filepath.replace('.jsonl', '_manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      jobIds: jobDescriptions.map(job => job.id),
      timestamp,
      status: 'pending'
    }, null, 2)
  );
  
  return filepath;
}

/**
 * Process the results from an OpenAI batch job
 */
export async function processBatchResults(responsePath: string): Promise<void> {
  // Verify the response file exists
  if (!fs.existsSync(responsePath)) {
    throw new Error(`Response file not found: ${responsePath}`);
  }
  
  // Find corresponding manifest file
  const manifestPath = path.join(
    REQUESTS_DIR,
    path.basename(responsePath).replace('.jsonl', '_manifest.json')
  );
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestPath}`);
  }
  
  // Read manifest and responses
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const responses = fs.readFileSync(responsePath, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  
  if (manifest.jobIds.length !== responses.length) {
    throw new Error(`Mismatch between job IDs (${manifest.jobIds.length}) and responses (${responses.length})`);
  }
  
  // Process each response
  for (let i = 0; i < responses.length; i++) {
    const jobId = manifest.jobIds[i];
    const response = responses[i];
    
    try {
      // Parse the response content
      const processedContent = JSON.parse(response.choices[0].message.content) as ProcessedJobContent;
      
      // Update the job description
      await storage.updateJobDescriptionProcessedContent(jobId, processedContent);
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      await storage.updateJobDescriptionStatus(jobId, 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  // Update manifest status
  manifest.status = 'completed';
  manifest.processedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Move response file to responses directory
  const newResponsePath = path.join(RESPONSES_DIR, path.basename(responsePath));
  fs.renameSync(responsePath, newResponsePath);
} 