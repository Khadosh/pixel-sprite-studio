import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SpriteAsset, AdvancedCastSettings } from '@/lib/types';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import { useGenerateAnimation } from '@/hooks/useGenerateAnimation';
import { EditorScope } from '@/components/EditorToolbar';
import { 
  compositeFrame, ensureLayerSupport, addNewLayer, removeLayer, 
  reorderLayers, renameLayer, toggleLayerVisibility, toggleLayerLock 
} from '@/lib/layerUtils';
import { 
  generateAnimationsClientSide, 
  duplicateFrameInAllLayers, removeFrameFromAllLayers, addEmptyFrameToAllLayers 
} from '@/lib/spriteAnimations';
import { flipHorizontal, flipVertical, rotate90 } from '@/lib/spriteTransforms';
import { exportAsPNG, exportAsGIF } from '../utils/exportUtils';
import { AVAILABLE_ANIMS, SpriteEditorModalProps, SpriteEditorContextValue } from '../types';
import { PROP_LIBRARY } from '@/lib/assets/props';

export function useSpriteEditor(props: SpriteEditorModalProps): SpriteEditorContextValue & {
  sensors: any;
  visibleFramesIndices: number[];
  onionGhostFrames: { prev?: number[][]; next?: number[][] };
  frameLabels: string[];
} {
  const { initialAsset, onSave, onOpenChange } = props;

  const [editedAsset, setEditedAsset] = useState<SpriteAsset>(() => ensureLayerSupport(initialAsset));
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => editedAsset.layers[0]?.id || null);
  
  const [selectedAnims, setSelectedAnims] = useState<string[]>([]);
  const [editingFrameIndex, setEditingFrameIndex] = useState(0);
  const [viewingAnimation, setViewingAnimation] = useState<string>('base');
  const [assetName, setAssetName] = useState(initialAsset.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [onionSkin, setOnionSkin] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [scope, setScope] = useState<EditorScope>('layer');
  const [layerClipboard, setLayerClipboard] = useState<number[][] | null>(null);
  const [frameClipboard, setFrameClipboard] = useState<Record<string, number[][]> | null>(null);
  const [castSettings, setCastSettings] = useState<AdvancedCastSettings>({
    shape: 'burst',
    element: 'generic',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const visibleFramesIndices = useMemo(() => {
    if (viewingAnimation === 'base' || editedAsset.animations.length === 0) {
      return [0];
    }
    const anim = editedAsset.animations.find(a => a.name === viewingAnimation);
    if (!anim) return [0];
    return [...new Set(anim.frameIndices)];
  }, [editedAsset.animations, viewingAnimation]);

  const activeLayer = useMemo(() => 
    editedAsset.layers.find(l => l.id === activeLayerId),
    [editedAsset.layers, activeLayerId]
  );

  const filteredPalette = useMemo(() => {
    if (showAllColors || !activeLayer || !activeLayer.paletteIds) return editedAsset.palette;
    
    const filtered: Record<number, string> = { 0: 'transparent' };
    const ids = activeLayer.paletteIds || [];
    ids.forEach(id => {
      if (editedAsset.palette[id]) filtered[id] = editedAsset.palette[id];
    });
    return filtered;
  }, [editedAsset.palette, activeLayer, showAllColors]);

  const onionGhostFrames = useMemo(() => {
    if (!onionSkin) return { prev: undefined, next: undefined };
    const currentIndex = visibleFramesIndices.indexOf(editingFrameIndex);
    const prevIndex = currentIndex > 0 ? visibleFramesIndices[currentIndex - 1] : -1;
    const nextIndex = currentIndex < visibleFramesIndices.length - 1 ? visibleFramesIndices[currentIndex + 1] : -1;
    return {
      prev: prevIndex >= 0 ? compositeFrame(editedAsset, prevIndex) : undefined,
      next: nextIndex >= 0 ? compositeFrame(editedAsset, nextIndex) : undefined,
    };
  }, [onionSkin, visibleFramesIndices, editingFrameIndex, editedAsset]);

  const frameCount = editedAsset.layers[0]?.frames.length || editedAsset.frames?.length || 0;

  useEffect(() => {
    if (editingFrameIndex >= frameCount) {
      setEditingFrameIndex(0);
    }
  }, [frameCount, editingFrameIndex]);

  useEffect(() => {
    const migrated = ensureLayerSupport(initialAsset);
    setEditedAsset(migrated);
    setAssetName(initialAsset.name);
    setSelectedAnims(initialAsset.animations.map(a => a.name));
    setEditingFrameIndex(0);
    setViewingAnimation('base');
    if (migrated.layers[0]) setActiveLayerId(migrated.layers[0].id);
  }, [initialAsset]);

  const { isGenerating: isAnimGenerating, error: animError, generateAnimationsSequence } = useGenerateAnimation();

  const previewPanelRef = useRef<import('../components/AnimationPreviewPanel').AnimationPreviewPanelHandle>(null);

  const {
    tool, setTool,
    activeColorKey, setActiveColorKey: setEditorColorKey,
    brushSize, setBrushSize,
    mirrorX, setMirrorX, draftFrame,
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, canUndo,
    overwriteLayerFrame,
    moveOffset,
    rotationAngle,
    rotationCenter,
  } = usePixelEditor(editedAsset, editingFrameIndex, activeLayerId, (updated) => {
    setEditedAsset(updated);
  }, scope);

  const handleCopy = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) setLayerClipboard(frame.map(r => [...r]));
    } else {
      const clipboard: Record<string, number[][]> = {};
      editedAsset.layers.forEach(l => {
        clipboard[l.id] = l.frames[editingFrameIndex].map(r => [...r]);
      });
      setFrameClipboard(clipboard);
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex]);

  const handlePaste = useCallback(() => {
    if (scope === 'layer') {
      if (layerClipboard) overwriteLayerFrame(layerClipboard.map(r => [...r]));
    } else {
      if (frameClipboard) {
        setEditedAsset(prev => {
          const newLayers = prev.layers.map(l => {
            if (frameClipboard[l.id]) {
              const newFrames = [...l.frames];
              newFrames[editingFrameIndex] = frameClipboard[l.id].map(r => [...r]);
              return { ...l, frames: newFrames };
            }
            return l;
          });
          return { ...prev, layers: newLayers };
        });
      }
    }
  }, [scope, layerClipboard, frameClipboard, overwriteLayerFrame, editingFrameIndex]);

  const handleFlipH = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(flipHorizontal(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = flipHorizontal(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex, overwriteLayerFrame]);

  const handleFlipV = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(flipVertical(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = flipVertical(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex, overwriteLayerFrame]);

  const handleRotate = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(rotate90(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = rotate90(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset, activeLayerId, editingFrameIndex, overwriteLayerFrame]);

  const setActiveColorKey = useCallback((key: number) => {
    setEditorColorKey(key);
    if (showAllColors && activeLayerId) {
      setEditedAsset(prev => {
        const layerIdx = prev.layers.findIndex(l => l.id === activeLayerId);
        if (layerIdx === -1) return prev;
        const layer = prev.layers[layerIdx];
        const pIds = layer.paletteIds || [];
        if (!pIds.includes(key)) {
          const newLayers = [...prev.layers];
          newLayers[layerIdx] = { ...layer, paletteIds: [...pIds, key] };
          return { ...prev, layers: newLayers };
        }
        return prev;
      });
    }
  }, [setEditorColorKey, showAllColors, activeLayerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'b': setTool('pencil'); break;
        case 'e': setTool('eraser'); break;
        case 'i': setTool('picker'); break;
        case 'g': setTool('fill'); break;
        case 'v': setTool('move'); break;
        case 'r': setTool('rotate'); break;
        case 'm': setMirrorX((prev: boolean) => !prev); break;
        case 'z': 
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undo();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, setMirrorX, undo]);

  const toggleAnim = (anim: string) => {
    setSelectedAnims(prev =>
      prev.includes(anim) ? prev.filter(a => a !== anim) : [...prev, anim],
    );
  };

  const handleGenerateAnimations = (type?: string) => {
    const typeToGen = type || selectedAnims[0] || 'idle';
    const withAnims = generateAnimationsClientSide(editedAsset, [typeToGen], castSettings);
    
    // Instead of replacing all, we append the newly generated one with a unique name
    const newAnims = [...withAnims.animations];
    const generated = newAnims[newAnims.length - 1]; // The newly added one
    
    const timestamp = Date.now().toString().slice(-4);
    generated.name = `${generated.name}_${timestamp}`;
    generated.label = `${generated.label} ${timestamp}`;

    setEditedAsset({
      ...withAnims,
      animations: [...editedAsset.animations, generated]
    });

    setViewingAnimation(generated.name);
    const targetFrame = generated.frameIndices[0];
    setEditingFrameIndex(targetFrame);
    previewPanelRef.current?.setIsPlaying(true);
  };

  const handleRenameAnimation = useCallback((name: string, newLabel: string) => {
    setEditedAsset(prev => ({
      ...prev,
      animations: prev.animations.map(a => a.name === name ? { ...a, label: newLabel } : a)
    }));
  }, []);

  const handleRemoveAnimation = useCallback((name: string) => {
    setEditedAsset(prev => ({
      ...prev,
      animations: prev.animations.filter(a => a.name !== name)
    }));
    if (viewingAnimation === name) setViewingAnimation('base');
  }, [viewingAnimation]);

  const selectAllAnims = () => {
    setSelectedAnims(AVAILABLE_ANIMS.map(a => a.value));
  };

  const clearSelection = () => {
    setSelectedAnims([]);
  };

  const handleDuplicateFrame = useCallback((idx: number) => {
    setEditedAsset(prev => duplicateFrameInAllLayers(prev, idx));
  }, []);

  const handleDeleteFrame = useCallback((idx: number) => {
    if (editingFrameIndex === idx) setEditingFrameIndex(Math.max(0, idx - 1));
    else if (editingFrameIndex > idx) setEditingFrameIndex(editingFrameIndex - 1);
    setEditedAsset(prev => removeFrameFromAllLayers(prev, idx));
  }, [editingFrameIndex]);

  const handleInsertEmptyFrame = useCallback((idx: number) => {
    setEditedAsset(prev => addEmptyFrameToAllLayers(prev, idx));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = parseInt(active.id as string);
      const overId = parseInt(over.id as string);

      if (!isNaN(activeId) && !isNaN(overId)) {
        if (viewingAnimation === 'base') return;

        setEditedAsset(prev => {
          const animIndex = prev.animations.findIndex(a => a.name === viewingAnimation);
          if (animIndex === -1) return prev;
          const anim = prev.animations[animIndex];
          const oldTimelineIndex = anim.frameIndices.indexOf(activeId);
          const newTimelineIndex = anim.frameIndices.indexOf(overId);

          if (oldTimelineIndex !== -1 && newTimelineIndex !== -1) {
            const newFrameIndices = arrayMove(anim.frameIndices, oldTimelineIndex, newTimelineIndex);
            const newAnimations = [...prev.animations];
            newAnimations[animIndex] = { ...anim, frameIndices: newFrameIndices };
            return { ...prev, animations: newAnimations };
          }
          return prev;
        });
      }
    }
  };

  const handleGenerateAnimationsAI = async (type?: string) => {
    const animsToGen = type ? [type] : selectedAnims;
    if (animsToGen.length === 0) return;
    
    await generateAnimationsSequence(editedAsset, animsToGen, (updatedAsset) => {
      // Find the new animations by comparing with current
      const newAnims = updatedAsset.animations.filter(
        ua => !editedAsset.animations.some(ea => ea.name === ua.name)
      );
      
      // Give them unique names/labels if necessary (though generateAnimationsSequence often replaces)
      // For this pro refactor, we just append
      setEditedAsset(prev => ({
        ...updatedAsset,
        animations: [...prev.animations, ...newAnims.map(a => {
          const ts = Date.now().toString().slice(-3);
          return { ...a, name: `${a.name}_${ts}`, label: `${a.label} ${ts}` };
        })]
      }));
    }, activeLayerId);
  };

  const handleChangeColor = useCallback((key: number, color: string) => {
    setEditedAsset(prev => ({
      ...prev,
      palette: { ...prev.palette, [key]: color },
    }));
  }, []);

  const handleRenameColor = useCallback((key: number, name: string) => {
    setEditedAsset(prev => ({
      ...prev,
      colorNames: { ...prev.colorNames, [key]: name },
    }));
  }, []);

  const handleAddColor = useCallback(() => {
    setEditedAsset(prev => {
      const keys = Object.keys(prev.palette).map(Number).filter(k => k > 0);
      const newKey = keys.length > 0 ? Math.max(...keys) + 1 : 1;
      const updatedPalette = { ...prev.palette, [newKey]: '#888888' };
      const updatedColorNames = { ...prev.colorNames, [newKey]: `Color ${newKey}` };
      
      const newLayers = prev.layers.map(layer => {
        if (layer.id === activeLayerId) {
          const pIds = layer.paletteIds || [];
          if (!pIds.includes(newKey)) {
            return { ...layer, paletteIds: [...pIds, newKey] };
          }
        }
        return layer;
      });

      return {
        ...prev,
        palette: updatedPalette,
        colorNames: updatedColorNames,
        layers: newLayers,
      };
    });
  }, [activeLayerId]);

  const handleRemoveColor = useCallback((key: number) => {
    setEditedAsset(prev => {
      const newPalette = { ...prev.palette };
      delete newPalette[key];
      const newColorNames = { ...prev.colorNames };
      delete newColorNames[key];

      return {
        ...prev,
        palette: newPalette,
        colorNames: newColorNames,
        layers: prev.layers.map(layer => ({
          ...layer,
          paletteIds: layer.paletteIds?.filter(id => id !== key),
          frames: layer.frames.map(f =>
            f.map(r => r.map(c => c === key ? 0 : c))
          )
        })),
      };
    });
    if (activeColorKey === key) setActiveColorKey(1);
  }, [activeColorKey, setActiveColorKey]);

  const handleAddLayer = useCallback(() => {
    setEditedAsset(prev => {
      const updated = addNewLayer(prev, `Layer ${prev.layers.length + 1}`);
      setActiveLayerId(updated.layers[updated.layers.length - 1].id);
      return updated;
    });
  }, []);

  const handleRemoveLayer = useCallback((layerId: string) => {
    setEditedAsset(prev => {
      if (prev.layers.length <= 1) return prev;
      const updated = removeLayer(prev, layerId);
      if (activeLayerId === layerId) {
        setActiveLayerId(updated.layers[updated.layers.length - 1].id);
      }
      return updated;
    });
  }, [activeLayerId]);

  const handleToggleLayerVisibility = useCallback((layerId: string) => {
    setEditedAsset(prev => toggleLayerVisibility(prev, layerId));
  }, []);

  const handleToggleLayerLock = useCallback((layerId: string) => {
    setEditedAsset(prev => toggleLayerLock(prev, layerId));
  }, []);

  const handleRenameLayer = useCallback((layerId: string, name: string) => {
    setEditedAsset(prev => renameLayer(prev, layerId, name));
  }, []);

  const handleMoveLayer = useCallback((fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx + 1 : fromIdx - 1;
    if (toIdx < 0 || toIdx >= editedAsset.layers.length) return;
    setEditedAsset(prev => reorderLayers(prev, fromIdx, toIdx));
  }, [editedAsset.layers.length]);

  const handleAddPropLayer = useCallback((propId: string) => {
    const prop = PROP_LIBRARY.find(p => p.id === propId);
    if (!prop) return;

    const size = editedAsset.size || 16;
    const propData = size === 32 ? prop.data32 : prop.data16;
    if (!propData) return;

    const newLayerId = crypto.randomUUID();
    const frameCount = editedAsset.layers[0]?.frames.length || 1;
    
    // Create frames for the new layer (all identical/static for now)
    const newFrames = Array.from({ length: frameCount }, () => 
      propData.map(row => [...row])
    );

    setEditedAsset(prev => ({
      ...prev,
      layers: [
        ...prev.layers,
        {
          id: newLayerId,
          name: prop.name,
          frames: newFrames,
          isVisible: true,
          isLocked: false,
          opacity: 1,
          paletteIds: [] // Let it inherit or add specific colors if needed
        }
      ]
    }));
    setActiveLayerId(newLayerId);
  }, [editedAsset.size, editedAsset.layers]);

  const handleExportPNG = (options?: { includeLabels?: boolean }) => {
    exportAsPNG(editedAsset, options);
  };

  const handleExportGIF = async () => {
    const anim = editedAsset.animations.find(a => a.name === viewingAnimation);
    const fps = anim?.fps || 10;
    await exportAsGIF(editedAsset, viewingAnimation, fps);
  };

  const handleSave = () => {
    onSave({ ...editedAsset, name: assetName });
    onOpenChange(false);
  };

  const frameLabels = useMemo(() => {
    const labels: string[] = frameCount > 0 ? Array.from({ length: frameCount }, (_, i) => `F${i}`) : [];
    for (const anim of editedAsset.animations) {
      const uniqueIndices = [...new Set(anim.frameIndices)];
      uniqueIndices.forEach((fi, seq) => {
        if (fi < labels.length) {
          labels[fi] = `${anim.label} ${seq + 1}`;
        }
      });
    }
    return labels;
  }, [editedAsset.animations, frameCount]);

  return {
    editedAsset, setEditedAsset,
    activeLayerId, setActiveLayerId,
    selectedAnims, setSelectedAnims,
    editingFrameIndex, setEditingFrameIndex,
    viewingAnimation, setViewingAnimation,
    assetName, setAssetName,
    isEditingName, setIsEditingName,
    onionSkin, setOnionSkin,
    showAllColors, setShowAllColors,
    scope, setScope,
    castSettings, setCastSettings,
    sensors,
    visibleFramesIndices,
    activeLayer,
    filteredPalette,
    onionGhostFrames,
    isAnimGenerating,
    animError,
    previewPanelRef,
    handleGenerateAnimationsAI,
    handleGenerateAnimations,
    handleRenameAnimation,
    handleRemoveAnimation,
    selectAllAnims,
    clearSelection,
    toggleAnim,
    handleAddLayer,
    handleRemoveLayer,
    handleToggleLayerVisibility,
    handleToggleLayerLock,
    handleRenameLayer,
    handleMoveLayer,
    handleAddPropLayer,
    handleAddColor,
    handleRemoveColor,
    handleChangeColor,
    handleRenameColor,
    handleDuplicateFrame,
    handleDeleteFrame,
    handleInsertEmptyFrame,
    handleDragEnd,
    handleCopy,
    handlePaste,
    handleFlipH,
    handleFlipV,
    handleRotate,
    draftFrame,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    canUndo,
    tool,
    setTool,
    brushSize,
    setBrushSize,
    mirrorX,
    setMirrorX,
    activeColorKey,
    setActiveColorKey,
    handleExportPNG,
    handleExportGIF,
    handleSave,
    frameLabels,
    rotationAngle,
    moveOffset,
    rotationCenter,
    isGenerating: props.isGenerating,
    onRegenerate: props.onRegenerate,
    generatePrompt: props.generatePrompt
  };
}
