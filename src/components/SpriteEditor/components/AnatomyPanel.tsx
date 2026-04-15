import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { RefreshCcw, Bone } from 'lucide-react';

export function AnatomyPanel() {
  const asset = useSpriteEditorStore(s => s.editedAsset);
  const setEditedAsset = useSpriteEditorStore(s => s.setEditedAsset);
  
  if (!asset) return null;

  const anatomy = asset.anatomy || {};
  const { neckRow, waistRow, torsoLeft, torsoRight } = anatomy;

  const handleUpdate = (updates: Partial<{ neckRow: number; waistRow: number; torsoLeft: number; torsoRight: number } | null>) => {
    const newAnatomy = updates === null ? undefined : { ...anatomy, ...updates };
    setEditedAsset(prev => ({ ...prev, anatomy: newAnatomy }));
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bone className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Advanced Anatomy</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={() => handleUpdate(null)}
          title="Reset to Auto"
        >
          <RefreshCcw className="w-3 h-3" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Fine-tune how procedural animations deform the body.
      </p>

      {/* Neck Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <Label className="text-sky-400 font-medium italic">Neck Row (Blue)</Label>
          <span className="font-mono bg-background px-1 rounded text-[10px]">
            {neckRow !== undefined ? neckRow : 'AUTO'}
          </span>
        </div>
        <Slider
          value={[neckRow !== undefined ? neckRow : Math.floor(asset.size * 0.35)]}
          min={0}
          max={asset.size - 1}
          step={1}
          onValueChange={([val]) => handleUpdate({ neckRow: val })}
        />
      </div>

      {/* Waist Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <Label className="text-[#FF7F50] font-medium italic">Waist Row (Coral)</Label>
          <span className="font-mono bg-background px-1 rounded text-[10px]">
            {waistRow !== undefined ? waistRow : 'AUTO'}
          </span>
        </div>
        <Slider
          value={[waistRow !== undefined ? waistRow : Math.floor(asset.size * 0.7)]}
          min={0}
          max={asset.size - 1}
          step={1}
          onValueChange={([val]) => handleUpdate({ waistRow: val })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        {/* Torso Left Control */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1 text-[10px]">
            <Label className="text-purple-400 font-medium">Torso L (Purple)</Label>
            <span className="font-mono bg-background px-1 rounded self-start">
              {torsoLeft !== undefined ? torsoLeft : 'AUTO'}
            </span>
          </div>
          <Slider
            value={[torsoLeft !== undefined ? torsoLeft : Math.floor(asset.size * 0.3)]}
            min={0}
            max={asset.size - 1}
            step={1}
            onValueChange={([val]) => handleUpdate({ torsoLeft: val })}
          />
        </div>

        {/* Torso Right Control */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1 text-[10px]">
            <Label className="text-orange-400 font-medium">Torso R (Orange)</Label>
            <span className="font-mono bg-background px-1 rounded self-start">
              {torsoRight !== undefined ? torsoRight : 'AUTO'}
            </span>
          </div>
          <Slider
            value={[torsoRight !== undefined ? torsoRight : Math.floor(asset.size * 0.7)]}
            min={0}
            max={asset.size - 1}
            step={1}
            onValueChange={([val]) => handleUpdate({ torsoRight: val })}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-border/20">
        <p className="text-[9px] leading-tight text-muted-foreground grid grid-cols-2 gap-y-1">
          <span><span className="text-sky-400 font-bold">●</span> Neck Pivot</span>
          <span><span className="text-[#FF7F50] font-bold">●</span> Waist/Legs</span>
          <span><span className="text-purple-400 font-bold">●</span> Left Shoulder</span>
          <span><span className="text-orange-400 font-bold">●</span> Right Shoulder</span>
        </p>
      </div>
    </div>
  );
}
