import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan variables de entorno para Supabase. Verifica tu archivo .env.local');
}

// Inicialización de Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Tipos de Base de Datos para el proyecto
export interface ProjectConfig {
  directionality: '1-way' | '4-way';
  aesthetics: '8-bit' | '16-bit' | 'gameboy' | 'fantasy' | 'sci-fi' | 'cyberpunk' | 'custom';
}

export interface Project {
  id: string;
  created_at: string;
  name: string;
  user_id: string;
  slug: string;
  config: ProjectConfig;
}

export interface ProjectSprite {
  id: string;
  created_at: string;
  project_id: string;
  slug: string;
  asset_data: any; // Aquí guardaremos todo el JSON del SpriteAsset
}
