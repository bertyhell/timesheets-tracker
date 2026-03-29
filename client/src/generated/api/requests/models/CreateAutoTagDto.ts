/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AutoTagConditionDto } from "./AutoTagConditionDto";

export type CreateAutoTagDto = {
  /**
   * Id of the tagName
   */
  tagNameId?: string;
  /**
   * Name of the tagName
   */
  name?: string;
  /**
   * Priority order in which the auto tags are checked
   */
  priority?: number;
  /**
   * Conditions for the auto tag
   */
  conditions?: Array<AutoTagConditionDto>;
};
