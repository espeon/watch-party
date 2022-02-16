export async function emojify(text) {
  const emojiList = await emojis;
  let last = 0;
  let nodes = [];
  text.replace(/:([^\s:]+):/g, (match, name, index) => {
    if (last <= index)
      nodes.push(document.createTextNode(text.slice(last, index)));
    if (!emojiList.includes(name)) {
      nodes.push(document.createTextNode(match));
    } else {
      nodes.push(
        Object.assign(new Image(), {
          src: `/emojis/${name}.png`,
          className: "emoji",
          alt: name,
        })
      );
    }
    last = index + match.length;
  });
  if (last < text.length) nodes.push(document.createTextNode(text.slice(last)));
  return nodes;
}
export const emojis = fetch("/emojis")
  .then((e) => e.json())
  .then((e) => e.map((e) => e.slice(0, -4)));
