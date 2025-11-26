const path = require('path');

/**
 * Custom resolver for pnpm monorepo with Jest
 * Handles symlinks and .pnpm folder structure
 */
module.exports = (request, options) => {
  // Use the default resolver
  return options.defaultResolver(request, {
    ...options,
    // Tell Jest to resolve from both local and root node_modules
    packageFilter: (pkg) => {
      // Some packages (like react-native) need their main field resolved
      if (pkg.main) {
        return { ...pkg, main: pkg.main };
      }
      return pkg;
    },
  });
};
