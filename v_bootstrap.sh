#!/usr/bin/env bash

echo ---Updating packages---
sudo apt-get update

echo ---Install Git and cURL---
apt-get install -y git
apt-get install -y curl

echo ---Installing Node---
# --nvm--
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash