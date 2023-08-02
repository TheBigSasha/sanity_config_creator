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
  Typography,
} from "@mui/material";
import styled from "styled-components";
import { FaQuestionCircle } from "react-icons/fa";

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
  } else {
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
  }

  return outStr;
};

const Form = styled.form<{ isRoot?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 25px;
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
      {isRoot ? "submit" : "save"}
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
  return (
    <>
      <Typography variant="h6">
        {getValues().name || "new field"} {formState.isDirty ? "*" : ""}
      </Typography>
      <Form isRoot={isRoot} onSubmit={handleSubmit(onSubmit)}>
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

        {type === "Object" && (
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
  );
};

const saveFiles = (fp: SanityFieldProperties) => {
  // save a JSON file of the schema (JSON stringify) and sanity code (exportSanitySchema -> .ts)
  const json = JSON.stringify(fp, null, 2);
  const ts = exportSanitySchema(fp, true);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${fp.name}.json`;
  a.click();

  URL.revokeObjectURL(url);

  const blob2 = new Blob([ts], { type: "text/plain" });
  const url2 = URL.createObjectURL(blob2);
  const a2 = document.createElement("a");

  a2.href = url2;
  a2.download = `${fp.name}.ts`;
  a2.click();

  console.log(ts);

  URL.revokeObjectURL(url2);
};

export const SanityTypeCreator = () => {
  return (
    <div>
      <FieldForm
        isRoot
        onSubmit={(data) => saveFiles(data)}
        defaultValues={{
          type: "Object",
          name: "",
          title: "",
          description: "",
          readOnly: false,
          hidden: false,
        }}
      />
    </div>
  );
};
