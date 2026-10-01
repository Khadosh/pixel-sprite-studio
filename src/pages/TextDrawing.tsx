import React, { useCallback, useRef, useState } from 'react';
import { SpriteEditorModal } from '@/components/SpriteEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { SpriteAsset } from '@/lib/types';
import { openTextDrawing, saveTextDrawing, type TextDrawingSession } from '@/lib/textDrawing';
import { canWriteInPlace, pickTextFile, writeTextFile, type LocalTextFile } from '@/lib/textFileAccess';

interface OpenDrawing {
  /** Remounts the editor (and its store) on every file opened. */
  key: number;
  asset: SpriteAsset;
  session: TextDrawingSession;
  file: Pick<LocalTextFile, 'name' | 'handle'>;
}

/**
 * /dibujo: abre un dibujo de texto (formato `from_ascii`, src/headless/ascii.ts) en el editor
 * y lo guarda de vuelta al mismo .txt. No usa la nube: el archivo es la verdad.
 */
const TextDrawing = () => {
  const { toast } = useToast();
  const [drawing, setDrawing] = useState<OpenDrawing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const answerWarnings = useRef<((go: boolean) => void) | null>(null);
  const counter = useRef(0);

  const load = useCallback((text: string, file: Pick<LocalTextFile, 'name' | 'handle'>) => {
    try {
      const { asset, session } = openTextDrawing(text, file.name);
      counter.current += 1;
      setDrawing({ key: counter.current, asset, session, file });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDrawing(null);
    }
  }, []);

  const openFile = useCallback(async () => {
    try {
      const file = await pickTextFile();
      if (file) load(file.text, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [load]);

  const openPasted = () => {
    const id = /^id:\s*(\S+)/m.exec(pasted)?.[1];
    load(pasted, { name: `${id ?? 'dibujo'}.txt` });
  };

  const confirmWarnings = (list: string[]) => new Promise<boolean>(resolve => {
    answerWarnings.current = resolve;
    setWarnings(list);
  });

  const closeWarnings = (go: boolean) => {
    answerWarnings.current?.(go);
    answerWarnings.current = null;
    setWarnings(null);
  };

  const handleSave = useCallback(async (asset: SpriteAsset): Promise<boolean> => {
    if (!drawing) return false;
    let saved;
    try {
      saved = saveTextDrawing(asset, drawing.session);
    } catch (err) {
      toast({ title: 'No se pudo pasar a texto', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
      return false;
    }
    if (saved.warnings.length && !(await confirmWarnings(saved.warnings))) return false;
    try {
      const how = await writeTextFile(drawing.file, saved.text);
      drawing.session.layout.comments = 0; // what was lost is already said
      toast(how === 'written'
        ? { title: 'Guardado', description: `${drawing.file.name} quedó escrito en su lugar.` }
        : { title: 'Descargado', description: `${drawing.file.name} bajó como descarga: este navegador no deja escribir el archivo original.` });
      return true;
    } catch (err) {
      toast({ title: 'Error al guardar', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
      return false;
    }
  }, [drawing, toast]);

  const textFile = React.useMemo(
    () => (drawing ? { name: drawing.file.name, onOpen: openFile } : null),
    [drawing, openFile],
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2 border-b border-border pb-4">
          <h1 className="font-pixel text-sm text-primary uppercase">Dibujo de texto</h1>
          <p className="text-sm text-muted-foreground">
            Abrí un <code>.txt</code> del formato de <code>pss from_ascii</code> (tamaño, paleta, cuadros y animaciones),
            retocalo con el mouse y GUARDAR lo escribe de vuelta.{' '}
            {canWriteInPlace()
              ? 'Este navegador escribe el mismo archivo.'
              : 'Este navegador no deja escribir el archivo: GUARDAR lo descarga con el mismo nombre.'}
          </p>
        </header>

        <Button onClick={openFile} className="font-pixel text-[10px]">ABRIR .TXT</Button>

        <div className="space-y-2">
          <label htmlFor="pasted" className="text-sm text-muted-foreground">O pegá el texto del dibujo:</label>
          <Textarea
            id="pasted"
            value={pasted}
            onChange={e => setPasted(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={'id: farol\nsize: 16x32\nk = #15120f tinta\n\n== idle 0\n....'}
          />
          <Button variant="outline" onClick={openPasted} disabled={!pasted.trim()} className="font-pixel text-[10px]">
            ABRIR LO PEGADO
          </Button>
        </div>

        {error && (
          <pre className="whitespace-pre-wrap text-sm text-destructive border border-destructive/40 rounded p-3">{error}</pre>
        )}
      </div>

      {drawing && (
        <SpriteEditorModal
          key={drawing.key}
          open
          onOpenChange={open => { if (!open) setDrawing(null); }}
          initialAsset={drawing.asset}
          onSave={handleSave}
          fromTextFile
          textFile={textFile}
        />
      )}

      <AlertDialog open={warnings !== null} onOpenChange={open => { if (!open) closeWarnings(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>El texto no guarda todo</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ul className="list-disc pl-5 space-y-1 text-left">
                {(warnings ?? []).map(w => <li key={w}>{w}</li>)}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeWarnings(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeWarnings(true)}>Guardar igual</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TextDrawing;
