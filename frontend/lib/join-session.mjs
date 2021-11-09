import { joinSession } from "./watch-session.mjs";

/**
 * @param {HTMLInputElement} field
 */
const loadNickname = (field) => {
  try {
    const savedNickname = localStorage.getItem("watch-party-nickname");
    field.value = savedNickname;
  } catch (_err) {
    // Sometimes localStorage is blocked from use
  }
};

/**
 * @param {HTMLInputElement} field
 */
const saveNickname = (field) => {
  try {
    localStorage.setItem("watch-party-nickname", field.value);
  } catch (_err) {
    // see loadNickname
  }
};

export const setupJoinSessionForm = () => {
  const form = document.querySelector("#join-session-form");
  const nickname = form.querySelector("#join-session-nickname");
  const sessionId = form.querySelector("#join-session-id");

  loadNickname(nickname);

  if (window.location.hash.match(/#[0-9a-f\-]+/)) {
    sessionId.value = window.location.hash.substring(1);
  }

  document
    .querySelector("#join-session-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();

      saveNickname(nickname);
      joinSession(nickname.value, sessionId.value);
    });
};
