import { Button, TextField } from "@mui/material";
import { useFieldArray, Controller } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import { VscTrash } from "react-icons/vsc";

export const PreDefinedStringsForm: React.FC<{control: any}> = ({control}) => {
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
  
  