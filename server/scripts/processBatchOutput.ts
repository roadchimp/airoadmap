import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

interface Responsibility {
  responsibility_text: string;
  matched_capability_id: number | null;
  suggested_new_capability: {
    name: string;
    description: string;
  } | null;
}

interface AnalysisResult {
  extracted_responsibilities: Responsibility[];
}

interface ResponseBody {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface Response {
  status_code: number;
  body: ResponseBody;
}

interface BatchOutputLine {
  custom_id: string;
  response: Response;
  error: null | any;
}

interface JobResponsibilityMapping {
  jobId: string;
  responsibilities: Responsibility[];
}

interface NewCapability {
  name: string;
  description: string;
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

    // Read the batch output file
    const outputPath = path.resolve('server/SDR_batch_output.jsonl');
    const fileContent = fs.readFileSync(outputPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    const jobResponsibilityMappings: JobResponsibilityMapping[] = [];
    const newCapabilitiesMap = new Map<string, NewCapability>();

    // Process each line
    for (const line of lines) {
      const batchOutput: BatchOutputLine = JSON.parse(line);

      // Check if the response was successful
      if (batchOutput.error === null && batchOutput.response.status_code === 200) {
        const content = batchOutput.response.body.choices[0].message.content;
        const analysisResult: AnalysisResult = JSON.parse(content).analysis_result;

        // Store the job's responsibilities
        jobResponsibilityMappings.push({
          jobId: batchOutput.custom_id,
          responsibilities: analysisResult.extracted_responsibilities
        });

        // Collect new capabilities
        for (const responsibility of analysisResult.extracted_responsibilities) {
          if (responsibility.suggested_new_capability) {
            const { name, description } = responsibility.suggested_new_capability;
            if (!newCapabilitiesMap.has(name)) {
              newCapabilitiesMap.set(name, { name, description });
            }
          }
        }
      }
    }

    // Get the current maximum capability ID
    const maxIdResult = await pool.query('SELECT MAX(tool_id) as max_id FROM ai_tools');
    const nextId = (maxIdResult.rows[0].max_id || 0) + 1;

    // Insert new capabilities into the database
    const newCapabilities = Array.from(newCapabilitiesMap.values());
    for (let i = 0; i < newCapabilities.length; i++) {
      const capability = newCapabilities[i];
      await pool.query(
        'INSERT INTO ai_tools (tool_id, tool_name, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [nextId + i, capability.name, capability.description]
      );
    }

    // Store the job-responsibility mappings in a JSON file for reference
    const mappingsPath = path.resolve('server/job_responsibility_mappings.json');
    fs.writeFileSync(mappingsPath, JSON.stringify(jobResponsibilityMappings, null, 2));

    console.log('Processing complete!');
    console.log(`Found ${newCapabilities.length} new capabilities`);
    console.log(`Processed ${jobResponsibilityMappings.length} jobs`);

    await pool.end();
  } catch (error) {
    console.error('Error processing batch output:', error);
    process.exit(1);
  }
}

main(); 