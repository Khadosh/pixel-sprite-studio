import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { compositeFrame } from '@/lib/layerUtils';
import { useSpriteEditorContext } from '../../context/SpriteEditorContext';
import { FrameThumb } from './FrameThumb';
import { SortableFrameThumb } from './SortableFrameThumb';

export const TimelineStrip = React.memo(() => {
  const context = useSpriteEditorContext() as any;
  const {
    editedAsset,
    viewingAnimation,
    editingFrameIndex,
    setEditingFrameIndex,
    frameLabels,
    visibleFramesIndices,
    handleDuplicateFrame,
    handleDeleteFrame,
    handleInsertEmptyFrame,
    handleDragEnd,
    sensors
  } = context;

  return (
    <div className="flex-1 min-w-0 max-w-full overflow-hidden flex flex-col bg-secondary/20 p-2 rounded-lg border border-border">
      {visibleFramesIndices.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleFramesIndices.map((i: number) => i.toString())} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 overflow-x-auto custom-scrollbar flex-1 pb-1 px-2 items-center min-h-[90px]">
              {visibleFramesIndices.map((frameIndex: number) => (
                <SortableFrameThumb key={frameIndex} frameIndex={frameIndex}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div>
                        <FrameThumb
                          frame={compositeFrame(editedAsset, frameIndex)}
                          palette={editedAsset.palette}
                          size={editedAsset.size}
                          isActive={frameIndex === editingFrameIndex}
                          label={frameLabels[frameIndex]}
                          onClick={() => setEditingFrameIndex(frameIndex)}
                        />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleDuplicateFrame(frameIndex)}>
                        Duplicar Frame
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleInsertEmptyFrame(frameIndex)}>
                        Insertar Vacío (Después)
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem disabled={frameIndex === 0} onClick={() => handleDeleteFrame(frameIndex)} className="text-red-500 hover:text-red-400">
                        Eliminar Frame
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </SortableFrameThumb>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <span className="font-pixel text-[10px] text-muted-foreground">SIN FRAMES</span>
      )}
    </div>
  );
});

TimelineStrip.displayName = 'TimelineStrip';
