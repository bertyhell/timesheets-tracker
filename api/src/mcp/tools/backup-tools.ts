import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { z } from 'zod';

import type { DatabaseBackupsService } from '../../database-backups/database-backups.service';

import { RESTORABLE_TABLES } from '../../database-backups/database-backups.service';
import { runTool } from '../mcp-tool-helpers';

export function registerBackupTools(
  server: McpServer,
  databaseBackupsService: DatabaseBackupsService
): void {
  server.registerTool(
    'create_database_backup',
    {
      title: 'Create database backup',
      description:
        'Writes a backup of the whole database to the backup folder next to it. Call this before making changes, so they can be undone with restore_database_backup.',
      inputSchema: {
        label: z
          .string()
          .max(100)
          .optional()
          .describe('Short description to recognise the backup by, eg: "before auto tag cleanup"'),
      },
    },
    ({ label }) => runTool(() => databaseBackupsService.createBackup(label))
  );

  server.registerTool(
    'list_database_backups',
    {
      title: 'List database backups',
      description: 'Lists the database backups, newest first.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () => runTool(() => databaseBackupsService.listBackups())
  );

  server.registerTool(
    'restore_database_backup',
    {
      title: 'Restore database backup',
      description: [
        `Puts the ${RESTORABLE_TABLES.join(', ')} tables back to how they were in a backup.`,
        'Recorded events (programs, websites, active state) are not touched, so no tracked activity is lost.',
        'A backup of the current state is made first and returned as safetyBackup, so the restore can itself be undone.',
        'Only do this when the user asks for it.',
      ].join(' '),
      inputSchema: {
        backupId: z.string().describe('Id of the backup, from list_database_backups'),
      },
      annotations: { destructiveHint: true },
    },
    ({ backupId }) => runTool(() => databaseBackupsService.restoreBackup(backupId))
  );
}
