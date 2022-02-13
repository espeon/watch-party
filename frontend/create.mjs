import { setupCreateSessionForm } from "./lib/create-session.mjs?v=8";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
