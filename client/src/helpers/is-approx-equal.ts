import { isNil } from 'lodash-es';

export const EPSILON = 0.0001;

export function isApproxEqual(
  value1: number | null,
  value2: number | null,
  epsilon: number = EPSILON
) {
  if (isNil(value1) || isNil(value2)) {
    return false;
  }
  return Math.abs(value1 - value2) < epsilon;
}
