import fs from 'fs';
import path from 'path';
import type { AccountData } from './wechat-api.js';

const WECHAT_DIR = path.join(process.cwd(), 'data', 'wechat');
const CREDENTIALS_FILE = path.join(WECHAT_DIR, 'account.json');
const SYNC_BUF_FILE = path.join(WECHAT_DIR, 'sync_buf.txt');

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
