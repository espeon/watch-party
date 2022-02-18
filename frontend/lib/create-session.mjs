import { createSession } from "./watch-session.mjs?v=a6a856c";

export const setupCreateSessionForm = () => {
  const form = document.querySelector("#create-session-form");
  const videoUrl = form.querySelector("#create-session-video");
  const subsUrl = form.querySelector("#create-session-subs");
  const subsName = form.querySelector("#create-session-subs-name");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let subs = [];
    if (subsUrl.value) {
      subs.push({ url: subsUrl.value, name: subsName.value || "default" });
    }
    createSession(videoUrl.value, subs);
  });
};
