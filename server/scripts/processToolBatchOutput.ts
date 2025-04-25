import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

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

    // Get the absolute path to the batch output file
    const batchOutputPath = path.resolve(process.cwd(), 'batch-processing', 'responses', 'tool_batch_output.jsonl');
    
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
        try {
          // Check if tool already exists (by name)
          let toolId: number;
          const existingTool = await pool.query(
            'SELECT tool_id FROM ai_tools WHERE tool_name = $1',
            [tool.tool_name]
          );

          if (existingTool.rows.length > 0) {
            toolId = existingTool.rows[0].tool_id;
          } else {
            // Insert new tool
            const result = await pool.query(
              `INSERT INTO ai_tools 
               (tool_name, description, website_url, license_type, primary_category, tags) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               RETURNING tool_id`,
              [
                tool.tool_name,
                tool.description,
                tool.website_url,
                tool.license_type,
                tool.primary_category,
                JSON.stringify(tool.tags)
              ]
            );
            toolId = result.rows[0].tool_id;
          }

          // Create capability-tool mapping
          await pool.query(
            `INSERT INTO capability_tool_mapping 
             (capability_id, tool_id) 
             VALUES ($1, $2) 
             ON CONFLICT DO NOTHING`,
            [output.capability_id, toolId]
          );

        } catch (error) {
          console.error(`Error processing tool ${tool.tool_name}:`, error);
        }
      }
    }

    // Save processed data to a JSON file for reference
    const summaryPath = path.resolve(process.cwd(), 'batch-processing', 'tool_processing_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(processedOutputs, null, 2));

    console.log('Processing complete!');
    console.log(`Processed ${processedOutputs.length} capabilities`);
    
    await pool.end();
  } catch (error) {
    console.error('Error processing batch output:', error);
    process.exit(1);
  }
}

// Run the script
main(); 