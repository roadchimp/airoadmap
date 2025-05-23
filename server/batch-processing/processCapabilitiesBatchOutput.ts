import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { storage } from '../storage';

interface AITool {
  tool_name: string;
  description: string;
  website_url: string;
  license_type: string;
  primary_category: string;
  tags: string[];
}

interface BatchOutputLine {
  id: string;
  custom_id: string;
  error: any;
  response: {
    status_code: number;
    body: {
      choices: [{
        message: {
          content: string;
        };
      }];
    };
  };
}

interface ProcessedOutput {
  capability_id: number;
  tools: AITool[];
}

/**
 * Process capability tool batch output
 * 
 * This script processes the output from OpenAI batch processing for AI capability tools.
 * It reads the batch output file, extracts tool information, and updates the database.
 * 
 * Usage:
 * npx tsx server/batch-processing/processCapabilitiesBatchOutput.ts <batch_output_file>
 */
async function main() {
  try {
    // Check for command line argument
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error('Error: Missing batch output file path');
      console.log('Usage: npx tsx server/batch-processing/processCapabilitiesBatchOutput.ts <batch_output_file>');
      process.exit(1);
    }

    const outputPath = path.resolve(args[0]);
    if (!fs.existsSync(outputPath)) {
      console.error(`Error: Batch output file not found at ${outputPath}`);
      process.exit(1);
    }

    console.log(`Reading batch output from: ${outputPath}`);
    
    // Read the batch output file
    const fileContent = fs.readFileSync(outputPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    const processedOutputs: ProcessedOutput[] = [];
    const toolNameMap = new Map<string, number>(); // Map to track unique tools

    // Process each line
    for (const line of lines) {
      const batchOutput: BatchOutputLine = JSON.parse(line);

      // Extract capability ID from custom_id (format: cap_001)
      const capabilityId = parseInt(batchOutput.custom_id.split('_')[1]);

      // Check if the response was successful
      if (batchOutput.error === null && batchOutput.response.status_code === 200) {
        const content = batchOutput.response.body.choices[0].message.content;
        const toolsResult = JSON.parse(content);
        
        // Ensure we have an array of tools
        const tools = Array.isArray(toolsResult.tools) ? toolsResult.tools : [];

        processedOutputs.push({
          capability_id: capabilityId,
          tools: tools
        });
      }
    }

    // Insert tools and create mappings
    let newTools = 0;
    let newMappings = 0;
    
    for (const output of processedOutputs) {
      for (const tool of output.tools) {
        try {
          // Check if tool already exists (by name)
          let toolId: number;
          
          // Try to find existing tool in database
          const existingTools = await storage.listAITools(tool.tool_name);
          const existingTool = existingTools.find(t => t.tool_name === tool.tool_name);
          
          if (existingTool) {
            toolId = existingTool.tool_id;
          } else {
            // Create new tool
            const newTool = await storage.createAITool({
              tool_name: tool.tool_name,
              description: tool.description,
              website_url: tool.website_url,
              license_type: tool.license_type,
              primary_category: tool.primary_category,
              tags: tool.tags
            });
            
            toolId = newTool.tool_id;
            newTools++;
          }
          
          // Create capability-tool mapping
          try {
            await storage.mapCapabilityToTool(output.capability_id, toolId);
            newMappings++;
          } catch (mappingError) {
            // Likely a duplicate mapping error, which is fine
            console.log(`Note: Mapping between capability ${output.capability_id} and tool ${toolId} may already exist`);
          }
        } catch (toolError) {
          console.error(`Error processing tool ${tool.tool_name}:`, toolError);
        }
      }
    }

    // Save processed data to a JSON file for reference
    const summaryPath = path.resolve('server/batch-processing/tool_processing_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(processedOutputs, null, 2));

    console.log('Processing complete!');
    console.log(`Processed ${processedOutputs.length} capabilities`);
    console.log(`Added ${newTools} new tools and ${newMappings} new capability-tool mappings`);
    
  } catch (error) {
    console.error('Error processing batch output:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === import.meta.resolve('./processCapabilitiesBatchOutput.ts') || 
    import.meta.url.endsWith('processCapabilitiesBatchOutput.ts')) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 