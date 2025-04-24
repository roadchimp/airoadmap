import * as fs from 'fs';
import * as path from 'path';
// import { rtfToText as rtfToTextCallback } from 'rtf2text'; // Use callback version
// import rtfToTextCallback from 'rtf2text'; // Use default import for CommonJS modules
// import * as rtf2textModule from 'rtf2text'; // Import the module object
import rtf2textDefault from 'rtf2text'; // Import the default export (likely the stream function)
import { promisify } from 'util';

// --- Configuration ---
const SOURCE_DIR = "temp/SDR"; // Relative path to the directory containing RTF files
const OUTPUT_FILE = "output.jsonl"; // Relative path for the output JSONL file
// --- End Configuration ---

// Assume .string is a method attached to the default export
const rtfToText = promisify(rtf2textDefault.string);

interface JobDetails {
    company_name: string | null;
    job_title: string | null;
    location: string | null;
    job_description: string | null;
    source_file: string;
}

async function extractTextFromRtf(filePath: string): Promise<string | null> {
    console.log(`DEBUG: Reading RTF file: ${filePath}`); // Debug log
    try {
        const rtfContent = fs.readFileSync(filePath);
        console.log(`DEBUG: RTF content length: ${rtfContent.length}`); // Debug log
        // Use the promisified version
        const plainText = await rtfToText(rtfContent);
        console.log(`DEBUG: Plain text length: ${plainText ? plainText.length : 'N/A'}`); // Debug log
        return plainText;
    } catch (err) {
        // Improved error logging
        if (err instanceof Error) {
             if ('code' in err && err.code === 'ENOENT') {
                 console.error(`Error: File not found - ${filePath}`);
             } else {
                 console.error(`Error reading or parsing RTF file ${path.basename(filePath)}: ${err.message}`);
                 // console.error(err.stack); // Optional: log stack trace for more details
             }
         } else {
             console.error(`An unknown error occurred while processing ${path.basename(filePath)}:`, err);
         }
        return null;
    }
}

function extractJobDetails(plainText: string | null, filename: string): JobDetails {
    const details: JobDetails = {
        company_name: null,
        job_title: null,
        location: null,
        job_description: null,
        source_file: filename,
    };

    if (!plainText) {
        return details;
    }

    // Normalize line endings and split, then filter empty lines
    const lines = plainText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // Attempt to extract based on line order
    if (lines.length >= 1) {
        details.company_name = lines[0];
    }
    if (lines.length >= 2) {
        // Sometimes the title might have extra spaces, attempt basic cleanup
        details.job_title = lines[1].replace(/\s+/g, ' ').trim();
    }
    if (lines.length >= 3) {
        details.location = lines[2];
    }

    // Attempt to extract job description based on "About the job" marker
    const lowerPlainText = plainText.toLowerCase();
    const marker = "about the job";
    const markerIndex = lowerPlainText.indexOf(marker);

    if (markerIndex !== -1) {
         // Find the start of the line containing the marker by looking backwards for newline
        let startDescIndex = plainText.lastIndexOf('\n', markerIndex);
        startDescIndex = (startDescIndex === -1) ? 0 : startDescIndex + 1; // Handle case where marker is on first line

        let descriptionText = plainText.substring(startDescIndex).trim();

        // Remove the "About the job" line itself if it's the start
        if (descriptionText.toLowerCase().startsWith(marker)) {
            const firstNewline = descriptionText.indexOf('\n');
            if (firstNewline !== -1) {
                descriptionText = descriptionText.substring(firstNewline).trim();
            } else { // Only "About the job" was found
                descriptionText = ""; // Or set to null if preferred
            }
        }
        details.job_description = descriptionText;
    } else {
        console.warn(`Warning: 'About the job' marker not found in ${filename}. Description might be incomplete or missing.`);
        // Fallback: Assign remaining text if description marker not found
        if (lines.length > 3) {
            console.log(`DEBUG: Using fallback for description in ${filename}`); // Debug log
            details.job_description = lines.slice(3).join('\n');
        }
    }

    // Basic validation/cleanup (optional)
    if (!details.job_description && lines.length > 3 && markerIndex === -1) {
         console.log(`DEBUG: Applying final fallback for description in ${filename}`); // Debug log
         details.job_description = lines.slice(3).join('\n'); // Use rest if marker failed but text exists
    }

    return details;
}

async function main() {
    let processedCount = 0;
    let errorCount = 0;
    const workspaceRoot = process.cwd(); // Use process.cwd() in Node.js
    const sourcePath = path.join(workspaceRoot, SOURCE_DIR);
    const outputPath = path.join(workspaceRoot, OUTPUT_FILE);

    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
        console.error(`Error: Source directory '${sourcePath}' not found or is not a directory.`);
        return;
    }

    console.log(`Starting processing of RTF files in: ${sourcePath}`);
    console.log(`Output will be written to: ${outputPath}`);

    // Open the output file stream
    const outfileStream = fs.createWriteStream(outputPath, { encoding: 'utf-8', flags: 'w' });

    try {
        const filenames = fs.readdirSync(sourcePath);

        for (const filename of filenames) {
            if (filename.toLowerCase().endsWith(".rtf")) {
                const filePath = path.join(sourcePath, filename);
                console.log(`Processing: ${filename}`);
                const plainText = await extractTextFromRtf(filePath);

                if (plainText !== null) { // Check for null explicitly
                    const details = extractJobDetails(plainText, filename);

                    // Only write if we extracted something meaningful (e.g., at least a title)
                    if (details.job_title) {
                        // Convert the dictionary to a JSON string and write it as a line
                        outfileStream.write(JSON.stringify(details) + '\n');
                        processedCount++;
                    } else {
                        console.warn(`Skipping ${filename} due to missing essential details (e.g., job title).`);
                        errorCount++;
                    }
                } else {
                    // Error occurred during text extraction
                    errorCount++;
                }
            }
        }
    } catch (err) {
        console.error(`Error reading source directory ${sourcePath}:`, err);
        errorCount = -1; // Indicate a directory-level error
    } finally {
        outfileStream.end(); // Ensure the file stream is closed
    }

    console.log(`\nProcessing complete.`);
    if (errorCount !== -1) {
        console.log(`Successfully processed and wrote ${processedCount} files to ${OUTPUT_FILE}.`);
        console.log(`Encountered errors or skipped ${errorCount} files.`);
    } else {
        console.log("Processing stopped due to directory read error.");
    }
}

main().catch(err => {
    console.error("Unhandled error during script execution:", err);
    process.exit(1);
}); 