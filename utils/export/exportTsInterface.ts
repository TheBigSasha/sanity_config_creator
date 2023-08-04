import { SanityFieldProperties, SanityObjectFieldProperties, SanityArrayFieldProperties, SanityStringFieldProperties } from "../../types/SanityFieldProperties";
import { SanityFieldType } from "../../types/SanityFieldType";
import { hasFields } from "../getFields";
import { isDefaultSanityType } from "../isDefaultSanityType";
import { sanitizeName } from "../sanitizeName";


const getTSTypeName = (type: SanityFieldType | string, arrayType?: string[]): string => {
    switch (type) {
      case "Array":
        return `Array<${arrayType ? arrayType.map(type => getTSTypeName(type)).join(" | ") : "any"}>`;
      case "Block":
        return "PortableTextBlock";
      case "Boolean":
        return "boolean";
      case "Date":
        return "Date";
      case "Datetime":
        return "Date";
      case "Document":
        return "Document";
      case "File":
        return "File";
      case "Geopoint":
        return "Geopoint";
      case "Image":
        return "Image";
      case "Number":
        return "number";
      case "Object":
        return "Object";
      case "Reference":
        return "any /* TODO: fix reference type */";
      case "Slug":
        return "string";
      case "String":
        return "string";
      case "Text":
        return "String";
      case "URL":
        return "URL";
      default:
        return isDefaultSanityType(type) ? type.toLowerCase() : sanitizeName(type);
    }
  };
  
 export const exportTSInterface = (
    schema: SanityFieldProperties,
    isRoot = true,
  ): string => {
    let outStr = isRoot
      ? `export interface ${sanitizeName(schema.name)} {\n`
      : "";
    if (hasFields(schema)) {
      const objectSchema = schema as SanityObjectFieldProperties;
      objectSchema.fields.forEach((field) => {
        outStr += exportTSInterface(field, false);
      });
    } else if (schema.type === "Array") {
      const arraySchema = schema as SanityArrayFieldProperties;
      outStr += `${sanitizeName(schema.name)}: ${
        arraySchema.of.length === 0
          ? `Array<${getTSTypeName(arraySchema.of[0])}>`
          : `${getTSTypeName(arraySchema.type, arraySchema.of)}`
      };\n`;
    } else if (schema.type === "String") {
      const stringSchema = schema as SanityStringFieldProperties;
      if (stringSchema.internalConfig?.predefined && stringSchema.options?.list){
        outStr += `${sanitizeName(schema.name)}: ${stringSchema.options.list.map(listItem => `"${listItem.value}"`).join(" | ")};\n`;
      }else{
        outStr += `${sanitizeName(schema.name)}: ${getTSTypeName(schema.type)};\n`;
      }
    } else {
      outStr += `${sanitizeName(schema.name)}: ${getTSTypeName(schema.type)};\n`;
    }
    if (isRoot) {
      outStr += `}\n`;
    }
    return outStr;
  };