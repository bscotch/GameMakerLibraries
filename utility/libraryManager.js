const fs = require('fs');
const { compileFromFile } = require('json-schema-to-typescript');
const prettier = require('prettier');
const { unique, readJSON, assert, trimmedObject } = require('./utility.js');
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;
const {
  librariesPath,
  librariesSchemaPath,
  librariesTypesPath,
  tagsPath,
} = require('./paths.js');

exports.loadAndUpdateValidator = loadAndUpdateValidator;
exports.loadAndUpdateLibraries = loadAndUpdateLibraries;
exports.saveLibraries = saveLibraries;
exports.isLibrary = isLibrary;
exports.isAuthor = isAuthor;

/**
 * @typedef {import('./libraries-schema.js').GameMakerLibraryData} Libraries
 * @typedef {import('./libraries-schema.js').GameMakerLibrary} Library
 * @typedef {import('./libraries-schema.js').Author} Author
 * @typedef {import('./libraries-schema.json')} Schema
 * @typedef {Schema['definitions']['library']['properties']} LibrarySchema
 * @typedef {Schema['definitions']['author']['properties']} AuthorSchema
 */

/**
 * Load tags from the tags file and convert them to an array of unique
 * strings. Rewrite the file to ensure consistency.
 */
function loadAndUpdateTags() {
  const tags = unique(
    fs
      .readFileSync(tagsPath, 'utf8')
      .trim()
      .split(/\r?\n/)
      .filter((x) => x)
      .sort()
  );
  fs.writeFileSync(tagsPath, tags.join('\n'));
  return tags;
}

async function loadAndUpdateValidator() {
  // Load the libraries schema and update it if needed
  /** @type {Schema} */
  const librariesSchema = readJSON(librariesSchemaPath);
  librariesSchema.definitions.tag.enum = loadAndUpdateTags();
  // Save any changes made
  fs.writeFileSync(
    librariesSchemaPath,
    prettier.format(JSON.stringify(librariesSchema), { parser: 'json' })
  );

  // Create the validator (which will also ensure the schema is valid)
  const ajv = new Ajv();
  // Add "format" validators so we can get free/cheap validation of strings
  addFormats(ajv, ['uri', 'date']);

  /** @type {import('ajv').ValidateFunction<Schema>} */
  const validate = ajv.compile(librariesSchema);

  // Create a Typescript types file from the schema, to make it easier
  // to code with IDE support.
  const asTypescriptString = await compileFromFile(librariesSchemaPath);
  fs.writeFileSync(librariesTypesPath, asTypescriptString);

  return validate;
}

/**
 *
 * @param {any} obj
 * @returns {obj is Partial<AuthorSchema>}
 */
function isAuthor(obj) {
  return getAuthorSchemaFields().some((field) => obj[field]);
}

/**
 * @param {any} obj
 * @returns {obj is Partial<LibrarySchema>}
 */
function isLibrary(obj) {
  return getLibrarySchemaFields().some((field) => obj[field]);
}

function getAuthorSchemaFields() {
  /** @type {Schema} */
  const schema = readJSON(librariesSchemaPath);
  return /** @type {(keyof AuthorSchema)[]} */ (
    Object.keys(schema.definitions.author.properties)
  );
}

function getLibrarySchemaFields() {
  /** @type {Schema} */
  const schema = readJSON(librariesSchemaPath);
  return /** @type {(keyof LibrarySchema)[]} */ (
    Object.keys(schema.definitions.library.properties)
  );
}

/**
 * Given an author identifier or partial Author object,
 * find a matching one in the re-usable Authors section
 * and update it if possible.
 *
 * Mutates `libraries`.
 *
 * @param {Partial<Author>|string} author
 * @param {Libraries} libraries
 */
function ensureReusableAuthor(author, libraries) {
  const authorFields = getAuthorSchemaFields();
  for (const [existingAuthorId, existingAuthor] of Object.entries(
    libraries.authors
  )) {
    if (typeof author === 'string') {
      if (author === existingAuthorId) {
        return existingAuthor;
      }
      continue;
    } else {
      // Check for any matching fields
      const isMatch = authorFields.some(
        (field) => author[field]?.toLowerCase() === existingAuthor[field]
      );
      // Update!
      Object.assign(existingAuthor, trimmedObject(author));
      return existingAuthor;
    }
  }

  // If we made it here, then the author wasn't found.
  assert(typeof author !== 'string', 'Author key not found');
  // If it was an object author with at least a name, add it!
  assert(author.name, 'Author must have a name');
}

/**
 *
 * @param {any} data
 * @param {import('ajv').ValidateFunction} validate
 */
function throwIfInvalidData(data, validate) {
  const isValid = validate(data);
  if (!isValid) {
    console.error(validate.errors);
    process.exit(1);
  }
}

/**
 * Load the current libraries. On loading it always updates the schema
 * with any new tags, moves authors into the re-usable Authors section,
 * and validates the library as a side effect.
 *
 * @returns {Promise<Libraries>}
 */
async function loadAndUpdateLibraries() {
  const validate = await loadAndUpdateValidator();

  // Load the library data and test it against the schema
  /** @type {Libraries} */
  const libraries = readJSON(librariesPath);
  libraries.libraries.forEach((library) => {
    library.authors?.forEach((author) => {
      if (typeof author == 'string') {
        const referencedAuthor = libraries.authors[author];
        // @ts-ignore
        assert(referencedAuthor, `Author key "${author}" not found.`);
      }
    });
  });
  throwIfInvalidData(libraries, validate);
  // Check author refs to make sure they all exist

  saveLibraries(libraries);
  return libraries;
}

/**
 * @param {Libraries} libraries
 */
async function saveLibraries(libraries) {
  const validate = await loadAndUpdateValidator();
  throwIfInvalidData(libraries, validate);
  // Prettify
  fs.writeFileSync(
    librariesPath,
    prettier.format(JSON.stringify(libraries), { parser: 'json' })
  );
  return libraries;
}
