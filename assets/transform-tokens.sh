#!/usr/bin/env bash
# needs imagemagick installed in PATH
files=$(find ./tokens-raw -name "*.webp")
convert -size 1300x1300 xc:Black -fill White -draw 'circle 650 650 650 170' -alpha Copy mask.png
for file in $files
do
  dimensions=$(identify -format "%wx%h" "$file")
  IFS='x' read -r width height <<< "$dimensions"
  size=$((width > height ? width : height))
  
  temp="./tokens-temp/${file##*/}"
  end="./tokens-border/${file##*/}"
  alt="./tokens-border-alt/${file##*/}"

  convert "$file" -background white -gravity center -extent "${size}x${size}" "$temp"
  convert "$temp" -resize 960x960 "$temp"
  convert "$temp" -background transparent -gravity center -extent 1300x1300 "$temp"
  convert "$temp" -gravity Center mask.png -compose CopyOpacity -composite -trim "$temp"
  convert "$temp" -background transparent -gravity center -extent 1300x1300 "$temp"
  convert "$temp" token-border-1.webp -gravity center -compose over -composite "$end"
  convert "$temp" token-border-2.webp -gravity center -compose over -composite "$alt"
done
rm -r ./tokens-temp/* ./mask.png