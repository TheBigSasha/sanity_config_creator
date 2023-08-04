import { SanityFieldProperties, SanityObjectFieldProperties } from "../types/SanityFieldProperties";

export const hasSlug = (schema: SanityFieldProperties): boolean => {
  if (schema.type === "Object") {
    const objectSchema = schema as SanityObjectFieldProperties;
    for (const field of objectSchema.fields) {
      if (field.type === "Slug") {
        return true;
      }
    }
  }
  return false;
};
