import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { backupFileName, type BackupDoc } from '@/domain/backup';

export type IoResult = { ok: boolean; message: string };

/**
 * Writes the document to a file and hands it to the share sheet (Drive, Telegram,
 * mail). On web there is no share sheet, so it downloads instead.
 */
export async function exportBackupFile(doc: BackupDoc): Promise<IoResult> {
  const json = JSON.stringify(doc, null, 2);
  const filename = backupFileName();
  const kb = Math.max(1, Math.round(json.length / 1024));

  if (Platform.OS === 'web') {
    try {
      const g = globalThis as any;
      const blob = new Blob([json], { type: 'application/json' });
      const url = g.URL.createObjectURL(blob);
      const a = g.document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      g.URL.revokeObjectURL(url);
      return { ok: true, message: `downloaded ${filename} · ${kb} kb` };
    } catch {
      return { ok: false, message: 'download blocked by the browser' };
    }
  }

  try {
    const path = `${FileSystem.cacheDirectory ?? ''}${filename}`;
    await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Export Ledger backup',
        UTI: 'public.json',
      });
      return { ok: true, message: `shared ${filename} · ${kb} kb` };
    }
    return { ok: true, message: `saved to ${path}` };
  } catch (error) {
    return { ok: false, message: `export failed: ${(error as Error).message}` };
  }
}

/** Opens the system file picker and returns the file's text, or null if cancelled. */
export async function pickBackupText(): Promise<{ text: string } | { error: string } | null> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.length) return null;

    const uri = picked.assets[0].uri;
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      return { text: await response.text() };
    }

    const text = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return { text };
  } catch (error) {
    return { error: `could not read that file: ${(error as Error).message}` };
  }
}
