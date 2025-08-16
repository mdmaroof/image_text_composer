"use client";

import { useEffect } from "react";

// Popular Google Fonts
export const GOOGLE_FONTS = [
  { name: "Inter", category: "Sans-serif" },
  { name: "Roboto", category: "Sans-serif" },
  { name: "Open Sans", category: "Sans-serif" },
  { name: "Lato", category: "Sans-serif" },
  { name: "Poppins", category: "Sans-serif" },
  { name: "Montserrat", category: "Sans-serif" },
  { name: "Source Sans Pro", category: "Sans-serif" },
  { name: "Ubuntu", category: "Sans-serif" },
  { name: "Nunito", category: "Sans-serif" },
  { name: "Raleway", category: "Sans-serif" },
  { name: "Playfair Display", category: "Serif" },
  { name: "Merriweather", category: "Serif" },
  { name: "Lora", category: "Serif" },
  { name: "Crimson Text", category: "Serif" },
  { name: "Libre Baskerville", category: "Serif" },
  { name: "Source Serif Pro", category: "Serif" },
  { name: "PT Serif", category: "Serif" },
  { name: "Noto Serif", category: "Serif" },
  { name: "Roboto Slab", category: "Serif" },
  { name: "Bitter", category: "Serif" },
  { name: "Inconsolata", category: "Monospace" },
  { name: "Source Code Pro", category: "Monospace" },
  { name: "Fira Code", category: "Monospace" },
  { name: "JetBrains Mono", category: "Monospace" },
  { name: "Space Mono", category: "Monospace" },
  { name: "Cousine", category: "Monospace" },
  { name: "Pacifico", category: "Handwriting" },
  { name: "Dancing Script", category: "Handwriting" },
  { name: "Great Vibes", category: "Handwriting" },
  { name: "Satisfy", category: "Handwriting" },
  { name: "Kaushan Script", category: "Handwriting" },
  { name: "Lobster", category: "Handwriting" },
  { name: "Indie Flower", category: "Handwriting" },
  { name: "Shadows Into Light", category: "Handwriting" },
  { name: "Permanent Marker", category: "Handwriting" },
  { name: "Caveat", category: "Handwriting" },
];

export const GoogleFontsLoader = () => {
  useEffect(() => {
    // Load Google Fonts CSS
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(
      (font) =>
        `family=${encodeURIComponent(
          font.name
        )}:wght@300;400;500;600;700;800;900`
    ).join("&")}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return null;
};

export const getFontFamilyCSS = (fontName: string) => {
  return `"${fontName}", system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
};
