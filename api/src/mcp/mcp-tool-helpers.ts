import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { z } from 'zod';

import { ConditionOperator, ConditionVariable, TimelineType } from '../types/types';

/** Every tool answers with JSON, pretty printed so it stays readable in a transcript. */
export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data ?? { ok: true }, null, 2) }],
  };
}

/**
 * Runs a tool body and turns any thrown error into a tool error the model can read and act on,
 * instead of a protocol error that only says something went wrong.
 */
export async function runTool(body: () => unknown): Promise<CallToolResult> {
  try {
    return jsonResult(await body());
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: describeError(err) }],
    };
  }
}

function describeError(err: unknown): string {
  const messages: string[] = [];
  let current: unknown = err;
  // Services wrap errors in CustomError, so the useful reason is usually a cause or two down.
  while (current && messages.length < 5) {
    if (current instanceof Error) {
      messages.push(current.message);
      current = current.cause;
    } else {
      messages.push(String(current));
      break;
    }
  }
  return messages.join(': ') || 'Unknown error';
}

export const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Must be an ISO 8601 date-time')
  .describe('ISO 8601 date-time, eg: 2026-11-17T08:00:00.000Z');

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a yyyy-MM-dd date')
  .describe('Day in yyyy-MM-dd format');

export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color like #3b82f6')
  .describe('Hex color, eg: #3b82f6');

export const conditionVariableSchema = z.enum(ConditionVariable);
export const timelineTypeSchema = z.enum(TimelineType);

export const autoTagConditionSchema = z
  .object({
    booleanOperator: z
      .enum(['AND', 'OR'])
      .default('AND')
      .describe(
        'How this condition joins the PREVIOUS condition. Ignored on the first condition. AND binds tighter than OR, so [A, AND B, OR C] means (A and B) or C.'
      ),
    variable: conditionVariableSchema.describe(
      'Event field to test. anyVariable tests every field and matches if any of them matches.'
    ),
    operator: z
      .enum(ConditionOperator)
      .describe('contains / isExact (and their negations) are case insensitive; regexes are not.'),
    value: z.string().describe('Text or regex (JavaScript syntax, no slashes) to test against'),
  })
  .superRefine((condition, ctx) => {
    if (
      condition.operator === ConditionOperator.matchesRegex ||
      condition.operator === ConditionOperator.doesNotMatchRegex
    ) {
      try {
        new RegExp(condition.value);
      } catch (err) {
        ctx.addIssue({
          code: 'custom',
          path: ['value'],
          message: `Invalid regex: ${(err as Error).message}`,
        });
      }
    }
  });

export const regexStringSchema = z.string().refine((value) => {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}, 'Must be a valid JavaScript regex');
