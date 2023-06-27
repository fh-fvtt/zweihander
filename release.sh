#!/usr/bin/env bash
#
# Available variable substitutions:
# - {{RELEASE_VERSION}} - version passed as parameter to the script
# - {{RELEASE_DATE}} - today's date
# - {{MANIFEST_URL}} - URL to system.json location on current branch in GitHub
#

FORCE=no
COMMIT_CHANGES=yes

PROG=$(basename $0)
usage() {
    echo "Usage: $PROG [--force|-f] [--manifest-only] RELEASE_VERSION"
}

error() {
    echo "error: $1"
}

while [ $# != 0 ]; do
    case "$1" in
        --force | -f)
            FORCE=yes
            ;;
        --manifest-only)
            COMMIT_CHANGES=no
            ;;
        -*)
            error "unrecognized option '$1'"
            usage
            exit 1
            ;;
        *)
            VERSION=$1
            shift
            break;;
    esac
    shift
done

if [ $# != 0 ]; then
    error "unexpected parameters after version"
    usage
    exit 1
fi

if [ "x$VERSION" = "x" ]; then
    error "version not specified"
    usage
    exit 1
fi

git diff --quiet
if [ $? -ne 0 ] && [ "$FORCE" != yes ]; then
    cat <<EOF
You have local changes, which might need to be commited before the release.
To continue, commit your changes or pass --force to the script to ignore them.
EOF
    exit 1
fi

git diff --cached --quiet
if [ $? -ne 0 ]; then
    echo "You have staged changes, the release process can not continue."
    exit 1
fi

RELEASE_DATE=$(date +%F)
MANIFEST_BRANCH=$(git branch --show-current)

MANIFEST_URL="https://raw.githubusercontent.com/fh-fvtt/zweihander/${MANIFEST_BRANCH}/system.json"

subst_vars=$(cat <<EOF
s/{{RELEASE_VERSION}}/${VERSION}/g
s/{{RELEASE_DATE}}/${RELEASE_DATE}/g
s,{{MANIFEST_URL}},${MANIFEST_URL},g
EOF
)

sed -e "$subst_vars" system.template.json > system.json
sed -ie "$subst_vars" ChangeLog.md

RELEASE_TAG="v${VERSION}"

[ "$COMMIT_CHANGES" = no ] && exit 0

set -e
git add system.json ChangeLog.md
git commit -m "preparing release $RELEASE_TAG"
git push
git tag "$RELEASE_TAG"
git push origin "$RELASE_TAG"
