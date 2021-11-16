const fs = require('fs');
const { undent } = require('@bscotch/utility');
const { librariesSchemaPath, issueTemplatePath } = require('./paths.js');
const { readJSON, submissionLabel } = require('./utility.js');

/**
 * @typedef {import('./libraries-schema.js').GameMakerLibraryData} Libraries
 * @typedef {import('./libraries-schema.json')} Schema
 * @typedef {Schema['definitions']['library']['properties']} LibrarySchema
 * @typedef {Schema['definitions']['author']['properties']} AuthorSchema
 */

function createSubmissionForm() {
  /** @type {Schema} */
  const schema = readJSON(librariesSchemaPath);
  const tags = schema.definitions.tag.enum;
  const compatibility =
    schema.definitions.library.properties.compatibility.items.enum.map(
      // One of the versions is just an 8, which YAML will interpret as a number
      // unless we wrap in quotes.
      (v) => `"${v}"`
    );

  // Even though we want to write custom instructions for each
  // field, *having* those fields is useful since we can assert
  // that we have an instruction for each field. That way if the
  // schema changes any future compile will change until the change
  // is reflected here.
  /** @type {{[Field in keyof Omit<LibrarySchema,'authors'>]:{comment:string, importance:'required'|'recommended'|'optional', default?: string}}} */
  const fieldInstructions = {
    title: {
      comment: 'The name or title of the resource.',
      importance: 'required',
    },
    description: {
      comment: 'A short description of the resource. What is it for?',
      importance: 'recommended',
    },
    url: {
      comment:
        'The URL of the resource. This could be a homepage, a marketplace link, a public repository, etc.',
      importance: 'required',
    },
    compatibility: {
      comment:
        'Which GameMaker versions is this resource useful for? Delete any incompatible versions.',
      importance: 'recommended',
      default: `[${compatibility.join(', ')}]`,
    },
    tags: {
      comment:
        "Tags are used to group, filter, and sort resources by useful features. Delete any tags that don't apply to this resource. If you need additional tags, go ahead and provide them (use kebab case) and they'll be reviewed by project maintainers.",
      importance: 'recommended',
      default: `\n  - ${tags.join('\n  - ')}`,
    },
    githubUrl: {
      comment:
        'The URL of the GitHub repository corresponding to this project, if you there is one.',
      importance: 'optional',
    },
  };

  const instructions = Object.keys(fieldInstructions)
    .map((field) => {
      const {
        comment,
        importance,
        default: defaultValue,
      } = fieldInstructions[field];
      return `# [${importance}] ${comment}\n${field}: ${defaultValue || ''}`;
    })
    .join('\n\n');

  return instructions;
}

function createAuthorForm() {
  /** @type {Schema} */
  const schema = readJSON(librariesSchemaPath);

  /** @type {{[Field in keyof AuthorSchema]:{comment:string, importance:'required'|'recommended'|'optional', default?: string}}} */
  const fieldInstructions = {
    name: {
      comment: 'The name or handle the author goes by.',
      importance: 'required',
    },
    website: {
      comment: 'The website this author is most closely affiliated with.',
      importance: 'recommended',
    },
    discord: {
      comment: 'Discord username (make sure you include the part after the #).',
      importance: 'optional',
    },
    twitter: {
      comment: 'Twitter handle.',
      importance: 'optional',
    },
    github: {
      comment: 'GitHub handle.',
      importance: 'optional',
    },
  };

  const instructions = Object.keys(fieldInstructions)
    .map((field) => {
      const {
        comment,
        importance,
        default: defaultValue,
      } = fieldInstructions[field];
      return `# [${importance}] ${comment}\n${field}: ${defaultValue || ''}`;
    })
    .join('\n\n');

  return instructions;
}

/**
 * Compile an issue template that users can use to submit likely-valid
 * library data for new and updated libraries.
 */
exports.compileIssueTemplate = function compileIssueTemplate() {
  const template = undent`
    ---
    name: Add a library
    about: Add or edit a library
    title: ''
    labels: '${submissionLabel}'
    assignees: ''
    ---
    
    # Add a new library, or edit an existing one!

    Fill out the YAML below to provide all of the useful information about your library.

    **⚠ YAML is case-sensitive and spacing-sensitive!**

    *(This will be processed by robots. If something goes wrong the robots will reply to tell you what happened.)*

    \`\`\`yaml
    # Fill out the details below! Take care to make sure that the spacing stays consistent.

    ${createSubmissionForm()}
    \`\`\`
    
    
    ## Author information

    Give credit where it's due! Copy-paste the following for as many authors as you want to include.

    **⚠ Copy the *entire* block, including those triple-backticks, to add more!**

    *💡 If you're already listed as an author on another resource, you only need to provide *one* unique identifier and the robot will do the rest!*

    ### Add/Update an Author!

    \`\`\`yaml
    ${createAuthorForm()}
    \`\`\`


    ### Add/Update another Author!

    *If you don't need this, you can leave it blank or delete it.*

    *If you need to add even more, just copy-paste this whole section to repeat it.*

    \`\`\`yaml
    ${createAuthorForm()}
    \`\`\`
    `;
  fs.writeFileSync(issueTemplatePath, template);
};
