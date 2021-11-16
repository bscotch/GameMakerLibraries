/**
 * @file Compile all library documentation into human-friendly files.
 */

const { compileReadme } = require('./compileReadme.js');
const { compileIssueTemplate } = require('./compileIssueTemplate.js');
const { loadAndUpdateLibraries } = require('./libraryManager.js');

/**
 * @typedef {import('./libraries-schema.js').GameMakerLibraryData} Libraries
 * @typedef {import('./libraries-schema.json')} Schema
 */

async function main() {
  const libraries = await loadAndUpdateLibraries();
  compileReadme(libraries);
  compileIssueTemplate();
}

main();
