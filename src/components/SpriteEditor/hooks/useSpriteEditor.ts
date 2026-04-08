import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SpriteAsset, AdvancedCastSettings } from '@/lib/types';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import { EditorScope } from '@/components/EditorToolbar';
import { compositeFrame, ensureLayerSupport } from '@/lib/layerUtils';
import { SpriteEditorModalProps, SpriteEditorContextValue } from '../types';

// Specialized hooks
import { useAnimationActions } from './useAnimationActions';
import { useLayerActions } from './useLayerActions';
import { usePaletteActions } from './usePaletteActions';
import { useFrameActions } from './useFrameActions';
import { useTransformActions } from './useTransformActions';
import { useExportActions } from './useExportActions';

export function useSpriteEditor(props: SpriteEditorModalProps): SpriteEditorContextValue & {
  sensors: any;
  visibleFramesIndices: number[];
  onionGhostFrames: { prev?: number[][]; next?: number[][] };
  frameLabels: string[];
} {
  const { initialAsset, onSave, onOpenChange } = props;

  // --- STATE ---
  const [editedAsset, setEditedAsset] = useState<SpriteAsset>(() => ensureLayerSupport(initialAsset));
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => editedAsset.layers[0]?.id || null);
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

  const previewPanelRef = useRef<import('../components/AnimationPreviewPanel').AnimationPreviewPanelHandle>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // --- DERIVED STATE ---
  const activeLayer = useMemo(() => 
    editedAsset.layers.find(l => l.id === activeLayerId),
    [editedAsset.layers, activeLayerId]
  );

  const visibleFramesIndices = useMemo(() => {
    if (viewingAnimation === 'base' || editedAsset.animations.length === 0) {
      return [0];
    }
    const anim = editedAsset.animations.find(a => a.name === viewingAnimation);
    if (!anim) return [0];
    return [...new Set(anim.frameIndices)];
  }, [editedAsset.animations, viewingAnimation]);

  const frameCount = editedAsset.layers[0]?.frames.length || editedAsset.frames?.length || 0;

  const filteredPalette = useMemo(() => {
    if (showAllColors || !activeLayer || !activeLayer.paletteIds) return editedAsset.palette;
    const filtered: Record<number, string> = { 0: 'transparent' };
    (activeLayer.paletteIds || []).forEach(id => {
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

  // --- EDITOR CORE ENGINE (Pixel Manipulation) ---
  const {
    tool, setTool,
    activeColorKey, setActiveColorKey: setEditorColorKey,
    brushSize, setBrushSize,
    mirrorX, setMirrorX, draftFrame,
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, canUndo,
    overwriteLayerFrame,
    moveOffset, rotationAngle, rotationCenter,
  } = usePixelEditor(editedAsset, editingFrameIndex, activeLayerId, (updated) => {
    setEditedAsset(updated);
  }, scope);

  // --- ACTIONS FROM SUB-HOOKS ---
  const animActions = useAnimationActions(
    editedAsset, setEditedAsset, viewingAnimation, setViewingAnimation, 
    setEditingFrameIndex, previewPanelRef, activeLayerId, castSettings
  );

  const layerActions = useLayerActions(
    editedAsset, setEditedAsset, activeLayerId, setActiveLayerId
  );

  const paletteActions = usePaletteActions(
    editedAsset, setEditedAsset, activeLayerId, activeColorKey, (k) => setEditorColorKey(k)
  );

  const frameActions = useFrameActions(
    editedAsset, setEditedAsset, editingFrameIndex, setEditingFrameIndex
  );

  const exportActions = useExportActions(editedAsset);

  const transformActions = useTransformActions(
    editedAsset, setEditedAsset, editingFrameIndex, activeLayerId, 
    viewingAnimation, scope, overwriteLayerFrame
  );

  // --- EFFECTS ---
  useEffect(() => {
    if (editingFrameIndex >= frameCount) setEditingFrameIndex(0);
  }, [frameCount, editingFrameIndex]);

  useEffect(() => {
    const migrated = ensureLayerSupport(initialAsset);
    setEditedAsset(migrated);
    setAssetName(initialAsset.name);
    setEditingFrameIndex(0);
    setViewingAnimation('base');
    if (migrated.layers[0]) setActiveLayerId(migrated.layers[0].id);
  }, [initialAsset]);

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
        case 'z': if (e.ctrlKey || e.metaKey) { e.preventDefault(); undo(); } break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, setTool, setMirrorX]); 

  const handleSave = () => {
    onSave({ ...editedAsset, name: assetName });
    onOpenChange(false);
  };

  return {
    // State
    editedAsset, setEditedAsset,
    activeLayerId, setActiveLayerId,
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
    previewPanelRef,
    
    // Actions from sub-hooks
    ...animActions,
    ...layerActions,
    ...paletteActions,
    ...frameActions,
    ...transformActions,
    ...exportActions,
    
    handleExportGIF: () => exportActions.handleExportGIF(viewingAnimation),
    
    // Transform specialized calls
    handleCopy: () => transformActions.handleCopy(setLayerClipboard, setFrameClipboard),
    handlePaste: () => transformActions.handlePaste(layerClipboard, frameClipboard),
    
    // Core engine
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
    setActiveColorKey: setEditorColorKey,
    handleSave,
    rotationAngle,
    moveOffset,
    rotationCenter,
    isGenerating: props.isGenerating,
    onRegenerate: props.onRegenerate,
    generatePrompt: props.generatePrompt
  };
}
