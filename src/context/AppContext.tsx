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

  // Initialize from localStorage (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_LAYERS);
      const savedLayers = raw ? (JSON.parse(raw) as TextLayerType[]) : [];
      const savedSelRaw = localStorage.getItem(LS_KEY_SELECTED);
      const parsedSel = savedSelRaw ? JSON.parse(savedSelRaw) : null;
      _setTextLayers(savedLayers || []);
      _setSelectedLayer(typeof parsedSel === "number" ? parsedSel : null);
    } catch (_) {
      // ignore corrupted storage
    } finally {
      hasHydratedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist changes
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    try {
      localStorage.setItem(LS_KEY_LAYERS, JSON.stringify(textLayers));
    } catch (_) {}
  }, [textLayers]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    try {
      localStorage.setItem(LS_KEY_SELECTED, JSON.stringify(selectedLayer));
    } catch (_) {}
  }, [selectedLayer]);

  // Helper to compare arrays shallowly by reference equality at element level
  const areArraysShallowEqual = (a: TextLayerType[], b: TextLayerType[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  // Wrapped setter to capture history and cap at MAX_HISTORY entries
  const setTextLayers: React.Dispatch<React.SetStateAction<TextLayerType[]>> = useCallback((updater) => {
    _setTextLayers((prev) => {
      const next = typeof updater === "function" ? (updater as (p: TextLayerType[]) => TextLayerType[])(prev) : updater;
      // If no change, skip
      if (areArraysShallowEqual(prev, next)) return prev;

      if (!isApplyingHistoryRef.current) {
        // push prev into past
        pastRef.current = [...pastRef.current, prev].slice(-MAX_HISTORY);
        // clear future on new change
        futureRef.current = [];
      }
      return next;
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

  const setSelectedLayer = useCallback<React.Dispatch<React.SetStateAction<number | null>>>((updater) => {
    _setSelectedLayer((prev) => (typeof updater === "function" ? (updater as (p: number | null) => number | null)(prev) : updater));
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
  }), [textLayers, selectedLayer, setTextLayers, undo, redo, canUndo, canRedo, pastCount, futureCount]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
