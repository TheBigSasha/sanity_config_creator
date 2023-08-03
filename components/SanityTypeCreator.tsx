import { Controller, useFieldArray, useForm } from "react-hook-form";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Select,
  TextField,
  Button,
  Tooltip,
  MenuItem,
  Paper,
  AlertTitle,
  Typography,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Accordion,
  Alert,
} from "@mui/material";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import styled from "styled-components";
import {
  FaChevronDown,
  FaPlus,
  FaQuestionCircle,
} from "react-icons/fa";
import {
  HiOutlineDocumentText
} from "react-icons/hi";
import {
  VscSymbolArray,
  VscSymbolBoolean,
  VscSymbolFile,
  VscSymbolNumeric,
  VscSymbolKeyword,
  VscSymbolString,
  VscListTree,
  VscNote,
  VscLink,
  VscKey,
  VscPackage,
  VscReferences,
  VscLocation,
  VscSymbolMethod,
  VscSaveAll,
  VscNewFile,
  VscTrash,
} from "react-icons/vsc";
import {
  BsCalendarDate,
  BsCardImage,
  BsFiletypeJson,
  BsUpload
} from "react-icons/bs";
import styles from "../styles/Home.module.css";
import { CODEGEN_MESSAGE } from "../constants/CodegenMessage";
import { UnchoosableTypes } from "../constants/UnchoosableTypes";

type SanityFieldType =
  | "Array"
  | "Block"
  | "Boolean"
  | "Date"
  | "Datetime"
  | "Document"
  | "File"
  | "Geopoint"
  | "Image"
  | "Number"
  | "Object"
  | "Reference"
  | "Slug"
  | "String"
  | "Span"
  | "Text"
  | "URL";

const SanityFieldTypes = [
  "Array",
  "Block",
  "Boolean",
  "Date",
  "Datetime",
  "Document",
  "File",
  "Geopoint",
  "Image",
  "Number",
  "Object",
  "Reference",
  "Slug",
  "String",
  "Span",
  "Text",
  "URL",
];


type SanityFieldProperties = {
  name: string;
  type: SanityFieldType;
  title: string;
  description: string;
  hidden: boolean;
  readOnly: boolean;
};

interface SanityStringFieldProperties extends SanityFieldProperties {
  name: "String";
  options: {
    list: Array<{title: string, value: string}>; // for pre defined strings
  };
  internalConfig: { // not sanity properties, but properties for use in code generation
    predefined: boolean;
  }
}

const getIconForField = (field: SanityFieldProperties | string): React.ReactNode => {
  const type = typeof field === "string" ? field : field.type;
  switch(type){
    case "Array":
      const arrayField = field as SanityArrayFieldProperties;
      if (typeof field !== "string" && arrayField.of && arrayField.of.length === 1 && arrayField.of[0] === "Block") {
        return <VscSymbolKeyword/>;
      }
      if (typeof field === "string"  || !arrayField.of || arrayField.of.length === 0) {0
        return <VscSymbolArray/>;
      }
      return <>[{arrayField.of.map(typ => getIconForField(typ))}]</>;
    case "Block":
      return <VscSymbolKeyword/>;
      case "Boolean":
      return <VscSymbolBoolean/>;
      case "Date":
      return <BsCalendarDate/>;
      case "Datetime":
      return <BsCalendarDate/>;
      case "Document":
      return <HiOutlineDocumentText />;
      case "File":
      return <VscSymbolFile/>;
      case "Geopoint":
      return <VscLocation/>;
      case "Image":
      return <BsCardImage/>;
      case "Number":
      return <VscSymbolNumeric/>;
      case "Object":
      return <VscPackage/>;
      case "Reference":
      return <VscReferences/>;
      case "Slug":
      return <VscKey/>;
      case "String":
      return <VscSymbolString/>;
      case "Span":
      return <VscListTree/>;
      case "Text":
      return <VscNote/>;
      case "URL":
      return <VscLink/>;
      default:
        return <VscSymbolMethod/>;

  }
}

interface SanityObjectFieldProperties extends SanityFieldProperties {
  type: "Object";
  fields: SanityFieldProperties[];
}

interface SanityDocumentFieldProperties extends SanityFieldProperties {
  type: "Document";
  fields: SanityFieldProperties[];
}

interface SanityImageFieldProperties extends SanityFieldProperties {
  type: "Image";
  options: {
    hotspot: boolean;
    accept: string;
    sources: string;
  };
  internalConfig: { // not sanity properties, but properties for use in code generation
    caption: boolean;
    alt: boolean;
  }
}

interface SanityReferenceFieldProperties extends SanityFieldProperties {
  type: "Reference";
  weak: boolean;
  to: Array<SanityFieldType | string>;
}

interface SanityArrayFieldProperties extends SanityFieldProperties {
  type: "Array";
  of: Array<SanityFieldType | string>;
  options: {
    layout: "grid" | "tags" | "list";
    sortable: boolean;
  };
}

const getFields: (
    type: SanityFieldType | string,
    getTypeObjOfString: (name: string) => SanityFieldProperties
) => SanityFieldProperties[] = (type, getTypeObjOfString) => {
    const typeObj = getTypeObjOfString(type);
    if (typeObj.type === "Object" || typeObj.type === "Document" || (typeObj as SanityObjectFieldProperties)["fields"] != null) {
      const fieldsObj = typeObj as SanityObjectFieldProperties | SanityDocumentFieldProperties;
      return fieldsObj.fields;
    }
    return [];
}

const hasFields: (typeClass: SanityFieldProperties) => boolean = (typeClass) => {
  return typeClass.type === "Object" || typeClass.type === "Document" || (typeClass as SanityObjectFieldProperties)["fields"] != null && (typeClass as SanityObjectFieldProperties)["fields"].length > 0;
}


const exportQuery = (schema: SanityFieldProperties, isRoot = true, getTypeObjOfString: (name: string) => SanityFieldProperties): string => {
  let query = "";
  console.dir(schema)
  console.log(schema.type)
  console.log("isRoot", isRoot)
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
      if (field.type === "Object" || field.type === "Document" || field.type === "Array" || !isDefaultSanityType(field.type)) {
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
  }   else if (schema.type === "Array") {
    const arraySchema = schema as SanityArrayFieldProperties;
    console.log("arraySchema", arraySchema);
    query += "{\n";

      for (const ofType of arraySchema.of) {
        console.log("ofType", ofType);
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

const exportBySlugQuery = (
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
        query += `${field.name},`;
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

const hasSlug = (schema: SanityFieldProperties): boolean => {
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

const isDefaultSanityType = (type: SanityFieldType | string): boolean => {
    return SanityFieldTypes.includes(type);
}

const getBaseTypeDef = (
  schema: SanityFieldProperties,
  isRoot = false,
): string => {
  let outStr = isRoot ? "defineType" : "defineField";
  outStr += `({\n      type: '${isDefaultSanityType(schema.type) ? schema.type.toLowerCase() : schema.type}',\n      name: ${JSON.stringify(schema.name)},\n      title: ${JSON.stringify(schema.title)},\n`;
  if (schema.description)
    outStr += `      description: ${JSON.stringify(schema.description)},\n`;
  if (schema.hidden) outStr += `      hidden: ${schema.hidden},\n`;
  if (schema.readOnly) outStr += `      readOnly: ${schema.readOnly},\n`;
  return outStr;
};

const sanitizeName = (name: string): string => {
  return name.replaceAll(" ", "_").replaceAll("[^a-zA-Z0-9_]", "");
};

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
      return "Reference /* TODO: fix reference type */";
    case "Slug":
      return "Slug";
    case "String":
      return "string";
    case "Text":
      return "String";
    default:
      return isDefaultSanityType(type) ? type.toLowerCase() : sanitizeName(type);
  }
};

const exportTSInterface = (
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

const PreDefinedStringsForm: React.FC<{control: any}> = ({control}) => {
  // form to edit list of predefined strings

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "options.list",
  });

  return (
    <>
      <Button
        onClick={() => {
          append({title: "", value: ""});
        }}
        variant={"contained"}
      >
        <FaPlus /> Add Predefined String
      </Button>
      <br />
      {fields.map((field, index) => {
        return (
          <Horizontal key={field.id}>
            <Controller
              name={`options.list.${index}.title`}
              control={control}
              defaultValue=""
              render={({ field }) => <TextField {...field} label="Title" />}
            />
            {" - "}
            <Controller
              name={`options.list.${index}.value`}
              control={control}
              defaultValue=""
              render={({ field }) => <TextField {...field} label="Value" />}
            />
            <Button
              onClick={() => {
                remove(index);
              }}
              variant={"outlined"}
            >
              <VscTrash/>
            </Button>
          </Horizontal>
        );
      })}
    </>
  );
}


const exportSanitySchema = (
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

  if (isRoot) {
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

    outStr += "\n\n";
    outStr += exportTSInterface(schema);
  }

  return outStr;
};

const Form = styled.form<{ isRoot?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: ${({ isRoot }) => (!isRoot ? "0" : " 0.5rem 2rem 1rem 2rem")};
  margin-top: ${({ isRoot }) => (!isRoot ? "0" : "25px")};
  width: ${({ isRoot }) => (isRoot ? "clamp(300px, 80vw, 720px);" : "300px")};
`;

const Horizontal = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  align-items: center;
`;

interface FormFieldProps {
  onSubmit: (formState: SanityFieldProperties) => void;
  defaultValues: SanityFieldProperties;
  isRoot?: boolean;
  extraButtons?: React.ReactNode;
  topBar?: React.ReactNode;
}
const FieldForm: React.FC<FormFieldProps> = ({
  onSubmit,
  defaultValues,
  isRoot,
  extraButtons,
  topBar,
}) => {
  const { handleSubmit, control, getValues, formState } =
    useForm<SanityFieldProperties>({
      defaultValues,
    });
  const { fields, append, remove, update } = useFieldArray({
    control /*@ts-ignore -- we know fields is on getValues() because type === 'Object'*/,
    name: "fields",
  });
  const [type, setType] = useState<SanityFieldType>(defaultValues?.type);

  const subButton = (
    <Button
      onClick={() => onSubmit(getValues())}
      type={isRoot ? "submit" : "button"}
      variant="contained"
    >
      save
    </Button>
  );

  const newlyCreatedObjectNames =
    getValues().type === "Object"
      ? getValues() /*@ts-ignore -- we know fields is on getValues() because type === 'Object'*/
          .fields?.filter((field) => field.type === "Object")
          .map((field: SanityFieldProperties) => field.name)
      : [];

  const { customTypes } = useContext(CustomTypeContext);

  const allObjectNames: string[] = [
    ...SanityFieldTypes,
    ...newlyCreatedObjectNames,
    ...customTypes,
  ]

  const choosableObjectNames = allObjectNames.flat().filter(
    // filter out UnchoosableTypes
    (type) => !UnchoosableTypes.includes(type)
  );



  const validTypes: string[] = isRoot ? ["Document", "Object"] : choosableObjectNames;

  // @ts-ignore
  const out = (
    <>
      <Form isRoot={isRoot} onSubmit={handleSubmit(onSubmit)}>
        {topBar}
        {isRoot && type === "Object" && (
          <>
            {" "}
            <Alert severity="info">
              {" "}
              <AlertTitle>Top Level Object Type</AlertTitle>
              {`By default, object types can not be represented as standalone
              documents in the data store. If you want to define an object type
              that you'd like to be represented as a document with an id,
              revision and created and updated timestamps, you should define it
              using the document type instead. Apart from these additional
              fields, there's no semantic difference between a document and an
              object.`}
              <a href={"https://www.sanity.io/docs/object-type"}> Learn more</a>
            </Alert>{" "}
            <br />{" "}
          </>
        )}
        <Controller
          name="name"
          control={control}
          defaultValue=""
          render={({ field }) => <TextField {...field} label="Name" />}
        />
        <br />
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Horizontal>
              <Select
                {...field}
                title="Type"
                label="Type"
                onChange={(e) => {
                  setType(e.target.value as SanityFieldType);
                  field.onChange(e);
                }}
              >
                {validTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              <a
                href={`https://www.sanity.io/docs/${
                  type?.toLowerCase() || "object"
                }-type`}
                target="_blank"
                rel="noreferrer"
              >
                <Tooltip title={"Documentation page"} arrow>
                  <Button onClick={() => {}} variant={"text"}>
                    <FaQuestionCircle />
                  </Button>
                </Tooltip>
              </a>
            </Horizontal>
          )}
        />
        <br />
        <Controller
          name="title"
          control={control}
          defaultValue=""
          render={({ field }) => <TextField {...field} label="Title" />}
        />
        <br />
        <Controller
          name="description"
          control={control}
          defaultValue=""
          render={({ field }) => <TextField {...field} label="Description" />}
        />
        <br />
        <Controller
          name="hidden"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} />}
              label="Hidden"
            />
          )}
        />
        <br />
        <Controller
          name="readOnly"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} />}
              label="Read Only"
            />

          )}
        />
        <br />

        { type === "String" && (
            <>
             <Controller
              {/*@ts-ignore -- we know fields is on getValues() because type === 'String'*/ ...{} }
              name="internalConfig.predefined"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label="Use Pre-defined Strings (enum)"
                />
              )}
            />
            <br />
            {
              /*@ts-ignore -- we know fields is on getValues() because type === 'String'*/ 
              getValues().internalConfig?.predefined && (
                <PreDefinedStringsForm
                  control={control}
                  />

              )
              
            }
              <br />
            </>
        )}

        {type === "Image" && (
          <>
            <Controller
              {/*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
              name="options.hotspot"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label="Hotspot"
                />
              )}
            />
            <br />
            <Controller
              {/*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
              name="options.accept"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField {...field} label="Accept (MIME types)" />
              )}
            />
            <br />
            <Controller
              {/*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
              name="options.sources"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField {...field} label="Sources (asset sources)" />
              )}
            />
            <br />
            <Controller
              {/*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
              name="internalConfig.caption"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label="Caption"
                />
              )}
            />
            <br />
            <Controller
              {/*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
              name="internalConfig.alt"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label="Alt"
                />
              )}
            />
            <br />
          </>
        )}

        {type === "Reference" && (
          <>
            <Controller
              {/*@ts-ignore -- we know to is on getValues() because type === 'Reference'*/ ...{} }
              name="to"
              control={control}
              {/*@ts-ignore -- we know to is on getValues() because type === 'Reference'*/ ...{} }
              defaultValue={["Object"]}
              render={({ field }) => (
                <Select multiple {...field} title="To" label="To">
                  {choosableObjectNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <br />
            <Controller
              {/*@ts-ignore -- we know weak is on getValues() because type === 'Reference'*/ ...{} }
              name="weak"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label="Weak"
                />
              )}
            />
            <br />
          </>
        )}

        {type === "Array" && (
          <>
            <Controller
              {/*@ts-ignore -- we know fields is on getValues() because type === 'Array'*/ ...{} }
              name="of"
              control={control}
              {/*@ts-ignore -- we know to is on getValues() because type === 'Array'*/ ...{} }
              defaultValue={["Object"]}
              render={({ field }) => (
                <Select multiple {...field} title="Of" label="Member Types">
                  {allObjectNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <br />
            <Controller
              {/*@ts-ignore -- we know sortable is on getValues() because type === 'Array'*/ ...{} }
              name="options.sortable"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label="Sortable"
                />
              )}
            />
            <br />
            <Controller
              {/*@ts-ignore -- we know min is on getValues() because type === 'Array'*/ ...{} }
              name="options.layout"
              control={control}
              defaultValue="grid"
              render={({ field }) => (
                <Select {...field} title="Layout" label="Layout">
                  <MenuItem value="grid">Grid</MenuItem>
                  <MenuItem value="list">List</MenuItem>
                  <MenuItem value="tags">Tags</MenuItem>
                </Select>
              )}
            />
            <br />
          </>
        )}

        {(type === "Object" || type === "Document") && (
          <>
            <div>
              <Typography variant="h6">
                {fields.length === 0 ? "No Fields" : "Fields"}
                <Tooltip title="Add Field">
                  <Button
                    variant="text"
                    onClick={() =>
                      append({
                        name: "",
                        title: "",
                        type: "String",
                        description: "",
                        hidden: false,
                        readOnly: false,
                      })
                    }
                  >
                    <FaPlus />
                  </Button>
                </Tooltip>
              </Typography>

              {fields.map((field, index) => (
                <FieldForm
                  key={field.id}
                  extraButtons={
                    <Button onClick={() => remove(index)}>Remove</Button>
                  }
                  isRoot={false}
                  { /*@ts-ignore -- we know fields is on getValues() because type === 'Object'*/ ...{} }
                  defaultValues={getValues().fields[index]}
                  onSubmit={(data) => {
                    update(index, data);
                  }}
                />
              ))}
            </div>
          </>
        )}

        <>
          <br />
          {isRoot && (
            <Horizontal>
              {isRoot && subButton}
              {isRoot && extraButtons}
            </Horizontal>
          )}
          <br />
        </>
      </Form>
      {!isRoot && (
        <Horizontal>
          {subButton}
          {extraButtons}
        </Horizontal>
      )}
    </>
  );

  if (!isRoot) {
    return (
      <Accordion>
        <AccordionSummary expandIcon={<FaChevronDown />}>
          {getIconForField(getValues())}
          <div style={{ width: "1rem" }} />
          <Typography>
            {getValues().name || (isRoot ? "Schema Editor" : "New Field")}{" "}
            {formState.isDirty ? "*" : ""}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{out}</AccordionDetails>
      </Accordion>
    );
  }

  return (
    <main className={styles.main}>
      <Paper> {out} </Paper>
    </main>
  );
};

const saveTs = (fp: SanityFieldProperties, getTypeObjOfString: (name: string) => SanityFieldProperties) => {
  const ts = CODEGEN_MESSAGE + exportSanitySchema(fp, true, getTypeObjOfString);

  const blob2 = new Blob([ts], { type: "text/plain" });
  const url2 = URL.createObjectURL(blob2);
  const a2 = document.createElement("a");

  a2.href = url2;
  a2.download = `${fp.name}.ts`;
  a2.click();

  URL.revokeObjectURL(url2);
};

const saveTses = (fp: SanityFieldProperties[], getTypeObjOfString: (name: string) => SanityFieldProperties) => {
  const tses = fp
    .map(
      (f) =>
        CODEGEN_MESSAGE +
        `\n\n// ------------------ ${f.title} ------------------  \n\n` +
        exportSanitySchema(f, true, getTypeObjOfString),
    )
    .join("");

  const blob2 = new Blob([tses], { type: "text/plain" });
  const url2 = URL.createObjectURL(blob2);
  const a2 = document.createElement("a");

  a2.href = url2;
  a2.download = `${fp.map((f) => sanitizeName(f.title)).join("-")}.ts`;
  a2.click();

  URL.revokeObjectURL(url2);
};

const saveJson = (fp: SanityFieldProperties) => {
  const json = JSON.stringify(fp, null, 2);
  const blob = new Blob([json], { type: "text/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${fp.name}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

const saveJsons = (fp: SanityFieldProperties[]) => {
  const json = JSON.stringify(fp, null, 2);
  const blob = new Blob([json], { type: "text/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${fp.map((f) => sanitizeName(f.title)).join("-")}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  grid-gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  overflow: auto;
  min-height: calc(100vh - 12rem);
`;

const DEFAULT_DATA: SanityDocumentFieldProperties = {
  type: "Document",
  name: "",
  title: "",
  description: "",
  fields: [],
  readOnly: false,
  hidden: false,
};

const LeftRight = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

interface customTypeContextType {
  customTypes: string[];
  setCustomTypes: (customTypes: SanityFieldProperties[]) => void;
  getTypeObjOfString: (name: string) => SanityFieldProperties,
}

export const CustomTypeContext = createContext<customTypeContextType>({
  customTypes: [],
  setCustomTypes: () => {},
  getTypeObjOfString: () => DEFAULT_DATA,
});

export const CustomTypeProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [customTypeObjs, setCustomTypes] = useState<SanityFieldProperties[]>([]);
  const getTypeObjOfString = (name: string) => {
    return customTypeObjs.find((ct) => sanitizeName(ct.name) === name || ct.name === name) || DEFAULT_DATA;
  }

  const customTypes = customTypeObjs.map((ct) => sanitizeName(ct.name));

  return (
    <CustomTypeContext.Provider value={{ customTypes, setCustomTypes, getTypeObjOfString }}>
      {children}
    </CustomTypeContext.Provider>
  );
};

const SanityTypeCreatorRaw = () => {
  const [datas, setDatas] = useState<SanityFieldProperties[]>([DEFAULT_DATA]);
  const { setCustomTypes, getTypeObjOfString } = useContext(CustomTypeContext);

  useEffect(() => {
    setCustomTypes(datas);
  }, [datas, setCustomTypes]);

  return (
    <>
      <ResponsiveGrid>
        {datas.map((data, index) => (
          <FieldForm
              key={data.title + index}
            topBar={
              <LeftRight>
                <Typography variant={"h6"}>
                  {data.title || "Untitled Entry"}
                </Typography>{" "}
                {datas.length > 1 && (
                  <Button
                    onClick={() =>
                      setDatas(datas.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </Button>
                )}
              </LeftRight>
            }
            isRoot
            onSubmit={(dta) => {
              const newDta = [...datas];
              newDta[index] = dta;
              setDatas(newDta);
            }}
            defaultValues={data}
            extraButtons={
              <Button
                variant={"outlined"}
                onClick={() => {
                  saveTs(data, getTypeObjOfString);
                }}
              >
                Download Code (.ts)
              </Button>
            }
          />
        ))}
      </ResponsiveGrid>

      <SpeedDial
        ariaLabel="Quick Menu"
        sx={{ position: "fixed", bottom: "2rem", right: "2rem" }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<VscNewFile />}
          tooltipTitle={"Add New Schema"}
          onClick={() => {
            setDatas([...datas, DEFAULT_DATA]);
          }}
        />

        <SpeedDialAction
          icon={<VscSaveAll />}
          tooltipTitle={"Save All Generated Code (.ts)"}
          onClick={() => {
            saveTses(datas, getTypeObjOfString);
          }}
        />

        <SpeedDialAction
          icon={<BsFiletypeJson />}
          tooltipTitle={"Save Project (.json)"}
          onClick={() => {
            saveJsons(datas);
          }}
        />


        <SpeedDialAction
            icon={<BsUpload />}
            tooltipTitle={"Import from JSON"}
            onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/json";
                input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                        const file = files[0];
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const contents = e.target?.result;
                            if (typeof contents === "string") {
                                try {
                                    const parsed = JSON.parse(contents);
                                    if (Array.isArray(parsed)) {
                                        setDatas(parsed);
                                    }
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            }
            }
        />
      </SpeedDial>
    </>
  );
};

export const SanityTypeCreator = () => {
  return (
    <CustomTypeProvider>
      <SanityTypeCreatorRaw />
    </CustomTypeProvider>
  );
};
