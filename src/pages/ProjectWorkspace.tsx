import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Project, ProjectSprite } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Image as ImageIcon, Trash2, Sparkles, Loader2, X } from 'lucide-react';
import { PaletteProvider } from '@/hooks/usePalette';
import SpriteSheetCanvas from '@/components/SpriteSheetCanvas';
import SpritePreview from '@/components/SpritePreview';
import { useGenerateSprite } from '@/hooks/useGenerateSprite';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [sprites, setSprites] = useState<ProjectSprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedAnims, setSelectedAnims] = useState<string[]>(['idle', 'walk']);
  const { isGenerating, error: generateError, result: generatedSprite, generate, clear: clearGenerated } = useGenerateSprite();

  const AVAILABLE_ANIMS = [
    { value: 'idle', label: 'Idle', desc: 'Respiración sutil' },
    { value: 'walk', label: 'Walk', desc: 'Caminar' },
    { value: 'attack', label: 'Attack', desc: 'Ataque con arma' },
    { value: 'cast', label: 'Cast', desc: 'Lanzar hechizo' },
    { value: 'hurt', label: 'Hurt', desc: 'Recibir daño' },
    { value: 'jump', label: 'Jump', desc: 'Saltar' },
  ];

  const toggleAnim = (anim: string) => {
    setSelectedAnims(prev =>
      prev.includes(anim)
        ? prev.filter(a => a !== anim)
        : prev.length < 4 ? [...prev, anim] : prev
    );
  };

  useEffect(() => {
    if (id && user) {
      fetchProjectData();
    }
  }, [id, user]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      // Get project details
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (projError) throw projError;
      setProject(projData);

      // Get project sprites
      const { data: spriteData, error: spriteError } = await supabase
        .from('project_sprites')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (spriteError) throw spriteError;
      setSprites(spriteData || []);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSprite = async (spriteId: string) => {
    try {
      const { error } = await supabase
        .from('project_sprites')
        .delete()
        .eq('id', spriteId);
      
      if (error) throw error;
      setSprites(sprites.filter(s => s.id !== spriteId));
      toast({ title: 'Eliminado', description: 'El sprite fue eliminado del proyecto.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatePrompt.trim() || isGenerating) return;
    await generate(generatePrompt.trim(), selectedAnims);
  };

  const handleSaveGenerated = async () => {
    if (!generatedSprite) return;
    try {
      const { data, error } = await supabase
        .from('project_sprites')
        .insert([{ project_id: id, asset_data: generatedSprite }])
        .select()
        .single();

      if (error) throw error;
      setSprites([data, ...sprites]);
      clearGenerated();
      setGeneratePrompt('');
      setShowGenerator(false);
      toast({ title: 'Sprite guardado', description: 'El sprite generado se guardó en tu proyecto.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
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

            <form onSubmit={handleGenerate} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="Describe tu sprite... ej: a red dragon, a treasure chest, a water tile"
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
              </div>
              <div className="space-y-2">
                <span className="font-mono text-xs text-muted-foreground">
                  Animaciones (2 frames c/u, max 4):
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ANIMS.map(anim => {
                    const active = selectedAnims.includes(anim.value);
                    return (
                      <button
                        key={anim.value}
                        type="button"
                        onClick={() => toggleAnim(anim.value)}
                        disabled={isGenerating}
                        className={`px-3 py-1.5 text-[10px] font-pixel rounded border transition-all ${
                          active
                            ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                            : 'bg-secondary/30 border-border text-muted-foreground hover:border-purple-500/50'
                        } disabled:opacity-50`}
                        title={anim.desc}
                      >
                        {anim.label.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                {selectedAnims.length === 0 && (
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    Sin animaciones = sprite estático (1 frame)
                  </span>
                )}
              </div>
            </form>

            {generateError && (
              <div className="text-sm font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded p-3">
                {generateError}
              </div>
            )}

            {generatedSprite && (
              <div className="border border-purple-500/20 rounded-lg p-4 space-y-4 bg-secondary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-pixel text-xs text-foreground tracking-wider">{generatedSprite.name.toUpperCase()}</h3>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">{generatedSprite.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveGenerated} className="font-pixel text-[10px] bg-primary text-primary-foreground hover:bg-primary/80 border border-primary">
                      GUARDAR EN PROYECTO
                    </Button>
                    <Button onClick={() => clearGenerated()} variant="outline" className="font-pixel text-[10px]">
                      DESCARTAR
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="bg-card rounded border border-border p-3">
                    <PaletteProvider defaultPalette={generatedSprite.palette}>
                      <SpriteSheetCanvas asset={generatedSprite} />
                    </PaletteProvider>
                  </div>
                  {generatedSprite.animations.length > 0 && (
                    <div className="bg-card rounded border border-border p-3">
                      <PaletteProvider defaultPalette={generatedSprite.palette}>
                        <SpritePreview asset={generatedSprite} />
                      </PaletteProvider>
                    </div>
                  )}
                </div>
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
               <p className="font-mono text-muted-foreground text-[10px] max-w-sm mb-6">Explora el catálogo o usa una plantilla para añadir sprites a tu proyecto.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sprites.map((s) => {
                const asset = s.asset_data;
                return (
                  <div key={s.id} className="group bg-secondary/30 rounded-lg border border-border overflow-hidden relative">
                    <button 
                      onClick={() => handleDeleteSprite(s.id)}
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
                      <p className="font-mono text-[8px] text-muted-foreground">Guardado: {new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
