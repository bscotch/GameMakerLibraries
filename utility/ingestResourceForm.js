/**
 * @file The `submission` template serves to make providing
 * project-compatible data easier. This script is used to
 * convert form data into updated resources. It should be
 * run by a GitHub Workflow that is triggered upon Issue create/edit.
 */

const { context, getOctokit } = require('@actions/github');
const { Context } = require('@actions/github/lib/context');
const { assert, submissionLabel, readJSON } = require('./utility.js');
const { parse: parseYaml } = require('yaml');
const { librariesSchemaPath } = require('./paths.js');
const { loadAndUpdateLibraries } = require('./libraryManager.js');

/**
 * This token is added to environment variables by the GitHub Action.
 * It should be set to the value of `secrets.GITHUB_TOKEN`, which is
 * a temporary token created by GitHub to run the workflow.
 */
const token = /** @type {string} */ (process.env.token);
const github = getOctokit(token);

/**
 * @typedef {import('./libraries-schema.js').GameMakerLibraryData} Libraries
 * @typedef {import('./libraries-schema.json')} Schema
 * @typedef {Schema['definitions']['library']['properties']} LibrarySchema
 * @typedef {Schema['definitions']['author']['properties']} AuthorSchema
 */


/**
 * @param {string} body
 */
async function parseForm(body) {
  // Grab the fields associated with authors and libraries
  // so we can use them to determine which type a codeblock is

  const yamlPattern = /```yaml\r?\n(.*?)\r?\n```/;
  const codeBlocks = /** @type {null|string[]} */ (
    body.match(new RegExp(yamlPattern, 'g'))
  );
  assert(codeBlocks?.length, 'No code blocks found');

  const asObjects = codeBlocks.map(
    (codeBlock) =>
      /** @type {Partial<AuthorSchema>|Partial<LibrarySchema>}*/
      (parseYaml(codeBlock))
  );

  const authorUpdates = asObjects.filter(isAuthor);
  const libraryUpdates = asObjects.filter(isLibrary);

  // Load the current libraries for matching and patching
  const currentLibrary = await loadAndUpdateLibraries();
  const currentLibraries = currentLibrary.libraries;
  const currentAuthors = currentLibrary.authors;

  // Clean up the authors by looking them up, normalizing etc.
  for (const author of authorUpdates) {
    for(const )
  }
}

async function ingestResourceForm() {
  const { action, eventName, payload } = context;
  assert(eventName === 'issues', `Incorrect event: ${eventName}`);
  assert(['opened', 'edited'].includes(action), `Incorrect action: ${action}`);
  assert(payload.issue, 'Issue field not found');

  const { body, number } = payload.issue;
  assert(body, 'No comment body found');

  const { data } = await github.rest.issues.listLabelsForRepo(
    this.commonRepoFields
  );
  assert(
    data.some((label) => label.name == submissionLabel),
    `Submission label "${submissionLabel}" not found`
  );

  // Finally we're past all the housekeeping checks. Now to attempt to parse and use the DATA.
}

ingestResourceForm().catch(async (err) => {
  // Attempt to log the issue to the comment thread
  const number = context.payload.issue?.number;
  if (number) {
    await github.rest.issues.createComment({
      body: `🤖 Something went wrong!\n\n${err.message}`,
      issue_number: number,
      repo: context.repo.repo,
      owner: context.repo.owner,
    });
  }
});
