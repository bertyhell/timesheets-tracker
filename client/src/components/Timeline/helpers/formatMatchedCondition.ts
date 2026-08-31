import type { MatchedAutoTagConditionDto } from '../../../generated/api/types.gen';

const MAX_MATCHED_VALUE_LENGTH = 60;

function truncate(value: string): string {
  return value.length > MAX_MATCHED_VALUE_LENGTH
    ? value.slice(0, MAX_MATCHED_VALUE_LENGTH - 1) + '…'
    : value;
}

/**
 * Renders the auto tag condition that triggered an auto tag event as a readable one-liner,
 * eg: websiteUrl contains "jira" → "https://jira.company.com/browse/ABC-123"
 */
export function formatMatchedCondition(condition: MatchedAutoTagConditionDto): string {
  const rule = `${condition.variable} ${condition.operator} "${condition.value}"`;
  if (!condition.matchedValue || condition.matchedValue === condition.value) {
    return rule;
  }
  return `${rule} → "${truncate(condition.matchedValue)}"`;
}
