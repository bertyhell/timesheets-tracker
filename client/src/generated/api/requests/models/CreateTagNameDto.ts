/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CreateTagNameDto = {
  /**
   * Name of the tag
   */
  title?: string;
  /**
   * Timesheet code for this tag (optional)
   */
  code?: string;
  /**
   * Hex code of the color to give tags with this tag name
   */
  color?: string;
};
