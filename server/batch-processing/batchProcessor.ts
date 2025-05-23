import fs from 'fs';
import path from 'path';
import { JobDescription, ProcessedJobContent, AICapability } from '@shared/schema';
import { storage } from '../storage';
import { spawn } from 'child_process';

const BATCH_DIR = path.join(process.cwd(), 'server', 'batch-processing');
const REQUESTS_DIR = path.join(BATCH_DIR, 'requests');
const RESPONSES_DIR = path.join(BATCH_DIR, 'responses');
const LOGS_DIR = path.join(BATCH_DIR, 'logs');
const TRACKING_FILE = path.join(LOGS_DIR, 'processed_jobs.json');
const CAPABILITIES_FILE = path.join(LOGS_DIR, 'capabilities.json');
const CAPABILITIES_TRACKING_FILE = path.join(LOGS_DIR, 'processed_capabilities.json');

// Ensure directories exist
[BATCH_DIR, REQUESTS_DIR, RESPONSES_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize tracking file if it doesn't exist
if (!fs.existsSync(TRACKING_FILE)) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify({ processedJobIds: [] }), 'utf8');
}

/**
 * Runs the job scraper to collect job descriptions
 */
export async function runJobScraper(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting job scraper...');
    
    const scraperProcess = spawn('npx', ['tsx', 'server/scraper/custom-scraper.ts'], {
      stdio: 'inherit',
      shell: true
    });
    
    scraperProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Job scraper completed successfully');
        resolve();
      } else {
        const error = new Error(`Job scraper exited with code ${code}`);
        console.error(error);
        reject(error);
      }
    });
    
    scraperProcess.on('error', (err) => {
      console.error('Failed to start job scraper:', err);
      reject(err);
    });
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
  
  // Format jobs for batch processing - using Promise.all to handle async formatJobForBatch
  const jsonlPromises = jobsToProcess.map(job => formatJobForBatch(job));
  const jsonlArray = await Promise.all(jsonlPromises);
  const jsonlContent = jsonlArray.join('\n');
  
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
 * Formats a job description for OpenAI batch processing
 */
async function formatJobForBatch(jobDescription: JobDescription): Promise<string> {
  // Get existing capabilities from the database or a cached file
  const capabilities = await getCapabilitiesForMatching();
  
  const prompt = `Analyze this job description and extract responsibilities. For each responsibility, match it to the most relevant AI capability from the provided list, or suggest a new capability if no good match exists.

Job Title: ${jobDescription.title}
Company: ${jobDescription.company || 'Not specified'}
Location: ${jobDescription.location || 'Not specified'}

Job Description:
${jobDescription.rawContent}

AI Capabilities List:
${capabilities.map((cap: AICapability) => `ID: ${cap.id} - Name: ${cap.name} - Category: ${cap.category} - Description: ${cap.description || 'No description'}`).join('\n')}

For each responsibility you identify, provide:
1. The exact text of the responsibility
2. The ID of the matching capability from the list (or null if no good match)
3. If no good match exists, suggest a new capability with a name and description

Return your analysis in this JSON format:
{
  "analysis_result": {
    "extracted_responsibilities": [
      {
        "responsibility_text": "Example responsibility text",
        "matched_capability_id": 123,
        "suggested_new_capability": null
      },
      {
        "responsibility_text": "Another responsibility with no match",
        "matched_capability_id": null,
        "suggested_new_capability": {
          "name": "Suggested Capability Name",
          "description": "Detailed description of this capability"
        }
      }
    ]
  }
}`;

  // Format for OpenAI batch processing
  return JSON.stringify({
    custom_id: `job_${jobDescription.id.toString().padStart(5, '0')}`,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing job descriptions and matching responsibilities to AI capabilities. You provide accurate, detailed analysis and only respond with valid JSON.'
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
 * Gets AI capabilities for matching from database or cached file
 * Filters out duplicate capabilities that have been identified during rationalization
 */
async function getCapabilitiesForMatching(): Promise<AICapability[]> {
  try {
    // Try to read from cache file first
    if (fs.existsSync(CAPABILITIES_FILE)) {
      const fileContent = fs.readFileSync(CAPABILITIES_FILE, 'utf8');
      const capabilities = JSON.parse(fileContent);
      
      // If we have capabilities, return them
      if (capabilities && Array.isArray(capabilities) && capabilities.length > 0) {
        console.log(`Using ${capabilities.length} capabilities from cache file`);
        
        // Get list of duplicates from rationalization results
        const duplicateCapabilityIds = await getDuplicateCapabilityIds();
        
        if (duplicateCapabilityIds.length > 0) {
          // Filter out duplicate capabilities
          const filteredCapabilities = capabilities.filter((cap: AICapability) => !duplicateCapabilityIds.includes(cap.id));
          console.log(`Filtered out ${capabilities.length - filteredCapabilities.length} duplicate capabilities`);
          return filteredCapabilities;
        }
        
        return capabilities;
      }
    }
    
    // If no cache file or empty cache, fetch from database and update cache
    console.log('No capabilities cache found or empty cache, fetching from database...');
    await updateCapabilitiesCache();
    
    // Now read from the updated cache file
    if (fs.existsSync(CAPABILITIES_FILE)) {
      const fileContent = fs.readFileSync(CAPABILITIES_FILE, 'utf8');
      const capabilities = JSON.parse(fileContent);
      
      // Get list of duplicates from rationalization results
      const duplicateCapabilityIds = await getDuplicateCapabilityIds();
      
      if (duplicateCapabilityIds.length > 0) {
        // Filter out duplicate capabilities
        const filteredCapabilities = capabilities.filter((cap: AICapability) => !duplicateCapabilityIds.includes(cap.id));
        console.log(`Using ${filteredCapabilities.length} capabilities from freshly updated cache (filtered out ${capabilities.length - filteredCapabilities.length} duplicates)`);
        return filteredCapabilities;
      }
      
      console.log(`Using ${capabilities.length} capabilities from freshly updated cache`);
      return capabilities;
    }
    
    // If still no capabilities, return empty array
    console.warn('Could not fetch capabilities from database or cache');
    return [];
  } catch (error) {
    console.warn('Error reading capabilities file:', error);
    return [];
  }
}

/**
 * Gets a list of capability IDs that have been identified as duplicates during rationalization
 */
async function getDuplicateCapabilityIds(): Promise<number[]> {
  try {
    // Use the storage method to get duplicate capability IDs
    return await storage.getDuplicateCapabilityIds();
  } catch (error) {
    console.warn('Error getting duplicate capability IDs:', error);
    return [];
  }
}

/**
 * Exports AI capabilities to a JSONL file for tool matching batch processing
 */
export async function exportCapabilitiesForBatch(forceIncludeAll: boolean = false): Promise<string> {
  // Get all capabilities from the database
  const capabilities = await storage.listAICapabilities();
  
  if (capabilities.length === 0) {
    throw new Error('No AI capabilities found in the database');
  }

  // Load processed capabilities tracking
  let processedCapabilitiesTracking = { processedCapabilityIds: [] as number[], lastProcessedDate: '' };
  try {
    if (fs.existsSync(CAPABILITIES_TRACKING_FILE)) {
      const trackingData = fs.readFileSync(CAPABILITIES_TRACKING_FILE, 'utf8');
      processedCapabilitiesTracking = JSON.parse(trackingData);
    }
  } catch (error) {
    console.warn('Could not read capabilities tracking file, will create a new one');
  }

  // Filter out previously processed capabilities unless forceIncludeAll is true
  const capabilitiesToProcess = forceIncludeAll 
    ? capabilities 
    : capabilities.filter(cap => !processedCapabilitiesTracking.processedCapabilityIds.includes(cap.id));
  
  if (capabilitiesToProcess.length === 0) {
    throw new Error('No new capabilities found to process. Use --force to reprocess all capabilities.');
  }
  
  console.log(`Found ${capabilitiesToProcess.length} new capabilities to process (${capabilities.length - capabilitiesToProcess.length} filtered as already processed)`);
  
  // Create a timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `capabilities_${timestamp}.jsonl`;
  const filepath = path.join(REQUESTS_DIR, filename);
  
  // Format capabilities for batch processing
  const jsonlContent = capabilitiesToProcess
    .map(capability => formatCapabilityForBatch(capability))
    .join('\n');
  
  // Write to file
  fs.writeFileSync(filepath, jsonlContent, 'utf8');
  
  // Create a manifest file with capability IDs for later processing
  const manifestPath = filepath.replace('.jsonl', '_manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      capabilityIds: capabilitiesToProcess.map(cap => cap.id),
      timestamp,
      status: 'pending'
    }, null, 2)
  );

  // Update tracking file with newly processed capabilities
  processedCapabilitiesTracking.processedCapabilityIds.push(...capabilitiesToProcess.map(cap => cap.id));
  processedCapabilitiesTracking.lastProcessedDate = timestamp;
  fs.writeFileSync(CAPABILITIES_TRACKING_FILE, JSON.stringify(processedCapabilitiesTracking, null, 2));
  
  return filepath;
}

/**
 * Formats a capability for OpenAI batch processing
 */
function formatCapabilityForBatch(capability: AICapability): string {
  const prompt = `Research and suggest AI tools that could implement the following AI capability:

Capability Name: ${capability.name}
Category: ${capability.category}
Description: ${capability.description || 'No description provided'}

Your task:
1. Identify 3-5 specific AI tools that can implement this capability
2. For each tool, provide:
   - Tool name
   - Vendor/creator
   - Brief description of how it implements the capability
   - URL to the tool's website
   - License type (Open Source, Commercial, Freemium, etc.)

Return your findings as a JSON object with this structure:
{
  "capability_id": ${capability.id},
  "tools": [
    {
      "name": "Tool Name",
      "vendor": "Vendor Name",
      "description": "A detailed description of how this tool implements the capability",
      "url": "https://example.com",
      "license_type": "Commercial/Open Source/Freemium/etc."
    }
  ]
}`;

  // Format for OpenAI batch processing
  return JSON.stringify({
    custom_id: `cap_${capability.id.toString().padStart(5, '0')}`,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      messages: [
        {
          role: 'system',
          content: 'You are an expert in AI tools and technologies. You provide accurate, detailed information about AI tools that can implement specific capabilities. You only respond with valid JSON.'
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
 * Process the results from an OpenAI batch job for job responsibilities
 */
export async function processJobBatchResults(responsePath: string): Promise<void> {
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
  let newCapabilities = 0;
  
  // Create a map of custom_id to job ID for easy lookup
  const customIdToJobId = new Map();
  manifest.jobIds.forEach((jobId: number) => {
    const customId = `job_${jobId.toString().padStart(5, '0')}`;
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
        const content = JSON.parse(response.response.body.choices[0].message.content);
        const analysisResult = content.analysis_result;
        
        if (!analysisResult || !analysisResult.extracted_responsibilities) {
          throw new Error('Invalid response format: missing analysis_result or extracted_responsibilities');
        }
        
        // Process responsibilities and capabilities
        for (const resp of analysisResult.extracted_responsibilities) {
          // If there's a suggested new capability, create it
          if (resp.suggested_new_capability) {
            const { name, description } = resp.suggested_new_capability;
            
            try {
              // Create the new capability in the database
              const newCapability = await storage.findOrCreateGlobalAICapability(
                name,
                'Suggested', // Default category for suggested capabilities
                description,
                {
                  default_business_value: 'Medium',
                  default_implementation_effort: 'Medium',
                  default_ease_score: '3',
                  default_value_score: '3',
                  default_feasibility_score: '3',
                  default_impact_score: '3',
                  tags: []
                }
              );
              
              console.log(`Created new capability: ${newCapability.name} (ID: ${newCapability.id})`);
              newCapabilities++;
            } catch (capError) {
              console.error(`Error creating capability '${name}':`, capError);
            }
          }
        }
        
        // Update the job description with processed content
        const processedContent: ProcessedJobContent = {
          skills: [],
          experience: [],
          education: [],
          responsibilities: analysisResult.extracted_responsibilities.map((r: { responsibility_text: string }) => r.responsibility_text),
          benefits: [],
          requiredSkills: [],
          preferredSkills: []
        };
        
        await storage.updateJobDescriptionProcessedContent(jobId, processedContent);
        
        // Mark as processed
        if (!processedJobsTracking.processedJobIds.includes(jobId)) {
          processedJobsTracking.processedJobIds.push(jobId);
        }
        
        // Change status from 'raw' to 'processed'
        await storage.updateJobDescriptionStatus(jobId, 'processed');
        
        successCount++;
      } else {
        const jobId = customIdToJobId.get(response.custom_id);
        console.error(`Error in response for job ${jobId || 'unknown'}:`, response.error || 'Unknown error');
        
        if (jobId) {
          await storage.updateJobDescriptionStatus(jobId, 'error', response.error || 'Unknown error');
        }
        
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
    error: errorCount,
    newCapabilities
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Move response file to responses directory
  const newResponsePath = path.join(RESPONSES_DIR, path.basename(responsePath));
  fs.renameSync(responsePath, newResponsePath);
  
  console.log(`Batch processing complete. Successfully processed: ${successCount}, Errors: ${errorCount}, New capabilities: ${newCapabilities}`);
}

/**
 * Process the results from an OpenAI batch job for capability-tool mapping
 */
export async function processCapabilityToolsResults(responsePath: string): Promise<void> {
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
  
  // Process each response
  let successCount = 0;
  let errorCount = 0;
  let newToolsCount = 0;
  let mappingsCount = 0;
  
  // Create a map of custom_id to capability ID for easy lookup
  const customIdToCapabilityId = new Map();
  manifest.capabilityIds.forEach((capabilityId: number) => {
    const customId = `cap_${capabilityId.toString().padStart(5, '0')}`;
    customIdToCapabilityId.set(customId, capabilityId);
  });
  
  for (const response of responses) {
    try {
      // Check if the response was successful
      if (response.error === null && response.response?.status_code === 200) {
        // Extract the custom_id to determine which capability this response belongs to
        const { custom_id } = response;
        const capabilityId = customIdToCapabilityId.get(custom_id);
        
        if (!capabilityId) {
          console.error(`Could not determine capability ID for custom_id: ${custom_id}`);
          errorCount++;
          continue;
        }
        
        // Parse the response content
        const content = JSON.parse(response.response.body.choices[0].message.content);
        
        // Verify capability ID in the response matches expected ID
        if (content.capability_id !== capabilityId) {
          console.warn(`Capability ID mismatch: expected ${capabilityId}, got ${content.capability_id}`);
        }
        
        // Process tools for this capability
        if (content.tools && Array.isArray(content.tools)) {
          for (const tool of content.tools) {
            try {
              // Find or create the tool in the database
              const toolData = {
                tool_name: tool.name,
                description: tool.description,
                website_url: tool.url,
                license_type: tool.license_type,
                primary_category: tool.primary_category || 'General',
                tags: tool.tags ? [tool.tags.join(',')] : [],
                // vendor is not in the schema, so we'll skip it
              };
              
              // Create or get existing tool - our updated createAITool will handle duplicates
              const toolRecord = await storage.createAITool(toolData);
              const toolId = toolRecord.tool_id;
              
              if (!toolId) {
                throw new Error(`Failed to get tool ID for ${tool.name}`);
              }
              
              // Check if this was a newly created tool by comparing the creation and update timestamps
              // If they're very close (within 1 second), it's likely a new tool
              const createdAt = new Date(toolRecord.created_at).getTime();
              const updatedAt = new Date(toolRecord.updated_at).getTime();
              if (Math.abs(updatedAt - createdAt) < 1000) {
                newToolsCount++;
              }
              
              // Map capability to tool - our updated mapCapabilityToTool will handle duplicates
              await storage.mapCapabilityToTool(capabilityId, toolId);
              mappingsCount++;
            } catch (toolError) {
              console.error(`Error processing tool for capability ${capabilityId}:`, toolError);
            }
          }
        }
        
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
  
  // Update manifest status
  manifest.status = 'completed';
  manifest.processedAt = new Date().toISOString();
  manifest.summary = {
    total: responses.length,
    success: successCount,
    error: errorCount,
    newTools: newToolsCount,
    mappings: mappingsCount
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Move response file to responses directory
  const newResponsePath = path.join(RESPONSES_DIR, path.basename(responsePath));
  fs.renameSync(responsePath, newResponsePath);
  
  console.log(`Capability-tool mapping complete. Successfully processed: ${successCount}, Errors: ${errorCount}, New tools: ${newToolsCount}, Mappings: ${mappingsCount}`);
}

/**
 * Reset the tracking of processed job IDs
 */
export function resetProcessedJobsTracking(): void {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify({ processedJobIds: [] }), 'utf8');
  console.log('Processed jobs tracking has been reset. All raw jobs will be included in the next export.');
}

/**
 * Update the capabilities cache file
 */
export async function updateCapabilitiesCache(): Promise<void> {
  try {
    const capabilities = await storage.listAICapabilities();
    fs.writeFileSync(CAPABILITIES_FILE, JSON.stringify(capabilities, null, 2), 'utf8');
    console.log(`Updated capabilities cache with ${capabilities.length} capabilities`);
  } catch (error) {
    console.error('Error updating capabilities cache:', error);
    throw error;
  }
}

/**
 * Exports AI capabilities for rationalization
 */
export async function exportCapabilitiesForRationalization(): Promise<string> {
  // Get all capabilities from the database
  const capabilities = await storage.listAICapabilities();
  
  if (capabilities.length === 0) {
    throw new Error('No AI capabilities found in the database');
  }
  
  console.log(`Found ${capabilities.length} AI capabilities to rationalize`);
  
  // Create a timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `rationalize_capabilities_${timestamp}.jsonl`;
  const filepath = path.join(REQUESTS_DIR, filename);
  
  // Format capabilities for batch processing
  const jsonlContent = formatCapabilitiesForRationalization(capabilities);
  
  // Write to file
  fs.writeFileSync(filepath, jsonlContent, 'utf8');
  
  // Create a manifest file with capability IDs for later processing
  const manifestPath = filepath.replace('.jsonl', '_manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      timestamp,
      status: 'pending',
      totalCapabilities: capabilities.length
    }, null, 2)
  );
  
  return filepath;
}

/**
 * Formats capabilities for rationalization batch processing
 */
function formatCapabilitiesForRationalization(capabilities: any[]): string {
  // Group capabilities into chunks of 10 for better processing
  const chunks = [];
  for (let i = 0; i < capabilities.length; i += 10) {
    chunks.push(capabilities.slice(i, i + 10));
  }
  
  // Process each chunk and return JSONL
  return chunks.map((chunk, batchIndex) => {
    const prompt = `Analyze this group of AI capabilities to identify duplicates or highly similar capabilities that should be consolidated.

AI Capabilities:
${chunk.map((cap: any) => `ID: ${cap.id} - Name: ${cap.name} - Category: ${cap.category} - Description: ${cap.description || 'No description'}`).join('\n')}

Your task:
1. Identify sets of capabilities that are duplicates or highly similar (80%+ similarity in function)
2. For each set, select ONE primary capability that best represents the group
3. List the other capabilities as duplicates that should be redirected to the primary one

Return your analysis in this JSON format:
{
  "capability_groups": [
    {
      "primary_capability_id": 123,
      "duplicate_capability_ids": [456, 789],
      "rationale": "Explanation of why these are duplicates and why the primary was chosen"
    }
  ]
}

If you don't find any duplicates, return an empty array for capability_groups.`;

    return JSON.stringify({
      custom_id: `batch_${batchIndex.toString().padStart(3, '0')}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing AI capabilities and identifying duplicates or similarities. You provide accurate, detailed analysis and only respond with valid JSON.'
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
  }).join('\n');
}

/**
 * Process the results from an OpenAI batch job for capability rationalization
 */
export async function processRationalizationResults(responsePath: string): Promise<void> {
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
  
  // Process each response
  let successCount = 0;
  let errorCount = 0;
  let capabilityGroupsCount = 0;
  let duplicatesFound = 0;
  
  // Collect all capability groups across all responses
  const allCapabilityGroups: {
    primary_capability_id: number;
    duplicate_capability_ids: number[];
    rationale: string;
  }[] = [];
  
  for (const response of responses) {
    try {
      // Check if the response was successful
      if (response.error === null && response.response?.status_code === 200) {
        // Parse the response content
        const content = JSON.parse(response.response.body.choices[0].message.content);
        
        // Extract capability groups
        if (content.capability_groups && Array.isArray(content.capability_groups)) {
          // Add these groups to our collection
          allCapabilityGroups.push(...content.capability_groups);
          capabilityGroupsCount += content.capability_groups.length;
          
          // Count total duplicates
          for (const group of content.capability_groups) {
            duplicatesFound += group.duplicate_capability_ids.length;
          }
        } else if (content.rationalization_result && content.rationalization_result.capability_groups) {
          // Legacy format support
          const groups = content.rationalization_result.capability_groups;
          allCapabilityGroups.push(...groups);
          capabilityGroupsCount += groups.length;
          
          // Count total duplicates
          for (const group of groups) {
            duplicatesFound += group.duplicate_capability_ids.length;
          }
        }
        
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
  
  // Now consolidate all the capabilities based on the collected groups
  if (allCapabilityGroups.length > 0) {
    try {
      await consolidateCapabilities(allCapabilityGroups);
    } catch (error) {
      console.error('Error consolidating capabilities:', error);
    }
  }
  
  // Update manifest status
  manifest.status = 'completed';
  manifest.processedAt = new Date().toISOString();
  manifest.summary = {
    total: responses.length,
    success: successCount,
    error: errorCount,
    capabilityGroups: capabilityGroupsCount,
    duplicatesFound
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Move response file to responses directory
  const newResponsePath = path.join(RESPONSES_DIR, path.basename(responsePath));
  fs.renameSync(responsePath, newResponsePath);
  
  console.log(`Capability rationalization complete. Successfully processed: ${successCount}, Errors: ${errorCount}, Capability groups: ${capabilityGroupsCount}, Duplicates found: ${duplicatesFound}`);
}

/**
 * Consolidate capabilities based on the rationalization results
 */
async function consolidateCapabilities(capabilityGroups: {
  primary_capability_id: number;
  duplicate_capability_ids: number[];
  rationale: string;
}[]): Promise<void> {
  console.log(`Starting consolidation of ${capabilityGroups.length} capability groups`);
  
  // Process each group
  for (const group of capabilityGroups) {
    const { primary_capability_id, duplicate_capability_ids, rationale } = group;
    
    if (!primary_capability_id || !duplicate_capability_ids || duplicate_capability_ids.length === 0) {
      console.log('Skipping invalid group:', group);
      continue;
    }
    
    console.log(`Processing group with primary ID ${primary_capability_id} and ${duplicate_capability_ids.length} duplicates`);
    console.log(`Rationale: ${rationale}`);
    
    try {
      // Get the primary capability
      const primaryCapability = await storage.getAICapability(primary_capability_id);
      
      if (!primaryCapability) {
        console.error(`Primary capability with ID ${primary_capability_id} not found`);
        continue;
      }
      
      // Process each duplicate capability
      for (const duplicateId of duplicate_capability_ids) {
        try {
          // Update tool mappings to point to the primary capability
          await updateToolMappings(duplicateId, primary_capability_id);
          
          // Record the duplicate in the database
          try {
            const pool = await getPool();
            await pool.query(
              'INSERT INTO duplicate_capabilities (duplicate_id, primary_id, rationale) VALUES ($1, $2, $3) ON CONFLICT (duplicate_id) DO UPDATE SET primary_id = $2, rationale = $3',
              [duplicateId, primary_capability_id, rationale]
            );
            console.log(`Recorded duplicate relationship: ${duplicateId} -> ${primary_capability_id}`);
          } catch (dbError) {
            console.error('Error recording duplicate capability:', dbError);
          }
          
          // Log the action instead of actually deleting
          console.log(`Marked capability with ID ${duplicateId} as duplicate (primary: ${primary_capability_id})`);
          
          // In a real implementation, you might do:
          // await storage.deleteAICapability(duplicateId);
          // or
          // await storage.archiveAICapability(duplicateId, primary_capability_id);
        } catch (duplicateError) {
          console.error(`Error processing duplicate capability ${duplicateId}:`, duplicateError);
        }
      }
      
      // Log the successful consolidation
      console.log(`Successfully consolidated group with primary ID ${primary_capability_id}`);
    } catch (groupError) {
      console.error(`Error processing capability group with primary ID ${primary_capability_id}:`, groupError);
    }
  }
  
  console.log('Capability consolidation complete');
}

/**
 * Get a database pool for direct queries
 */
async function getPool() {
  const { Pool } = await import('pg');
  return new Pool({
    connectionString: process.env.DATABASE_URL
  });
}

/**
 * Update tool mappings to point from a duplicate capability to the primary capability
 */
async function updateToolMappings(fromCapabilityId: number, toCapabilityId: number): Promise<void> {
  try {
    // Get all tools mapped to the duplicate capability
    const tools = await storage.getToolsForCapability(fromCapabilityId);
    
    if (tools.length === 0) {
      console.log(`No tools mapped to capability ${fromCapabilityId}`);
      return;
    }
    
    console.log(`Found ${tools.length} tools mapped to capability ${fromCapabilityId}`);
    
    // For each tool, create a mapping to the primary capability if it doesn't exist
    for (const tool of tools) {
      try {
        // Create mapping to primary capability
        await storage.mapCapabilityToTool(toCapabilityId, tool.tool_id);
        console.log(`Mapped tool ${tool.tool_name} (ID: ${tool.tool_id}) to primary capability ${toCapabilityId}`);
        
        // Remove mapping to duplicate capability
        await storage.unmapCapabilityFromTool(fromCapabilityId, tool.tool_id);
        console.log(`Unmapped tool ${tool.tool_name} (ID: ${tool.tool_id}) from duplicate capability ${fromCapabilityId}`);
      } catch (toolError) {
        console.error(`Error updating mapping for tool ${tool.tool_id}:`, toolError);
      }
    }
    
    console.log(`Successfully updated all tool mappings from capability ${fromCapabilityId} to ${toCapabilityId}`);
  } catch (error) {
    console.error(`Error updating tool mappings from capability ${fromCapabilityId} to ${toCapabilityId}:`, error);
    throw error;
  }
}

/**
 * Exports AI capabilities for job role matching batch processing
 */
export async function exportCapabilitiesForJobRoleMatching(forceIncludeAll: boolean = false): Promise<string> {
  // Get all capabilities from the database
  const capabilities = await storage.listAICapabilities();
  
  if (capabilities.length === 0) {
    throw new Error('No AI capabilities found in the database');
  }

  // Get all job roles for reference
  const jobRoles = await storage.listJobRoles();
  
  if (jobRoles.length === 0) {
    throw new Error('No job roles found in the database');
  }

  console.log(`Found ${capabilities.length} AI capabilities and ${jobRoles.length} job roles for matching`);
  
  // Create a timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `capability_job_roles_${timestamp}.jsonl`;
  const filepath = path.join(REQUESTS_DIR, filename);
  
  // Format capabilities for batch processing
  const jsonlContent = capabilities
    .map(capability => formatCapabilityForJobRoleMatching(capability, jobRoles))
    .join('\n');
  
  // Write to file
  fs.writeFileSync(filepath, jsonlContent, 'utf8');
  
  // Create a manifest file with capability IDs for later processing
  const manifestPath = filepath.replace('.jsonl', '_manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      capabilityIds: capabilities.map(cap => cap.id),
      timestamp,
      status: 'pending',
      type: 'job_role_matching'
    }, null, 2)
  );
  
  return filepath;
}

/**
 * Formats a capability for job role matching batch processing
 */
function formatCapabilityForJobRoleMatching(capability: AICapability, jobRoles: any[]): string {
  const prompt = `Analyze the following AI capability and determine which job roles would benefit from or use this capability. 

AI Capability:
- Name: ${capability.name}
- Category: ${capability.category}
- Description: ${capability.description || 'No description provided'}

Available Job Roles:
${jobRoles.map(role => `ID: ${role.id} - Title: ${role.title} - Department: ${role.departmentName || 'Unknown'}`).join('\n')}

Your task:
1. Identify which job roles would directly benefit from or use this AI capability
2. For each matching job role, provide an impact score from 1-100 (how much this capability would benefit that role)
3. Only include roles where the impact score would be 30 or higher

Return your analysis in this JSON format:
{
  "capability_id": ${capability.id},
  "job_role_matches": [
    {
      "job_role_id": 123,
      "impact_score": 85,
      "rationale": "Brief explanation of why this role would benefit from this capability"
    }
  ]
}

If no job roles have significant impact (30+), return an empty array for job_role_matches.`;

  // Format for OpenAI batch processing
  return JSON.stringify({
    custom_id: `cap_role_${capability.id.toString().padStart(5, '0')}`,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing AI capabilities and matching them to job roles. You provide accurate assessments of how different roles would benefit from specific AI capabilities. You only respond with valid JSON.'
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
 * Process the results from an OpenAI batch job for capability-job role matching
 */
export async function processCapabilityJobRoleResults(responsePath: string): Promise<void> {
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
  
  // Process each response
  let successCount = 0;
  let errorCount = 0;
  let mappingsCount = 0;
  
  // Create a map of custom_id to capability ID for easy lookup
  const customIdToCapabilityId = new Map();
  manifest.capabilityIds.forEach((capabilityId: number) => {
    const customId = `cap_role_${capabilityId.toString().padStart(5, '0')}`;
    customIdToCapabilityId.set(customId, capabilityId);
  });
  
  for (const response of responses) {
    try {
      // Check if the response was successful
      if (response.error === null && response.response?.status_code === 200) {
        // Extract the custom_id to determine which capability this response belongs to
        const { custom_id } = response;
        const capabilityId = customIdToCapabilityId.get(custom_id);
        
        if (!capabilityId) {
          console.error(`Could not determine capability ID for custom_id: ${custom_id}`);
          errorCount++;
          continue;
        }
        
        // Parse the response content
        const content = JSON.parse(response.response.body.choices[0].message.content);
        
        // Verify capability ID in the response matches expected ID
        if (content.capability_id !== capabilityId) {
          console.warn(`Capability ID mismatch: expected ${capabilityId}, got ${content.capability_id}`);
        }
        
        // Process job role matches for this capability
        if (content.job_role_matches && Array.isArray(content.job_role_matches)) {
          for (const match of content.job_role_matches) {
            try {
              // Create capability-job role mapping
              await storage.mapCapabilityToJobRole(capabilityId, match.job_role_id);
              
              // Store the impact score in capability_role_impacts table
              // Note: You'll need to implement this method in storage
              // await storage.setCapabilityRoleImpact(capabilityId, match.job_role_id, match.impact_score);
              
              console.log(`Mapped capability ${capabilityId} to job role ${match.job_role_id} with impact score ${match.impact_score}`);
              mappingsCount++;
            } catch (mappingError) {
              console.error(`Error mapping capability ${capabilityId} to job role ${match.job_role_id}:`, mappingError);
            }
          }
        }
        
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
  
  // Update manifest status
  manifest.status = 'completed';
  manifest.processedAt = new Date().toISOString();
  manifest.summary = {
    total: responses.length,
    success: successCount,
    error: errorCount,
    mappings: mappingsCount
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Move response file to responses directory
  const newResponsePath = path.join(RESPONSES_DIR, path.basename(responsePath));
  fs.renameSync(responsePath, newResponsePath);
  
  console.log(`Capability-job role matching complete. Successfully processed: ${successCount}, Errors: ${errorCount}, Mappings: ${mappingsCount}`);
}

/**
 * Command-line interface
 */
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts scrape-jobs');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts export-jobs [--force]');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file_path>');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts export-capabilities');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts process-tools <response_file_path>');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts export-job-roles');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file_path>');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts update-cache');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts list');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts reset-tracking');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts export-rationalize');
    console.log('  npx tsx server/batch-processing/batchProcessor.ts process-rationalize <response_file_path>');
    process.exit(1);
  }
  
  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'scrape-jobs':
        await runJobScraper();
        break;
        
      case 'export-jobs':
        const forceIncludeAll = args.includes('--force');
        const filePath = await exportJobsForBatch(forceIncludeAll);
        console.log('Exported job descriptions to:', filePath);
        console.log('Manifest file created at:', filePath.replace('.jsonl', '_manifest.json'));
        console.log('\nNext steps:');
        console.log('1. Submit this JSONL file to OpenAI for batch processing');
        console.log('2. Save the response file');
        console.log('3. Run: npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file_path>');
        break;
      
      case 'export-capabilities':
        const forceIncludeAllCaps = args.includes('--force');
        const capFilePath = await exportCapabilitiesForBatch(forceIncludeAllCaps);
        console.log('Exported AI capabilities to:', capFilePath);
        console.log('Manifest file created at:', capFilePath.replace('.jsonl', '_manifest.json'));
        console.log('\nNext steps:');
        console.log('1. Submit this JSONL file to OpenAI for batch processing');
        console.log('2. Save the response file');
        console.log('3. Run: npx tsx server/batch-processing/batchProcessor.ts process-tools <response_file_path>');
        break;
      
      case 'reset-tracking':
        resetProcessedJobsTracking();
        break;
        
      case 'process-jobs':
        if (args.length < 2) {
          console.error('Error: Missing response file path');
          console.log('Usage: npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file_path>');
          process.exit(1);
        }
        
        const responsePath = args[1];
        await processJobBatchResults(responsePath);
        console.log('Processed batch results successfully');
        console.log('Job descriptions updated in database');
        break;
        
      case 'process-tools':
        if (args.length < 2) {
          console.error('Error: Missing response file path');
          console.log('Usage: npx tsx server/batch-processing/batchProcessor.ts process-tools <response_file_path>');
          process.exit(1);
        }
        
        const toolsResponsePath = args[1];
        await processCapabilityToolsResults(toolsResponsePath);
        console.log('Processed capability tools results successfully');
        console.log('AI tools and mappings updated in database');
        break;
        
      case 'update-cache':
        await updateCapabilitiesCache();
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
            let type = 'Unknown';
            
            if (fs.existsSync(manifestPath)) {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
              status = manifest.status;
              count = manifest.jobIds?.length || manifest.capabilityIds?.length || 0;
              type = manifest.jobIds ? 'Jobs' : 'Capabilities';
            }
            
            console.log(`- ${file} (${count} ${type}, Status: ${status})`);
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
        
      case 'export-rationalize':
        const rationalizePath = await exportCapabilitiesForRationalization();
        console.log('Exported capabilities for rationalization to:', rationalizePath);
        console.log('Manifest file created at:', rationalizePath.replace('.jsonl', '_manifest.json'));
        console.log('\nNext steps:');
        console.log('1. Submit this JSONL file to OpenAI for batch processing');
        console.log('2. Save the response file');
        console.log('3. Run: npx tsx server/batch-processing/batchProcessor.ts process-rationalize <response_file_path>');
        break;
        
      case 'process-rationalize':
        if (args.length < 2) {
          console.error('Error: Missing response file path');
          console.log('Usage: npx tsx server/batch-processing/batchProcessor.ts process-rationalize <response_file_path>');
          process.exit(1);
        }
        
        const rationalizeResponsePath = args[1];
        await processRationalizationResults(rationalizeResponsePath);
        console.log('Processed rationalization results successfully');
        break;
        
      case 'export-job-roles':
        const forceIncludeAllJobRoles = args.includes('--force');
        const jobRolesFilePath = await exportCapabilitiesForJobRoleMatching(forceIncludeAllJobRoles);
        console.log('Exported job roles for capabilities to:', jobRolesFilePath);
        console.log('Manifest file created at:', jobRolesFilePath.replace('.jsonl', '_manifest.json'));
        console.log('\nNext steps:');
        console.log('1. Submit this JSONL file to OpenAI for batch processing');
        console.log('2. Save the response file');
        console.log('3. Run: npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file_path>');
        break;
        
      case 'process-job-roles':
        if (args.length < 2) {
          console.error('Error: Missing response file path');
          console.log('Usage: npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file_path>');
          process.exit(1);
        }
        
        const jobRolesResponsePath = args[1];
        await processCapabilityJobRoleResults(jobRolesResponsePath);
        console.log('Processed job role matches successfully');
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage:');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts scrape-jobs');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts export-jobs [--force]');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file_path>');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts export-capabilities');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts process-tools <response_file_path>');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts export-job-roles');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file_path>');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts update-cache');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts list');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts reset-tracking');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts export-rationalize');
        console.log('  npx tsx server/batch-processing/batchProcessor.ts process-rationalize <response_file_path>');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 