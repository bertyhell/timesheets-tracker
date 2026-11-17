import { Copy } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';

import Button, { ButtonSize, ButtonVariant } from '../../../components/Button/Button';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { client } from '../../../generated/api/client.gen';

/** The backend serves the MCP endpoint on the same origin as the REST API. */
const MCP_URL =
  (client.getConfig().baseUrl ?? 'http://localhost:55577').replace(/\/$/, '') + '/mcp';

const CLAUDE_CODE_COMMAND = `claude mcp add --transport http timesheets-tracker ${MCP_URL}`;

const JSON_CONFIG = JSON.stringify(
  { mcpServers: { 'timesheets-tracker': { type: 'http', url: MCP_URL } } },
  null,
  2
);

function CopyBlock({ text }: { text: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard', { type: 'success' });
    } catch {
      toast('Could not copy to the clipboard', { type: 'error' });
    }
  };
  return (
    <div className="flex gap-2 items-start mb-4">
      <pre
        className="flex-1 p-3 rounded-lg bg-[var(--bg-alternative)] overflow-x-auto"
        style={{ fontSize: '0.85em', margin: 0 }}
      >
        {text}
      </pre>
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
        icon={<Copy size={14} />}
        onClick={copy}
        title="Copy"
        ariaLabel="Copy"
      />
    </div>
  );
}

export function AiAssistantPage() {
  return (
    <div className="p-ai-assistant-settings">
      <PageHeader
        title="AI assistant"
        description="Let an AI assistant manage your tags and auto tag rules over MCP."
      />

      <div className="px-6 mt-4 max-w-2xl">
        <section>
          <h3 className="font-semibold mb-1">What it can do</h3>
          <ul
            className="text-gray-500 mb-3"
            style={{ fontSize: '0.9em', paddingLeft: '1.25rem', listStyle: 'disc' }}
          >
            <li>Read your tracked events (programs, websites, calendar, git, Jira, ...).</li>
            <li>Create, change and delete tag names, tags, auto tag rules and auto notes.</li>
            <li>
              Back up the database. The assistant is asked to do this before it changes anything,
              but double check it did. Backups can be restored from the Import &amp; export page.
            </li>
          </ul>
          <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            Tracked events themselves cannot be changed. The server only listens on this computer
            and only works while Timesheets Tracker is running.
          </p>
        </section>

        <section className="mt-6">
          <h3 className="font-semibold mb-1">Server address</h3>
          <CopyBlock text={MCP_URL} />

          <h3 className="font-semibold mb-1">Claude Code</h3>
          <CopyBlock text={CLAUDE_CODE_COMMAND} />

          <h3 className="font-semibold mb-1">Other MCP clients</h3>
          <p className="text-gray-500 mb-2" style={{ fontSize: '0.9em' }}>
            Clients that support streamable HTTP servers can use a configuration like:
          </p>
          <CopyBlock text={JSON_CONFIG} />
        </section>
      </div>
    </div>
  );
}
