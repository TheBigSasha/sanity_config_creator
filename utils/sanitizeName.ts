export const sanitizeName = (name: string): string => {
  return name.replaceAll(" ", "_").replaceAll("[^a-zA-Z0-9_]", "");
};
