import {
  setDebounce,
  setVideoTime,
  setPlaying,
} from "./watch-session.mjs?v=048af96";
import { emojify, findEmojis } from "./emojis.mjs?v=048af96";
import { linkify } from "./links.mjs?v=048af96";
import { joinNewSession } from "./watch-session.mjs?v=048af96";

function setCaretPosition(elem, caretPos) {
  if (elem.createTextRange) {
    var range = elem.createTextRange();
    range.move("character", caretPos);
    range.select();
  } else {
    if (elem.selectionStart) {
      elem.focus();
      elem.setSelectionRange(caretPos, caretPos);
    } else elem.focus();
  }
}

const setupChatboxEvents = (socket) => {
  // clear events by just reconstructing the form
  const oldChatForm = document.querySelector("#chatbox-send");
  const chatForm = oldChatForm.cloneNode(true);
  const messageInput = chatForm.querySelector("input");
  const emojiAutocomplete = chatForm.querySelector("#emoji-autocomplete");
  oldChatForm.replaceWith(chatForm);

  let autocompleting = false,
    showListTimer;

  const replaceMessage = (message) => () => {
    messageInput.value = message;
    autocomplete();
  };
  async function autocomplete(fromListTimeout) {
    if (autocompleting) return;
    try {
      clearInterval(showListTimer);
      emojiAutocomplete.textContent = "";
      autocompleting = true;
      let text = messageInput.value.slice(0, messageInput.selectionStart);
      const match = text.match(/(:[^\s:]+)?:([^\s:]*)$/);
      if (!match || match[1]) return (autocompleting = false); // We don't need to autocomplete.
      const prefix = text.slice(0, match.index);
      const search = text.slice(match.index + 1);
      if (search.length < 1 && !fromListTimeout) {
        autocompleting = false;
        showListTimer = setTimeout(() => autocomplete(true), 500);
        return;
      }
      const suffix = messageInput.value.slice(messageInput.selectionStart);
      let selected;
      const select = (button) => {
        if (selected) selected.classList.remove("selected");
        selected = button;
        button.classList.add("selected");
      };
      let results = await findEmojis(search);
      let yieldAt = performance.now() + 13;
      for (let i = 0; i < results.length; i += 100) {
        emojiAutocomplete.append.apply(
          emojiAutocomplete,
          results.slice(i, i + 100).map(([name, replaceWith, ext], i) => {
            const button = Object.assign(document.createElement("button"), {
              className: "emoji-option",
              onmousedown: (e) => e.preventDefault(),
              onclick: () => {
                messageInput.value = prefix + replaceWith + " " + suffix;
                setCaretPosition(
                  messageInput,
                  (prefix + " " + replaceWith).length
                );
              },
              onmouseover: () => select(button),
              onfocus: () => select(button),
              type: "button",
              title: name,
            });
            button.append(
              replaceWith[0] !== ":"
                ? Object.assign(document.createElement("span"), {
                    textContent: replaceWith,
                    className: "emoji",
                  })
                : Object.assign(new Image(), {
                    loading: "lazy",
                    src: `/emojis/${name}${ext}`,
                    className: "emoji",
                  }),
              Object.assign(document.createElement("span"), {
                textContent: name,
                className: "emoji-name",
              })
            );
            return button;
          })
        );
        if (i == 0 && emojiAutocomplete.children[0]) {
          emojiAutocomplete.children[0].scrollIntoView();
          select(emojiAutocomplete.children[0]);
        }
        const now = performance.now();
        if (now > yieldAt) {
          yieldAt = now + 13;
          await new Promise((cb) => setTimeout(cb, 0));
        }
      }
      autocompleting = false;
    } catch (e) {
      autocompleting = false;
    }
  }
  messageInput.addEventListener("input", () => autocomplete());
  messageInput.addEventListener("selectionchange", () => autocomplete());
  messageInput.addEventListener("keydown", (event) => {
    if (event.key == "ArrowUp" || event.key == "ArrowDown") {
      let selected = document.querySelector(".emoji-option.selected");
      if (!selected) return;
      event.preventDefault();
      selected.classList.remove("selected");
      selected =
        event.key == "ArrowDown"
          ? selected.nextElementSibling || selected.parentElement.children[0]
          : selected.previousElementSibling ||
            selected.parentElement.children[
              selected.parentElement.children.length - 1
            ];
      selected.classList.add("selected");
      selected.scrollIntoView({ scrollMode: "if-needed", block: "nearest" });
    }
    if (event.key == "Tab") {
      let selected = document.querySelector(".emoji-option.selected");
      if (!selected) return;
      event.preventDefault();
      selected.onclick();
    }
  });

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = messageInput.value;
    if (content.trim().length) {
      messageInput.value = "";

      // handle commands
      if (content.startsWith("/")) {
        const command = content.toLowerCase().match(/^\/\S+/)[0];
        const args = content.slice(command.length).trim();

        let handled = false;
        switch (command) {
          case "/ping":
            socket.send(
              JSON.stringify({
                op: "Ping",
                data: args,
              })
            );
            handled = true;
            break;
          case "/sync":
            const sessionId = window.location.hash.slice(1);
            const { current_time_ms, is_playing } = await fetch(
              `/sess/${sessionId}`
            ).then((r) => r.json());

            setDebounce();
            setPlaying(is_playing);
            setVideoTime(current_time_ms);

            const syncMessageContent = document.createElement("span");
            syncMessageContent.appendChild(
              document.createTextNode("resynced you to ")
            );
            syncMessageContent.appendChild(
              document.createTextNode(formatTime(current_time_ms))
            );
            printChatMessage("set-time", "/sync", "b57fdc", syncMessageContent);
            handled = true;
            break;
          case "/shrug":
            socket.send(
              JSON.stringify({
                op: "ChatMessage",
                data: `${args} ¯\\_(ツ)_/¯`.trim(),
              })
            );
            handled = true;
            break;
          case "/join":
            joinNewSession(args);
            handled = true;
            break;
          case "/help":
            const helpMessageContent = document.createElement("span");
            helpMessageContent.innerHTML =
              "Available commands:<br>" +
              "&emsp;<code>/help</code> - display this help message<br>" +
              "&emsp;<code>/ping [message]</code> - ping all viewers<br>" +
              "&emsp;<code>/sync</code> - resyncs you with other viewers<br>" +
              "&emsp;<code>/shrug</code> - appends ¯\\_(ツ)_/¯ to your message<br>" +
              "&emsp;<code>/join [session id]</code> - joins another session";

            printChatMessage(
              "command-message",
              "/help",
              "b57fdc",
              helpMessageContent
            );
            handled = true;
            break;
          default:
            break;
        }

        if (handled) {
          return;
        }
      }

      // handle regular chat messages
      socket.send(
        JSON.stringify({
          op: "ChatMessage",
          data: content,
        })
      );
    }
  });
};

/**
 * @param {WebSocket} socket
 */
export const setupChat = async (socket) => {
  document.querySelector("#chatbox-container").style["display"] = "flex";
  setupChatboxEvents(socket);
};

const addToChat = (node) => {
  const chatbox = document.querySelector("#chatbox");
  chatbox.appendChild(node);
  chatbox.scrollTop = chatbox.scrollHeight;
};

let lastTimeMs = null;
let lastPlaying = false;

const checkDebounce = (event) => {
  let timeMs = null;
  let playing = null;
  if (event.op == "SetTime") {
    timeMs = event.data;
  } else if (event.op == "SetPlaying") {
    timeMs = event.data.time;
    playing = event.data.playing;
  }

  let shouldIgnore = false;

  if (timeMs != null) {
    if (lastTimeMs && Math.abs(lastTimeMs - timeMs) < 500) {
      shouldIgnore = true;
    }
    lastTimeMs = timeMs;
  }

  if (playing != null) {
    if (lastPlaying != playing) {
      shouldIgnore = false;
    }
    lastPlaying = playing;
  }

  return shouldIgnore;
};

/**
 * @returns {string}
 */
const getCurrentTimestamp = () => {
  const t = new Date();
  return `${matpad(t.getHours())}:${matpad(t.getMinutes())}:${matpad(
    t.getSeconds()
  )}`;
};

/**
 * https://media.discordapp.net/attachments/834541919568527361/931678814751301632/66d2c68c48daa414c96951381665ec2e.png
 */
const matpad = (n) => {
  return ("00" + n).slice(-2);
};

/**
 * @param {string} eventType
 * @param {string?} user
 * @param {Node?} content
 */
export const printChatMessage = (eventType, user, colour, content) => {
  const chatMessage = document.createElement("div");
  chatMessage.classList.add("chat-message");
  chatMessage.classList.add(eventType);
  chatMessage.title = getCurrentTimestamp();

  if (user != null) {
    const userName = document.createElement("strong");
    userName.style = `--user-color: #${colour}`;
    userName.textContent = user + " ";
    chatMessage.appendChild(userName);
  }

  if (content != null) {
    chatMessage.appendChild(content);
  }

  addToChat(chatMessage);

  return chatMessage;
};

const formatTime = (ms) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (60 * 1000)) % 60);
  const hours = Math.floor((ms / (3600 * 1000)) % 3600);
  return `${hours < 10 ? "0" + hours : hours}:${
    minutes < 10 ? "0" + minutes : minutes
  }:${seconds < 10 ? "0" + seconds : seconds}`;
};

export const logEventToChat = async (event) => {
  if (checkDebounce(event)) {
    return;
  }

  switch (event.op) {
    case "UserJoin": {
      printChatMessage(
        "user-join",
        event.user,
        event.colour,
        document.createTextNode("joined")
      );
      break;
    }
    case "UserLeave": {
      printChatMessage(
        "user-leave",
        event.user,
        event.colour,
        document.createTextNode("left")
      );
      break;
    }
    case "ChatMessage": {
      const messageContent = document.createElement("span");
      messageContent.classList.add("message-content");
      messageContent.append(...(await linkify(event.data, emojify)));
      printChatMessage(
        "chat-message",
        event.user,
        event.colour,
        messageContent
      );
      break;
    }
    case "SetTime": {
      const messageContent = document.createElement("span");
      if (event.data.from != undefined) {
        messageContent.appendChild(
          document.createTextNode("set the time from ")
        );

        messageContent.appendChild(
          document.createTextNode(formatTime(event.data.from))
        );

        messageContent.appendChild(document.createTextNode(" to "));
      } else {
        messageContent.appendChild(document.createTextNode("set the time to "));
      }

      messageContent.appendChild(
        document.createTextNode(formatTime(event.data.to))
      );

      printChatMessage("set-time", event.user, event.colour, messageContent);
      break;
    }
    case "SetPlaying": {
      const messageContent = document.createElement("span");
      messageContent.appendChild(
        document.createTextNode(
          event.data.playing ? "started playing" : "paused"
        )
      );
      messageContent.appendChild(document.createTextNode(" at "));
      messageContent.appendChild(
        document.createTextNode(formatTime(event.data.time))
      );

      printChatMessage("set-playing", event.user, event.colour, messageContent);
      break;
    }
    case "Ping": {
      const messageContent = document.createElement("span");
      if (event.data) {
        messageContent.appendChild(document.createTextNode("pinged saying: "));
        messageContent.appendChild(document.createTextNode(event.data));
      } else {
        messageContent.appendChild(document.createTextNode("pinged"));
      }

      printChatMessage("ping", event.user, event.colour, messageContent);
      beep();
      break;
    }
  }
};

const beep = () => {
  const context = new AudioContext();

  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.value = 0.15;

  const oscillator = context.createOscillator();
  oscillator.connect(gain);
  oscillator.frequency.value = 400;
  oscillator.type = "sine";

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.22);
};

export const updateViewerList = (viewers) => {
  const listContainer = document.querySelector("#viewer-list");

  // empty out the current list
  listContainer.innerHTML = "";

  // display the updated list
  for (const viewer of viewers) {
    const viewerElem = document.createElement("div");
    const content = document.createElement("strong");
    content.textContent = viewer.nickname;
    content.style = `--user-color: #${viewer.colour}`;
    viewerElem.appendChild(content);
    listContainer.appendChild(viewerElem);
  }
};
