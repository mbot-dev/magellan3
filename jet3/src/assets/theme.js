export const base = {
  background: "#fff",
  onBackground: "#000",
  surface: "#f1f1f1",
  onSurface: "#000",
  borderColor: "#ccc",
  karte: "#fff",
  onKarte: "#000",
  soa: "#fafafa",
  onSoa: "#000",
  onHeader: "#111",
  danger: "#f44336",
  oral: "#ff9800",
  injection: "#2196F3",
  topical: "#000",
};
export const lilacTheme = {
  name: "margaret",
  primary: "#8875b4",
  primarySelected: "#6798a3",
  onPrimary: "#fff",
  secondary: "#5a8fa5",
  onSecondary: "#fff",
  accent: "#8875b4",
};
const blueMistTheme = {
  name: "blueMist",
  primary: "#6D7CBB",
  primarySelected: "#72b7d3",
  onPrimary: "#fff",
  secondary: "#72b7d3",
  onSecondary: "#fff",
  accent: "#868CD8",
};
// #6D7CBB(Original)  #7b7dbf(Adjusted)  #8b8bd1
const greenTheme = {
  name: "greenCurtain",
  primary: "#739f77",
  onPrimary: "#fff",
  primarySelected: "#6798a3",
  secondary: "#8875b4",
  onSecondary: "#fff",
  accent: "#739f77",
};
const blueGrayTheme = {
  name: "blueGray",
  primary: "#677aa3",
  primarySelected: "#6798a3",
  onPrimary: "#fff",
  secondary: "#6798a3",
  onSecondary: "#fff",
  accent: "#677aa3",
};
const grayTheme = {
  name: "gray",
  primary: "#f1f1f1",
  primarySelected: "#f1f1f1",
  onPrimary: "#000",
  secondary: "#f1f1f1",
  onSecondary: "#000",
  accent: "#677aa3",
};
export const margaret = { ...base, ...lilacTheme };
export const blueMist = { ...base, ...blueMistTheme };
export const greenCurtain = { ...base, ...greenTheme };
export const blueGray = { ...base, ...blueGrayTheme };
export const gray = { ...base, ...grayTheme };
