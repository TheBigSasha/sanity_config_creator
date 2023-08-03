import { Controller, useFieldArray, useForm } from "react-hook-form";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Box,
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
  FaGithub,
  FaJs,
  FaQuestionCircle,
  FaSave,
  FaUndo, FaTruckLoading,
} from "react-icons/fa";
import styles from "../styles/Home.module.css";
import { CODEGEN_MESSAGE } from "../constants/CodegenMessage";

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
  };
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
  }   else if (schema.type === "Array") {
    const arraySchema = schema as SanityArrayFieldProperties;
    for (const ofType of arraySchema.of) {
      query += `${ofType},`;
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

const isDefaultSanityType = (type: SanityFieldType | string): boolean => {
    return SanityFieldTypes.includes(type);
}

const getBaseTypeDef = (
  schema: SanityFieldProperties,
  isRoot = false,
): string => {
  let outStr = isRoot ? "defineType" : "defineField";
  outStr += `({\n      type: '${isDefaultSanityType(schema.type) ? schema.type.toLowerCase() : schema.type}',\n      name: '${schema.name}',\n      title: '${schema.title}',\n`;
  if (schema.description)
    outStr += `      description: '${schema.description}',\n`;
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
  if (schema.type === "Object" || schema.type === "Document") {
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
      outStr += `export const get${schemaName.replaceAll(
        "_",
        "",
      )}BySlug = (slug: string) => client.fetch(${schemaName.toUpperCase()}_BY_SLUG_QUERY, { slug })\n`;
    }
    outStr += "\n\n";
    outStr += `export const ${schemaName.toUpperCase()}_QUERY = groq\`\n${exportQuery(
      schema,
    )}\n\`\n`;
    outStr += `export const get${schemaName.replaceAll(
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
  ].flat();

  const validTypes: string[] = isRoot ? ["Document", "Object"] : allObjectNames;

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

const saveTs = (fp: SanityFieldProperties) => {
  const ts = CODEGEN_MESSAGE + exportSanitySchema(fp, true);

  const blob2 = new Blob([ts], { type: "text/plain" });
  const url2 = URL.createObjectURL(blob2);
  const a2 = document.createElement("a");

  a2.href = url2;
  a2.download = `${fp.name}.ts`;
  a2.click();

  URL.revokeObjectURL(url2);
};

const saveTses = (fp: SanityFieldProperties[]) => {
  const tses = fp
    .map(
      (f) =>
        CODEGEN_MESSAGE +
        `\n\n// ------------------ ${f.title} ------------------  \n\n` +
        exportSanitySchema(f, true),
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
  setCustomTypes: (customTypes: string[]) => void;
}

export const CustomTypeContext = createContext<customTypeContextType>({
  customTypes: [],
  setCustomTypes: () => {},
});

export const CustomTypeProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [customTypes, setCustomTypes] = useState<string[]>([]);

  return (
    <CustomTypeContext.Provider value={{ customTypes, setCustomTypes }}>
      {children}
    </CustomTypeContext.Provider>
  );
};

const SanityTypeCreatorRaw = () => {
  const [datas, setDatas] = useState<SanityFieldProperties[]>([DEFAULT_DATA]);
  const { setCustomTypes } = useContext(CustomTypeContext);

  useEffect(() => {
    setCustomTypes(datas.map((d) => d.name));
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
                  saveTs(data);
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
          icon={<FaPlus />}
          tooltipTitle={"Add New Schema"}
          onClick={() => {
            setDatas([...datas, DEFAULT_DATA]);
          }}
        />

        <SpeedDialAction
          icon={<FaJs />}
          tooltipTitle={"Save All Generated Code (.ts)"}
          onClick={() => {
            saveTses(datas);
          }}
        />

        <SpeedDialAction
          icon={<FaSave />}
          tooltipTitle={"Save Project (.json)"}
          onClick={() => {
            saveJsons(datas);
          }}
        />

        <SpeedDialAction
          icon={<FaGithub />}
          tooltipTitle={"View on Github"}
          onClick={() => {
            typeof window !== "undefined" &&
              window.open(
                "https://github.com/TheBigSasha/sanity_config_creator",
              );
          }}
        />

        <SpeedDialAction
            icon={<FaTruckLoading />}
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

        <SpeedDialAction
          icon={<FaUndo />}
          tooltipTitle={"Reset"}
          onClick={() => setDatas([DEFAULT_DATA])}
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
