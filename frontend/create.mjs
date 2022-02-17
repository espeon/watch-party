import { setupCreateSessionForm } from "./lib/create-session.mjs?v=19ef791";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
