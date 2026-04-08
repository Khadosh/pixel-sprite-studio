import React, { createContext, useContext } from 'react';
import { SpriteEditorContextValue } from '../types';

const SpriteEditorContext = createContext<SpriteEditorContextValue | undefined>(undefined);

export const SpriteEditorProvider: React.FC<{ value: SpriteEditorContextValue; children: React.ReactNode }> = ({ value, children }) => {
  return <SpriteEditorContext.Provider value={value}>{children}</SpriteEditorContext.Provider>;
};

export const useSpriteEditorContext = () => {
  const context = useContext(SpriteEditorContext);
  if (context === undefined) {
    throw new Error('useSpriteEditorContext must be used within a SpriteEditorProvider');
  }
  return context;
};
