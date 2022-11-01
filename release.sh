#!/usr/bin/env bash
git diff --exit-code &>/dev/null
if [ $? -ne 0 ] && [ "$2" != "--force" ]; then
  echo "You have local changes, which might need to be commited before the release. To continue, commit your changes or pass --force as second argument."
  exit 1
fi
git diff --cached --exit-code &>/dev/null
if [ $? -ne 0 ]; then
  echo "You have staged changes, the release process can not continue."
  exit 1
fi
version=$1
manifest_branch=$(git branch --show-current)
cat system.template.json | sed -e 's/{{version}}/'"${version}"'/g' -e 's/{{manifest}}/https:\/\/raw.githubusercontent.com\/fh-fvtt\/zweihander\/'"${manifest_branch}"'\/public\/system.json/g' > public/system.json
if [ "$2" != "--manifest-only" ] && [ "$3" != "--manifest-only" ]; then
  git add public/system.json
  git commit -m "preparing release v${version}"
  git push
  git tag "v${version}"
  git push origin "v${version}"
fi