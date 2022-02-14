#!/bin/sh
set -eu

# Get guild ID
if [ ! "$1" ];then
   echo "You need to provide a Discord Guild ID."
   exit 1
else
   guild="$1"
fi

# Get emoji folder
emojiFolder="$(readlink -f "$(dirname $0)/../frontend/emojis/")"

# Get Discord token
printf "Token: " 1>&2
trap 'stty echo' INT EXIT
stty -echo
read token
printf "\n" 1>&2
stty echo

curl "https://discord.com/api/v9/guilds/${guild}/emojis" -H "Authorization: $token"  |  jq --raw-output 'map("curl '"'"'https://cdn.discordapp.com/emojis/" + .id + ".png?size=48&quality=lossless'"'"' -o '"'${emojiFolder}/"'" + .name + ".png'"'"'") | join("\n")' | sh
