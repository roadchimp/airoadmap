import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

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

async function main() {
  try {
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'airoadmap',
      password: 'postgres',
      port: 5432,
    });

    // Get the absolute path to the batch output file relative to this script
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const batchOutputPath = path.resolve(__dirname, '..', 'batch-processing', 'responses', 'tool_batch_output.jsonl');
    console.log(`Reading tool batch output from: ${batchOutputPath}`);

    // Add check for file existence
    if (!fs.existsSync(batchOutputPath)) {
      console.error(`Error: Tool batch output file not found at ${batchOutputPath}`);
      process.exit(1);
    }

    // Read the batch output file
    const fileContent = await fs.promises.readFile(batchOutputPath, 'utf-8');
    const lines = fileContent.split('\n').filter((line: string) => line.trim());

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
    for (const output of processedOutputs) {
      for (const tool of output.tools) {
        let toolId: number | null = null; // Initialize toolId as potentially null
        try {
          // Insert new tool or do nothing if it exists (based on tool_name)
          // Database should now auto-generate tool_id via sequence
          const result = await pool.query(
            `INSERT INTO ai_tools (tool_name, description, website_url, license_type, primary_category, tags, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             ON CONFLICT (tool_name) DO UPDATE SET updated_at = NOW() 
             RETURNING tool_id`,
            [
              tool.tool_name,       // $1
              tool.description,     // $2
              tool.website_url,     // $3
              tool.license_type,    // $4
              tool.primary_category,// $5
              tool.tags             // $6
            ]
          );

          if (result.rows.length > 0) {
            // Tool was inserted
            toolId = result.rows[0].tool_id;
            console.log(`Inserted tool: ${tool.tool_name} with ID ${toolId}`);
          } else {
            // Tool already existed, need to fetch its ID
            const existingTool = await pool.query(
              'SELECT tool_id FROM ai_tools WHERE tool_name = $1',
              [tool.tool_name]
            );
            if (existingTool.rows.length > 0) {
              toolId = existingTool.rows[0].tool_id;
              console.log(`Tool already exists: ${tool.tool_name} with ID ${toolId}`);
            } else {
              // This case should ideally not happen if ON CONFLICT works correctly
              console.error(`Failed to insert or find tool: ${tool.tool_name}`);
              continue; // Skip mapping if tool ID couldn't be determined
            }
          }

          // Create capability-tool mapping if toolId was found
          if (toolId !== null) {
            await pool.query(
              `INSERT INTO capability_tool_mapping
               (capability_id, tool_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [output.capability_id, toolId]
            );
            console.log(`Mapped capability ${output.capability_id} to tool ${toolId}`);
          }

        } catch (error) {
          console.error(`Error processing tool ${tool.tool_name}:`, error);
        }
      }
    }

    // Save processed data to a JSON file for reference
    // ... existing code ...

  } catch (error) {
    console.error('Error processing batch output:', error);
  }
}

main();
