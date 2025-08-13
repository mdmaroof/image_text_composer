"use client";

import { createContext, ReactNode, useState } from "react";

type TextLayerType = {
  id: number;
  text: string;
};

type AppContextType = {
  textLayers: TextLayerType[];
  selected: number | null;
  setTextLayers: React.Dispatch<React.SetStateAction<TextLayerType[]>>;
  setSelected: React.Dispatch<React.SetStateAction<number | null>>;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [textLayers, setTextLayers] = useState<TextLayerType[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <AppContext.Provider
      value={{ textLayers, setTextLayers, selected, setSelected }}
    >
      {children}
    </AppContext.Provider>
  );
};
