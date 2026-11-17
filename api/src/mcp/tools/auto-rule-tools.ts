import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { z } from 'zod';

import type { AutoNotesService } from '../../auto-notes/auto-notes.service';
import type { AutoTagsService } from '../../auto-tags/auto-tags.service';
import type { DatabaseService } from '../../database/database.service';
import type { AutoTagCondition } from '../../types/types';

import { findOneAutoNote } from '../../auto-notes/queries/findOneAutoNote';
import { findOneAutoTag } from '../../auto-tags/queries/findOneAutoTag';
import { findOneTagName } from '../../tag-names/queries/findOneTagName';
import {
  autoTagConditionSchema,
  conditionVariableSchema,
  dateOnlySchema,
  regexStringSchema,
  runTool,
} from '../mcp-tool-helpers';

export interface AutoRuleToolDependencies {
  databaseService: DatabaseService;
  autoTagsService: AutoTagsService;
  autoNotesService: AutoNotesService;
}

const AUTO_TAG_EXPLANATION = [
  'An auto tag rule tags activity with a tag name when an event matches its conditions.',
  'Rules are checked in priority order (0 first) and the first matching rule wins for that event.',
  'Conditions are tested against the `info` fields of program, website, calendar, git, Jira, file edit and active state events (see query_events).',
  "A condition's booleanOperator joins it to the previous condition; AND binds tighter than OR.",
  'activeFrom/activeUntil (yyyy-MM-dd, inclusive) limit the days a rule applies to.',
].join(' ');

export function registerAutoRuleTools(server: McpServer, deps: AutoRuleToolDependencies): void {
  const { databaseService, autoTagsService, autoNotesService } = deps;

  const requireTagName = (id: string) => {
    if (!findOneTagName(databaseService.getDb(), { id })) {
      throw new Error(`Tag name not found: ${id}`);
    }
  };
  const requireAutoTag = (id: string) => {
    if (!findOneAutoTag(databaseService.getDb(), { id })) {
      throw new Error(`Auto tag not found: ${id}`);
    }
  };
  const requireAutoNote = (id: string) => {
    if (!findOneAutoNote(databaseService.getDb(), { id })) {
      throw new Error(`Auto note not found: ${id}`);
    }
  };
  const checkPeriod = (activeFrom?: string | null, activeUntil?: string | null) => {
    if (activeFrom && activeUntil && activeFrom > activeUntil) {
      throw new Error('activeFrom must not be after activeUntil');
    }
  };

  // ── Auto tags ───────────────────────────────────────────────────────────

  server.registerTool(
    'list_auto_tags',
    {
      title: 'List auto tag rules',
      description: `Lists the auto tag rules, sorted by priority. ${AUTO_TAG_EXPLANATION}`,
      inputSchema: {
        search: z.string().optional().describe('Only rules whose title contains this text'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ search }) =>
      runTool(async () => {
        const autoTags = await autoTagsService.findAll(search || undefined);
        return autoTags.sort((a, b) => a.priority - b.priority);
      })
  );

  server.registerTool(
    'create_auto_tag',
    {
      title: 'Create auto tag rule',
      description: `Creates an auto tag rule. ${AUTO_TAG_EXPLANATION}`,
      inputSchema: {
        title: z.string().min(1).describe('Name of the rule'),
        tagNameId: z.string().describe('Id of the tag name matching activity gets'),
        conditions: z.array(autoTagConditionSchema).min(1),
        priority: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Lower is checked first. Defaults to after all existing rules.'),
        activeFrom: dateOnlySchema.nullable().optional().describe('First day the rule applies'),
        activeUntil: dateOnlySchema.nullable().optional().describe('Last day the rule applies'),
      },
    },
    (args) =>
      runTool(async () => {
        requireTagName(args.tagNameId);
        checkPeriod(args.activeFrom, args.activeUntil);
        let priority = args.priority;
        if (priority === undefined) {
          const existing = await autoTagsService.findAll(undefined);
          priority = existing.reduce((max, autoTag) => Math.max(max, autoTag.priority + 1), 0);
        }
        return autoTagsService.create({
          title: args.title,
          tagNameId: args.tagNameId,
          priority,
          conditions: args.conditions as AutoTagCondition[],
          activeFrom: args.activeFrom ?? null,
          activeUntil: args.activeUntil ?? null,
        });
      })
  );

  server.registerTool(
    'update_auto_tag',
    {
      title: 'Update auto tag rule',
      description: `Changes an auto tag rule. Only the given fields change; conditions, when given, replace the whole list. ${AUTO_TAG_EXPLANATION}`,
      inputSchema: {
        id: z.string().describe('Id of the auto tag rule'),
        title: z.string().min(1).optional(),
        tagNameId: z.string().optional(),
        conditions: z.array(autoTagConditionSchema).min(1).optional(),
        priority: z.number().int().min(0).optional(),
        activeFrom: dateOnlySchema.nullable().optional().describe('null removes the start bound'),
        activeUntil: dateOnlySchema.nullable().optional().describe('null removes the end bound'),
      },
      annotations: { idempotentHint: true },
    },
    ({ id, ...changes }) =>
      runTool(async () => {
        requireAutoTag(id);
        if (changes.tagNameId) requireTagName(changes.tagNameId);
        const existing = await autoTagsService.findOne(id);
        checkPeriod(
          changes.activeFrom === undefined ? existing.activeFrom : changes.activeFrom,
          changes.activeUntil === undefined ? existing.activeUntil : changes.activeUntil
        );
        return autoTagsService.update(id, {
          id,
          ...changes,
          conditions: changes.conditions as AutoTagCondition[] | undefined,
        });
      })
  );

  server.registerTool(
    'delete_auto_tag',
    {
      title: 'Delete auto tag rule',
      description: 'Deletes an auto tag rule. Its tag name and any manual tags are kept.',
      inputSchema: {
        id: z.string().describe('Id of the auto tag rule'),
      },
      annotations: { destructiveHint: true },
    },
    ({ id }) =>
      runTool(async () => {
        requireAutoTag(id);
        await autoTagsService.delete(id);
        return { deleted: id };
      })
  );

  server.registerTool(
    'reorder_auto_tags',
    {
      title: 'Reorder auto tag rules',
      description:
        'Sets the order in which auto tag rules are checked. The given ids get priority 0, 1, 2, ... in that order; rules that are not listed keep their relative order and go after them.',
      inputSchema: {
        orderedIds: z.array(z.string()).min(1).describe('Auto tag ids, highest precedence first'),
      },
      annotations: { idempotentHint: true },
    },
    ({ orderedIds }) =>
      runTool(async () => {
        const autoTags = (await autoTagsService.findAll(undefined)).sort(
          (a, b) => a.priority - b.priority
        );
        const known = new Set(autoTags.map((autoTag) => autoTag.id));
        const unknown = orderedIds.filter((id) => !known.has(id));
        if (unknown.length) {
          throw new Error(`Auto tags not found: ${unknown.join(', ')}`);
        }
        const listed = new Set(orderedIds);
        const finalOrder = [
          ...new Set(orderedIds),
          ...autoTags.map((autoTag) => autoTag.id).filter((id) => !listed.has(id)),
        ];
        await autoTagsService.reorder(finalOrder.map((id, priority) => ({ id, priority })));
        return (await autoTagsService.findAll(undefined))
          .sort((a, b) => a.priority - b.priority)
          .map((autoTag) => ({ id: autoTag.id, title: autoTag.title, priority: autoTag.priority }));
      })
  );

  server.registerTool(
    'merge_duplicate_auto_tags',
    {
      title: 'Merge duplicate auto tag rules',
      description:
        'Merges auto tag rules that point at the same tag name and have the same active period into one rule, joining their conditions with OR. The rule with the lowest priority is kept.',
      inputSchema: {},
      annotations: { destructiveHint: true },
    },
    () => runTool(() => autoTagsService.mergeDuplicates())
  );

  // ── Auto notes ──────────────────────────────────────────────────────────

  const AUTO_NOTE_EXPLANATION =
    'An auto note fills in the note of a tag that has none, by extracting text (eg: a ticket number) from an event that overlaps the tag. The first rule that yields text wins.';

  server.registerTool(
    'list_auto_notes',
    {
      title: 'List auto note rules',
      description: `Lists the auto note rules. ${AUTO_NOTE_EXPLANATION}`,
      inputSchema: {
        search: z.string().optional().describe('Only rules whose title contains this text'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ search }) => runTool(() => autoNotesService.findAll(search || undefined))
  );

  const autoNoteShape = {
    title: z.string().min(1).describe('Name of the rule'),
    tagNameIds: z
      .array(z.string())
      .describe('Tag names the rule applies to. An empty list applies it to all tags.'),
    variable: conditionVariableSchema.describe(
      'Event info field to extract the note from, eg: windowTitle, websiteUrl. anyVariable tries them all.'
    ),
    extractRegex: regexStringSchema
      .optional()
      .describe('Regex that finds the text, eg: (ABC-[0-9]+). Defaults to (.*)'),
    extractRegexReplacement: z
      .string()
      .optional()
      .describe('What to keep of the match, eg: $1. Defaults to $1'),
  };

  server.registerTool(
    'create_auto_note',
    {
      title: 'Create auto note rule',
      description: `Creates an auto note rule. ${AUTO_NOTE_EXPLANATION}`,
      inputSchema: autoNoteShape,
    },
    (args) =>
      runTool(() => {
        args.tagNameIds.forEach(requireTagName);
        return autoNotesService.create({
          title: args.title,
          tagNameIds: args.tagNameIds,
          variable: args.variable,
          extractRegex: args.extractRegex,
          extractRegexReplacement: args.extractRegexReplacement,
        });
      })
  );

  server.registerTool(
    'update_auto_note',
    {
      title: 'Update auto note rule',
      description: `Changes an auto note rule. Only the given fields change. ${AUTO_NOTE_EXPLANATION}`,
      inputSchema: {
        id: z.string().describe('Id of the auto note rule'),
        title: autoNoteShape.title.optional(),
        tagNameIds: autoNoteShape.tagNameIds.optional(),
        variable: autoNoteShape.variable.optional(),
        extractRegex: autoNoteShape.extractRegex,
        extractRegexReplacement: autoNoteShape.extractRegexReplacement,
      },
      annotations: { idempotentHint: true },
    },
    ({ id, ...changes }) =>
      runTool(async () => {
        requireAutoNote(id);
        changes.tagNameIds?.forEach(requireTagName);
        // The service writes every column, so merge with the stored rule first.
        const existing = await autoNotesService.findOne(id);
        return autoNotesService.update(id, {
          title: changes.title ?? existing.title,
          tagNameIds: changes.tagNameIds ?? existing.tagNameIds,
          variable: changes.variable ?? existing.variable,
          extractRegex: changes.extractRegex ?? existing.extractRegex,
          extractRegexReplacement:
            changes.extractRegexReplacement ?? existing.extractRegexReplacement,
        });
      })
  );

  server.registerTool(
    'delete_auto_note',
    {
      title: 'Delete auto note rule',
      description:
        'Deletes an auto note rule. Auto notes are worked out when events are read, so tags lose the notes this rule filled in; manual notes are kept.',
      inputSchema: {
        id: z.string().describe('Id of the auto note rule'),
      },
      annotations: { destructiveHint: true },
    },
    ({ id }) =>
      runTool(async () => {
        requireAutoNote(id);
        await autoNotesService.remove(id);
        return { deleted: id };
      })
  );
}
