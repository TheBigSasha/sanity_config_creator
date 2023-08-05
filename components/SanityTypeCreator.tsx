import React, { useContext, useEffect, useState } from "react";
import {
  Button,
   Typography,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  ButtonGroup,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  VscSaveAll,
  VscNewFile,
  VscBook,
  VscCopy,
  VscDesktopDownload,
} from "react-icons/vsc";
import {
  BsFiletypeJson,
  BsUpload
} from "react-icons/bs";
import { getAllPresets } from "../presets/GetPreset";
import { SanityFieldProperties, DEFAULT_DATA } from "../types/SanityFieldProperties";
import { CustomTypeContext, CustomTypeProvider } from "../utils/context/customTypeContext";
import { saveJsons } from "../utils/export/saveJSON";
import { copyQueryToClipboard, copySchemaToClipboard, copyTsInterfaceToClipboard, saveTs, saveTses } from "../utils/export/saveTS";
import { FieldForm } from "./FieldForm";
import { LeftRight } from "./LeftRight";
import { ResponsiveGrid } from "./ResponsiveGrid";
import { PresetGallery } from "./PresetGallery";


const SanityTypeCreatorRaw = () => {
  const [datas, setDatas] = useState<SanityFieldProperties[]>([DEFAULT_DATA]);
  const { setCustomTypes, getTypeObjOfString } = useContext(CustomTypeContext);

  useEffect(() => {
    setCustomTypes(datas);
  }, [datas, setCustomTypes]);

  const [copiedNotif, setCopiedNotif] = useState<string | undefined>(undefined);

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setCopiedNotif(undefined);
  };

  const [presetGalleryOpen, setPresetGalleryOpen] = useState(false);


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
              <ButtonGroup>
                <Button
                  variant={"outlined"}
                  onClick={() => {
                    saveTs(data, getTypeObjOfString);
                    setCopiedNotif(`Saved all TypeScript code for ${data.title} to Downloads`);
                  }}
                >
                  <VscDesktopDownload/> All (.ts)
                </Button>
                <Button
                  variant={"outlined"}
                  onClick={() => {copySchemaToClipboard(data, getTypeObjOfString); setCopiedNotif(`Copied Sanity Schema for ${data.title} to Clipboard`);
                }
                  }
                >
                  <VscCopy/> Schema
                </Button>
                <Button
                  variant={"outlined"}
                  onClick={() => {
                    copyQueryToClipboard(data, getTypeObjOfString);
                    setCopiedNotif(`Copied GROQ Query for ${data.title} to Clipboard`);
                  }}
                >
                   <VscCopy/> Query
                </Button>
                <Button variant={"outlined"} onClick={
                  () => {
                    copyTsInterfaceToClipboard(data);
                    setCopiedNotif(`Copied TypeScript interface for types in ${data.title} to Clipboard`);
                  }
                }
                >
                  <VscCopy/> TS Types
                </Button>
              </ButtonGroup>
            
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

          {/* TODO: add preset gallery modal UI */}
        <SpeedDialAction
          icon={<VscBook />}
          tooltipTitle={"Load from Preset"}
          onClick={() => {
            setPresetGalleryOpen(true);
          }}
        />
      </SpeedDial>
      <Snackbar
          open={copiedNotif !== undefined}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert severity="success">
          {copiedNotif}
        </Alert>
        </Snackbar>
        {presetGalleryOpen &&
        <PresetGallery onChoosePreset={(preset) => {
          setDatas(preset.element);
          setPresetGalleryOpen(false);
          setCopiedNotif(`Replaced editor content with preset schema ${preset.title}`);
        }
        } onDismiss={() => setPresetGalleryOpen(false)} presets={getAllPresets()} />
        }
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
