# Next.js Font Loader and Babel Configuration Conflict

This document explains the conflict between Next.js font loader and Babel configuration, and how to avoid it in this project.

## The Issue

Next.js 13+ introduced a new font system (`next/font`) that relies on the SWC compiler for optimization and processing. However, when a Babel configuration file (`babel.config.js`, `.babelrc`, etc.) is present in the project root, Next.js automatically switches from using SWC to using Babel for transpilation.

This creates a conflict because:
- The Next.js font system requires SWC
- The presence of a Babel config forces Next.js to use Babel instead of SWC

When this conflict occurs, you'll see this error:

```
Syntax error: "next/font" requires SWC although Babel is being used due to a custom babel config being present.
Read more: https://nextjs.org/docs/messages/babel-font-loader-conflict
```

## How We Solved It

In this project, we need Babel for our Jest tests, but we also need the Next.js font system for our application. To solve this conflict, we:

1. Removed standalone Babel configuration files from the project root
2. Integrated the Babel configuration directly into the Jest configuration file
3. This allows Next.js to use SWC for the application build while Jest can still use Babel for testing

The key part of our solution is in `jest.config.js`:

```javascript
module.exports = {
  // ... other Jest config
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }],
  },
  // ... other Jest config
};
```

## Validation Tools

We've added two scripts to help prevent this conflict:

1. **Build Configuration Validator**
   - Script: `scripts/validate-build-config.js`
   - NPM Command: `npm run validate-build`
   - Automatically runs before every build (`prebuild` hook)
   - Checks for potential conflicts between Next.js font imports and Babel configuration files

2. **Babel Conflict Test**
   - Script: `scripts/test-babel-conflict.js`
   - NPM Command: `npm run test:babel-conflict`
   - Simulates the conflict by temporarily creating a Babel configuration file
   - Verifies that the build fails as expected with the correct error message

## Best Practices

To avoid this conflict in the future:

1. **Never add these files to the project root**:
   - `babel.config.js`
   - `babel.config.json`
   - `.babelrc`
   - `.babelrc.js`
   - `.babelrc.json`

2. **Always keep Babel configuration inside Jest configuration**:
   - Use the inline configuration approach as shown above
   - This isolates the Babel configuration to the testing environment only

3. **Run the validation before building**:
   - `npm run validate-build`
   - This will catch any potential conflicts before they cause build failures

4. **If you need to modify Babel configuration**:
   - Update it in the `jest.config.js` file
   - Never create a separate Babel configuration file

## Further Reading

- [Next.js Documentation: Babel Font Loader Conflict](https://nextjs.org/docs/messages/babel-font-loader-conflict)
- [Next.js Font Optimization](https://nextjs.org/docs/basic-features/font-optimization)
- [Jest Configuration](https://jestjs.io/docs/configuration)
