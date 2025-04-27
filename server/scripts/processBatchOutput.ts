import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

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

    // Read the batch output file from the correct directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const outputPath = path.resolve(__dirname, '..', 'batch-processing', 'SDR_batch_output.jsonl');
    console.log(`Reading batch output from: ${outputPath}`);

    if (!fs.existsSync(outputPath)) {
      console.error(`Error: Batch output file not found at ${outputPath}`);
      process.exit(1);
    }

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

    // Get the current maximum capability ID from the correct table
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM ai_capabilities');
    let nextId = (maxIdResult.rows[0].max_id || 0) + 1;

    // Insert new capabilities into the database
    const newCapabilities = Array.from(newCapabilitiesMap.values());
    console.log(`Attempting to insert ${newCapabilities.length} new suggested capabilities starting with ID ${nextId}...`);

    // Define default values for suggested capabilities
    const DEFAULT_SUGGESTED_CATEGORY = 'Suggested';
    const DEFAULT_SUGGESTED_BUSINESS_VALUE = 'Medium'; // Or set to NULL if appropriate
    const DEFAULT_SUGGESTED_IMPLEMENTATION_EFFORT = 'Medium'; // Or set to NULL
    const DEFAULT_SUGGESTED_EASE_SCORE = 3; // Or set to NULL
    const DEFAULT_SUGGESTED_VALUE_SCORE = 3; // Or set to NULL

    for (let i = 0; i < newCapabilities.length; i++) {
      const capability = newCapabilities[i];
      const currentId = nextId + i;
      try {
        await pool.query(
          `INSERT INTO ai_capabilities
            (id, name, description, category, business_value, implementation_effort, ease_score, value_score, created_at, updated_at)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            currentId,
            capability.name,
            capability.description,
            DEFAULT_SUGGESTED_CATEGORY,
            DEFAULT_SUGGESTED_BUSINESS_VALUE,
            DEFAULT_SUGGESTED_IMPLEMENTATION_EFFORT,
            DEFAULT_SUGGESTED_EASE_SCORE,
            DEFAULT_SUGGESTED_VALUE_SCORE,
          ]
        );
        console.log(`Inserted/Skipped suggested capability: ${capability.name} with proposed ID ${currentId}`);
      } catch (insertError) {
         console.error(`Error inserting suggested capability '${capability.name}' with proposed ID ${currentId}:`, insertError);
         // Decide how to handle errors, e.g., continue or stop
      }
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