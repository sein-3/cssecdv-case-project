// utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    // Define a secure folder for logs (outside your public folder)
    this.logDirectory = path.join(__dirname, '../logs');
    this.currentDate = this.getCurrentDate(); // e.g. "2025-04-09"
    this.logFilePath = path.join(this.logDirectory, `security-${this.currentDate}.log`);
    this.logStream = null;

    this.ensureLogDirectoryExists();
    this.createLogStream();
  }

  // Ensure the log directory exists
  ensureLogDirectoryExists() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  // Create a write stream in append mode for the current log file
  createLogStream() {
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
    this.logStream.on('error', (err) => {
      console.error('Error opening or writing to log file:', err);
    });
  }

  // Returns the current date formatted as "YYYY-MM-DD"
  getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Logs a security-related event.
   * @param {Object} options - An object with log metadata.
   * @param {string} [options.timestamp] - Timestamp in ISO format.
   * @param {string|number} [options.userID] - ID of the user triggering the event.
   * @param {string} [options.action] - Descriptive name of the event.
   * @param {string|number} [options.status] - Event status code or description.
   * @param {string} [options.route] - The route that was hit.
   * @param {string} [options.message] - Additional details or error messages.
   */
  logSecurityEvent({
    timestamp = new Date().toISOString(),
    userID = 'N/A',
    action = 'N/A',
    status = 'N/A',
    route = 'N/A',
    message = ''
  }) {
    // Check if the current date has changed compared to the log file's date
    const today = this.getCurrentDate();
    if (today !== this.currentDate) {
      // Date has changed, close the old stream and update to a new file
      this.logStream.end();
      this.currentDate = today;
      this.logFilePath = path.join(this.logDirectory, `security-${this.currentDate}.log`);
      this.createLogStream();
    }

    // Format and write the log line
    const logLine = `${timestamp} | UserID: ${userID} | Action: ${action} | Status: ${status} | Route: ${route} | Message: ${message}\n`;
    this.logStream.write(logLine);
  }
}

module.exports = Logger;
