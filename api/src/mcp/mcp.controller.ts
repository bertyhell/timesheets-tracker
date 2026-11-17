import type { Request, Response } from 'express';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Controller, Delete, Get, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { McpService } from './mcp.service';

/**
 * Model Context Protocol endpoint (Streamable HTTP, stateless), so AI assistants can read events
 * and manage tags and auto tag rules. Like the rest of the API it only listens on loopback and is
 * guarded by the local-only middleware.
 *
 * Kept out of Swagger: it is not part of the REST API the client is generated from.
 */
@ApiExcludeController()
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response): Promise<void> {
    const server = this.mcpService.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      // Nest already parsed the JSON body, so hand it over instead of letting the transport
      // read the (already consumed) stream.
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      this.logger.error('Failed to handle MCP request', err as Error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  }

  // Stateless server: there is no session to open a server-sent event stream on or to end.
  @Get()
  handleGet(@Res() res: Response): void {
    this.methodNotAllowed(res);
  }

  @Delete()
  handleDelete(@Res() res: Response): void {
    this.methodNotAllowed(res);
  }

  private methodNotAllowed(res: Response): void {
    res
      .status(405)
      .set('Allow', 'POST')
      .json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null,
      });
  }
}
