import { SanityFieldProperties } from "../../types/SanityFieldProperties";
import { isDefaultSanityType } from "../isDefaultSanityType";

export const getBaseTypeDef = (
  schema: SanityFieldProperties,
  isRoot = false,
): string => {
  let outStr = isRoot ? "defineType" : "defineField";
  outStr += `({\n      type: '${
    isDefaultSanityType(schema.type) ? schema.type.toLowerCase() : schema.type
  }',\n      name: ${JSON.stringify(
    schema.name,
  )},\n      title: ${JSON.stringify(schema.title)},\n`;
  if (schema.description)
    outStr += `      description: ${JSON.stringify(schema.description)},\n`;
  if (schema.hidden) outStr += `      hidden: ${schema.hidden},\n`;
  if (schema.readOnly) outStr += `      readOnly: ${schema.readOnly},\n`;
  return outStr;
};
