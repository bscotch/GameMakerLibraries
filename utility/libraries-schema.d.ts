/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type TwitterHandle = string;
/**
 * A tag can be used to categorize libraries for filtering and sorting.
 */
export type Tag =
  | "asset"
  | "community"
  | "editor"
  | "graphics"
  | "pipeline"
  | "room"
  | "shader"
  | "sprite"
  | "test"
  | "text"
  | "ui";
/**
 * You can re-use an author listed in the root authors map by providing the unique key.
 */
export type AuthorKey = string;
/**
 * The version(s) of GameMaker this library is compatible with.
 */
export type GameMakerCompatibility = ("8" | "Studio" | "Studio 2" | "Studio 2.3")[];

/**
 * Data documenting GameMaker libraries, for use in generating READMEs etc.
 */
export interface GameMakerLibraryData {
  /**
   * The title of the entire listing, used for page titles
   */
  title: string;
  /**
   * Description of the entire listing, used for page summaries
   */
  description: string;
  authors: LibraryAuthors;
  /**
   * List of libraries
   */
  libraries: AGameMakerLibrary[];
}
/**
 * Some authors have multiple libraries, so this section allows for re-use of author info. Authors can be directly added to a library, or they can be added here by a unique key, and that key can be used in a Library object.
 */
export interface LibraryAuthors {
  [k: string]: Author;
}
/**
 * An author is a person or organization that has contributed to the library.
 *
 * This interface was referenced by `LibraryAuthors`'s JSON-Schema definition
 * via the `patternProperty` "^[a-zA-Z0-9-_.]{2,64}$".
 */
export interface Author {
  name?: string;
  /**
   * The author home page.
   */
  website?: string;
  twitter?: TwitterHandle;
  /**
   * GitHub username
   */
  github?: string;
  /**
   * Companies, communities, or other significant entities the author is a member of.
   */
  affiliations?: string[];
}
export interface AGameMakerLibrary {
  /**
   * The title of the library
   */
  title: string;
  /**
   * Description of the library
   */
  description?: string;
  /**
   * URL of the library
   */
  url: string;
  /**
   * URL of the library's GitHub repository, if it has one.
   */
  githubUrl?: string;
  tags?: Tag[];
  authors?: (Author | AuthorKey)[];
  compatibility?: GameMakerCompatibility;
}