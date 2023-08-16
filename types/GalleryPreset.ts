import React from "react";
import { SanityFieldProperties } from "./SanityFieldProperties";

export interface GalleryPreset {
  title: string;
  subtitle: string;
  element: SanityFieldProperties[];
  icon?: React.ReactNode;
}
