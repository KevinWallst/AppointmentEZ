const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Package Dependencies', () => {
  // Get the package.json content
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Get the package-lock.json content
  const packageLockPath = path.join(process.cwd(), 'package-lock.json');
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));

  // List of critical dependencies that must be present
  const criticalDependencies = [
    'next',
    'react',
    'react-dom',
    'glob'
  ];

  // List of scripts that use external modules
  const scriptsWithDependencies = [
    { 
      path: 'scripts/validate-imports.js',
      dependencies: ['glob']
    },
    {
      path: 'scripts/validate-build-config.js',
      dependencies: ['fs', 'path']
    }
  ];

  test('Package version in package.json matches package-lock.json', () => {
    expect(packageJson.version).toBe(packageLock.version);
  });

  test('All dependencies in package.json are in package-lock.json', () => {
    // Combine all dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Check each dependency
    Object.keys(allDeps).forEach(dep => {
      // Skip if the dependency is a local file or URL
      if (allDeps[dep].startsWith('file:') || allDeps[dep].startsWith('http')) {
        return;
      }

      // Check if the dependency exists in package-lock.json
      const depInLock = packageLock.packages[`node_modules/${dep}`];
      expect(depInLock).toBeDefined();
      
      // For caret (^) versions, only the major version needs to match
      if (allDeps[dep].startsWith('^')) {
        const requiredMajor = parseInt(allDeps[dep].replace('^', '').split('.')[0]);
        const actualMajor = parseInt(depInLock.version.split('.')[0]);
        expect(actualMajor).toBe(requiredMajor);
      }
      // For tilde (~) versions, major and minor versions need to match
      else if (allDeps[dep].startsWith('~')) {
        const requiredParts = allDeps[dep].replace('~', '').split('.');
        const actualParts = depInLock.version.split('.');
        expect(parseInt(actualParts[0])).toBe(parseInt(requiredParts[0]));
        expect(parseInt(actualParts[1])).toBe(parseInt(requiredParts[1]));
      }
      // For exact versions, the entire version should match
      else if (!allDeps[dep].includes('*') && !allDeps[dep].includes('>') && !allDeps[dep].includes('<')) {
        expect(depInLock.version).toBe(allDeps[dep]);
      }
    });
  });

  test('Critical dependencies are present', () => {
    // Combine all dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Check each critical dependency
    criticalDependencies.forEach(dep => {
      expect(allDeps[dep]).toBeDefined();
    });
  });

  test('Scripts with dependencies have their dependencies installed', () => {
    // For each script with dependencies
    scriptsWithDependencies.forEach(script => {
      // Check if the script file exists
      const scriptPath = path.join(process.cwd(), script.path);
      expect(fs.existsSync(scriptPath)).toBe(true);

      // Get the script content
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');

      // Check each dependency
      script.dependencies.forEach(dep => {
        // If it's a Node.js built-in module, skip the check
        if (['fs', 'path', 'child_process', 'os', 'util'].includes(dep)) {
          return;
        }

        // Check if the dependency is required in the script
        const isRequired = scriptContent.includes(`require('${dep}')`) || 
                          scriptContent.includes(`require("${dep}")`) ||
                          scriptContent.includes(`from '${dep}'`) ||
                          scriptContent.includes(`from "${dep}"`);
        
        expect(isRequired).toBe(true);

        // Check if the dependency is installed
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        
        expect(allDeps[dep]).toBeDefined();
      });
    });
  });

  test('validate-imports.js handles missing glob dependency gracefully', () => {
    const validateImportsPath = path.join(process.cwd(), 'scripts/validate-imports.js');
    const validateImportsContent = fs.readFileSync(validateImportsPath, 'utf8');
    
    // Check if the script has error handling for the glob module
    const hasErrorHandling = validateImportsContent.includes('try {') && 
                            validateImportsContent.includes('catch (error)') &&
                            validateImportsContent.includes('glob');
    
    expect(hasErrorHandling).toBe(true);
  });

  test('validate-package-lock.js correctly validates package dependencies', () => {
    const validatePackageLockPath = path.join(process.cwd(), 'scripts/validate-package-lock.js');
    
    // Check if the script exists
    expect(fs.existsSync(validatePackageLockPath)).toBe(true);
    
    // Check if the script has the necessary validation logic
    const validatePackageLockContent = fs.readFileSync(validatePackageLockPath, 'utf8');
    
    // Check for version comparison logic
    expect(validatePackageLockContent).toContain('packageJson.version !== packageLock.version');
    
    // Check for dependency validation logic
    expect(validatePackageLockContent).toContain('packageDeps');
    expect(validatePackageLockContent).toContain('lockPackage.version');
  });

  test('All npm scripts in package.json are valid', () => {
    // Get all scripts
    const scripts = packageJson.scripts || {};
    
    // Check each script
    Object.entries(scripts).forEach(([name, command]) => {
      // Skip scripts that use environment variables or complex shell commands
      if (command.includes('$') || command.includes('&&') || command.includes('||')) {
        return;
      }
      
      // For simple npm commands, check if they reference valid scripts
      if (command.startsWith('npm run ')) {
        const referencedScript = command.replace('npm run ', '').trim().split(' ')[0];
        expect(scripts[referencedScript]).toBeDefined();
      }
      
      // For node scripts, check if the file exists
      if (command.startsWith('node ')) {
        const scriptFile = command.replace('node ', '').trim().split(' ')[0];
        const scriptPath = path.join(process.cwd(), scriptFile);
        expect(fs.existsSync(scriptPath)).toBe(true);
      }
    });
  });
});
