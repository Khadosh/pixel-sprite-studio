// Open and save a local text file from the browser. With the File System
// Access API (Chrome, Edge) the file is written back in place; without it
// (Firefox, Safari) opening uses an <input type="file"> and saving downloads
// a file with the same name.

import { saveAs } from 'file-saver';

/** The slice of the File System Access API this module uses (not in TS's DOM lib yet). */
interface WritableFileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  queryPermission?(opts: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission?(opts: { mode: 'readwrite' }): Promise<PermissionState>;
}

type OpenPicker = (opts: {
  types: { description: string; accept: Record<string, string[]> }[];
  multiple?: boolean;
}) => Promise<WritableFileHandle[]>;

export interface LocalTextFile {
  name: string;
  text: string;
  /** Present when the browser lets us write the same file back. */
  handle?: WritableFileHandle;
}

function openPicker(): OpenPicker | undefined {
  return (window as unknown as { showOpenFilePicker?: OpenPicker }).showOpenFilePicker;
}

/** Can the browser write a file in place (Save overwrites the .txt)? */
export function canWriteInPlace(): boolean {
  return typeof window !== 'undefined' && typeof openPicker() === 'function';
}

function pickWithInput(): Promise<LocalTextFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      file.text().then(text => resolve({ name: file.name, text }), reject);
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/** Asks for a .txt. Resolves null when the person cancels. */
export async function pickTextFile(): Promise<LocalTextFile | null> {
  const picker = openPicker();
  if (!picker) return pickWithInput();
  try {
    const [handle] = await picker.call(window, {
      types: [{ description: 'Dibujo de texto', accept: { 'text/plain': ['.txt'] } }],
      multiple: false,
    });
    const file = await handle.getFile();
    return { name: file.name, text: await file.text(), handle };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null;
    throw err;
  }
}

/** Writes the text back: in place when there is a handle, else as a download. */
export async function writeTextFile(file: { name: string; handle?: WritableFileHandle }, text: string): Promise<'written' | 'downloaded'> {
  const { handle } = file;
  if (handle) {
    let permission: PermissionState = 'granted';
    if (handle.queryPermission) permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted' && handle.requestPermission) permission = await handle.requestPermission({ mode: 'readwrite' });
    if (permission === 'granted') {
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return 'written';
    }
  }
  saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), file.name);
  return 'downloaded';
}
