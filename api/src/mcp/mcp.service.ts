import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';

import pkg from '../../package.json';
import { AutoNotesService } from '../auto-notes/auto-notes.service';
import { AutoTagsService } from '../auto-tags/auto-tags.service';
import { DatabaseBackupsService } from '../database-backups/database-backups.service';
import { DatabaseService } from '../database/database.service';
import { TagNamesService } from '../tag-names/tag-names.service';
import { TagsService } from '../tags/tags.service';
import { TimelinesService } from '../timelines/timelines.service';
import { registerAutoRuleTools } from './tools/auto-rule-tools';
import { registerBackupTools } from './tools/backup-tools';
import { registerEventTools } from './tools/event-tools';
import { registerTagTools } from './tools/tag-tools';

const INSTRUCTIONS = `
Timesheets Tracker records what the user does on their computer (active programs and window titles, websites, idle state, calendar events, git commits, Jira issues, file edits) and turns it into timesheets by tagging time with tag names (projects / customers).

What you can do:
- Read events with query_events and summarize_events. Events are read only.
- Create, update and delete tag names, manual tags (booked time ranges), auto tag rules and auto note rules.
- Back up the database and restore tag names, tags, auto tags and auto notes from a backup.

Before changing anything, call create_database_backup with a short label so the user can roll your changes back. Tell the user the backup id.

Tips:
- Use summarize_events with onlyUntagged=true to find activity no rule covers yet, then write auto tag conditions against the info fields you see in query_events.
- After changing auto tag rules, check the result with query_events using timelineTypes ["AutoTag"].
- All times are ISO 8601. The user's days are in their local time zone.
`.trim();

/**
 * Builds the MCP server. A fresh server is created per request (the HTTP transport runs
 * stateless), which is cheap: it only registers tool definitions that close over the services.
 */
@Injectable()
export class McpService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly databaseBackupsService: DatabaseBackupsService,
    private readonly tagNamesService: TagNamesService,
    private readonly tagsService: TagsService,
    private readonly autoTagsService: AutoTagsService,
    private readonly autoNotesService: AutoNotesService,
    private readonly timelinesService: TimelinesService
  ) {}

  createServer(): McpServer {
    const server = new McpServer(
      { name: 'timesheets-tracker', version: pkg.version },
      { instructions: INSTRUCTIONS }
    );

    registerEventTools(server, this.timelinesService);
    registerTagTools(server, {
      databaseService: this.databaseService,
      tagNamesService: this.tagNamesService,
      tagsService: this.tagsService,
      autoNotesService: this.autoNotesService,
    });
    registerAutoRuleTools(server, {
      databaseService: this.databaseService,
      autoTagsService: this.autoTagsService,
      autoNotesService: this.autoNotesService,
    });
    registerBackupTools(server, this.databaseBackupsService);

    return server;
  }
}
