import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectSprite } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Image as ImageIcon, Trash2, Sparkles, Loader2, X } from 'lucide-react';
import { PaletteProvider } from '@/hooks/usePalette';
import SpriteSheetCanvas from '@/components/SpriteSheetCanvas';
import { useGenerateSprite } from '@/hooks/useGenerateSprite';
import { SpriteEditorModal } from '@/components/SpriteEditor';
import type { SpriteAsset } from '@/lib/types';
import { useProject, useProjectSprites, useCreateSprite, useUpdateSprite, useDeleteSprite } from '@/hooks/useProjectQueries';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: project, isLoading: isProjectLoading, error: projectError } = useProject(id);
  const { data: sprites = [], isLoading: isSpritesLoading } = useProjectSprites(id);
  
  const createSpriteMutation = useCreateSprite();
  const updateSpriteMutation = useUpdateSprite();
  const deleteSpriteMutation = useDeleteSprite();

  // Generation state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const { isGenerating, error: generateError, result: generatedSprite, generate, clear: clearGenerated } = useGenerateSprite();

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAsset, setEditorAsset] = useState<SpriteAsset | null>(null);
  const [editorIsNew, setEditorIsNew] = useState(false); // true = saving new, false = updating existing
  const [editingSpriteId, setEditingSpriteId] = useState<string | null>(null);

  // When generation completes, open editor
  useEffect(() => {
    if (generatedSprite) {
      setEditorAsset(generatedSprite);
      setEditorIsNew(true);
      setEditingSpriteId(null);
      setEditorOpen(true);
    }
  }, [generatedSprite]);

  // Handle project loading error
  useEffect(() => {
    if (projectError) {
      toast({ title: 'Error', description: (projectError as Error).message, variant: 'destructive' });
      navigate('/dashboard');
    }
  }, [projectError, toast, navigate]);

  const handleDeleteSprite = async (e: React.MouseEvent, spriteId: string) => {
    e.stopPropagation();
    if (!id) return;
    
    deleteSpriteMutation.mutate({ id: spriteId, projectId: id }, {
      onSuccess: () => {
        toast({ title: 'Eliminado' });
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatePrompt.trim() || isGenerating) return;
    await generate(generatePrompt.trim());
  };

  const handleOpenEditorForSprite = (sprite: ProjectSprite) => {
    setEditorAsset(sprite.asset_data as SpriteAsset);
    setEditorIsNew(false);
    setEditingSpriteId(sprite.id);
    setEditorOpen(true);
  };

  const handleEditorSave = async (asset: SpriteAsset) => {
    if (!id) return;

    if (editorIsNew) {
      createSpriteMutation.mutate({ projectId: id, asset }, {
        onSuccess: () => {
          clearGenerated();
          setGeneratePrompt('');
          setShowGenerator(false);
          toast({ title: 'Sprite guardado', description: 'El sprite se guardó en tu proyecto.' });
        },
        onError: (error: any) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
      });
    } else if (editingSpriteId) {
      updateSpriteMutation.mutate({ id: editingSpriteId, projectId: id, asset }, {
        onSuccess: () => {
          toast({ title: 'Sprite actualizado' });
        },
        onError: (error: any) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
      });
    }

    setEditorOpen(false);
    setEditorAsset(null);
    setEditingSpriteId(null);
  };

  if (isProjectLoading || isSpritesLoading) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary font-pixel text-xs">CARGANDO WORKSPACE...</div>;
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </button>
            <h1 className="font-pixel text-foreground text-xl md:text-2xl tracking-wider">
              {project.name.toUpperCase()}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => { setShowGenerator(!showGenerator); clearGenerated(); }}
              className="font-pixel text-xs bg-purple-600 text-white hover:bg-purple-500 transition-all border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)]"
            >
              <Sparkles size={16} className="mr-2" />
              GENERAR CON IA
            </Button>
            <Button
              onClick={() => navigate(`/catalog?projectId=${project.id}`)}
              className="font-pixel text-xs bg-primary text-primary-foreground hover:bg-primary/80 transition-all border border-primary/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            >
              <Plus size={16} className="mr-2" />
              DESDE CATALOGO
            </Button>
          </div>
        </div>

        {/* AI Generation Panel */}
        {showGenerator && (
          <div className="bg-card border border-purple-500/30 p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <h2 className="font-pixel text-[10px] text-purple-400 tracking-wider">GENERAR SPRITE CON IA</h2>
              </div>
              <button onClick={() => { setShowGenerator(false); clearGenerated(); }} className="text-muted-foreground hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="flex gap-2">
              <Input
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="Describe tu sprite... ej: a red dragon, an old wizard, a treasure chest"
                className="bg-secondary/50 font-mono flex-1"
                maxLength={500}
                disabled={isGenerating}
              />
              <Button
                type="submit"
                disabled={isGenerating || !generatePrompt.trim()}
                className="font-pixel text-[10px] bg-purple-600 text-white hover:bg-purple-500 border border-purple-500 whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    GENERANDO...
                  </>
                ) : (
                  'GENERAR'
                )}
              </Button>
            </form>

            <p className="font-mono text-[10px] text-muted-foreground">
              Se genera 1 frame base. Luego podras editarlo y agregar animaciones.
            </p>

            {generateError && (
              <div className="text-sm font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded p-3">
                {generateError}
              </div>
            )}
          </div>
        )}

        {/* Sprites Grid */}
        <div className="bg-card border border-border p-6 md:p-8 rounded-lg min-h-[50vh]">
          <h2 className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-6">SPRITES GUARDADOS</h2>

          {sprites.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="text-muted-foreground/50" />
              </div>
              <p className="font-pixel text-muted-foreground text-xs mb-2">PROYECTO VACIO</p>
              <p className="font-mono text-muted-foreground text-[10px] max-w-sm mb-6">Genera un sprite con IA o agrega uno desde el catalogo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sprites.map((s) => {
                const asset = s.asset_data as SpriteAsset;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleOpenEditorForSprite(s)}
                    className="group bg-secondary/30 rounded-lg border border-border overflow-hidden relative cursor-pointer hover:border-purple-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(147,51,234,0.1)]"
                  >
                    <button
                      onClick={(e) => handleDeleteSprite(e, s.id)}
                      className="absolute top-2 right-2 p-1.5 bg-background border border-border rounded text-muted-foreground hover:text-destructive hover:border-destructive opacity-0 group-hover:opacity-100 transition-all z-10"
                      title="Eliminar del proyecto"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="aspect-square bg-secondary/50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                      <div className="scale-75 origin-center pointer-events-none">
                        <PaletteProvider defaultPalette={asset.palette}>
                          <SpriteSheetCanvas asset={asset} />
                        </PaletteProvider>
                      </div>
                    </div>
                    <div className="p-3 border-t border-border">
                      <h3 className="font-pixel text-[10px] text-foreground tracking-wider truncate mb-1">
                        {asset.name.toUpperCase()}
                      </h3>
                      <p className="font-mono text-[8px] text-muted-foreground">
                        {asset.layers?.[0]?.frames.length || asset.frames?.length || 0} frame{(asset.layers?.[0]?.frames.length || asset.frames?.length || 0) !== 1 ? 's' : ''} · Click para editar
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {editorAsset && (
        <SpriteEditorModal
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) { setEditorAsset(null); setEditingSpriteId(null); }
          }}
          initialAsset={editorAsset}
          onSave={handleEditorSave}
          generatePrompt={editorIsNew && generatePrompt ? generatePrompt : undefined}
          onRegenerate={editorIsNew ? () => generate(generatePrompt) : undefined}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
