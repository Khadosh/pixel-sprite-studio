import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Project, ProjectSprite } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { PaletteProvider } from '@/hooks/usePalette';
import SpriteSheetCanvas from '@/components/SpriteSheetCanvas';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [sprites, setSprites] = useState<ProjectSprite[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Button 
            onClick={() => navigate(`/catalog?projectId=${project.id}`)}
            className="font-pixel text-xs bg-primary text-primary-foreground hover:bg-primary/80 transition-all border border-primary/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          >
            <Plus size={16} className="mr-2" />
            AGREGAR DESDE CATALOGO
          </Button>
        </div>

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
