import { setupJoinSessionForm } from "./lib/join-session.mjs?v=bfdcf2";

const main = () => {
  setupJoinSessionForm();
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
