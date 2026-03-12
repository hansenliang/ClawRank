import os from 'os';
import path from 'path';

export function expandHomePath(input: string): string {
 const value = String(input || '').trim();
 if (!value) return value;
 if (value === '~') return os.homedir();
 if (value.startsWith('~/')) {
 return path.join(os.homedir(), value.slice(2));
 }
 return value;
}
