import { setupCreateSessionForm } from "./lib/create-session.mjs?v=4b61c4";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
