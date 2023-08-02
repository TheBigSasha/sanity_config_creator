import { Controller, useFieldArray, useForm } from "react-hook-form";
import React, { useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Select,
  TextField,
  Button,
  MenuItem,
  Grid,
  Paper,
  Card,
  Typography, SpeedDial, SpeedDialIcon, SpeedDialAction,
} from "@mui/material";
import styled from "styled-components";
import { FaGithub, FaJs, FaQuestionCircle, FaSave, FaUndo} from "react-icons/fa";
import styles from "../styles/Home.module.css";

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
    }
}

const exportQuery = (schema: SanityFieldProperties, isRoot = true): string => {
  let query = "";
  if (isRoot) {
    query += `*[_type == "${schema.name}"]{`;
  }
  if (schema.type === "Object") {
    const objectSchema = schema as SanityObjectFieldProperties;
    for (const field of objectSchema.fields) {
      query += `${field.name},`;
      if (field.type === "Object") {
        query += exportQuery(field, false);
      }
    }
  } else if (schema.type === "Reference") {
    const referenceSchema = schema as SanityReferenceFieldProperties;
    for (const to of referenceSchema.to) {
      query += `${to},`;
      query +=
        "// TODO: Add query for reference type, unsupported by codegen.\n";
    }
  } else if (schema.type === "Array") {
    const arraySchema = schema as SanityArrayFieldProperties;
    for (const of of arraySchema.of) {
      query += `${of},\n`;
      query += "// TODO: Add query for array type, unsupported by codegen.\n";
    }
  }
  if (isRoot) {
    query += "}";
  }
  return query;
};

const exportBySlugQuery = (
  schemaWithSlug: SanityFieldProperties,
  isRoot = true,
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
        query += exportBySlugQuery(field, false);
      }
    }
  } else {
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

const getBaseTypeDef = (
  schema: SanityFieldProperties,
  isRoot = false,
): string => {
  let outStr = isRoot ? "defineType" : "defineField";
  outStr += `({\n      type: '${schema.type}',\n      name: '${schema.name}',\n      title: '${schema.title}',\n`;
  if (schema.description)
    outStr += `      description: '${schema.description}',\n`;
  if (schema.hidden) outStr += `      hidden: ${schema.hidden},\n`;
  if (schema.readOnly) outStr += `      readOnly: ${schema.readOnly},\n`;
  return outStr;
};

const sanitizeName = (name: string): string => {
  return name.replace(" ", "_").replace("[^a-zA-Z0-9_]", "");
};

const getTSTypeName = (type: SanityFieldType | string): string => {
  switch (type) {
    case "Array":
        return "Array<any>";
    case "Block":
        return "Block";
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
        return "Reference";
    case "Slug":
        return "Slug";
    case "String":
        return "string";
    case "Text":
        return "RichText";
    default:
        return "any";
  }
}

const exportTSInterface = (
    schema: SanityFieldProperties,
    isRoot = true,
): string => {
    let outStr = isRoot ? `export interface ${sanitizeName(schema.name)} {\n` : "";
        if (schema.type === "Object" || schema.type === "Document") {
            const objectSchema = schema as SanityObjectFieldProperties;
            objectSchema.fields.forEach((field) => {
                outStr += exportTSInterface(field, false);
            });
        } else if (schema.type === "Array") {
            const arraySchema = schema as SanityArrayFieldProperties;
            outStr += `${sanitizeName(schema.name)}: ${arraySchema.of.length === 0 ? getTSTypeName(arraySchema.of[0]) : `(${arraySchema.of.map(itm => getTSTypeName(itm)).join(" | ")})`}[];\n`;
        } else {
            outStr += `${sanitizeName(schema.name)}: ${getTSTypeName(schema.type)};\n`;
        }
        if (isRoot) {
            outStr += `}\n`;
        }
        return outStr;
};


const exportSanitySchema = (
  schema: SanityFieldProperties,
  isRoot = true,
): string => {
  const typeDefEnd = isRoot ? `});` : `}),\n`;

  let outStr = isRoot
    ? `import { defineField, defineType } from 'sanity'\n\n export default `
    : "";

  if (schema.type === "Object") {
    const objectSchema = schema as SanityObjectFieldProperties;

    outStr += getBaseTypeDef(schema, isRoot);
    outStr += "fields: [\n";

    objectSchema.fields.forEach((field) => {
      outStr += exportSanitySchema(field, false);
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
  }  else if (schema.type === "Array"){
    const arraySchema = schema as SanityArrayFieldProperties;
    outStr += getBaseTypeDef(schema, isRoot);
    outStr += `      of: [`;
    arraySchema.of.forEach((ref, index) => {
      if (index > 0) outStr += `, `;
      outStr += `{type: '${ref.toLowerCase()}'}`;
    });
    outStr += `],\n`;
    if(arraySchema.options){
      outStr += `      options: {\n`;
        if(arraySchema.options.layout){
            outStr += `        layout: '${arraySchema.options.layout}',\n`;
        }
        if(arraySchema.options.sortable){
          outStr += `        sortable: ${arraySchema.options.sortable},\n`;
        }
        outStr += `      },\n`;
    }
    outStr += typeDefEnd;
  }else {
    outStr += getBaseTypeDef(schema, isRoot);
    outStr += typeDefEnd;
  }

  if (isRoot) {
    const schemaName = sanitizeName(schema.name);
    if (hasSlug(schema)) {
      outStr += "\n\n";
      outStr += `export const ${schemaName.toUpperCase()}_BY_SLUG_QUERY = groq\`\n${exportBySlugQuery(
        schema,
      )}\n\`\n`;
      outStr += `export const get${schemaName.replace(
        "_",
        "",
      )}BySlug = (slug: string) => client.fetch(${schemaName.toUpperCase()}_BY_SLUG_QUERY, { slug })\n`;
    }
    outStr += "\n\n";
    outStr += `export const ${schemaName.toUpperCase()}_QUERY = groq\`\n${exportQuery(
      schema,
    )}\n\`\n`;
    outStr += `export const get${schemaName.replace(
      "_",
      "",
    )} = () => client.fetch(${schemaName.toUpperCase()}_QUERY)\n`;

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
  width: ${({ isRoot }) => (isRoot ? "clamp(300px, 80vw, 650px);" : "300px")};
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
}
const FieldForm: React.FC<FormFieldProps> = ({
  onSubmit,
  defaultValues,
  isRoot,
}) => {
  const { handleSubmit, control, getValues, formState } =
    useForm<SanityFieldProperties>({
      defaultValues,
    });
  const { fields, append, remove, update } = useFieldArray({
    control, /*@ts-ignore -- we know fields is on getValues() because type === 'Object'*/
  name: "fields",
  });
  const [type, setType] = useState<SanityFieldType>(defaultValues?.type);

  const subButton = (
    <Button
      onClick={() => onSubmit(getValues())}
      type={isRoot ? "submit" : "button"}
      variant="contained"
    >
      {isRoot ? "download generated code" : "save"}
    </Button>
  );

  const newlyCreatedObjectNames =
    getValues().type === "Object"
      ? getValues()   /*@ts-ignore -- we know fields is on getValues() because type === 'Object'*/
            .fields?.filter((field) => field.type === "Object")
          .map((field: SanityFieldProperties) => field.name)
      : [];
  const allObjectNames = [...SanityFieldTypes, newlyCreatedObjectNames].flat();

  // @ts-ignore
  const out = <>
      <Form isRoot={isRoot} onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h4">
          {getValues().name || (isRoot ? "Schema Editor" : "New Field")} {formState.isDirty ? "*" : ""}
        </Typography>
        <br/>
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
                {SanityFieldTypes.map((type) => (
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
                <FaQuestionCircle />
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

        {type === "Image" && (
          <>
            <Controller
                { /*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
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
              { /*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
              name="options.accept"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField {...field} label="Accept (MIME types)" />
              )}
            />
            <br />
            <Controller
                { /*@ts-ignore -- we know fields is on getValues() because type === 'Image'*/ ...{} }
                name="options.sources"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField {...field} label="Sources (asset sources)" />
              )}
            />
            <br />
          </>
        )}

        {type === "Reference" && (
          <>
            <Controller
              { /*@ts-ignore -- we know to is on getValues() because type === 'Reference'*/ ...{} }
              name="to"
              control={control}
              { /*@ts-ignore -- we know to is on getValues() because type === 'Reference'*/ ...{} }
              defaultValue={["Object"]}
              render={({ field }) => (
                <Select multiple {...field} title="To" label="To">
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
                { /*@ts-ignore -- we know weak is on getValues() because type === 'Reference'*/ ...{} }
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
                    { /*@ts-ignore -- we know fields is on getValues() because type === 'Array'*/ ...{} }
                    name="of"
                    control={control}
                    { /*@ts-ignore -- we know to is on getValues() because type === 'Array'*/ ...{} }
                    defaultValue={["Object"]}
                    render={({ field }) => (
                        <Select multiple {...field} title="Of" label="Of">
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
                    { /*@ts-ignore -- we know sortable is on getValues() because type === 'Array'*/ ...{} }
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
                    { /*@ts-ignore -- we know min is on getValues() because type === 'Array'*/ ...{} }
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

        {type === "Object" || type === "Document" && (
          <>
            <Button variant="outlined" onClick={() => append({})}>
              Add Field
            </Button>
            <br />
            <Grid
              container
              spacing={{ xs: 1, md: 2 }}
              columns={{ xs: 2, sm: 3, md: 4 }}
              justifyContent="center"
            >
              {fields.map((field, index) => (
                <Grid xs="auto" item key={field.id}>
                  <Card
                    sx={{ width: "300px", height: "min-content" }}
                    key={field.id}
                  >
                    <FieldForm
                      isRoot={false}
                      { /*@ts-ignore -- we know fields is on getValues() because type === 'Object'*/ ...{} }
                      defaultValues={getValues().fields[index]}
                      onSubmit={(data) => {
                        update(index, data);
                      }}
                    />{" "}
                    <Button onClick={() => remove(index)}>Remove</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>

          </>
        )}

        <>
          {isRoot && subButton}
          <br />
        </>
      </Form>
      {!isRoot && subButton}
      </>


  if(!isRoot) {
    return out;
  }

  return  <main className={styles.main}><Paper> {out} </Paper></main>

};

const saveTs = (fp: SanityFieldProperties) => {
  // save a JSON file of the schema (JSON stringify) and sanity code (exportSanitySchema -> .ts)
  const ts = exportSanitySchema(fp, true);

  const blob2 = new Blob([ts], { type: "text/plain" });
  const url2 = URL.createObjectURL(blob2);
  const a2 = document.createElement("a");

  a2.href = url2;
  a2.download = `${fp.name}.ts`;
  a2.click();


  URL.revokeObjectURL(url2);
};

const saveJson = (fp: SanityFieldProperties) => {
  const json = JSON.stringify(fp, null, 2);
    const blob = new Blob([json], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${fp.name}.json`;
    a.click();


    URL.revokeObjectURL(url);
}


const DEFAULT_DATA: SanityDocumentFieldProperties = {
  type: "Document",
  name: "",
  title: "",
  description: "",
  fields: [],
  readOnly: false,
  hidden: false,
};

export const SanityTypeCreator = () => {
  const [ data, setData ] = useState<SanityFieldProperties>(DEFAULT_DATA)
  return (
    <>
      <FieldForm
        isRoot
        onSubmit={(dta) => {setData(dta); saveTs(dta);}}
        defaultValues={data}
      />
      <SpeedDial
          ariaLabel="Quick Menu"
          sx={{ position: 'fixed', bottom: "2rem", right: "2rem" }}
          icon={<SpeedDialIcon />}
      >
            <SpeedDialAction
                icon={<FaJs/>}
                tooltipTitle={"Save Generated Code (.ts)"}
                onClick={() => {
                  saveTs(data);
                }}/>

        <SpeedDialAction
            icon={<FaSave/>}
            tooltipTitle={"Save Entry (.json)"}
            onClick={() => {
                saveJson(data);
            }}/>


          <SpeedDialAction
                icon={<FaGithub/>}
                tooltipTitle={"View on Github"}
                onClick={() => {
                    typeof window !== 'undefined' && window.open("");
                }}/>

        <SpeedDialAction
          icon={<FaUndo/>}
            tooltipTitle={"Reset"}
            onClick={() =>
              setData(DEFAULT_DATA)
            }/>



      </SpeedDial>
    </>
  );
};
