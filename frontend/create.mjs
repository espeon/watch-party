import { setupCreateSessionForm } from "./lib/create-session.mjs?v=ee93fb";

const main = () => {
  setupCreateSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
