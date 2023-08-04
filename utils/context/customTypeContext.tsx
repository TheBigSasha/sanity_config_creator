import { createContext, useState } from "react";
import { SanityFieldProperties, DEFAULT_DATA } from "../../types/SanityFieldProperties";
import { sanitizeName } from "../sanitizeName";

export interface customTypeContextType {
    customTypes: string[];
    setCustomTypes: (customTypes: SanityFieldProperties[]) => void;
    getTypeObjOfString: (name: string) => SanityFieldProperties,
  }
  
  export const CustomTypeContext = createContext<customTypeContextType>({
    customTypes: [],
    setCustomTypes: () => {},
    getTypeObjOfString: () => DEFAULT_DATA,
  });
  
  export const CustomTypeProvider: React.FC<React.PropsWithChildren<{}>> = ({
    children,
  }) => {
    const [customTypeObjs, setCustomTypes] = useState<SanityFieldProperties[]>([]);
    const getTypeObjOfString = (name: string) => {
      return customTypeObjs.find((ct) => sanitizeName(ct.name) === name || ct.name === name) || DEFAULT_DATA;
    }
  
    const customTypes = customTypeObjs.map((ct) => sanitizeName(ct.name));
  
    return (
      <CustomTypeContext.Provider value={{ customTypes, setCustomTypes, getTypeObjOfString }}>
        {children}
      </CustomTypeContext.Provider>
    );
  };
  
  