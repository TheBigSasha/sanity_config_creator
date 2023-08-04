import { Button, Alert, AlertTitle, TextField, Select, MenuItem, Tooltip, FormControlLabel, Checkbox, Typography, Accordion, AccordionSummary, AccordionDetails, Paper } from "@mui/material";
import { useState, useContext } from "react";
import { useForm, useFieldArray, Form, Controller } from "react-hook-form";
import { FaQuestionCircle, FaPlus, FaChevronDown } from "react-icons/fa";
import { UnchoosableTypes } from "../constants/UnchoosableTypes";
import { SanityFieldProperties } from "../types/SanityFieldProperties";
import { SanityFieldType, SanityFieldTypes } from "../types/SanityFieldType";
import { Horizontal } from "./Horizontal";
import { PreDefinedStringsForm } from "./PreDefinedStringsForm";
import { getIconForField } from "./getIconForField";
import styles from "../styles/Home.module.css";
import { CustomTypeContext } from "../utils/context/customTypeContext";
import { SForm } from "./SForm";

export interface FormFieldProps {
    onSubmit: (formState: SanityFieldProperties) => void;
    defaultValues: SanityFieldProperties;
    isRoot?: boolean;
    extraButtons?: React.ReactNode;
    topBar?: React.ReactNode;
  }

  export const FieldForm: React.FC<FormFieldProps> = ({
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
  
    const out = (
      <>
        <SForm isRoot={isRoot} onSubmit={handleSubmit(onSubmit)}>
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
            rules={{ required: true, pattern: /^[a-zA-Z0-9_]+$/ }}
            defaultValue=""
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Field name (Record key)"
                error={fieldState.invalid}
                helperText={
                  fieldState.invalid
                    ? "Name must be alphanumeric and contain no spaces"
                    : ""
                }
              />
            )}
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
                control={<Checkbox {...field} checked={field.value as boolean} />}
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
                control={<Checkbox {...field} checked={field.value as boolean}  />}
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
                    control={<Checkbox {...field} checked={field.value as boolean}  />}
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
                    control={<Checkbox {...field} checked={field.value as boolean}  />}
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
                    control={<Checkbox {...field} checked={field.value as boolean}  />}
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
                    control={<Checkbox {...field} checked={field.value as boolean}  />}
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
                    control={<Checkbox {...field} checked={field.value as boolean}  />}
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
                    control={<Checkbox {...field} checked={field.value as boolean}  />}
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
        </SForm>
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
  