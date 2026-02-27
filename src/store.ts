import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface Message {
  id: number;
  conversation_id: string;
  role: string;
  content: string;
  tool_calls?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Stmt { run(...p: unknown[]): void; all(...p: unknown[]): unknown[]; }
interface DB { exec(sql: string): void; prepare(sql: string): Stmt; }

async function openDb(dbPath: string): Promise<DB> {
  try {
    const { Database } = await import('bun:sqlite' as string);
    const db = new Database(dbPath);
    db.exec('PRAGMA journal_mode = WAL');
    return db as unknown as DB;
  } catch {
    const mod = await import('better-sqlite3');
    const Database = mod.default;
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    return db as unknown as DB;
  }
}

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

let stmts: {
  createConv: Stmt; listConvs: Stmt; updateTitle: Stmt; addMsg: Stmt; getMsgs: Stmt;
};

export async function initStore(): Promise<void> {
  const db = await openDb(path.join(dataDir, 'paeanclaw.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      role TEXT NOT NULL, content TEXT NOT NULL,
      tool_calls TEXT, created_at TEXT NOT NULL
    );
  `);
  stmts = {
    createConv: db.prepare('INSERT INTO conversations (id, title, created_at) VALUES (?, ?, ?)'),
    listConvs: db.prepare('SELECT * FROM conversations ORDER BY created_at DESC'),
    updateTitle: db.prepare('UPDATE conversations SET title = ? WHERE id = ?'),
    addMsg: db.prepare('INSERT INTO messages (conversation_id, role, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?)'),
    getMsgs: db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC'),
  };
}

export function createConversation(title = 'New conversation'): Conversation {
  const id = randomUUID();
  const now = new Date().toISOString();
  stmts.createConv.run(id, title, now);
  return { id, title, created_at: now };
}

export function listConversations(): Conversation[] {
  return stmts.listConvs.all() as Conversation[];
}

export function addMessage(conversationId: string, role: string, content: string, toolCalls?: string): void {
  stmts.addMsg.run(conversationId, role, content, toolCalls ?? null, new Date().toISOString());
}

export function getMessages(conversationId: string): Message[] {
  return stmts.getMsgs.all(conversationId) as Message[];
}

export function updateTitle(conversationId: string, title: string): void {
  stmts.updateTitle.run(title, conversationId);
}
