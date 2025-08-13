"use client";
import { useState } from "react";

type TextLayerType = {
  id: number;
  text: string;
};
export const useLayersHook = () => {
  const [textLayers, setTextLayers] = useState<TextLayerType[]>([]);
  return { textLayers, setTextLayers };
};
