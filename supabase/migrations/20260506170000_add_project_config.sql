ALTER TABLE public.projects 
ADD COLUMN config jsonb DEFAULT '{"directionality": "1-way", "aesthetics": "custom"}'::jsonb NOT NULL;
