import { createContext } from "preact";

export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});
