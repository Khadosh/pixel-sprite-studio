import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Edit2, Sparkles, Download, Save, Image as ImageIcon, FileVideo, HardDrive } from 'lucide-react';
import { useSpriteEditorContext } from '../context/SpriteEditorContext';

export const EditorHeader = React.memo(() => {
  const {
    assetName,
    setAssetName,
    isEditingName,
    setIsEditingName,
    generatePrompt,
    onRegenerate,
    isGenerating,
    handleExportPNG,
    handleExportGIF,
    handleSave,
    viewingAnimation
  } = useSpriteEditorContext();

  return (
    <DialogHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0 pr-12">
      <div className="flex items-center gap-2">
        {isEditingName ? (
          <input
            autoFocus
            type="text"
            value={assetName}
            onChange={e => setAssetName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
            className="bg-background border border-purple-500 rounded px-2 py-1 text-sm font-pixel text-primary outline-none"
          />
        ) : (
          <DialogTitle
            className="font-pixel text-sm text-primary tracking-wider flex items-center gap-2 cursor-pointer hover:text-purple-400 transition-colors"
            onClick={() => setIsEditingName(true)}
            title="Click para editar nombre"
          >
            {assetName.toUpperCase()} — EDITOR
            <Edit2 size={12} className="opacity-50" />
          </DialogTitle>
        )}
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
              className="font-pixel text-[10px] border-purple-500/50 text-purple-400 hover:bg-purple-600/20"
            >
              {isGenerating ? 'GENERANDO...' : 'REGENERAR'}
              {!isGenerating && <Sparkles size={12} className="ml-1" />}
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="font-pixel text-[9px] h-8 border-purple-500/30 text-purple-300 hover:bg-purple-600/10"
              >
                <Download size={14} className="mr-2" />
                EXPORTAR
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border font-pixel text-[10px]">
              <DropdownMenuLabel className="text-muted-foreground text-[8px] uppercase tracking-widest px-2 py-1.5">
                Opciones de Exportación
              </DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => handleExportPNG()} className="cursor-pointer gap-2 focus:bg-purple-500/10 focus:text-purple-300">
                <ImageIcon size={14} />
                PNG SPRITE SHEET
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleExportPNG({ includeLabels: true })} className="cursor-pointer gap-2 focus:bg-purple-500/10 focus:text-purple-300">
                <HardDrive size={14} />
                PNG CON ETIQUETAS
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem onClick={handleExportGIF} className="cursor-pointer gap-2 focus:bg-purple-500/10 focus:text-purple-300">
                <FileVideo size={14} />
                EXPORTAR GIF ({viewingAnimation.toUpperCase()})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleSave}
            size="sm"
            className="font-pixel text-[9px] h-8 bg-green-600 text-white hover:bg-green-500 border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
          >
            <Save size={14} className="mr-2" />
            GUARDAR
          </Button>
        </div>
      </div>
    </DialogHeader>
  );
});

EditorHeader.displayName = 'EditorHeader';
