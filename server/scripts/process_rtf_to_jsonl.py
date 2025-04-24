import os
import json
from striprtf.striprtf import rtf_to_text
import re

# --- Configuration ---
SOURCE_DIR = "temp/SDR"  # Relative path to the directory containing RTF files
OUTPUT_FILE = "output.jsonl"  # Relative path for the output JSONL file
# --- End Configuration ---

def extract_text_from_rtf(file_path):
    \"\"\"Reads an RTF file and returns its plain text content.\"\"\"
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            rtf_content = f.read()
        # Use striprtf to convert RTF to plain text
        plain_text = rtf_to_text(rtf_content, errors=\"ignore\")
        return plain_text
    except FileNotFoundError:
        print(f\"Error: File not found - {file_path}\")
        return None
    except Exception as e:
        print(f\"Error reading or parsing RTF file {file_path}: {e}\")
        return None

def extract_job_details(plain_text, filename):
    \"\"\"Extracts job details from the plain text content.\"\"\"
    details = {
        "company_name": None,
        "job_title": None,
        "location": None,
        "job_description": None,
        "source_file": filename
    }

    if not plain_text:
        return details

    lines = [line.strip() for line in plain_text.splitlines() if line.strip()]

    # Attempt to extract based on line order
    if len(lines) >= 1:
        details["company_name"] = lines[0]
    if len(lines) >= 2:
        # Sometimes the title might have extra spaces, attempt basic cleanup
        details["job_title"] = re.sub(r'\\s+', ' ', lines[1]).strip()
    if len(lines) >= 3:
        details["location"] = lines[2]

    # Attempt to extract job description based on "About the job" marker
    try:
        # Case-insensitive search for the marker
        marker_index = plain_text.lower().index("about the job")
        # Find the start of the line containing the marker
        start_desc_index = plain_text.rfind('\\n', 0, marker_index) + 1
        description_text = plain_text[start_desc_index:].strip()
        # Remove the "About the job" line itself if it's the start
        if description_text.lower().startswith("about the job"):
             first_newline = description_text.find('\\n')
             if first_newline != -1:
                 description_text = description_text[first_newline:].strip()
             else: # Only "About the job" was found
                 description_text = "" # Or set to None if preferred

        details["job_description"] = description_text
    except ValueError:
        print(f\"Warning: 'About the job' marker not found in {filename}. Description might be incomplete or missing.\")
        # Fallback: Assign remaining text if description marker not found
        # This might be inaccurate, consider removing if too noisy
        if len(lines) > 3:
            details["job_description"] = '\\n'.join(lines[3:])


    # Basic validation/cleanup (optional)
    if not details["job_description"] and len(lines) > 3:
         details["job_description"] = '\\n'.join(lines[3:]) # Use rest if marker failed but text exists


    return details

def main():
    processed_count = 0
    error_count = 0
    workspace_root = os.getcwd()
    source_path = os.path.join(workspace_root, SOURCE_DIR)
    output_path = os.path.join(workspace_root, OUTPUT_FILE)

    if not os.path.isdir(source_path):
        print(f\"Error: Source directory '{source_path}' not found.\")
        return

    print(f\"Starting processing of RTF files in: {source_path}\")
    print(f\"Output will be written to: {output_path}\")

    # Open the output file in append mode ('a') to avoid overwriting
    # Use 'w' if you want to overwrite the file each time the script runs
    with open(output_path, 'w', encoding='utf-8') as outfile:
        for filename in os.listdir(source_path):
            if filename.lower().endswith(".rtf"):
                file_path = os.path.join(source_path, filename)
                print(f\"Processing: {filename}\")
                plain_text = extract_text_from_rtf(file_path)

                if plain_text:
                    details = extract_job_details(plain_text, filename)
                    # Only write if we extracted something meaningful (e.g., at least a title)
                    if details.get("job_title"):
                         # Convert the dictionary to a JSON string and write it as a line
                         json.dump(details, outfile)
                         outfile.write('\\n')
                         processed_count += 1
                    else:
                        print(f\"Skipping {filename} due to missing essential details (e.g., job title).\")
                        error_count += 1
                else:
                    error_count += 1

    print(f\"\\nProcessing complete.\")
    print(f\"Successfully processed and wrote {processed_count} files to {OUTPUT_FILE}.\")
    print(f\"Encountered errors or skipped {error_count} files.\")

if __name__ == \"__main__\":
    main() 