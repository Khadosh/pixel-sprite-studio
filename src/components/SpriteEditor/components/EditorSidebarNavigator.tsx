import React from 'react';
import { Layers, Palette, Sword, Film } from 'lucide-react';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const EditorSidebarNavigator = () => {
  const activeTab = useSpriteEditorStore(s => s.leftSidebarTab);
  const setTab = useSpriteEditorStore(s => s.setLeftSidebarTab);

  const tabs = [
    { id: 'layers', icon: Layers, label: 'LAYERS' },
    { id: 'animations', icon: Film, label: 'ANIMS' },
    { id: 'themes', icon: Palette, label: 'THEMES' },
    { id: 'assets', icon: Sword, label: 'ASSETS' },
  ] as const;

  return (
    <div className="w-[60px] flex-shrink-0 bg-background/90 border-r border-border flex flex-col items-center py-6 gap-8 select-none order-first">
      <TooltipProvider delayDuration={0}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <div key={tab.id} className="flex flex-col items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="icon"
                    className={`w-10 h-10 transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.15)] scale-110' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                    onClick={() => setTab(tab.id)}
                  >
                    <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <span className="font-pixel text-[10px] uppercase">{tab.label}</span>
                </TooltipContent>
              </Tooltip>

              <button 
                onClick={() => setTab(tab.id)}
                className={`transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="[writing-mode:vertical-rl] rotate-180 font-pixel text-[8px] tracking-[0.2em] uppercase py-1">
                  {tab.label}
                </span>
              </button>
            </div>
          );
        })}
      </TooltipProvider>
    </div>
  );
};
