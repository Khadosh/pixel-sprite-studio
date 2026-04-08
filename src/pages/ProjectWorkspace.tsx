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

  // Creation panel state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [canvasSize, setCanvasSize] = useState<16 | 32>(16);
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
    await generate(generatePrompt.trim(), canvasSize);
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
          setShowCreator(false);
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
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => { setShowCreator(!showCreator); clearGenerated(); }}
              className="font-pixel text-xs bg-primary text-primary-foreground hover:brightness-110 transition-all border border-primary shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            >
              <Sparkles size={16} className="mr-2" />
              CREAR SPRITE
            </Button>
          </div>
        </div>

        {/* Unified Creation Panel */}
        {showCreator && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Resolution Header */}
            <div className="flex items-center justify-between bg-card/50 border border-border p-3 rounded-xl px-4">
              <div className="flex items-center gap-3">
                <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-widest">Resolución del lienzo:</span>
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border">
                  {[16, 32].map((s) => (
                    <button
                      key={s}
                      onClick={() => setCanvasSize(s as 16 | 32)}
                      className={`font-pixel text-[8px] px-4 py-1.5 rounded-md transition-all ${canvasSize === s ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                    >
                      {s}×{s}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => { setShowCreator(false); clearGenerated(); }} 
                className="text-muted-foreground hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: AI (Premium Violet) */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 shadow-[0_0_30px_rgba(168,85,247,0.15)]"></div>
                <div className="relative bg-card border border-purple-500/30 p-5 rounded-2xl flex flex-col h-full space-y-4 transition-all hover:border-purple-500/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/20">
                        <Sparkles className="text-purple-400" size={18} />
                      </div>
                      <span className="bg-purple-500/20 text-purple-300 text-[7px] font-pixel px-2 py-0.5 rounded-full border border-purple-500/30 tracking-tighter">PREMIUM</span>
                    </div>
                    <h3 className="font-pixel text-xs text-purple-100 tracking-wider pt-2">MAGIA DE IA</h3>
                    <p className="font-mono text-[9px] text-purple-200/60 leading-relaxed">Describe tu idea y deja que la red neuronal genere un asset único para ti.</p>
                  </div>
                  
                  <form onSubmit={handleGenerate} className="space-y-2 pt-2 mt-auto">
                    <Input
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      placeholder="ej: un dragón rojo..."
                      className="bg-purple-950/20 border-purple-500/20 font-mono text-[10px] h-8 focus-visible:ring-purple-500"
                      maxLength={500}
                      disabled={isGenerating}
                    />
                    <Button
                      type="submit"
                      disabled={isGenerating || !generatePrompt.trim()}
                      className="w-full font-pixel text-[9px] bg-purple-600 hover:bg-purple-500 text-white border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    >
                      {isGenerating ? (
                        <Loader2 size={12} className="animate-spin mr-2" />
                      ) : (
                        "GENERAR AHORA"
                      )}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Card 2: Catalog (Standard Green) */}
              <div 
                onClick={() => navigate(`/catalog?projectId=${project.id}&size=${canvasSize}`)}
                className="bg-card border border-primary/20 p-5 rounded-2xl flex flex-col h-full space-y-4 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="space-y-2">
                  <div className="bg-primary/10 p-2 rounded-lg border border-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <ImageIcon className="text-primary" size={18} />
                  </div>
                  <h3 className="font-pixel text-xs text-primary/90 tracking-wider pt-2">BIBLIOTECA</h3>
                  <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">Explora cientos de sprites pre-diseñados listos para tu proyecto.</p>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between text-primary font-pixel text-[8px] opacity-60 group-hover:opacity-100 transition-opacity">
                  <span>EXPLORAR CATÁLOGO</span>
                  <ArrowLeft size={10} className="rotate-180" />
                </div>
              </div>

              {/* Card 3: Scratch (Standard Bluish) */}
              <div 
                onClick={() => {
                  const s = canvasSize;
                  const blank: SpriteAsset = {
                    id: crypto.randomUUID(),
                    name: 'New Sprite',
                    description: 'Blank sprite created from scratch',
                    category: 'character',
                    size: s,
                    palette: { 0: 'transparent', 1: '#1a1a2e', 2: '#f0c38e', 3: '#5c3a21', 4: '#2d6a4f', 5: '#3a3a5c', 6: '#4a2c1a', 7: '#c0c0c0', 8: '#1a1a2e', 9: '#e63946' },
                    colorNames: { 1: 'Outline', 2: 'Skin', 3: 'Hair', 4: 'Shirt', 5: 'Pants', 6: 'Shoes', 7: 'Sword', 8: 'Eyes', 9: 'Hurt' },
                    layers: [{
                      id: 'layer-1',
                      name: 'Base',
                      isVisible: true,
                      isLocked: false,
                      opacity: 1,
                      frames: [Array.from({ length: s }, () => Array(s).fill(0))]
                    }],
                    animations: [{ name: 'idle', label: 'IDLE', frameIndices: [0], fps: 5 }],
                    tags: [],
                  };
                  setEditorAsset(blank);
                  setEditorIsNew(true);
                  setEditingSpriteId(null);
                  setEditorOpen(true);
                }}
                className="bg-card border border-blue-500/20 p-5 rounded-2xl flex flex-col h-full space-y-4 hover:border-blue-500/50 transition-all cursor-pointer group"
              >
                <div className="space-y-2">
                  <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/10 w-fit group-hover:bg-blue-500/20 transition-colors">
                    <Plus className="text-blue-400" size={18} />
                  </div>
                  <h3 className="font-pixel text-xs text-blue-100 tracking-wider pt-2">DESDE CERO</h3>
                  <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">Dibuja cada píxel manualmente con total control artístico sobre el lienzo.</p>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between text-blue-400 font-pixel text-[8px] opacity-60 group-hover:opacity-100 transition-opacity">
                  <span>LIENZO EN BLANCO</span>
                  <ArrowLeft size={10} className="rotate-180" />
                </div>
              </div>
            </div>

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
                    className="group bg-secondary/30 rounded-lg border border-border overflow-hidden relative cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
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
          onRegenerate={editorIsNew ? () => generate(generatePrompt, canvasSize) : undefined}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
