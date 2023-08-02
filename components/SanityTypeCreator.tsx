import {Controller, useFieldArray, useForm} from "react-hook-form";
import React, {useState} from "react";
import {Box, Checkbox, FormControlLabel, Select, TextField, Button, MenuItem, Grid, Paper, Card, Typography} from "@mui/material";
import styled from "styled-components";
import {FaQuestionCircle} from "react-icons/fa";

type SanityFieldType = "Array" | "Block" | "Boolean" | "Date" | "Datetime" | "Document" | "File" | "Geopoint" | "Image" | "Number" | "Object" | "Reference"  | "Slug"  | "String" | "Span" | "Text" | "URL";

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
}

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
    }
}

const exportQuery = (schema: SanityFieldProperties, isRoot = true) : string => {
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
    } else {
        query += `${schema.name},`;
    }
    if (isRoot) {
        query += "}";
    }
    return query;
}

const exportBySlugQuery = (schemaWithSlug: SanityFieldProperties, isRoot = true): string => {
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
}

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
}


const exportSanitySchema = (schema: SanityFieldProperties, isRoot = true): string => {
    let outStr = isRoot ? `import { defineField, defineType } from 'sanity'\n\n` : '';

    if (schema.type === 'Object') {
        const objectSchema = schema as SanityObjectFieldProperties;

        if (isRoot) {
            outStr += `export default defineType({\n  name: '${objectSchema.name}',\n  title: '${objectSchema.title}',\n  type: '${objectSchema.type}',\n  fields: [\n`;
        } else {
            outStr += `defineField({\n  name: '${objectSchema.name}',\n  title: '${objectSchema.title}',\n  type: '${objectSchema.type}',\n  fields: [\n`;
        }

        objectSchema.fields.forEach(field => {
            outStr += exportSanitySchema(field, false);
        });

        outStr += `  ],\n`;

        if (isRoot) {
            outStr += `})`;
        } else {
            outStr += `}),\n`;
        }
    } else if (schema.type === 'Image') {
        const imageSchema = schema as SanityImageFieldProperties;

        outStr += `    defineField({\n      type: '${imageSchema.type}',\n      name: '${imageSchema.name}',\n      title: '${imageSchema.title}',\n`;
        if (imageSchema.description) outStr += `      description: '${imageSchema.description}',\n`;
        if (imageSchema.hidden) outStr += `      hidden: ${imageSchema.hidden},\n`;
        if (imageSchema.readOnly) outStr += `      readOnly: ${imageSchema.readOnly},\n`;

        if (imageSchema.options) {
            outStr += `      options: {\n`;

            if (imageSchema.options.hotspot) outStr += `        hotspot: ${imageSchema.options.hotspot},\n`;
            if (imageSchema.options.accept) outStr += `        accept: '${imageSchema.options.accept}',\n`;
            if (imageSchema.options.sources) outStr += `        sources: '${imageSchema.options.sources}',\n`;

            outStr += `      },\n`;
        }

        outStr += `    }),\n`;
    } else {
        outStr += `    defineField({\n      type: '${schema.type}',\n      name: '${schema.name}',\n      title: '${schema.title}',\n`;
        if (schema.description) outStr += `      description: '${schema.description}',\n`;
        if (schema.hidden) outStr += `      hidden: ${schema.hidden},\n`;
        if (schema.readOnly) outStr += `      readOnly: ${schema.readOnly},\n`;
        outStr += `    }),\n`;
    }

    if (isRoot) {
        if (hasSlug(schema)) {
            outStr += "\n\n";
            outStr += `export const ${schema.name.toUpperCase()}_BY_SLUG_QUERY = groq\`\n${exportBySlugQuery(schema)}\n\`\n`;
            outStr += `export const get${schema.name}BySlug = (slug: string) => client.fetch(${schema.name.toUpperCase()}_BY_SLUG_QUERY, { slug })\n`;
        }
        outStr += "\n\n";
        outStr += `export const ${schema.name.toUpperCase()}_QUERY = groq\`\n${exportQuery(schema)}\n\`\n`;
        outStr += `export const get${schema.name} = () => client.fetch(${schema.name.toUpperCase()}_QUERY)\n`;
    }

    return outStr;
}

const Form = styled.form<{ isRoot?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 25px;
  width: ${({ isRoot }) => (isRoot ? 'clamp(300px, 100vw, 1200px);' : '300px')};
`;

const Horizontal = styled.div`
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
    align-items: center;
`;

const ResponsiveGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
`;
interface FormFieldProps {onSubmit: (formState: SanityFieldProperties) => void;
    defaultValues: SanityFieldProperties; isRoot?: boolean;}
const FieldForm: React.FC<FormFieldProps> = ({ onSubmit, defaultValues, isRoot }) => {
    const { handleSubmit, control, getValues, formState } = useForm<SanityFieldProperties>({
        defaultValues,
    });
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'fields',
    });
    const [type, setType] = useState<SanityFieldType>(defaultValues?.type);

    const subButton =                     <Button onClick={() => onSubmit(getValues())} type={isRoot ? "submit" : "button"} variant="contained">{isRoot ? "submit" : "save"}</Button>

    return (
        <>
            <Typography variant="h6">{getValues().name || "new field"} {formState.isDirty ? "*" : ""}</Typography>
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
                    <Horizontal><Select
                        {...field}
                        title="Type"
                        label="Type"
                        onChange={e => {
                            setType(e.target.value as SanityFieldType);
                            field.onChange(e);
                        }}
                    >
                        {SanityFieldTypes.map(type => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                    <a href={`https://www.sanity.io/docs/${type?.toLowerCase() || "object"}-type`} target="_blank" rel="noreferrer"><FaQuestionCircle/></a>
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

            {type === 'Image' && (
                <>
                    <Controller
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
                        name="options.accept"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <TextField {...field} label="Accept (MIME types)" />
                        )}
                    />
                    <br />
                    <Controller
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

            {type === 'Object' && (
                <>
                <Grid container spacing={{ xs: 1, md: 2 }} columns={{ xs: 2, sm: 3, md: 4 }}   justifyContent="center"
                >

                {fields.map((field, index) => (
                            <Grid xs="auto" item>
                                <Card sx={{width: "300px", height: "min-content"}} key={field.id} >
                                <FieldForm
                                isRoot={false}
                                defaultValues={field}
                                onSubmit={data => {
                                    update(index, data);
                                }}
                            />                                    <Button onClick={() => remove(index)}>Remove</Button>

                                </Card>

                            </Grid>

                    ))}
                </Grid>

                    <Button variant="outlined" onClick={() => append({})}>Add Field</Button>
                    <br />
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

    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${fp.name}.json`;
    a.click();

    URL.revokeObjectURL(url);

    const blob2 = new Blob([ts], {type: "text/plain"});
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement("a");

    a2.href = url2;
    a2.download = `${fp.name}.ts`;
    a2.click();

    console.log(ts)

    URL.revokeObjectURL(url2);

};

export const SanityTypeCreator = () => {
    return (
        <div>
            <FieldForm isRoot onSubmit={data => saveFiles(data)}  defaultValues={{type: "Object", name: "New Type", title: "New type", description: "", readOnly: false, hidden: false}}/>
        </div>
    )
}
