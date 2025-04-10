const fs = require('fs');
const path = require('path');

const LoggerController = {
    viewLogs: (req, res) => {
        // Ensure the user is authenticated and has the adminlogger role (roleID === 4)
        if (!req.session.authorized || req.session.userRole !== 'adminlogger') {
            return res.status(403).send(`Error 403`);
        }

        // Get requested date from query parameter (expected format: YYYY-MM-DD)
        let logDate = req.query.date;
        if (!logDate) {
            logDate = new Date().toISOString().slice(0, 10); // e.g. "2025-04-09"
        }

        // Build the log file name based on date.
        const logDirectory = path.join(__dirname, '../logs');
        const logFilePath = path.join(logDirectory, `security-${logDate}.log`);

        // Read the log file if it exists, otherwise show a default message.
        let logContent = '';
        if (fs.existsSync(logFilePath)) {
            logContent = fs.readFileSync(logFilePath, 'utf8');
        } else {
            logContent = "No logs available for this date.";
        }

        // List available log dates by reading file names in the logs directory.
        let availableLogs = [];
        try {
            const files = fs.readdirSync(logDirectory);
            availableLogs = files
                .filter(file => file.startsWith("security-") && file.endsWith(".log"))
                .map(file => file.substring("security-".length, file.length - ".log".length))
                .sort((a, b) => b.localeCompare(a)); // sort descending
        } catch (err) {
            console.error("Error reading log directory:", err);
        }

        // Render the view-logs EJS view, passing the log contents, selected date, and available dates.
        return res.render('logger/viewLogs.ejs', {
            logContent: logContent,
            selectedDate: logDate,
            availableLogs: availableLogs
        });
    }
};

module.exports = LoggerController;
