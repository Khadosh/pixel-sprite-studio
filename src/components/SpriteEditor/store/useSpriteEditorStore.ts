import { createStore } from 'zustand/vanilla';
import { ensureLayerSupport } from '@/lib/layerUtils';
import { getColorName } from '@/lib/colorUtils';
import { EditorScope } from '@/components/EditorToolbar';
import { AdvancedCastSettings } from '@/lib/types';
import { SpriteEditorState, CreateSpriteEditorStoreOptions } from './types';

// Import Slices
import { createHistorySlice } from './slices/historySlice';
import { createBaseSlice } from './slices/baseSlice';
import { createLayerSlice } from './slices/layerSlice';
import { createFrameSlice } from './slices/frameSlice';
import { createPaletteSlice } from './slices/paletteSlice';
import { createAnimationSlice } from './slices/animationSlice';
import { createTransformSlice } from './slices/transformSlice';
import { createExportSlice } from './slices/exportSlice';
import { createAnatomySlice } from './slices/anatomySlice';

import { persist, createJSONStorage } from 'zustand/middleware';

export function createSpriteEditorStore(options: CreateSpriteEditorStoreOptions) {
  const DEFAULT_THEORY_PALETTE = ['#1a0c24', '#4c1e3d', '#9e3a39', '#e87e35', '#ffce5e', '#fff1c7', '#141013', '#2b1b36', '#4e2d4d', '#7d4a41', '#b37748', '#e3a857', '#fee27d', '#3e3546', '#44a362', '#91db69'];

  const initialAsset = { ...options.initialAsset };
  const currentPaletteKeys = Object.keys(initialAsset.palette || {}).filter(k => k !== '0');
  
  // If the palette is empty or very basic, inject the theory palette
  if (currentPaletteKeys.length <= 2) {
    const newPalette: Record<number, string> = { 0: 'transparent' };
    const newColorNames: Record<number, string> = { 0: 'Transparent' };
    DEFAULT_THEORY_PALETTE.forEach((color, i) => {
      const key = i + 1;
      newPalette[key] = color;
      newColorNames[key] = getColorName(color);
    });
    initialAsset.palette = newPalette;
    initialAsset.colorNames = newColorNames;
  }

  const migrated = ensureLayerSupport(initialAsset);

  return createStore<SpriteEditorState>()(
    persist(
      (set, get) => ({
        // Compose Slices
        ...createHistorySlice(set as any, get),
        ...createBaseSlice(set as any, get),
        ...createLayerSlice(set as any, get),
        ...createFrameSlice(set as any, get),
        ...createPaletteSlice(set as any, get),
        ...createAnimationSlice(set as any, get),
        ...createTransformSlice(set as any, get),
        ...createExportSlice(set as any, get),
        ...createAnatomySlice(set as any, get),

        // --- Initial State Overrides (from options) ---
        editedAsset: options.isIconMode ? {
          ...migrated,
          palette: { 
            0: 'transparent', 
            1: '#ffffff', // Default white base, will be rendered as var(--px-base)
            2: 'rgba(255,255,255,0.7)', // Light
            3: 'rgba(0,0,0,0.3)', // Dark
            4: 'rgba(0,0,0,0.6)'  // Black
          },
          colorNames: {
            0: 'Transparent',
            1: 'Base Color',
            2: 'Highlight',
            3: 'Shadow',
            4: 'Deep Black'
          }
        } : migrated,
        activeLayerId: migrated.layers![0]?.id || null,
        editingFrameIndex: 0,
        viewingAnimation: 'base',
        assetName: options.initialAsset.name,
        isEditingName: false,
        onionSkin: false,
        showAllColors: false,
        scope: 'layer' as EditorScope,
        castSettings: { shape: 'burst', element: 'generic' } as AdvancedCastSettings,
        zoom: options.isIconMode ? 3.0 : 1.0, // Zoom in more for icons
        layerClipboard: null,
        frameClipboard: null,
        selectedAnims: [],
        isAnimGenerating: false,
        animError: null,
        leftSidebarTab: options.isIconMode ? 'layers' : 'animations',
        isDirty: false,
        canvasBg: 'dark',
        activePerspective: 'front',
        activeSide: 'right',
        showIsometricGrid: false,
        sketchMode: false,
        isIconMode: options.isIconMode,
        iconId: options.iconId,

        // Props from parent
        projectId: options.projectId,
        _onSave: options.onSave,
        _onOpenChange: options.onOpenChange,
        _previewPanelRef: options.previewPanelRef,
        _generatePrompt: options.generatePrompt,
        _onRegenerate: options.onRegenerate,
        _isGenerating: options.isGenerating,

        // Bridge initialized as null
        _pixelEditorBridge: null,
      } as SpriteEditorState),
      {
        name: `pps-editor-${options.initialAsset.id || 'new'}`,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ 
          editedAsset: state.editedAsset, 
          isDirty: state.isDirty,
          assetName: state.assetName,
          canvasBg: state.canvasBg
        }),
      }
    )
  );
}

export type SpriteEditorStore = ReturnType<typeof createSpriteEditorStore>;
export * from './types';
