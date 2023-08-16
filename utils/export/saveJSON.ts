import { SanityFieldProperties } from "../../types/SanityFieldProperties";
import { sanitizeName } from "../sanitizeName";

export const saveJson = (fp: SanityFieldProperties) => {
  const json = JSON.stringify(fp, null, 2);
  const blob = new Blob([json], { type: "text/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${fp.name}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

export const saveJsons = (fp: SanityFieldProperties[]) => {
  const json = JSON.stringify(fp, null, 2);
  const blob = new Blob([json], { type: "text/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${fp.map((f) => sanitizeName(f.title)).join("-")}.json`;
  a.click();

  URL.revokeObjectURL(url);
};
