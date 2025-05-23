import fs from 'fs';
import path from 'path';
import { storage } from '../storage';

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

/**
 * Process job responsibility batch output
 * 
 * This script processes the output from OpenAI batch processing for job responsibilities.
 * It reads the batch output file, extracts responsibilities, matches them to capabilities,
 * and creates new capabilities when needed.
 * 
 * Usage:
 * npx tsx server/batch-processing/processBatchOutput.ts <batch_output_file>
 */
async function main() {
  try {
    // Check for command line argument
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error('Error: Missing batch output file path');
      console.log('Usage: npx tsx server/batch-processing/processBatchOutput.ts <batch_output_file>');
      process.exit(1);
    }

    const outputPath = path.resolve(args[0]);
    if (!fs.existsSync(outputPath)) {
      console.error(`Error: Batch output file not found at ${outputPath}`);
      process.exit(1);
    }

    console.log(`Reading batch output from: ${outputPath}`);
    
    const fileContent = fs.readFileSync(outputPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    const jobResponsibilityMappings: JobResponsibilityMapping[] = [];
    const newCapabilitiesMap = new Map<string, NewCapability>();
    let newCapabilitiesCount = 0;

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

        // Process new capabilities
        for (const responsibility of analysisResult.extracted_responsibilities) {
          if (responsibility.suggested_new_capability) {
            const { name, description } = responsibility.suggested_new_capability;
            if (!newCapabilitiesMap.has(name)) {
              newCapabilitiesMap.set(name, { name, description });
              
              // Create the new capability in the database
              try {
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
                newCapabilitiesCount++;
              } catch (capError) {
                console.error(`Error creating capability '${name}':`, capError);
              }
            }
          }
        }
      }
    }

    // Store the job-responsibility mappings in a JSON file for reference
    const mappingsPath = path.resolve('server/batch-processing/job_responsibility_mappings.json');
    fs.writeFileSync(mappingsPath, JSON.stringify(jobResponsibilityMappings, null, 2));

    console.log('Processing complete!');
    console.log(`Created ${newCapabilitiesCount} new capabilities`);
    console.log(`Processed ${jobResponsibilityMappings.length} jobs`);
    console.log(`Saved mappings to ${mappingsPath}`);

  } catch (error) {
    console.error('Error processing batch output:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === import.meta.resolve('./processBatchOutput.ts') || 
    import.meta.url.endsWith('processBatchOutput.ts')) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 