import { joinNewSession } from "./watch-session.mjs?v=048af96";

export async function linkify(
  text,
  next = async (t) => [document.createTextNode(t)]
) {
  let last = 0;
  let nodes = [];
  let promise = Promise.resolve();
  // matching non-urls isn't a problem, we use the browser's url parser to filter them out
  text.replace(
    /[^:/?#\s]+:\/\/\S+/g,
    (match, index) =>
      (promise = promise.then(async () => {
        if (last <= index) nodes.push(...(await next(text.slice(last, index))));
        let url;
        try {
          url = new URL(match);
          if (url.protocol === "javascript:") throw new Error();
        } catch (e) {
          url = null;
        }
        if (!url) {
          nodes.push(...(await next(match)));
        } else {
          let s;
          if (
            url.origin == location.origin &&
            url.pathname == "/" &&
            url.hash.length > 1
          ) {
            nodes.push(
              Object.assign(document.createElement("a"), {
                textContent: "Join Session",
                className: "chip join-chip",
                onclick: () => {
                  joinNewSession(url.hash.substring(1));
                },
              })
            );
          } else if (
            url.hostname == "xiv.st" &&
            (s = url.pathname.match(/(\d?\d).?(\d\d)/))
          ) {
            if (s) {
              const date = new Date();
              date.setUTCSeconds(0);
              date.setUTCMilliseconds(0);
              date.setUTCHours(s[1]), date.setUTCMinutes(s[2]);
              nodes.push(
                Object.assign(document.createElement("a"), {
                  href: url.href,
                  textContent: date.toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  className: "chip time-chip",
                  target: "_blank",
                })
              );
            }
          } else {
            nodes.push(
              Object.assign(document.createElement("a"), {
                href: url.href,
                textContent: url.href,
                target: "_blank",
              })
            );
          }
        }
        last = index + match.length;
      }))
  );
  await promise;
  if (last < text.length) nodes.push(...(await next(text.slice(last))));
  return nodes;
}
const emojis = {};

export const emojisLoaded = Promise.all([
  fetch("/emojis")
    .then((e) => e.json())
    .then((a) => {
      for (let e of a) {
        const name = e.slice(0, -4),
          lower = name.toLowerCase();
        emojis[lower[0]] = emojis[lower[0]] || [];
        emojis[lower[0]].push([name, ":" + name + ":", e.slice(-4), lower]);
      }
    }),
  fetch("/emojis/unicode.json")
    .then((e) => e.json())
    .then((a) => {
      for (let e of a) {
        emojis[e[0][0]] = emojis[e[0][0]] || [];
        emojis[e[0][0]].push([e[0], e[1], null, e[0]]);
      }
    }),
]);

export async function findEmojis(search) {
  await emojisLoaded;
  let groups = [[], []];
  if (search.length < 1) {
    for (let letter of Object.keys(emojis).sort())
      for (let emoji of emojis[letter]) {
        (emoji[1][0] === ":" ? groups[0] : groups[1]).push(emoji);
      }
  } else {
    search = search.toLowerCase();
    for (let emoji of emojis[search[0]]) {
      if (search.length == 1 || emoji[3].startsWith(search)) {
        (emoji[1][0] === ":" ? groups[0] : groups[1]).push(emoji);
      }
    }
  }
  return [...groups[0], ...groups[1]];
}
