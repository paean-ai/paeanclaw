import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ToolDef {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

interface ActiveServer { client: Client; tools: ToolDef[]; toolNames: Set<string>; }

const servers = new Map<string, ActiveServer>();

export async function connectAll(config: Record<string, McpServerConfig>): Promise<void> {
  for (const [name, cfg] of Object.entries(config)) {
    const client = new Client({ name: `paeanclaw-${name}`, version: '0.1.0' });
    const transport = new StdioClientTransport({
      command: cfg.command,
      args: cfg.args,
      env: { ...process.env, ...cfg.env } as Record<string, string>,
    });
    await client.connect(transport);
    const { tools: mcpTools } = await client.listTools();
    const tools: ToolDef[] = mcpTools.map(t => ({
      type: 'function',
      function: {
        name: `${name}__${t.name}`,
        description: t.description ?? '',
        parameters: t.inputSchema as Record<string, unknown>,
      },
    }));
    const toolNames = new Set(tools.map(t => t.function.name));
    servers.set(name, { client, tools, toolNames });
  }
}

export function allTools(): ToolDef[] {
  return Array.from(servers.values()).flatMap(s => s.tools);
}

export async function callTool(qualifiedName: string, args: Record<string, unknown>): Promise<string> {
  for (const [serverName, srv] of servers) {
    if (srv.toolNames.has(qualifiedName)) {
      const toolName = qualifiedName.slice(serverName.length + 2);
      const result = await srv.client.callTool({ name: toolName, arguments: args });
      const content = result.content as Array<{ type: string; text?: string }> | undefined;
      return content?.map(c => c.text ?? '').join('\n') ?? '';
    }
  }
  return `Error: tool "${qualifiedName}" not found`;
}

export async function shutdown(): Promise<void> {
  for (const srv of servers.values()) await srv.client.close();
  servers.clear();
}
