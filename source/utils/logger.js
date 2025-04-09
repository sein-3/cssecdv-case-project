// utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        // Define a secure folder for logs (outside your public folder)
        this.logDirectory = path.join(__dirname, '../logs');
        this.logFilePath = path.join(this.logDirectory, 'security.log');
        this.logStream = null;

        this.ensureLogDirectoryExists();
        this.createLogStream();
    }

    ensureLogDirectoryExists() {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }

    createLogStream() {
        this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
        this.logStream.on('error', (err) => {
            console.error('Error opening or writing to log file:', err);
        });
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
        if (!this.logStream) {
            console.error('Log stream is not initialized.');
            return;
        }
        const logLine = `${timestamp} | UserID: ${userID} | Action: ${action} | Status: ${status} | Route: ${route} | Message: ${message}\n`;
        this.logStream.write(logLine);
    }
}

module.exports = Logger;