import fs from 'fs';
import path from 'path';
import type { AccountData } from './wechat-api.js';

export interface WechatContact {
  userId: string;
  contextToken: string;
  lastSeen: string;
  displayName?: string;
}

const WECHAT_DIR = path.join(process.cwd(), 'data', 'wechat');
const CREDENTIALS_FILE = path.join(WECHAT_DIR, 'account.json');
const SYNC_BUF_FILE = path.join(WECHAT_DIR, 'sync_buf.txt');
const CONTACTS_FILE = path.join(WECHAT_DIR, 'contacts.json');

export function loadCredentials(): AccountData | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null;
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
  } catch { return null; }
}

export function saveCredentials(data: AccountData): void {
  fs.mkdirSync(WECHAT_DIR, { recursive: true });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  try { fs.chmodSync(CREDENTIALS_FILE, 0o600); } catch { /* best-effort */ }
}

export function removeCredentials(): void {
  try { if (fs.existsSync(CREDENTIALS_FILE)) fs.unlinkSync(CREDENTIALS_FILE); } catch { /* ignore */ }
  try { if (fs.existsSync(SYNC_BUF_FILE)) fs.unlinkSync(SYNC_BUF_FILE); } catch { /* ignore */ }
}

export function loadSyncBuf(): string {
  try { if (fs.existsSync(SYNC_BUF_FILE)) return fs.readFileSync(SYNC_BUF_FILE, 'utf-8'); } catch { /* ignore */ }
  return '';
}

export function saveSyncBuf(buf: string): void {
  try {
    fs.mkdirSync(WECHAT_DIR, { recursive: true });
    fs.writeFileSync(SYNC_BUF_FILE, buf, 'utf-8');
  } catch { /* ignore */ }
}

export function loadContacts(): WechatContact[] {
  try {
    if (!fs.existsSync(CONTACTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'));
  } catch { return []; }
}

export function saveContact(userId: string, contextToken: string): void {
  const contacts = loadContacts();
  const displayName = userId.split('@')[0] || userId;
  const idx = contacts.findIndex(c => c.userId === userId);
  const entry: WechatContact = { userId, contextToken, lastSeen: new Date().toISOString(), displayName };
  if (idx >= 0) contacts[idx] = entry; else contacts.push(entry);
  try {
    fs.mkdirSync(WECHAT_DIR, { recursive: true });
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

export function getContactToken(userId: string): string | null {
  const contacts = loadContacts();
  const match = contacts.find(c => c.userId === userId || c.displayName === userId);
  return match?.contextToken ?? null;
}
