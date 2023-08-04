import { DEFAULT_DATA, SanityArrayFieldProperties, SanityFieldProperties, SanityObjectFieldProperties, SanityReferenceFieldProperties } from "../../types/SanityFieldProperties";
import { hasFields, getFields } from "../getFields";
import { isDefaultSanityType } from "../isDefaultSanityType";
import { needsRecursiveExport } from "../needsRecursiveExport";
import { sanitizeName } from "../sanitizeName";



export const exportQuery = (schema: SanityFieldProperties, isRoot = true, getTypeObjOfString: (name: string) => SanityFieldProperties): string => {
    let query = "";
    if (isRoot) {
      query += `*[_type == "${sanitizeName(schema.name)}"]`;
    }
    if(isRoot || hasFields(schema)) {
        query += "{\n";
    }
    if (!isDefaultSanityType(schema.type)) {
      query += "{\n";
      for (const field of getFields(schema.type, getTypeObjOfString)) {
        query += `${sanitizeName(field.name)}${exportQuery(field, false, getTypeObjOfString)}, \n`;
      }
      query += "}\n";
    }
    if (hasFields(schema)) {
      const objectSchema = schema as SanityObjectFieldProperties;
      for (const field of objectSchema.fields) {
        query += `${sanitizeName(field.name)}`;
        if (needsRecursiveExport(field)) {
          query += exportQuery(field, false, getTypeObjOfString);
        }
        query += ",";
      }
    } else if (schema.type === "Reference") {
      const referenceSchema = schema as SanityReferenceFieldProperties;
      for (const to of referenceSchema.to) {
        query += `${to},`;
        query +=
          "// TODO: Add query for reference type, unsupported by codegen.\n";
      }
    } else if (schema.type === "File") {
        query += "{\n";
        query += `\n /* In order to download a file from your front-end you need to append ?dl=<filename-of-your-choice.pdf> to the file URL. If you leave the filename blank, the original filename will be used if present. */\n`;
        query += `"url": file.asset->url,\n`;
        query += `"originalFilename": file.asset->originalFilename,\n`;
        query += `"extension": file.asset->extension,\n`;
        query += `"size": file.asset->size,\n`;
  
        query += "}\n";
  
    } else if (schema.type === "Array") {
      const arraySchema = schema as SanityArrayFieldProperties;
      query += "{\n";
  
        for (const ofType of arraySchema.of) {
          if (!isDefaultSanityType(ofType) && getTypeObjOfString(ofType).name === DEFAULT_DATA.name) {
            query += `_type == '${sanitizeName(ofType)}' => { // TODO: Add selection of fields for ${ofType} },`;
          } else if (!isDefaultSanityType(ofType) && getTypeObjOfString(ofType).name !== DEFAULT_DATA.name) {
            query += `_type == '${sanitizeName(ofType)}' => ${exportQuery(getTypeObjOfString(ofType), false, getTypeObjOfString)},`;
          } else if (ofType === 'Object') {
            query += `${exportQuery(getTypeObjOfString(ofType), false, getTypeObjOfString)},`;
          } else {
            query += `${ofType},`;
          }
  
        }
        query += "\n}";
  }
    if(isRoot || hasFields(schema)) {
      query += "\n}";
    }
    return query;
  };
  
  export const exportBySlugQuery = (
    schemaWithSlug: SanityFieldProperties,
    isRoot = true,
    getTypeObjOfString: (name: string) => SanityFieldProperties
  ): string => {
    let query = "";
    if (isRoot) {
      query += `*[_type == "${schemaWithSlug.name}" && slug.current == $slug][0]{`;
    }
    if (schemaWithSlug.type === "Object") {
      const objectSchema = schemaWithSlug as SanityObjectFieldProperties;
      for (const field of objectSchema.fields) {
        if (field.name === "slug") {
          query += `"slug": slug.current,`;
        } else {
          query += `${sanitizeName(field.name)},`;
        }
        if (field.type === "Object") {
          query += exportBySlugQuery(field, false, getTypeObjOfString);
        }
      }
    } else {
      //TODO: array support
      if (schemaWithSlug.name === "slug") {
        query += `"slug": slug.current,`;
      } else {
        query += `${schemaWithSlug.name},`;
      }
    }
    if (isRoot) {
      query += "}";
    }
    return query;
  };
  

