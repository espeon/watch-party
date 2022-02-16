import { setupCreateSessionForm } from "./lib/create-session.mjs?v=e9a1b";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
