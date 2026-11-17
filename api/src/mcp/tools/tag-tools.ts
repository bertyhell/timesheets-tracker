import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { z } from 'zod';

import type { AutoNotesService } from '../../auto-notes/auto-notes.service';
import type { DatabaseService } from '../../database/database.service';
import type { TagNamesService } from '../../tag-names/tag-names.service';
import type { TagsService } from '../../tags/tags.service';

import { findOneTagName } from '../../tag-names/queries/findOneTagName';
import { findOneTag } from '../../tags/queries/findOneTag';
import { updateTag } from '../../tags/queries/updateTag';
import { colorSchema, isoDateTimeSchema, runTool } from '../mcp-tool-helpers';

export interface TagToolDependencies {
  databaseService: DatabaseService;
  tagNamesService: TagNamesService;
  tagsService: TagsService;
  autoNotesService: AutoNotesService;
}

export function registerTagTools(server: McpServer, deps: TagToolDependencies): void {
  const { databaseService, tagNamesService, tagsService, autoNotesService } = deps;

  const requireTagName = (id: string) => {
    if (!findOneTagName(databaseService.getDb(), { id })) {
      throw new Error(`Tag name not found: ${id}`);
    }
  };

  const requireTag = (id: string) => {
    const tag = findOneTag(databaseService.getDb(), { id });
    if (!tag) {
      throw new Error(`Tag not found: ${id}`);
    }
    return tag;
  };

  // ── Tag names: the projects/customers time is booked on ───────────────────

  server.registerTool(
    'list_tag_names',
    {
      title: 'List tag names',
      description:
        'Lists the tag names: the projects, customers or activities that time gets tagged with. Manual tags and auto tag rules both point at a tag name.',
      inputSchema: {
        search: z.string().optional().describe('Only tag names whose title contains this text'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ search }) => runTool(() => tagNamesService.findAll(search || undefined))
  );

  server.registerTool(
    'create_tag_name',
    {
      title: 'Create tag name',
      description: 'Creates a new tag name (project / customer / activity to book time on).',
      inputSchema: {
        title: z.string().min(1).describe('Display name, eg: "Acme - website redesign"'),
        color: colorSchema,
        code: z.string().optional().describe('Optional timesheet / project code'),
        note: z
          .string()
          .optional()
          .describe('Optional note that is copied onto every tag created with this tag name'),
        canGrow: z
          .boolean()
          .optional()
          .describe(
            'Whether auto tags for this tag name may be stretched into neighbouring free time by the "grow auto tags" action. Defaults to true.'
          ),
      },
    },
    (args) =>
      runTool(() =>
        tagNamesService.create({
          title: args.title,
          color: args.color,
          code: args.code,
          note: args.note,
          canGrow: args.canGrow,
        })
      )
  );

  server.registerTool(
    'update_tag_name',
    {
      title: 'Update tag name',
      description:
        'Changes a tag name. Only the given fields change. Every tag and auto tag pointing at it follows along.',
      inputSchema: {
        id: z.string().describe('Id of the tag name'),
        title: z.string().min(1).optional(),
        color: colorSchema.optional(),
        code: z.string().nullable().optional().describe('null clears the code'),
        note: z.string().nullable().optional().describe('null clears the note'),
        canGrow: z.boolean().optional(),
      },
      annotations: { idempotentHint: true },
    },
    ({ id, ...changes }) =>
      runTool(() => {
        requireTagName(id);
        return tagNamesService.update(id, changes as Parameters<TagNamesService['update']>[1]);
      })
  );

  server.registerTool(
    'delete_tag_name',
    {
      title: 'Delete tag name',
      description:
        'Deletes a tag name. WARNING: this also deletes every manual tag (booked time) and every auto tag rule that uses it. Auto notes that list it are left as they are. Make a database backup first.',
      inputSchema: {
        id: z.string().describe('Id of the tag name'),
      },
      annotations: { destructiveHint: true },
    },
    ({ id }) =>
      runTool(async () => {
        requireTagName(id);
        const db = databaseService.getDb();
        const count = (sql: string) => Number((db.prepare(sql).get(id) as { count: number }).count);
        const deletedTags = count('SELECT COUNT(*) AS count FROM tags WHERE tagNameId = ?');
        const deletedAutoTags = count('SELECT COUNT(*) AS count FROM autoTags WHERE tagNameId = ?');
        const autoNotesStillReferencing = (await autoNotesService.findAll(undefined))
          .filter((autoNote) => autoNote.tagNameIds?.includes(id))
          .map((autoNote) => ({ id: autoNote.id, title: autoNote.title }));

        await tagNamesService.remove(id);

        return { deleted: id, deletedTags, deletedAutoTags, autoNotesStillReferencing };
      })
  );

  // ── Tags: time ranges booked on a tag name ──────────────────────────────

  server.registerTool(
    'list_tags',
    {
      title: 'List tags',
      description:
        'Lists the manual tags (time ranges booked on a tag name) that lie completely inside a time range. Auto tags are not stored; see query_events with timelineTypes ["AutoTag"] for those.',
      inputSchema: {
        startedAt: isoDateTimeSchema,
        endedAt: isoDateTimeSchema,
      },
      annotations: { readOnlyHint: true },
    },
    ({ startedAt, endedAt }) =>
      runTool(() =>
        tagsService.findAll(new Date(startedAt).toISOString(), new Date(endedAt).toISOString())
      )
  );

  server.registerTool(
    'create_tag',
    {
      title: 'Create tag',
      description: [
        'Books a time range on a tag name, the same as tagging time in the app.',
        'Overlaps are resolved the way the app does it: overlapping tags with the same tag name and note are merged into this one, other overlapping tags are trimmed, split or removed so that no two tags overlap.',
      ].join(' '),
      inputSchema: {
        tagNameId: z.string().describe('Id of the tag name to book the time on'),
        startedAt: isoDateTimeSchema,
        endedAt: isoDateTimeSchema,
        note: z.string().optional().describe('Optional note, eg: a ticket number'),
      },
    },
    (args) =>
      runTool(() => {
        requireTagName(args.tagNameId);
        return tagsService.create({
          tagNameId: args.tagNameId,
          startedAt: new Date(args.startedAt).toISOString(),
          endedAt: new Date(args.endedAt).toISOString(),
          note: args.note,
        });
      })
  );

  server.registerTool(
    'update_tag',
    {
      title: 'Update tag',
      description:
        'Changes a manual tag. Only the given fields change. Unlike create_tag this does not resolve overlaps with other tags.',
      inputSchema: {
        id: z.string().describe('Id of the tag'),
        tagNameId: z.string().optional(),
        startedAt: isoDateTimeSchema.optional(),
        endedAt: isoDateTimeSchema.optional(),
        note: z.string().nullable().optional().describe('null clears the note'),
      },
      annotations: { idempotentHint: true },
    },
    (args) =>
      runTool(() => {
        const existing = requireTag(args.id);
        if (args.tagNameId) requireTagName(args.tagNameId);
        const startedAt = args.startedAt
          ? new Date(args.startedAt).toISOString()
          : existing.startedAt;
        const endedAt = args.endedAt ? new Date(args.endedAt).toISOString() : existing.endedAt;
        if (Date.parse(endedAt) <= Date.parse(startedAt)) {
          throw new Error('endedAt must be after startedAt');
        }
        // Written as one full row: the service's partial update paths drop fields that are left out.
        updateTag(
          databaseService.getDb(),
          {
            tagNameId: args.tagNameId ?? existing.tagNameId,
            startedAt,
            endedAt,
            note: args.note !== undefined ? args.note : (existing.note ?? null),
          },
          { id: args.id }
        );
        return tagsService.findOne(args.id);
      })
  );

  server.registerTool(
    'delete_tag',
    {
      title: 'Delete tag',
      description: 'Deletes a manual tag (booked time range). The tag name itself is kept.',
      inputSchema: {
        id: z.string().describe('Id of the tag'),
      },
      annotations: { destructiveHint: true },
    },
    ({ id }) =>
      runTool(async () => {
        requireTag(id);
        await tagsService.remove(id);
        return { deleted: id };
      })
  );
}
