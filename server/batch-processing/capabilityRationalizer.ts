import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { spawn } from 'child_process';

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
 * Exports AI capabilities for rationalization
 */
async function exportCapabilitiesForRationalization(): Promise<string> {
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
 * Formats capabilities for OpenAI batch processing to rationalize them
 */
function formatCapabilitiesForRationalization(capabilities: any[]): string {
  // Group capabilities in batches of 50 for better processing
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < capabilities.length; i += batchSize) {
    const batch = capabilities.slice(i, i + batchSize);
    batches.push(batch);
  }
  
  // Create a prompt for each batch
  return batches.map((batch, batchIndex) => {
    const prompt = `Analyze this list of AI capabilities and identify duplicates or highly similar capabilities that could be consolidated. For each group of similar capabilities, select one primary capability and list the others as duplicates that should be merged into it.

Capabilities List:
${batch.map(cap => `ID: ${cap.id} - Name: ${cap.name} - Category: ${cap.category} - Description: ${cap.description || 'No description'}`).join('\n')}

Return your analysis in this JSON format:
{
  "rationalization_result": {
    "capability_groups": [
      {
        "primary_capability_id": 123,
        "duplicate_capability_ids": [456, 789],
        "rationale": "These capabilities all describe similar functionality around X. The primary was chosen because it has the most comprehensive description."
      },
      {
        "primary_capability_id": 234,
        "duplicate_capability_ids": [567],
        "rationale": "These capabilities both address Y, but the primary has a clearer description and broader applicability."
      }
    ],
    "standalone_capability_ids": [345, 678]
  }
}

Note: Only group capabilities that are truly duplicates or so similar that they should be merged. If a capability is unique, include its ID in the standalone_capability_ids array.`;

    // Format for OpenAI batch processing
    return JSON.stringify({
      custom_id: `batch_${batchIndex.toString().padStart(3, '0')}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in AI capabilities analysis. Your task is to identify duplicate or highly similar AI capabilities that could be consolidated. Provide accurate, detailed analysis and only respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }
    });
  }).join('\n');
}

/**
 * Process the results from an OpenAI batch job for capability rationalization
 */
async function processRationalizationResults(responsePath: string): Promise<void> {
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
  
  // Track all capability groups for consolidation
  const allCapabilityGroups: {
    primary_capability_id: number;
    duplicate_capability_ids: number[];
    rationale: string;
  }[] = [];
  
  // Process each batch response
  for (const response of responses) {
    try {
      // Check if the response was successful
      if (response.error === null && response.response.status_code === 200) {
        const content = response.response.body.choices[0].message.content;
        const result = JSON.parse(content);
        
        if (result.rationalization_result && result.rationalization_result.capability_groups) {
          // Add the capability groups to our consolidated list
          allCapabilityGroups.push(...result.rationalization_result.capability_groups);
          successCount++;
        } else {
          console.error(`Invalid response format for batch ${response.custom_id}`);
          errorCount++;
        }
      } else {
        console.error(`Error in response for batch ${response.custom_id}:`, response.error || 'Unknown error');
        errorCount++;
      }
    } catch (responseError) {
      console.error('Error processing batch response:', responseError);
      errorCount++;
    }
  }
  
  // Consolidate capabilities based on the results
  if (allCapabilityGroups.length > 0) {
    await consolidateCapabilities(allCapabilityGroups);
  }
  
  // Update manifest status
  manifest.status = 'completed';
  manifest.processedAt = new Date().toISOString();
  manifest.summary = {
    total: responses.length,
    success: successCount,
    error: errorCount,
    groupsIdentified: allCapabilityGroups.length
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Move response file to responses directory
  const newResponsePath = path.join(RESPONSES_DIR, path.basename(responsePath));
  fs.renameSync(responsePath, newResponsePath);
  
  console.log(`Rationalization processing complete. Successfully processed: ${successCount}, Errors: ${errorCount}, Groups identified: ${allCapabilityGroups.length}`);
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
          
          // Delete the duplicate capability
          // Note: This would typically be a soft delete or archive in a production system
          // For this example, we'll just log the action
          console.log(`Would delete capability with ID ${duplicateId} (merged into ${primary_capability_id})`);
          
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
 * Command-line interface
 */
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx server/batch-processing/capabilityRationalizer.ts export');
    console.log('  npx tsx server/batch-processing/capabilityRationalizer.ts process <response_file_path>');
    console.log('  npx tsx server/batch-processing/capabilityRationalizer.ts list');
    process.exit(1);
  }
  
  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'export':
        const filePath = await exportCapabilitiesForRationalization();
        console.log('Exported capabilities for rationalization to:', filePath);
        console.log('Manifest file created at:', filePath.replace('.jsonl', '_manifest.json'));
        console.log('\nNext steps:');
        console.log('1. Submit this JSONL file to OpenAI for batch processing');
        console.log('2. Save the response file');
        console.log('3. Run: npx tsx server/batch-processing/capabilityRationalizer.ts process <response_file_path>');
        break;
        
      case 'process':
        if (args.length < 2) {
          console.error('Error: Missing response file path');
          console.log('Usage: npx tsx server/batch-processing/capabilityRationalizer.ts process <response_file_path>');
          process.exit(1);
        }
        
        const responsePath = args[1];
        await processRationalizationResults(responsePath);
        console.log('Processed rationalization results successfully');
        break;
        
      case 'list':
        // List all request files
        console.log('Available rationalization request files:');
        const requestFiles = fs.readdirSync(REQUESTS_DIR)
          .filter(file => file.startsWith('rationalize_capabilities_') && file.endsWith('.jsonl') && !file.includes('_manifest'));
          
        if (requestFiles.length === 0) {
          console.log('No rationalization request files found');
        } else {
          requestFiles.forEach(file => {
            const manifestPath = path.join(REQUESTS_DIR, file.replace('.jsonl', '_manifest.json'));
            let status = 'Unknown';
            let timestamp = '';
            
            if (fs.existsSync(manifestPath)) {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
              status = manifest.status;
              timestamp = manifest.timestamp;
            }
            
            console.log(`- ${file} (Created: ${timestamp}, Status: ${status})`);
          });
        }
        
        // List all response files
        console.log('\nAvailable rationalization response files:');
        const responseFiles = fs.readdirSync(RESPONSES_DIR)
          .filter(file => file.startsWith('rationalize_capabilities_') && file.endsWith('.jsonl'));
          
        if (responseFiles.length === 0) {
          console.log('No rationalization response files found');
        } else {
          responseFiles.forEach(file => {
            console.log(`- ${path.join(RESPONSES_DIR, file)}`);
          });
        }
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage:');
        console.log('  npx tsx server/batch-processing/capabilityRationalizer.ts export');
        console.log('  npx tsx server/batch-processing/capabilityRationalizer.ts process <response_file_path>');
        console.log('  npx tsx server/batch-processing/capabilityRationalizer.ts list');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (import.meta.url === import.meta.resolve('./capabilityRationalizer.ts') || 
    import.meta.url.endsWith('capabilityRationalizer.ts')) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 