import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

interface JobEntry {
  company_name: string;
  job_title: string;
  location: string;
  job_description: string;
  source_file: string;
}

interface Capability {
  id: number;
  name: string;
  description: string;
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

const SYSTEM_PROMPT = `You are an expert HR analyst and AI product specialist. Your task is twofold:
1. Extract the distinct primary job responsibilities listed in the provided job description text. Ignore general company descriptions, benefits, or qualification requirements unless they explicitly state a responsibility.
2. For EACH extracted responsibility, analyze it and attempt to match it to the MOST relevant capability from the provided list of 'Known AI Capabilities'. Use the capability 'id' for mapping.
3. If a responsibility clearly requires a capability NOT present or adequately described in the known list, suggest a new capability by providing a 'suggested_new_capability' object containing a concise 'name' and 'description'. If an existing capability is a good match, this field should be null.
4. Respond ONLY in JSON format. The top-level key must be 'analysis_result'. Its value should be an object containing a single key 'extracted_responsibilities', which is an array of objects. Each object in the array represents one responsibility and must have the keys: 'responsibility_text' (string), 'matched_capability_id' (integer or null), and 'suggested_new_capability' (object with 'name' and 'description', or null).`;

function printUsage() {
  console.log('Usage: tsx generateBatchInput.ts <capabilities_file.json> <jobs_file.jsonl> [output_file.jsonl]');
  console.log('Example: tsx generateBatchInput.ts ../SDR_capabilities_v1.json ../SDR_source_jobs.jsonl batch_input.jsonl');
  process.exit(1);
}

function validateFileExists(filePath: string, description: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${description} file not found at ${filePath}`);
    process.exit(1);
  }
}

async function processFiles(capabilitiesFile: string, jobsFile: string, outputFile: string) {
  try {
    // Validate input files exist
    validateFileExists(capabilitiesFile, 'Capabilities');
    validateFileExists(jobsFile, 'Jobs');

    // Read capabilities file
    const capabilitiesContent = fs.readFileSync(capabilitiesFile, 'utf-8');
    const capabilities: Capability[] = JSON.parse(capabilitiesContent);

    // Create readline interface for JSONL file
    const fileStream = fs.createReadStream(jobsFile);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    // Create output file
    const outputStream = fs.createWriteStream(outputFile);

    let jobCount = 0;

    // Process each job entry
    for await (const line of rl) {
      const job: JobEntry = JSON.parse(line);
      jobCount++;

      const request: BatchRequest = {
        custom_id: `job_req_${jobCount.toString().padStart(3, '0')}`,
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
              content: `Job Description Text:
---
${job.job_description}
---

Known AI Capabilities:
---
${JSON.stringify(capabilities, null, 2)}
---`
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
    console.log(`Successfully processed ${jobCount} jobs and created ${outputFile}`);

  } catch (error) {
    console.error('Error processing files:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  printUsage();
}

const capabilitiesFile = path.resolve(args[0]);
const jobsFile = path.resolve(args[1]);
const outputFile = args[2] ? path.resolve(args[2]) : path.resolve('batch_input.jsonl');

// Validate file extensions
if (!capabilitiesFile.endsWith('.json')) {
  console.error('Error: Capabilities file must be a JSON file');
  printUsage();
}

if (!jobsFile.endsWith('.jsonl')) {
  console.error('Error: Jobs file must be a JSONL file');
  printUsage();
}

if (!outputFile.endsWith('.jsonl')) {
  console.error('Error: Output file must be a JSONL file');
  printUsage();
}

processFiles(capabilitiesFile, jobsFile, outputFile); 