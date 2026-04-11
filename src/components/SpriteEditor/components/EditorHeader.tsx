import React from 'react';
import { DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { PxEdit, PxSparkles, PxDownload, PxSave, PxImage, PxFileVideo, PxHardDrive, PxChevronLeft } from '@/components/icons/PixelIcon';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';

export const EditorHeader = React.memo(() => {
  const assetName = useSpriteEditorStore(s => s.assetName);
  const setAssetName = useSpriteEditorStore(s => s.setAssetName);
  const isEditingName = useSpriteEditorStore(s => s.isEditingName);
  const setIsEditingName = useSpriteEditorStore(s => s.setIsEditingName);
  const generatePrompt = useSpriteEditorStore(s => s._generatePrompt);
  const onRegenerate = useSpriteEditorStore(s => s._onRegenerate);
  const isGenerating = useSpriteEditorStore(s => s._isGenerating);
  const handleExportPNG = useSpriteEditorStore(s => s.handleExportPNG);
  const handleExportGIF = useSpriteEditorStore(s => s.handleExportGIF);
  const handleExportJSON = useSpriteEditorStore(s => s.handleExportJSON);
  const handleSave = useSpriteEditorStore(s => s.handleSave);
  const handleClose = useSpriteEditorStore(s => s.handleClose);
  const viewingAnimation = useSpriteEditorStore(s => s.viewingAnimation);
  const isDirty = useSpriteEditorStore(s => s.isDirty);

  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <DialogHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground font-pixel text-[10px] gap-1"
        >
          <PxChevronLeft size={14} /> SALIR
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={assetName}
              onChange={e => setAssetName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
              className="bg-background border border-primary rounded px-2 py-1 text-sm font-pixel text-primary outline-none focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all"
            />
          ) : (
            <DialogTitle
              className="font-pixel text-sm text-primary tracking-wider flex items-center gap-2 cursor-pointer hover:text-green-400 transition-colors"
              onClick={() => setIsEditingName(true)}
              title="Click para editar nombre"
            >
              {assetName.toUpperCase()} — EDITOR
              {isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" title="Cambios sin guardar" />
              )}
              <PxEdit size={12} className="opacity-50" />
            </DialogTitle>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {generatePrompt && onRegenerate && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline-block max-w-[200px] truncate">
              Prompt: "{generatePrompt}"
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onRegenerate}
              disabled={isGenerating}
              className="font-pixel text-[10px] border-primary/50 text-primary hover:bg-primary/10 transition-all"
            >
              {isGenerating ? 'GENERANDO...' : 'REGENERAR'}
              {!isGenerating && <PxSparkles size={14} className="ml-1" />}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="font-pixel text-[9px] h-8 border-primary/30 text-green-300 hover:bg-primary/10 transition-all"
              >
                <PxDownload size={15} className="mr-2" />
                EXPORTAR
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border font-pixel text-[10px]">
              <DropdownMenuLabel className="text-muted-foreground text-[8px] uppercase tracking-widest px-2 py-1.5">
                Opciones de Exportación
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => handleExportPNG()} className="cursor-pointer gap-2 focus:bg-primary/10 focus:text-primary transition-colors">
                <PxImage size={14} />
                PNG SPRITE SHEET
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleExportPNG({ includeLabels: true })} className="cursor-pointer gap-2 focus:bg-primary/10 focus:text-primary transition-colors">
                <PxHardDrive size={14} />
                PNG CON ETIQUETAS
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={handleExportGIF} className="cursor-pointer gap-2 focus:bg-primary/10 focus:text-primary transition-colors">
                <PxFileVideo size={14} />
                EXPORTAR GIF ({viewingAnimation.toUpperCase()})
              </DropdownMenuItem>

              {isLocalhost && (
                <>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer gap-2 text-amber-400 focus:bg-amber-400/10 focus:text-amber-300 transition-colors">
                    DEBUG: COPIAR JSON
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleSave}
            size="sm"
            className={`font-pixel text-[9px] h-8 bg-green-600 text-white hover:bg-green-500 border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all ${isDirty ? 'animate-pulse-glow border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''}`}
          >
            <PxSave size={15} className="mr-2" />
            GUARDAR
          </Button>
        </div>
      </div>
    </DialogHeader>
  );
});

EditorHeader.displayName = 'EditorHeader';
