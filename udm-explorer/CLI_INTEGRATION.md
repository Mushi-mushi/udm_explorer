# Chronicle CLI Integration

This application integrates with Google Chronicle's CLI to test parsers in real-time.

## Architecture

The integration uses a client-server architecture:

```
React Frontend (port 3000)
    ↓ HTTP POST
Backend Server (port 3001)
    ↓ subprocess
Chronicle CLI (secops)
```

## Setup

### 1. Install Chronicle CLI

Follow Google's official documentation:
https://docs.cloud.google.com/chronicle/docs/administration/cli-user-guide

```bash
# Example installation (check docs for latest)
pip install google-cloud-chronicle-cli
```

### 2. Authenticate

```bash
# Authenticate with your Google Cloud account
secops auth login

# Set your project
secops config set-project YOUR_PROJECT_ID
```

### 3. Start the Backend Server

The backend server must be running for parser testing to work:

```bash
# From the udm-explorer directory
npm run server
```

The server will start on `http://localhost:3001` and automatically check if Chronicle CLI is installed.

### 4. Start the Frontend

In a separate terminal:

```bash
npm start
```

## How It Works

1. **Generate Parser**: Use the Parser Generator to create a Gostash parser configuration
2. **Test Parser**: Click "Test Parser" to send your parser and sample log to the backend
3. **Backend Execution**: The backend server:
   - Creates temporary files for parser.conf and sample log
   - Executes: `secops parser run --log-type CUSTOM --parser-code-file <parser> --logs-file <log>`
   - Returns the parsed UDM output
4. **View Results**: See the Chronicle CLI output displayed in the UI

## Behavior

### With Chronicle CLI Installed
- Real parser validation using Google's parser engine
- Actual UDM event output
- Error messages from Chronicle CLI if parser has issues

### Without Chronicle CLI Installed
- Server detects missing CLI on startup
- Returns simulated output for demonstration
- Warning message displayed in UI
- Encourages CLI installation for real testing

## API Endpoints

### POST /api/test-parser

Test a parser with sample log data.

**Request Body:**
```json
{
  "parser": "filter { grok { ... } }",
  "sampleLog": "{\"timestamp\": \"...\", ...}",
  "logType": "CUSTOM"
}
```

**Response (Success):**
```json
{
  "output": {
    "event": {
      "idm": {
        "read_only_udm": { ... }
      }
    }
  },
  "rawOutput": "...",
  "cliInstalled": true
}
```

**Response (CLI Not Installed):**
```json
{
  "output": { ... },
  "rawOutput": "Simulated output",
  "cliInstalled": false
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "rawOutput": "CLI stderr output"
}
```

### GET /api/health

Check backend server and CLI status.

**Response:**
```json
{
  "status": "ok",
  "cliInstalled": true,
  "message": "Chronicle CLI is available"
}
```

## Troubleshooting

### "Failed to connect to backend server"
- Make sure the backend server is running: `npm run server`
- Check that port 3001 is available
- Verify no firewall is blocking localhost connections

### "Chronicle CLI not found"
- Install the CLI: https://docs.cloud.google.com/chronicle/docs/administration/cli-user-guide
- Verify installation: `secops --version`
- Make sure CLI is in system PATH
- Restart the backend server after installation

### "Authentication required"
- Run: `secops auth login`
- Set project: `secops config set-project YOUR_PROJECT_ID`
- Check authentication status: `secops auth status`

### Parser Test Fails
- Check the raw CLI output in the error section
- Verify your parser syntax is valid Gostash format
- Ensure your sample log is valid JSON
- Check Chronicle CLI documentation for parser rules

## Development

### Backend Server (server.js)

Key features:
- Express.js server with CORS support
- Temporary file management for CLI input
- CLI detection on startup
- Graceful fallback to simulation
- Automatic file cleanup after execution

### Frontend Integration (ParserGenerator.js)

The `testParser()` function:
- Makes async POST request to backend
- Handles loading state
- Displays CLI output or errors
- Shows warnings when CLI not installed

## Security Notes

- Server runs locally only (localhost)
- Temporary files are cleaned up after each test
- No authentication required for local development
- For production deployment, add proper authentication
- Consider rate limiting for API endpoints

## Future Enhancements

- [ ] Support for multiple log types (SYSLOG, WINDOWS_DHCP, etc.)
- [ ] Batch testing with multiple sample logs
- [ ] Parser validation before testing
- [ ] CLI output streaming for long-running tests
- [ ] Save test results to file
- [ ] Parser version control and history
- [ ] Integration with Chronicle projects
