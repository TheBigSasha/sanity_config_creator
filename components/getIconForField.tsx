import React from "react";
import {
  SanityArrayFieldProperties,
  SanityFieldProperties,
} from "../types/SanityFieldProperties";
import { BsCalendarDate, BsCardImage } from "react-icons/bs";
import {
  VscSymbolKeyword,
  VscSymbolArray,
  VscSymbolBoolean,
  VscSymbolFile,
  VscLocation,
  VscSymbolNumeric,
  VscPackage,
  VscReferences,
  VscKey,
  VscSymbolString,
  VscListTree,
  VscNote,
  VscLink,
  VscSymbolMethod,
} from "react-icons/vsc";
import { HiOutlineDocumentText } from "react-icons/hi";

export const getIconForField = (
  field: SanityFieldProperties | string,
): React.ReactNode => {
  const type = typeof field === "string" ? field : field.type;
  switch (type) {
    case "Array":
      const arrayField = field as SanityArrayFieldProperties;
      if (
        typeof field !== "string" &&
        arrayField.of &&
        arrayField.of.length === 1 &&
        arrayField.of[0] === "Block"
      ) {
        return <VscSymbolKeyword />;
      }
      if (
        typeof field === "string" ||
        !arrayField.of ||
        arrayField.of.length === 0
      ) {
        0;
        return <VscSymbolArray />;
      }
      return <>[{arrayField.of.map((typ) => getIconForField(typ))}]</>;
    case "Block":
      return <VscSymbolKeyword />;
    case "Boolean":
      return <VscSymbolBoolean />;
    case "Date":
      return <BsCalendarDate />;
    case "Datetime":
      return <BsCalendarDate />;
    case "Document":
      return <HiOutlineDocumentText />;
    case "File":
      return <VscSymbolFile />;
    case "Geopoint":
      return <VscLocation />;
    case "Image":
      return <BsCardImage />;
    case "Number":
      return <VscSymbolNumeric />;
    case "Object":
      return <VscPackage />;
    case "Reference":
      return <VscReferences />;
    case "Slug":
      return <VscKey />;
    case "String":
      return <VscSymbolString />;
    case "Span":
      return <VscListTree />;
    case "Text":
      return <VscNote />;
    case "URL":
      return <VscLink />;
    default:
      return <VscSymbolMethod />;
  }
};
