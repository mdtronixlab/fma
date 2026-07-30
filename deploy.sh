#!/usr/bin/env bash
set -euo pipefail

BRANCH=dev
REMOTE=deploy
SSH_KEY="D:/Downloads/id_rsa"
SSH_HOST="cb4jf27barw2@118.139.179.181"

echo "Pushing $BRANCH to $REMOTE..."
git push "$REMOTE" "$BRANCH"

echo "Pulling on server..."
ssh -i "$SSH_KEY" "$SSH_HOST" "cd ~/public_html && git pull origin $BRANCH"

echo "Deploy complete."
