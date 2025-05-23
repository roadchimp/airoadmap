import fs from 'fs';
import path from 'path';
import { JobDescription, ProcessedJobContent } from '@shared/schema';
import { storage } from '../storage';

const BATCH_DIR = path.join(process.cwd(), 'server', 'batch-processing');
const REQUESTS_DIR = path.join(BATCH_DIR, 'requests');
const RESPONSES_DIR = path.join(BATCH_DIR, 'responses');
const LOGS_DIR = path.join(BATCH_DIR, 'logs');
const TRACKING_FILE = path.join(LOGS_DIR, 'processed_jobs.json');

// Ensure directories exist
[BATCH_DIR, REQUESTS_DIR, RESPONSES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize tracking file if it doesn't exist
if (!fs.existsSync(TRACKING_FILE)) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify({ processedJobIds: [] }), 'utf8');
}

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
    custom_id: `jd_${jobDescription.id.toString().padStart(5, '0')}`,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
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
      model: 'gpt-4-turbo',
      response_format: { type: 'json_object' },
      temperature: 0.2
    }
  });
}

/**
 * Exports unprocessed job descriptions to a JSONL file for batch processing
 * @param forceIncludeAll If true, include all 'raw' jobs even if previously processed
 */
export async function exportJobsForBatch(forceIncludeAll: boolean = false): Promise<string> {
  // Get all unprocessed job descriptions
  const jobDescriptions = await storage.listJobDescriptionsByStatus('raw');
  
  if (jobDescriptions.length === 0) {
    throw new Error('No unprocessed job descriptions found');
  }
  
  // Load processed job IDs from tracking file
  let processedJobsTracking = { processedJobIds: [] as number[] };
  try {
    const trackingData = fs.readFileSync(TRACKING_FILE, 'utf8');
    processedJobsTracking = JSON.parse(trackingData);
  } catch (error) {
    console.warn('Could not read tracking file, will create a new one');
  }
  
  // Filter out previously processed jobs unless forceIncludeAll is true
  const jobsToProcess = forceIncludeAll 
    ? jobDescriptions 
    : jobDescriptions.filter(job => !processedJobsTracking.processedJobIds.includes(job.id));
  
  if (jobsToProcess.length === 0) {
    throw new Error('No new unprocessed job descriptions found. Use --force to reprocess all raw jobs.');
  }
  
  console.log(`Found ${jobsToProcess.length} new job descriptions to process (${jobDescriptions.length - jobsToProcess.length} filtered as already processed)`);
  
  // Create a timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `batch_${timestamp}.jsonl`;
  const filepath = path.join(REQUESTS_DIR, filename);
  
  // Create JSONL content
  const jsonlContent = jobsToProcess
    .map(job => formatJobForBatch(job))
    .join('\n');
  
  // Write to file
  fs.writeFileSync(filepath, jsonlContent, 'utf8');
  
  // Create a manifest file with job IDs for later processing
  const manifestPath = filepath.replace('.jsonl', '_manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      jobIds: jobsToProcess.map(job => job.id),
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
  
  // Load processed job IDs tracking
  let processedJobsTracking = { processedJobIds: [] as number[] };
  try {
    const trackingData = fs.readFileSync(TRACKING_FILE, 'utf8');
    processedJobsTracking = JSON.parse(trackingData);
  } catch (error) {
    console.warn('Could not read tracking file, will create a new one');
  }
  
  // Process each response
  let successCount = 0;
  let errorCount = 0;
  
  // Create a map of custom_id to job ID for easy lookup
  const customIdToJobId = new Map();
  manifest.jobIds.forEach((jobId: number, index: number) => {
    const customId = `jd_${jobId.toString().padStart(5, '0')}`;
    customIdToJobId.set(customId, jobId);
  });
  
  for (const response of responses) {
    try {
      // Check if the response was successful
      if (response.error === null && response.response?.status_code === 200) {
        // Extract the custom_id to determine which job this response belongs to
        const { custom_id } = response;
        const jobId = customIdToJobId.get(custom_id);
        
        if (!jobId) {
          console.error(`Could not determine job ID for custom_id: ${custom_id}`);
          errorCount++;
          continue;
        }
        
        // Parse the response content
        const content = response.response.body.choices[0].message.content;
        const processedContent = JSON.parse(content) as ProcessedJobContent;
        
        // Update the job description
        await storage.updateJobDescriptionProcessedContent(jobId, processedContent);
        
        // Mark as processed
        if (!processedJobsTracking.processedJobIds.includes(jobId)) {
          processedJobsTracking.processedJobIds.push(jobId);
        }
        
        // Change status from 'raw' to 'processed'
        await storage.updateJobDescriptionStatus(jobId, 'processed');
        
        successCount++;
      } else {
        console.error(`Error in response: ${response.error || 'Unknown error'}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`Error processing response:`, error);
      errorCount++;
    }
  }
  
  // Update tracking file
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(processedJobsTracking, null, 2));
  
  // Update manifest status
  manifest.status = 'completed';
  manifest.processedAt = new Date().toISOString();
  manifest.summary = {
    total: responses.length,
    success: successCount,
    error: errorCount
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Move response file to responses directory
  const newResponsePath = path.join(RESPONSES_DIR, path.basename(responsePath));
  fs.renameSync(responsePath, newResponsePath);
  
  console.log(`Batch processing complete. Successfully processed: ${successCount}, Errors: ${errorCount}`);
}

/**
 * Reset the tracking of processed job IDs
 */
export function resetProcessedJobsTracking(): void {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify({ processedJobIds: [] }), 'utf8');
  console.log('Processed jobs tracking has been reset. All raw jobs will be included in the next export.');
}

/**
 * Command-line interface
 */
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts export [--force]');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts process <response_file_path>');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts list');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts reset-tracking');
    process.exit(1);
  }
  
  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'export':
        const forceIncludeAll = args.includes('--force');
        const filePath = await exportJobsForBatch(forceIncludeAll);
        console.log('Exported job descriptions to:', filePath);
        console.log('Manifest file created at:', filePath.replace('.jsonl', '_manifest.json'));
        console.log('\nNext steps:');
        console.log('1. Submit this JSONL file to OpenAI for batch processing');
        console.log('2. Save the response file');
        console.log('3. Run: npx tsx server/batch-processing/batchProcessor.ts process <response_file_path>');
        break;
      
      case 'reset-tracking':
        resetProcessedJobsTracking();
        break;
        
      case 'process':
        if (args.length < 2) {
          console.error('Error: Missing response file path');
          console.log('Usage: npx tsx server/batch-processing/batchProcessor.ts process <response_file_path>');
          process.exit(1);
        }
        
        const responsePath = args[1];
        await processBatchResults(responsePath);
        console.log('Processed batch results successfully');
        console.log('Job descriptions updated in database');
        break;
        
      case 'list':
        // List all request files
        console.log('Available batch request files:');
        const requestFiles = fs.readdirSync(REQUESTS_DIR)
          .filter(file => file.endsWith('.jsonl') && !file.includes('_manifest'));
          
        if (requestFiles.length === 0) {
          console.log('No request files found');
        } else {
          requestFiles.forEach(file => {
            const manifestPath = path.join(REQUESTS_DIR, file.replace('.jsonl', '_manifest.json'));
            let status = 'Unknown';
            let count = 0;
            
            if (fs.existsSync(manifestPath)) {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
              status = manifest.status;
              count = manifest.jobIds.length;
            }
            
            console.log(`- ${file} (${count} jobs, Status: ${status})`);
          });
        }
        
        // List all response files
        console.log('\nAvailable batch response files:');
        const responseFiles = fs.readdirSync(RESPONSES_DIR)
          .filter(file => file.endsWith('.jsonl'));
          
        if (responseFiles.length === 0) {
          console.log('No response files found');
        } else {
          responseFiles.forEach(file => {
            console.log(`- ${path.join(RESPONSES_DIR, file)}`);
          });
        }
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage:');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts export [--force]');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts process <response_file_path>');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts list');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts reset-tracking');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 