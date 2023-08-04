import { CODEGEN_MESSAGE } from "../../constants/CodegenMessage";
import { SanityFieldProperties } from "../../types/SanityFieldProperties";
import { sanitizeName } from "../sanitizeName";
import { exportSanitySchema } from "./exportSanitySchema";

export const saveTs = (fp: SanityFieldProperties, getTypeObjOfString: (name: string) => SanityFieldProperties) => {
    const ts = CODEGEN_MESSAGE + exportSanitySchema(fp, true, getTypeObjOfString);
  
    const blob2 = new Blob([ts], { type: "text/plain" });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement("a");
  
    a2.href = url2;
    a2.download = `${fp.name}.ts`;
    a2.click();
  
    URL.revokeObjectURL(url2);
  };
  
  export const saveTses = (fp: SanityFieldProperties[], getTypeObjOfString: (name: string) => SanityFieldProperties) => {
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
  