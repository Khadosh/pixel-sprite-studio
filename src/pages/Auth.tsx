import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: 'Registro exitoso',
          description: 'Revisa tu correo para confirmar tu cuenta (o ingresa directamente si no está configurado).',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ha ocurrido un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, hsl(142 72% 50%) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Home
      </button>

      <div className="w-full max-w-md bg-card border border-border p-8 rounded-lg shadow-xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-pixel text-primary text-xl mb-2">
            PIXEL SPRITE STUDIO
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {isLogin ? 'Welcome back! Login to access your projects.' : 'Create an account to start creating pixel art projects.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="pixel@hero.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary/50 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-secondary/50 font-mono"
            />
          </div>

          <Button type="submit" className="w-full font-pixel text-xs py-5 bg-primary hover:bg-primary/80 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]" disabled={loading}>
            {loading ? 'PROCESANDO...' : isLogin ? 'INICIAR SESION' : 'REGISTRARSE'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
