import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSpriteEditorStore } from '../context/SpriteEditorContext';
import { RefreshCcw, Bone } from 'lucide-react';
import type { AnatomyConfig } from '@/lib/types';

export function AnatomyPanel() {
  const asset = useSpriteEditorStore(s => s.editedAsset);
  const setEditedAsset = useSpriteEditorStore(s => s.setEditedAsset);
  
  if (!asset) return null;

  const anatomy = asset.anatomy || {};
  const { neckRow, waistRow, ankleRow, torsoLeft, torsoRight } = anatomy;

  const handleUpdate = (updates: Partial<AnatomyConfig> | null) => {
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

      <div className="bg-sky-500/10 border border-sky-500/30 rounded p-2 text-[10px] text-sky-200 flex gap-2 items-start">
        <span className="text-sky-400 font-bold shrink-0">TIP:</span>
        <p>You can now drag the guide lines directly on the canvas for faster adjustment.</p>
      </div>

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

      {/* Knee Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <Label className="text-pink-400 font-medium italic">Knee Row (Pink)</Label>
          <span className="font-mono bg-background px-1 rounded text-[10px]">
            {anatomy.kneeRow !== undefined ? anatomy.kneeRow : 'AUTO'}
          </span>
        </div>
        <Slider
          value={[anatomy.kneeRow !== undefined ? anatomy.kneeRow : Math.floor(asset.size * 0.85)]}
          min={0}
          max={asset.size - 1}
          step={1}
          onValueChange={([val]) => handleUpdate({ kneeRow: val })}
        />
      </div>

      {/* Ankle Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <Label className="text-[#A3E635] font-medium italic">Ankle Row (Lime)</Label>
          <span className="font-mono bg-background px-1 rounded text-[10px]">
            {ankleRow !== undefined ? ankleRow : 'AUTO'}
          </span>
        </div>
        <Slider
          value={[ankleRow !== undefined ? ankleRow : Math.floor(asset.size * 0.9)]}
          min={0}
          max={asset.size - 1}
          step={1}
          onValueChange={([val]) => handleUpdate({ ankleRow: val })}
        />
      </div>

      {/* Center Column Control */}
      <div className="space-y-2 pt-2 border-t border-border/10">
        <div className="flex justify-between items-center text-xs">
          <Label className="text-yellow-400 font-medium italic underline decoration-dotted">Body Center Axis (Yellow)</Label>
          <span className="font-mono bg-background px-1 rounded text-[10px]">
            {anatomy.torsoCenterCol !== undefined ? anatomy.torsoCenterCol : 'AUTO'}
          </span>
        </div>
        <Slider
          value={[anatomy.torsoCenterCol !== undefined ? anatomy.torsoCenterCol : Math.floor(asset.size / 2)]}
          min={0}
          max={asset.size - 1}
          step={1}
          onValueChange={([val]) => handleUpdate({ torsoCenterCol: val })}
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

      <div className="pt-2 border-t border-border/20 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
          <Bone className="w-3 h-3" />
          <span>Independent Limbs</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
           {/* Arm Area Control (Simple Version for now) */}
           <div className="space-y-3">
              <Label className="text-[10px] text-muted-foreground italic">Manual limb areas allow for independent movement (e.g. side walk).</Label>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[10px] h-7 gap-2"
                onClick={() => {
                  if (anatomy.leftArmArea) {
                     handleUpdate({ leftArmArea: undefined, rightArmArea: undefined });
                  } else {
                    handleUpdate({
                      leftArmArea: { startR: neckRow || 0, endR: waistRow || 16, startC: 0, endC: (torsoLeft || 8) - 1 },
                      rightArmArea: { startR: neckRow || 0, endR: waistRow || 16, startC: (torsoRight || 24) + 1, endC: asset.size - 1 }
                    });
                  }
                }}
              >
                {anatomy.leftArmArea ? 'Reset to Auto Arms' : 'Enable Manual Arms'}
              </Button>

              {anatomy.leftArmArea && (
                <div className="space-y-4 pt-2 border-t border-border/10">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-purple-400">Left Arm Verticals (Top-Bottom)</Label>
                    <Slider
                      value={[anatomy.leftArmArea.startR, anatomy.leftArmArea.endR]}
                      min={0}
                      max={asset.size - 1}
                      step={1}
                      onValueChange={([s, e]) => handleUpdate({ 
                        leftArmArea: { ...anatomy.leftArmArea!, startR: s, endR: e } 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-orange-400">Right Arm Verticals (Top-Bottom)</Label>
                    <Slider
                      value={[anatomy.rightArmArea!.startR, anatomy.rightArmArea!.endR]}
                      min={0}
                      max={asset.size - 1}
                      step={1}
                      onValueChange={([s, e]) => handleUpdate({ 
                        rightArmArea: { ...anatomy.rightArmArea!, startR: s, endR: e } 
                      })}
                    />
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/20">
        <p className="text-[9px] leading-tight text-muted-foreground grid grid-cols-2 gap-y-1">
          <span><span className="text-sky-400 font-bold">●</span> Neck Pivot</span>
          <span><span className="text-[#FF7F50] font-bold">●</span> Waist/Legs</span>
          <span><span className="text-[#A3E635] font-bold">●</span> Feet/Ankles</span>
          <span><span className="text-purple-400 font-bold">●</span> Left Shoulder</span>
          <span><span className="text-orange-400 font-bold">●</span> Right Shoulder</span>
        </p>
      </div>
    </div>
  );
}
