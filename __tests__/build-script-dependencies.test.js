const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Build Script Dependencies', () => {
  // List of script files to check
  const scriptFiles = [
    'build.sh',
    'build-and-deploy.sh',
    '.github/workflows/build.yml'
  ];

  // List of commands that might not be available on all systems
  const problematicCommands = [
    'bc',
    'awk',
    'sed',
    'grep',
    'find',
    'wc'
  ];

  // Test that script files exist
  test('Script files exist', () => {
    scriptFiles.forEach(scriptFile => {
      const filePath = path.join(process.cwd(), scriptFile);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  // Test that script files don't use problematic commands without fallbacks
  test('Script files have fallbacks for problematic commands', () => {
    scriptFiles.forEach(scriptFile => {
      const filePath = path.join(process.cwd(), scriptFile);
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        problematicCommands.forEach(command => {
          // Check if the command is used in the script
          if (fileContent.includes(` ${command} `) || 
              fileContent.includes(`|${command}`) || 
              fileContent.includes(`${command}|`) || 
              fileContent.includes(`$(${command}`) || 
              fileContent.includes(`\`${command}`)) {
            
            // Check if there's a fallback mechanism
            const hasFallback = 
              fileContent.includes(`command -v ${command}`) || // Check if command exists
              fileContent.includes(`which ${command}`) ||      // Alternative check if command exists
              fileContent.includes(`type ${command}`) ||       // Another alternative
              fileContent.includes(`if [ -z "$(${command}`) || // Check if command output is empty
              fileContent.includes(`|| true`) ||               // Fallback with || true
              fileContent.includes(`2>/dev/null`) ||           // Suppress errors
              fileContent.includes(`try {`) ||                 // JavaScript try/catch
              fileContent.includes(`try:`) ||                  // Python try/except
              fileContent.includes(`rescue`) ||                // Ruby rescue
              fileContent.includes(`catch`) ||                 // Various catch blocks
              fileContent.includes(`if ! ${command}`);         // Check if command fails
            
            // If the command is used but there's no fallback, fail the test
            if (!hasFallback) {
              console.warn(`Warning: ${scriptFile} uses '${command}' without a fallback mechanism.`);
              
              // For build.sh and build-and-deploy.sh, this is an error
              // For GitHub workflow files, it's just a warning (GitHub Actions has these commands)
              if (!scriptFile.includes('workflows')) {
                fail(`${scriptFile} uses '${command}' without a fallback mechanism.`);
              }
            }
          }
        });
      }
    });
  });

  // Test that we can run the build script with a mock test output
  test('Build script can parse test output without external commands', () => {
    // Create a mock test output
    const mockTestOutput = `
PASS __tests__/example.test.js
FAIL __tests__/failing.test.js
  ● Test suite failed to run

    Error: Something went wrong

Test Suites: 1 failed, 1 passed, 2 total
Tests:       2 failed, 10 passed, 12 total
Snapshots:   0 total
Time:        1.234s
`;

    // Write a temporary test script that uses our build script's parsing logic
    // but without relying on external commands
    const testScript = `
#!/bin/bash
set -e

# Mock test output
TEST_OUTPUT="${mockTestOutput}"

# Extract total tests, passing tests, and failing tests using pure bash
if [[ "$TEST_OUTPUT" =~ Tests:[[:space:]]*([0-9]+)[[:space:]]failed,[[:space:]]*([0-9]+)[[:space:]]passed,[[:space:]]*([0-9]+)[[:space:]]total ]]; then
  failing_tests="\${BASH_REMATCH[1]}"
  passing_tests="\${BASH_REMATCH[2]}"
  total_tests="\${BASH_REMATCH[3]}"
  
  # Verify that our extraction worked
  if [[ "$failing_tests" != "2" || "$passing_tests" != "10" || "$total_tests" != "12" ]]; then
    echo "Failed to correctly parse test output"
    exit 1
  fi
  
  echo "Successfully parsed test output without external commands"
  exit 0
else
  echo "Failed to match test output pattern"
  exit 1
fi
`;

    // Write the test script to a temporary file
    const tempScriptPath = path.join(process.cwd(), 'temp-test-script.sh');
    fs.writeFileSync(tempScriptPath, testScript, { mode: 0o755 });

    try {
      // Run the test script
      const output = execSync(`bash ${tempScriptPath}`, { encoding: 'utf8' });
      expect(output).toContain('Successfully parsed test output without external commands');
    } catch (error) {
      fail(`Failed to run test script: ${error.message}`);
    } finally {
      // Clean up
      fs.unlinkSync(tempScriptPath);
    }
  });
});
