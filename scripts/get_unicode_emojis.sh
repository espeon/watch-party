#!/bin/sh

# Get emoji folder
emojiFolder="$(readlink -f "$(dirname $0)/../frontend/emojis/")"

curl 'https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji.json' | jq '. | map(. as $emoji | .short_names | map([., ($emoji.unified | split("-") | map(. | split("") | map(. as $nibble | (["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"] | index($nibble))) | reduce .[] as $item (0; (. * 16) + $item)) | map(if (. < 65536) then (.) else [55296 - 64 + (. / 1024 | floor), 56320 + (((. / 1024) - (. / 1024 | floor)) * 1024)] end) | flatten(1) | map(("\\u" + ("0000" + ({"str": "", "num": .} | until(.num < 1; {"str": (["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"][((.num / 16) - (.num / 16 | floor)) * 16] + .str), "num": (.num / 16) | floor})).str)[-4:])) | join("") | "\"" + . + "\"" | fromjson)])) | flatten(1)' --raw-output >"$emojiFolder/unicode.json"
