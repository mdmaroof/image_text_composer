"use client";

import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Align = "left" | "center" | "right";

export type TextLayerType = {
  id: number;
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  opacity: number;
  align: Align;
  rotation: number;
  width: number;
  height?: number;
  z: number;
};

type AppContextType = {
  // list of textlayers
  textLayers: TextLayerType[];
  setTextLayers: React.Dispatch<React.SetStateAction<TextLayerType[]>>;

  // selected id
  selectedLayer: number | null;
  setSelectedLayer: React.Dispatch<React.SetStateAction<number | null>>;

  // history controls
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pastCount: number;
  futureCount: number;
  maxHistory: number;
  // Reset stacks and layers without adding to history
  resetLayersAndHistory: () => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

const LS_KEY_LAYERS = "itc:textLayers";
const LS_KEY_SELECTED = "itc:selectedLayer";
const MAX_HISTORY = 20;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [textLayers, _setTextLayers] = useState<TextLayerType[]>([]);
  const [selectedLayer, _setSelectedLayer] = useState<number | null>(null);

  // history stacks
  const pastRef = useRef<TextLayerType[][]>([]);
  const futureRef = useRef<TextLayerType[][]>([]);
  const isApplyingHistoryRef = useRef(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_LAYERS);
      let savedLayers: TextLayerType[] = [];
      if (raw && raw !== 'undefined') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            savedLayers = parsed;
          }
        } catch (e) {
          console.error("Failed to parse saved layers:", e);
        }
      }
      
      let selected: number | null = null;
      const savedSelRaw = localStorage.getItem(LS_KEY_SELECTED);
      if (savedSelRaw && savedSelRaw !== 'undefined') {
        try {
          const parsed = JSON.parse(savedSelRaw);
          if (typeof parsed === 'number') {
            selected = parsed;
          }
        } catch (e) {
          console.error("Failed to parse selected layer:", e);
        }
      }
      
      _setTextLayers(savedLayers);
      _setSelectedLayer(selected);
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
    } finally {
      hasHydratedRef.current = true;
    }
  }, []);

  const safeSetItem = useCallback((key: string, value: TextLayerType[] | number | null) => {
    try {
      if (value === undefined || value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
    }
  }, []);

  // Persist layers changes
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    safeSetItem(LS_KEY_LAYERS, textLayers);
  }, [textLayers, safeSetItem]);

  // Persist selected layer changes
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    safeSetItem(LS_KEY_SELECTED, selectedLayer);
  }, [selectedLayer, safeSetItem]);

  const areArraysShallowEqual = (a: TextLayerType[], b: TextLayerType[]) => {
    if (a === b) return true;
    if (a?.length !== b?.length) return false;
    for (let i = 0; i < a?.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const setTextLayers: React.Dispatch<React.SetStateAction<TextLayerType[]>> = useCallback((updater) => {
    _setTextLayers((prev) => {
      const next = typeof updater === "function" 
        ? (updater as (p: TextLayerType[]) => TextLayerType[])(prev || []) 
        : Array.isArray(updater) 
          ? updater 
          : [];
      return areArraysShallowEqual(prev, next) ? prev : next;
    });
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    isApplyingHistoryRef.current = true;
    _setTextLayers((current) => {
      const past = pastRef.current.slice();
      const prev = past.pop()!;
      pastRef.current = past;
      futureRef.current = [current, ...futureRef.current].slice(0, MAX_HISTORY);
      return prev;
    });
    isApplyingHistoryRef.current = false;
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    isApplyingHistoryRef.current = true;
    _setTextLayers((current) => {
      const [next, ...rest] = futureRef.current;
      futureRef.current = rest;
      pastRef.current = [...pastRef.current, current].slice(-MAX_HISTORY);
      return next;
    });
    isApplyingHistoryRef.current = false;
  }, []);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;
  const pastCount = pastRef.current.length;
  const futureCount = futureRef.current.length;

  // Track history on committed textLayers changes to avoid double entries under Strict Mode
  const prevCommittedRef = useRef<TextLayerType[] | null>(null);
  const [, forceRender] = useState(0);
  useEffect(() => {
    if (!hasHydratedRef.current) {
      prevCommittedRef.current = textLayers;
      return;
    }
    const prev = prevCommittedRef.current;
    if (prev && !isApplyingHistoryRef.current && !areArraysShallowEqual(prev, textLayers)) {
      pastRef.current = [...pastRef.current, prev].slice(-MAX_HISTORY);
      futureRef.current = [];
    }
    prevCommittedRef.current = textLayers;
    forceRender((x) => x + 1);
  }, [textLayers]);

  const setSelectedLayer = useCallback<React.Dispatch<React.SetStateAction<number | null>>>((updater) => {
    _setSelectedLayer((prev) => (typeof updater === "function" ? (updater as (p: number | null) => number | null)(prev) : updater));
  }, []);

  const resetLayersAndHistory = useCallback(() => {
    // prevent history effect from recording
    isApplyingHistoryRef.current = true;
    pastRef.current = [];
    futureRef.current = [];
    _setTextLayers([]);
    _setSelectedLayer(null);
    prevCommittedRef.current = [];
    isApplyingHistoryRef.current = false;
    forceRender((x) => x + 1);
    try {
      localStorage.setItem(LS_KEY_LAYERS, JSON.stringify([]));
      localStorage.setItem(LS_KEY_SELECTED, JSON.stringify(null));
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
  }, []);

  const value = useMemo<AppContextType>(() => ({
    textLayers,
    setTextLayers,
    selectedLayer,
    setSelectedLayer,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount,
    futureCount,
    maxHistory: MAX_HISTORY,
    resetLayersAndHistory,
  }), [textLayers, selectedLayer, setTextLayers, undo, redo, canUndo, canRedo, pastCount, futureCount]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
