import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

// Ensure the logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * A simple logger to write verbose debugging information to a file in the /logs directory.
 * @param filename - The name of the log file (e.g., 'openai-requests.log').
 * @param data - The data to log, which can be a string or a JSON object.
 */
export function logToFile(filename: string, data: any) {
  const logFilePath = path.join(logsDir, filename);
  const timestamp = new Date().toISOString();
  
  let logMessage = `[${timestamp}]\n`;
  
  if (typeof data === 'string') {
    logMessage += data;
  } else {
    logMessage += JSON.stringify(data, null, 2);
  }
  
  logMessage += '\n\n' + '-'.repeat(80) + '\n\n';

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error(`Failed to write to log file ${filename}:`, err);
    }
  });
} 