import React from 'react';
import { PxFilm, PxLayers, PxPalette, PxSword, PxSettings } from '@/components/icons/PixelIcon';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bone } from 'lucide-react';

export const EditorSidebarNavigator = () => {
  const activeTab = useSpriteEditorStore(s => s.leftSidebarTab);
  const setTab = useSpriteEditorStore(s => s.setLeftSidebarTab);

  const tabs = [
    { id: 'animations', icon: PxFilm, label: 'ANIMS' },
    { id: 'layers', icon: PxLayers, label: 'LAYERS' },
    { id: 'anatomy', icon: Bone, label: 'BONES' },
    { id: 'themes', icon: PxPalette, label: 'THEMES' },
    { id: 'assets', icon: PxSword, label: 'ASSETS' },
    { id: 'config', icon: PxSettings, label: 'CONFIG' },
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
                  <tab.icon size={20} />
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
