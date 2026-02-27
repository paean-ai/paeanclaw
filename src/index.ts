#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAgent, type LlmConfig } from './agent.js';
import { connectAll, shutdown, type McpServerConfig } from './mcp.js';
import { initStore, createConversation, listConversations, addMessage, getMessages, updateTitle } from './store.js';

interface Config {
  llm: LlmConfig;
  mcpServers?: Record<string, McpServerConfig>;
  server?: { port?: number };
  telegram?: { token: string };
}

function loadConfig(): Config {
  const raw = fs.readFileSync(path.join(process.cwd(), 'paeanclaw.config.json'), 'utf-8');
  const interpolated = raw.replace(/\$\{(\w+)\}/g, (_, k) => process.env[k] ?? '');
  return JSON.parse(interpolated);
}

function loadSystemPrompt(): string {
  const agentMd = path.join(process.cwd(), 'AGENT.md');
  return fs.existsSync(agentMd) ? fs.readFileSync(agentMd, 'utf-8') : 'You are a helpful AI assistant.';
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');
const MIME: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  const url = req.url === '/' ? '/index.html' : req.url!;
  const filePath = path.join(publicDir, url);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) return false;
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c: Buffer) => { data += c.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function cors(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: http.ServerResponse, data: unknown, status = 200): void {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function main(): Promise<void> {
  const config = loadConfig();
  const systemPrompt = loadSystemPrompt();
  await initStore();
  if (config.mcpServers) await connectAll(config.mcpServers);
  process.on('SIGINT', async () => { await shutdown(); process.exit(0); });

  const server = http.createServer(async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url!, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/conversations') {
      return json(res, listConversations());
    }

    if (req.method === 'GET' && url.pathname === '/api/messages') {
      const id = url.searchParams.get('conversationId');
      if (!id) return json(res, { error: 'conversationId required' }, 400);
      return json(res, getMessages(id));
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      const body = JSON.parse(await readBody(req));
      const { message, conversationId } = body;
      const convId = conversationId || createConversation(message.slice(0, 60)).id;
      addMessage(convId, 'user', message);

      const history = getMessages(convId).map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: JSON.parse(m.tool_calls) } : {}),
        ...(m.role === 'tool' ? { tool_call_id: m.content } : {}),
      }));

      res.writeHead(200, {
        'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(`data: ${JSON.stringify({ type: 'start', conversationId: convId })}\n\n`);

      let fullContent = '';
      try {
        for await (const event of runAgent(config.llm, systemPrompt, history)) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          if (event.type === 'content') fullContent += event.text;
          if (event.type === 'done') {
            addMessage(convId, 'assistant', event.content);
            if (!conversationId && event.content.length > 0) {
              updateTitle(convId, event.content.slice(0, 80));
            }
          }
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`);
      }
      res.end();
      return;
    }

    if (!serveStatic(req, res)) {
      json(res, { error: 'Not found' }, 404);
    }
  });

  if (config.telegram?.token) {
    const { startTelegram } = await import('./telegram.js');
    startTelegram(config.telegram.token, config.llm, systemPrompt);
  }

  const port = config.server?.port ?? 3007;
  server.listen(port, () => {
    console.log(`🐾 PaeanClaw running at http://localhost:${port}`);
  });
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
