import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

interface Capability {
  id: number;
  name: string;
  category: string;
  description: string;
  implementation_effort: string;
  business_value: string;
}

interface BatchRequest {
  custom_id: string;
  method: string;
  url: string;
  body: {
    model: string;
    messages: {
      role: string;
      content: string;
    }[];
    response_format: { type: string };
    temperature: number;
  };
}

const SYSTEM_PROMPT = `You are an expert in AI tools and technologies. Your task is to analyze the given AI capability and suggest specific AI tools that can implement this capability.

For each capability, provide a list of AI tools that can be used to implement it. Each tool should include:
1. A specific name (tool_name)
2. A detailed description of how it implements the capability
3. The tool's website URL
4. The license type (e.g., Commercial, Open Source, Freemium)
5. The primary category it belongs to
6. Relevant tags as an array

Important guidelines:
- Each tool must be a real, existing tool (not theoretical or generic)
- Include only tools that specifically address the capability
- Provide accurate website URLs
- Be specific about license types
- Tags should be relevant keywords for searching and categorizing the tool

Respond in JSON format with an array of tools, each containing the fields: tool_name, description, website_url, license_type, primary_category, and tags.`;

async function main() {
  try {
    // Database connection
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'airoadmap',
      password: 'postgres',
      port: 5432,
    });

    // Get all capabilities
    const result = await pool.query('SELECT * FROM ai_capabilities ORDER BY id');
    const capabilities: Capability[] = result.rows;

    // Create output directory if it doesn't exist
    const outputDir = path.resolve('server/batch-processing');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create output file
    const outputPath = path.join(outputDir, 'tool_batch_input.jsonl');
    const outputStream = fs.createWriteStream(outputPath);

    // Process each capability
    for (const capability of capabilities) {
      const request: BatchRequest = {
        custom_id: `cap_${capability.id.toString().padStart(3, '0')}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: `Analyze this AI capability and suggest specific AI tools that can implement it:

Name: ${capability.name}
Category: ${capability.category}
Description: ${capability.description}

Please provide a list of real, existing AI tools that can implement this capability. Each tool should include all required fields (tool_name, description, website_url, license_type, primary_category, tags).`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        }
      };

      // Write to output file
      outputStream.write(JSON.stringify(request) + '\n');
    }

    outputStream.end();
    console.log(`Successfully processed ${capabilities.length} capabilities and created ${outputPath}`);

    await pool.end();
  } catch (error) {
    console.error('Error generating batch input:', error);
    process.exit(1);
  }
}

// Run the script
main(); 