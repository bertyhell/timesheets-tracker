/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type AutoTagConditionDto = {
  /**
   * Conditions for the auto tag
   */
  booleanOperator?: string;
  /**
   * Variable to check
   */
  variable?: AutoTagConditionDto.variable | null;
  /**
   * Operator of the condition
   */
  operator?: AutoTagConditionDto.operator | null;
  /**
   * Piece of text that the variable has to contain
   */
  value?: string;
};

export namespace AutoTagConditionDto {
  /**
   * Variable to check
   */
  export enum variable {
    WINDOW_TITLE = "windowTitle",
    PROGRAM_NAME = "programName",
    WEBSITE_TITLE = "websiteTitle",
    WEBSITE_URL = "websiteUrl",
  }

  /**
   * Operator of the condition
   */
  export enum operator {
    CONTAINS = "contains",
    DOES_NOT_CONTAINS = "doesNotContains",
    IS_EXACT = "isExact",
    IS_NOT_EXACT = "isNotExact",
    MATCHES_REGEX = "matchesRegex",
    DOES_NOT_MATCH_REGEX = "doesNotMatchRegex",
  }
}
