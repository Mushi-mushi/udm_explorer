// server.js - Backend server to execute Chronicle CLI commands
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Test parser endpoint
app.post('/api/test-parser', async (req, res) => {
  const { parser, sampleLog, logType = 'CUSTOM' } = req.body;

  if (!parser || !sampleLog) {
    return res.status(400).json({
      error: 'Missing required fields: parser and sampleLog'
    });
  }

  // Create temporary files
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const parserFile = path.join(tempDir, `parser_${Date.now()}.conf`);
  const logFile = path.join(tempDir, `log_${Date.now()}.txt`);

  try {
    // Write parser and log to temporary files
    console.log('\n--- Writing Files ---');
    console.log('Parser content length:', parser.length);
    console.log('Sample log content length:', sampleLog.length);
    console.log('Parser preview:', parser.substring(0, 100));
    console.log('Sample log preview:', sampleLog.substring(0, 100));

    fs.writeFileSync(parserFile, parser, 'utf8');
    fs.writeFileSync(logFile, sampleLog, 'utf8');

    // Verify files were written
    const parserContent = fs.readFileSync(parserFile, 'utf8');
    const logContent = fs.readFileSync(logFile, 'utf8');
    console.log('Parser file size after write:', parserContent.length, 'bytes');
    console.log('Log file size after write:', logContent.length, 'bytes');

    // Execute Chronicle CLI command
    const command = `secops parser run --log-type ${logType} --parser-code-file "${parserFile}" --logs-file "${logFile}"`;

    console.log('\n--- Parser Test Request ---');
    console.log('Command:', command);
    console.log('Parser file:', parserFile);
    console.log('Log file:', logFile);

    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      console.log('\n--- CLI Response ---');
      console.log('Error:', error);
      console.log('Stdout:', stdout);
      console.log('Stderr:', stderr);

      // Clean up temporary files
      try {
        fs.unlinkSync(parserFile);
        fs.unlinkSync(logFile);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      if (error) {
        // Check if error is due to CLI not being installed
        if (error.message.includes('not found') || error.message.includes('not recognized')) {
          return res.status(503).json({
            error: 'Chronicle CLI not found',
            message: 'The Google Chronicle CLI (secops) is not installed or not in PATH. Please install it first.',
            installUrl: 'https://docs.cloud.google.com/chronicle/docs/administration/cli-user-guide',
            simulatedOutput: generateSimulatedOutput(sampleLog, parser)
          });
        }

        // Check if error is due to Chronicle instance not being onboarded
        if (stderr && stderr.includes('not properly configured')) {
          console.log('\n⚠️ Chronicle instance not fully onboarded. Providing informational response.');

          const responseData = {
            success: false,
            chronicleNotConfigured: true,
            error: 'Chronicle instance not fully onboarded',
            message: 'Your Chronicle project needs to complete onboarding before parser testing is available.',
            details: 'The Chronicle CLI "parser run" command requires API access to a fully configured Chronicle instance.',
            contactInfo: 'Please reach out to your Chronicle representative to complete onboarding.',
            parserInfo: {
              parserSize: parser.length + ' bytes',
              logSize: sampleLog.length + ' bytes',
              logType: logType
            },
            rawOutput: stderr,
            note: 'Parser and log files were successfully created and validated locally. Chronicle API access is required for full parser testing.'
          };

          console.log('\n📤 Sending response to frontend:');
          console.log(JSON.stringify(responseData, null, 2));

          return res.json(responseData);
        }

        return res.status(500).json({
          error: 'Parser execution failed',
          message: stderr || error.message,
          stdout: stdout,
          stderr: stderr,
          rawOutput: stdout + '\n\n' + stderr
        });
      }

      // Parse the CLI output
      try {
        const output = parseCliOutput(stdout);
        res.json({
          success: true,
          output: output,
          rawOutput: stdout
        });
      } catch (parseError) {
        res.json({
          success: true,
          rawOutput: stdout,
          message: 'Parser executed but output could not be parsed as JSON'
        });
      }
    });

  } catch (err) {
    // Clean up on error
    try {
      if (fs.existsSync(parserFile)) fs.unlinkSync(parserFile);
      if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});

// Parse Chronicle CLI output
function parseCliOutput(output) {
  // The CLI typically outputs JSON or formatted text
  // Try to extract JSON from the output
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return output;
}

// Generate simulated output when CLI is not available
function generateSimulatedOutput(sampleLog, parser) {
  return {
    note: 'This is simulated output. Install Chronicle CLI for real results.',
    message: 'Parser would be executed with the provided configuration',
    sampleLog: sampleLog,
    parserSize: parser.length + ' characters'
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Check if Chronicle CLI is available
  exec('secops parser --help', (error, stdout, stderr) => {
    res.json({
      server: 'running',
      chronicleCli: error ? 'not available' : 'available',
      version: error ? null : 'secops CLI'
    });
  });
});

app.listen(PORT, () => {
  console.log(`Chronicle Parser Test Server running on http://localhost:${PORT}`);
  console.log('Checking Chronicle CLI availability...');

  exec('secops parser --help', (error, stdout) => {
    if (error) {
      console.log('⚠️  Chronicle CLI not found. The server will simulate results.');
      console.log('   Install from: https://docs.cloud.google.com/chronicle/docs/administration/cli-user-guide');
    } else {
      console.log('✅ Chronicle CLI detected and ready!');
      console.log('   Run "secops config set" to configure your Chronicle instance if needed.');
    }
  });
});
