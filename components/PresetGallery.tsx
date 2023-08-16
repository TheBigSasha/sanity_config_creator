import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  DialogActions,
  Button,
} from "@mui/material";
import { useState } from "react";
import { IconButton } from "tbsui";
import { GalleryPreset } from "../types/GalleryPreset";
import { VscArrowRight, VscFileCode } from "react-icons/vsc";

export const PresetGallery = ({
  onChoosePreset,
  onDismiss,
  presets,
}: {
  onChoosePreset: (preset: GalleryPreset) => void;
  onDismiss: () => void;
  presets: GalleryPreset[];
}) => {
  const [highlightedPreset, setHighlightedPreset] = useState<
    GalleryPreset | undefined
  >(undefined);

  return (
    <Dialog open={true} onClose={onDismiss}>
      <DialogTitle>Choose a preset</DialogTitle>
      <DialogContent>
        <DialogContentText>Choose a preset to get started.</DialogContentText>
        <List>
          {presets.map((preset) => (
            <ListItem
              key={preset.title}
              onClick={() => {
                onChoosePreset(preset);
              }}
              onMouseEnter={() => {
                setHighlightedPreset(preset);
              }}
              onMouseLeave={() => {
                setHighlightedPreset(undefined);
              }}
            >
              <ListItemIcon>{preset.icon || <VscFileCode />}</ListItemIcon>
              <ListItemText
                primary={preset.title}
                secondary={preset.subtitle}
              />
              {highlightedPreset === preset && (
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => {
                      onChoosePreset(preset);
                    }}
                  >
                    <VscArrowRight />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
