import {
  SanityDocumentFieldProperties,
  SanityFieldProperties,
  SanityObjectFieldProperties,
} from "../types/SanityFieldProperties";
import { SanityFieldType } from "../types/SanityFieldType";

export const getFields: (
  type: SanityFieldType | string,
  getTypeObjOfString: (name: string) => SanityFieldProperties,
) => SanityFieldProperties[] = (type, getTypeObjOfString) => {
  const typeObj = getTypeObjOfString(type);
  if (
    typeObj.type === "Object" ||
    typeObj.type === "Document" ||
    (typeObj as SanityObjectFieldProperties)["fields"] != null
  ) {
    const fieldsObj = typeObj as
      | SanityObjectFieldProperties
      | SanityDocumentFieldProperties;
    return fieldsObj.fields;
  }
  return [];
};

export const hasFields: (typeClass: SanityFieldProperties) => boolean = (
  typeClass,
) => {
  return (
    typeClass.type === "Object" ||
    typeClass.type === "Document" ||
    ((typeClass as SanityObjectFieldProperties)["fields"] != null &&
      (typeClass as SanityObjectFieldProperties)["fields"].length > 0)
  );
};
