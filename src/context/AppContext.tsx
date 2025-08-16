"use client";

import { createContext, ReactNode, useState } from "react";

type Align = "left" | "center" | "right";
type TextLayerType = {
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
  height: number;
  z: number;
};

export type TextLayer = {
  id: string;
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
  height: number;
  z: number;
};

type AppContextType = {
  textLayers: TextLayerType[];
  selectedLayer: number | null;
  setTextLayers: React.Dispatch<React.SetStateAction<TextLayerType[]>>;
  setSelectedLayer: React.Dispatch<React.SetStateAction<number | null>>;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [textLayers, setTextLayers] = useState<TextLayerType[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  return (
    <AppContext.Provider
      value={{ textLayers, setTextLayers, selectedLayer, setSelectedLayer }}
    >
      {children}
    </AppContext.Provider>
  );
};
