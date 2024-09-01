import fs from 'node:fs';
import path from 'node:path';
import { v4 } from 'uuid';
import { decodeBase64 } from './auth';

export default function createFile(dirname, data) {
  const filePath = path.join(dirname, v4());
  const clearData = decodeBase64(data);
  fs.writeFileSync(filePath, clearData, 'utf-8');
  return filePath;
}
