// MCP server over stdio: every headless command becomes a tool named pss_<command>.
// Render results come back as images so the agent can look at the sprite.
//
//   npx tsx src/headless/mcp.ts        (or bin/pss-mcp)

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { commands } from './commands';

const server = new McpServer({ name: 'pixel-sprite-studio', version: '0.1.0' });

for (const cmd of commands) {
  server.registerTool(
    `pss_${cmd.name}`,
    { description: cmd.description, inputSchema: cmd.schema.shape },
    async (args: unknown) => {
      try {
        const result = cmd.run(args as never);
        const content: ({ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string })[] = [];
        content.push({ type: 'text', text: result.text ?? JSON.stringify(result.data, null, 1) });
        if (result.png) content.push({ type: 'image', data: result.png.toString('base64'), mimeType: 'image/png' });
        return { content };
      } catch (err) {
        return { content: [{ type: 'text', text: `error: ${(err as Error).message}` }], isError: true };
      }
    },
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
