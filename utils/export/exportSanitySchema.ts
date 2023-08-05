import { SanityFieldProperties, SanityObjectFieldProperties, SanityDocumentFieldProperties, SanityImageFieldProperties, SanityReferenceFieldProperties, SanityArrayFieldProperties, SanityStringFieldProperties } from "../../types/SanityFieldProperties";
import { hasFields } from "../getFields";
import { hasSlug } from "../hasSlug";
import { sanitizeName } from "../sanitizeName";
import { exportBySlugQuery, exportQuery } from "./exportQuery";
import { exportTSInterface } from "./exportTsInterface";
import { getBaseTypeDef } from "./getBaseTypeDef";

export const generateSanitySchema = (
    schema: SanityFieldProperties,
    isRoot = true,
    getTypeObjOfString: (ofType: string) => SanityFieldProperties,
    ): string => {
        const typeDefEnd = isRoot ? `});` : `}),\n`;
  
    let outStr = isRoot
      ? `import { defineField, defineType } from 'sanity'\n\n export default `
      : "";
  
    if (hasFields(schema)) {
      const objectSchema = schema as SanityObjectFieldProperties | SanityDocumentFieldProperties;
  
      outStr += getBaseTypeDef(schema, isRoot);
      outStr += "fields: [\n";
  
      objectSchema.fields.forEach((field) => {
        outStr += exportSanitySchema(field, false, getTypeObjOfString);
      });
  
      outStr += `  ],\n`;
  
      outStr += typeDefEnd;
    } else if (schema.type === "Image") {
      const imageSchema = schema as SanityImageFieldProperties;
  
      outStr += getBaseTypeDef(schema, isRoot);
  
      if (imageSchema.options) {
        outStr += `      options: {\n`;
  
        if (imageSchema.options.hotspot)
          outStr += `        hotspot: ${imageSchema.options.hotspot},\n`;
        if (imageSchema.options.accept)
          outStr += `        accept: '${imageSchema.options.accept}',\n`;
        if (imageSchema.options.sources)
          outStr += `        sources: '${imageSchema.options.sources}',\n`;
        outStr += `      },\n`;
      }
      if (imageSchema.internalConfig){
        outStr += "fields: [\n";
        if(imageSchema.internalConfig.caption){
          outStr +=  `defineField({
            title: 'Caption',
            name: 'caption',
            type: 'string',
          }),\n`;
      }
      if(imageSchema.internalConfig.alt){
        outStr += `defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          description:
            'Alternative text for screenreaders. Falls back on caption if not set',
            validation: (rule) => rule.required().max(255).min(10),           
        }),\n`;
      }
      outStr += `],\n`;
    }
  
      outStr += typeDefEnd;
    } else if (schema.type === "Reference") {
      outStr += getBaseTypeDef(schema, isRoot);
      const referenceSchema = schema as SanityReferenceFieldProperties;
  
      outStr += `        weak: ${referenceSchema.weak},\n`;
      outStr += `        to: [`;
      referenceSchema.to.forEach((ref, index) => {
        if (index > 0) outStr += `, `;
        outStr += `{type: '${ref.toLowerCase()}'}`;
      });
  
      outStr += `],\n`;
      outStr += typeDefEnd;
    } else if (schema.type === "Array") {
      const arraySchema = schema as SanityArrayFieldProperties;
      outStr += getBaseTypeDef(schema, isRoot);
      outStr += `      of: [`;
      arraySchema.of.forEach((ref, index) => {
        if (index > 0) outStr += `, `;
        outStr += `{type: '${ref.toLowerCase()}'}`;
      });
      outStr += `],\n`;
      if (arraySchema.options) {
        outStr += `      options: {\n`;
        if (arraySchema.options.layout) {
          outStr += `        layout: '${arraySchema.options.layout}',\n`;
        }
        if (arraySchema.options.sortable) {
          outStr += `        sortable: ${arraySchema.options.sortable},\n`;
        }
        outStr += `      },\n`;
      }
      outStr += typeDefEnd;
    } else if (schema.type === "String") {
      outStr += getBaseTypeDef(schema, isRoot);
      const stringSchema = schema as SanityStringFieldProperties;
      if (stringSchema.options && stringSchema.internalConfig){
        if (stringSchema.internalConfig.predefined && stringSchema.options.list){
          outStr += `      options: {\n`;
          outStr += `        list: [\n`;
          stringSchema.options.list.forEach((listItem, index) => {
            if (index > 0) outStr += `, `;
            outStr += `{title: '${listItem.title}', value: '${listItem.value}'}`;
          }
          );
          outStr += `],\n`;
          outStr += `      },\n`;
        }
      }
      outStr += typeDefEnd;
    } else {
      outStr += getBaseTypeDef(schema, isRoot);
      outStr += typeDefEnd;
    }
    return outStr;
    };

    export const generateSanityQueries = (
        schema: SanityFieldProperties,
        isRoot = true,
        getTypeObjOfString: (ofType: string) => SanityFieldProperties,
        ): string => {
            let outStr = "";
             //TODO: - Rich text and other types query generation improvements
      const schemaName = sanitizeName(schema.name);
      if (hasSlug(schema)) {
        outStr += "\n\n";
        outStr += `export const ${schemaName.toUpperCase()}_BY_SLUG_QUERY = groq\`\n${exportBySlugQuery(
          schema,
            true,
            getTypeObjOfString
        )}\n\`\n`;
        outStr += `export const get${schemaName.replaceAll(
          "_",
          "",
        )}BySlug = (slug: string) => client.fetch(${schemaName.toUpperCase()}_BY_SLUG_QUERY, { slug })\n`;
      }
      outStr += "\n\n";
      outStr += `export const ALL_${schemaName.toUpperCase()}_QUERY = groq\`\n${exportQuery(
        schema,
          true,
          getTypeObjOfString
      )}\n\`\n`;
      outStr += `export const getAll${schemaName.replaceAll(
        "_",
        "",
      )} = () => client.fetch(ALL_${schemaName.toUpperCase()}_QUERY)\n`;
        return outStr;
    };


export const exportSanitySchema = (
    schema: SanityFieldProperties,
    isRoot = true,
    getTypeObjOfString: (ofType: string) => SanityFieldProperties,
  ): string => {
    let outStr = generateSanitySchema(schema, isRoot, getTypeObjOfString);
  
    if (isRoot) {
     outStr += "\n\n";
      outStr += generateSanityQueries(schema, isRoot, getTypeObjOfString);
  
      outStr += "\n\n";
      outStr += exportTSInterface(schema);
    }
  
    return outStr;
  };
  