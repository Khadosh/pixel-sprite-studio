import React from 'react';
import { Layers, Palette, Sword, Film } from 'lucide-react';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const EditorSidebarNavigator = () => {
  const activeTab = useSpriteEditorStore(s => s.leftSidebarTab);
  const setTab = useSpriteEditorStore(s => s.setLeftSidebarTab);

  const tabs = [
    { id: 'animations', icon: Film, label: 'ANIMS' },
    { id: 'layers', icon: Layers, label: 'LAYERS' },
    { id: 'themes', icon: Palette, label: 'THEMES' },
    { id: 'assets', icon: Sword, label: 'ASSETS' },
  ] as const;

  return (
    <div className="w-[64px] flex-shrink-0 bg-background/90 border-l border-border flex flex-col items-center py-6 gap-6 select-none">
      <TooltipProvider delayDuration={0}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-12 h-auto flex flex-col items-center gap-3 py-4 transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.15)] scale-105' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                  onClick={() => setTab(tab.id)}
                >
                  <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="[writing-mode:vertical-rl] rotate-180 font-pixel text-[9px] tracking-[0.2em] uppercase">
                    {tab.label}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={10}>
                <span className="font-pixel text-[10px] uppercase">{tab.label}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
};
