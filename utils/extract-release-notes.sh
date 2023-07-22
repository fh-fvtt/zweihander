#!/bin/bash
#
# Naively extract first section of ChangeLog in "Keep a Changelog" format
# (https://keepachangelog.com/en/1.1.0/), that looks like description of
# the release version.
#

PROG=$(basename $0)

if [ $# -ne 1 ]; then
    echo "error: expecting ChangeLog file location as parameter"
    echo "Usage: $PROG FILE"
    exit 1
fi

CHANGELOG="$1"

grep -nE '^## +\[' "$CHANGELOG" | cut -d: -f1 | (
    read START
    read END
    END="${END:-\$}"
    if [ '$' != "$END" ]; then
        END=$((--END))
    fi
    sed -ne "${START},${END}p" "$CHANGELOG"
)
