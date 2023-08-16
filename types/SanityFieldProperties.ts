import { SanityFieldType } from "./SanityFieldType";

export type SanityFieldProperties = {
  name: string;
  type: SanityFieldType;
  title: string;
  description: string;
  hidden: boolean;
  readOnly: boolean;
};

export interface SanityStringFieldProperties extends SanityFieldProperties {
  name: "String";
  options: {
    list: Array<{ title: string; value: string }>; // for pre defined strings
  };
  internalConfig: {
    // not sanity properties, but properties for use in code generation
    predefined: boolean;
  };
}

export interface SanityObjectFieldProperties extends SanityFieldProperties {
  type: "Object";
  fields: SanityFieldProperties[];
}

export interface SanityDocumentFieldProperties extends SanityFieldProperties {
  type: "Document";
  fields: SanityFieldProperties[];
}

export interface SanityImageFieldProperties extends SanityFieldProperties {
  type: "Image";
  options: {
    hotspot: boolean;
    accept: string;
    sources: string;
  };
  internalConfig: {
    // not sanity properties, but properties for use in code generation
    caption: boolean;
    alt: boolean;
  };
}

export interface SanityReferenceFieldProperties extends SanityFieldProperties {
  type: "Reference";
  weak: boolean;
  to: Array<SanityFieldType | string>;
}

export interface SanityArrayFieldProperties extends SanityFieldProperties {
  type: "Array";
  of: Array<SanityFieldType | string>;
  options: {
    layout: "grid" | "tags" | "list";
    sortable: boolean;
  };
}

export const DEFAULT_DATA: SanityDocumentFieldProperties = {
  type: "Document",
  name: "",
  title: "",
  description: "",
  fields: [],
  readOnly: false,
  hidden: false,
};
