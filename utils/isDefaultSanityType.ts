import { SanityFieldType, SanityFieldTypes } from "../types/SanityFieldType";

export const isDefaultSanityType = (
  type: SanityFieldType | string,
): boolean => {
  return SanityFieldTypes.includes(type);
};
