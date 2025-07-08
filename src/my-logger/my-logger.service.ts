import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

// Mark this class as injectable so it can be used by NestJS's dependency injection
@Injectable()
export class MyLoggerService extends ConsoleLogger {
  // Writes a log entry to a file based on the log level
  async logToFile(entry: string, level: string) {
    // Format the log entry with date, time, and message
    const formattedEntry = `${Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Africa/Douala',
    }).format(new Date())}\t${entry}\n`;

    try {
      // Ensure the logs directory exists; create it if not
      if (!fs.existsSync(path.join(__dirname, '..', '..', 'logs'))) {
        await fsPromises.mkdir(path.join(__dirname, '..', '..', 'logs'));
      }
      // Append the formatted entry to the appropriate log file (info.log, error.log, etc.)
      await fsPromises.appendFile(
        path.join(__dirname, '..', '..', 'logs', `${level}.log`),
        formattedEntry,
      );
    } catch (e) {
      // If there's an error writing to the file, print the error message to the console
      if (e instanceof Error) console.error(e.message);
    }
  }

  // Log an informational message (calls logToFile and the base logger)
  log(message: any, context?: string) {
    const entry = `${context}\t${message}`;
    this.logToFile(entry, 'info');
    super.log(message, context);
  }

  // Log an error message (calls logToFile and the base logger)
  error(message: any, stackOrContext?: string) {
    const entry = `${stackOrContext}\t${message}`;
    this.logToFile(entry, 'error');
    super.error(message, stackOrContext);
  }

  // Log a warning message (calls logToFile and the base logger)
  warn(message: any, context?: string) {
    const entry = `${context}\t${message}`;
    this.logToFile(entry, 'warn');
    super.warn(message, context);
  }

  // Log a debug message (calls logToFile and the base logger)
  debug(message: any, context?: string) {
    const entry = `${context}\t${message}`;
    this.logToFile(entry, 'debug');
    super.debug(message, context);
  }

  // Log a verbose message (calls logToFile and the base logger)
  verbose(message: any, context?: string) {
    const entry = `${context}\t${message}`;
    this.logToFile(entry, 'verbose');
    super.verbose(message, context);
  }
}
