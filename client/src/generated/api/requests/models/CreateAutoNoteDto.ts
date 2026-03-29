/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CreateAutoNoteDto = {
  /**
   * Name of the autoNote
   */
  name?: string;
  /**
   * ids of the tags this autoNote is linked to. Value is semicolon separated. null for all tags
   */
  tagNameIds?: Array<string>;
  /**
   * What the content of the autoNote should be equal to. eg: programName, ProgramTitle, websiteTitle, websiteUrl
   */
  variable?: string;
  /**
   * The regex to extract some part of the above variable. (.*) to take the whole variable. eg: jira.com/issue/(ABC-[0-9]+)
   */
  extractRegex?: string;
  /**
   * The regex match group to keep. eg: $1, empty string to take the whole variable
   */
  extractRegexReplacement?: string;
};
