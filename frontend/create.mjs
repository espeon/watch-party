import { setupCreateSessionForm } from "./lib/create-session.mjs?v=bfdcf2";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
