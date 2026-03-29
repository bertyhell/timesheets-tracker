/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type AutoNoteDto = {
  /**
   * Id of the autoNote rule
   */
  id?: string;
  /**
   * Name of the autoNote
   */
  title?: string;
  /**
   * ids of the tags this autoNote is linked to. Value is semicolon separated. null for all tags
   */
  tagNameIds?: Array<string>;
  /**
   * What the content of the autoNote should be equal to. eg: programName, ProgramTitle, websiteTitle, websiteUrl
   */
  variable?: string;
  /**
   * The regex to extract some part of the above variable. null to take the whole variable
   */
  extractRegex?: string;
  /**
   * The regex match group to keep. eg: "(phone|cell): ([0-9]+)" => $2 would keep the phone number digits
   */
  extractRegexReplacement?: string;
};
