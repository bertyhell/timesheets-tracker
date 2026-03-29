/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AutoTagConditionDto } from "./AutoTagConditionDto";

export type AutoTagDto = {
  /**
   * Id of the auto tag
   */
  id?: string;
  /**
   * Id of the tagName
   */
  tagNameId?: string;
  /**
   * Name of the tagName
   */
  name?: string;
  /**
   * Priority order in which the auto tags are checked. 0 is checked first, 1 second, ...
   */
  priority?: number;
  /**
   * Conditions for the auto tag
   */
  conditions?: Array<AutoTagConditionDto>;
  /**
   * The tag name linked to this auto tag
   */
  tagName?: string;
};
