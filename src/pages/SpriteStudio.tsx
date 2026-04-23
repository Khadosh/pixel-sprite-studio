import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject, useSprite, useUpdateSprite } from '@/hooks/useProjectQueries';
import { SpriteEditorStoreProvider, useSpriteEditorStore, useSpriteEditorStoreApi } from '@/components/SpriteEditor/context/SpriteEditorContext';
import { createSpriteEditorStore } from '@/components/SpriteEditor/store/useSpriteEditorStore';
import { EditorLayout } from '@/components/SpriteEditor/components/EditorLayout';
import { AnimationPreviewPanelHandle } from '@/components/SpriteEditor/components/AnimationPreviewPanel';
import { SpriteAsset } from '@/lib/types';
import { PxArrowLeft, PxLoader, PxCheck, PxSave, PxDownload, PxImage, PxFileVideo, PxHardDrive, PxUpload } from '@/components/icons/PixelIcon';
import { useToast } from '@/hooks/use-toast';
import { useStore } from 'zustand';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { ImportImageModal } from '@/components/SpriteEditor/components/ImportImageModal';
import { createSpec, parseSpec } from '@/lib/slugUtils';

export default function SpriteStudio() {
  const { projectSlug, spriteSlug } = useParams<{ projectSlug: string; spriteSlug: string }>();
  const projectId = parseSpec(projectSlug || '');
  const spriteId = parseSpec(spriteSlug || '');
  const navigate = useNavigate();
  const { toast } = useToast();
  const previewPanelRef = useRef<AnimationPreviewPanelHandle>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // 1. Load Project and then Sprite Data
  const { data: project, isLoading: isProjectLoading } = useProject(projectSlug);
  const { data: sprite, isLoading: isSpriteLoading, error } = useSprite(spriteId, project?.id);

  const isLoading = isProjectLoading || isSpriteLoading;
  const updateSpriteMutation = useUpdateSprite();

  // 2. Local State for Store
  const [store, setStore] = useState<any>(null);

  // Reset store if we switch to a different sprite (handles navigation between assets)
  useEffect(() => {
    setStore(null);
  }, [spriteId]);

  // Initialize store once sprite is loaded
  useEffect(() => {
    if (sprite && !store) {
      const realProjectId = (sprite as any).project_id || projectId;
      const newStore = createSpriteEditorStore({
        initialAsset: sprite.asset_data as SpriteAsset,
        projectId: realProjectId,
        onSave: (asset) => {
          handleManualSave(asset);
        },
        onOpenChange: (open) => {
          if (!open) navigate(`/project/${projectSlug}`);
        },
        previewPanelRef,
      });
      setStore(newStore);
    }
  }, [sprite, store, projectId, projectSlug, navigate]);

  // Handle Manual Save
  const handleManualSave = async (asset: SpriteAsset) => {
    const realSpriteId = sprite?.id || spriteId;
    const realProjectId = (sprite as any)?.project_id || projectId;
    
    if (!realSpriteId || !realProjectId) return;
    
    try {
      await updateSpriteMutation.mutateAsync({ 
        id: realSpriteId, 
        projectId: realProjectId, 
        asset 
      });
      toast({ title: 'Checkpoint guardado', description: 'Nueva versión creada en la nube.' });
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    }
  };

  // 3. Debounced Autosave
  useEffect(() => {
    if (!store) return;

    let timeoutId: NodeJS.Timeout;

    const unsub = store.subscribe((state: any, prevState: any) => {
      if (state.editedAsset !== prevState.editedAsset && state.isDirty) {
        const realSpriteId = sprite?.id || spriteId;
        const realProjectId = (sprite as any)?.project_id || projectId;

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateSpriteMutation.mutate({ 
            id: realSpriteId, 
            projectId: realProjectId, 
            asset: state.editedAsset 
          }, {
            onSuccess: () => {
              store.getState().setIsDirty(false);
            }
          });
        }, 3000); 
      }
    });

    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, [store, spriteId, projectId]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-4">
        <PxLoader className="animate-spin text-primary" size={32} />
        <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-widest animate-pulse">
          Cargando Studio...
        </span>
      </div>
    );
  }

  if (error || !sprite) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-4">
        <span className="font-pixel text-destructive text-xs uppercase">Error al cargar el sprite</span>
        <Link to={`/project/${projectSlug}`} className="text-primary hover:underline font-mono text-[10px]">
          Volver al proyecto
        </Link>
      </div>
    );
  }

  if (!store) return null;

  return (
    <SpriteEditorStoreProvider store={store}>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        <StudioHeader 
          projectSlug={projectSlug || ''} 
          updateSpriteMutation={updateSpriteMutation}
          onShowImport={() => setShowImportModal(true)}
        />
        <EditorLayout hideHeader={true} />
        <ImportImageModal open={showImportModal} onOpenChange={setShowImportModal} />
      </div>
    </SpriteEditorStoreProvider>
  );
}

function StudioHeader({ 
  projectSlug, 
  updateSpriteMutation,
  onShowImport
}: { 
  projectSlug: string, 
  updateSpriteMutation: any,
  onShowImport: () => void
}) {
  const store = useSpriteEditorStoreApi();
  const assetName = useSpriteEditorStore(s => s.assetName);
  const setAssetName = useSpriteEditorStore(s => s.setAssetName);
  const viewingAnimation = useSpriteEditorStore(s => s.viewingAnimation);
  
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  return (
    <div className="flex-shrink-0 bg-secondary/20 border-b border-border px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link 
          to={`/project/${projectSlug}`}
          className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
          title="Volver al proyecto"
        >
          <PxArrowLeft size={16} />
        </Link>
        <div className="h-4 w-[1px] bg-border" />
        <div className="flex items-center gap-2 font-pixel text-[9px] tracking-tight">
          <span className="text-muted-foreground opacity-50 uppercase">STUDIO</span>
          <span className="text-muted-foreground">/</span>
          <div 
            className="relative cursor-text px-2 py-1 rounded transition-colors hover:bg-white/5"
            onDoubleClick={() => setIsEditing(true)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                className="bg-transparent border-none outline-none text-primary uppercase font-pixel text-[9px] w-64 h-4 leading-none"
                value={assetName || ''}
                onChange={(e) => setAssetName?.(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditing(false);
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
            ) : (
              <span className="text-primary uppercase font-pixel text-[9px] truncate max-w-[250px] block h-4 leading-none flex items-center">
                {assetName || 'SIN NOMBRE'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
         {updateSpriteMutation.isPending && (
           <div className="flex items-center gap-2 text-muted-foreground">
             <PxLoader size={12} className="animate-spin" />
             <span className="font-mono text-[8px] uppercase">Autoguardando...</span>
           </div>
         )}
         {updateSpriteMutation.isSuccess && !updateSpriteMutation.isPending && (
           <div className="flex items-center gap-2 text-primary/60">
             <PxCheck size={12} />
             <span className="font-mono text-[8px] uppercase tracking-tighter">Sincronizado</span>
           </div>
         )}
         
         <div className="h-4 w-[1px] bg-border mx-1" />

         <Button
           variant="outline"
           size="sm"
           className="font-pixel text-[9px] h-8 border-primary/30 text-green-300 hover:bg-primary/10 transition-all"
           onClick={onShowImport}
         >
           <PxUpload size={15} className="mr-2" />
           IMPORTAR
         </Button>
         
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

            <DropdownMenuItem onClick={() => store.getState().handleExportPNG()} className="cursor-pointer gap-2 focus:bg-primary/10 focus:text-primary transition-colors">
              <PxImage size={14} />
              PNG SPRITE SHEET
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => store.getState().handleExportPNG({ includeLabels: true })} className="cursor-pointer gap-2 focus:bg-primary/10 focus:text-primary transition-colors">
              <PxHardDrive size={14} />
              PNG CON ETIQUETAS
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border" />

            <DropdownMenuItem onClick={() => store.getState().handleExportGIF()} className="cursor-pointer gap-2 focus:bg-primary/10 focus:text-primary transition-colors">
              <PxFileVideo size={14} />
              EXPORTAR GIF ({viewingAnimation.toUpperCase()})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

         <Button
           size="sm"
           className="h-8 font-pixel text-[9px] bg-green-600 text-white hover:bg-green-500 border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all px-4"
           onClick={() => {
             store.getState().createCheckpoint('Guardado Manual');
             store.getState().handleSave();
           }}
         >
           <PxSave size={14} className="mr-2" />
           GUARDAR
         </Button>
      </div>
    </div>
  );
}
