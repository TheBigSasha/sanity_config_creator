import { SanityFieldProperties } from "../types/SanityFieldProperties";

export const needsRecursiveExport: (typeClass: SanityFieldProperties) => boolean = (field) => {
    return field.type === "Object" || field.type === "File" || field.type === "Document" || field.type === "Array"  || !isDefaultSanityType(field.type)};
  
  