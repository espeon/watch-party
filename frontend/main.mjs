import { setupJoinSessionForm } from "./lib/join-session.mjs?v=4b61c4";

const main = () => {
  setupJoinSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
