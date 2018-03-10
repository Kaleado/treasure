#!/bin/bash

# setup script
# Creates necessary environment

# Usage if failed
if [[ -z $1 ]]
then
    echo "Usage: ./setup.sh git_repo_address"
    echo "Sets up the environment and clones the repository provided"
    echo "Your local environment must have SSH access to the repository"
    echo "Also runs npm install :)"
    exit;
fi

# Make build directory
mkdir -p builds
# Make repo container
mkdir -p repo

touch builds.js

# Cause people forget
npm install || (echo && echo "Failed NPM install - are you sudo?" && echo && exit);

# Clone the repo
git clone $1 repo/ || (echo && echo "Failed git clone - do you have correct repo access?" && echo && exit);
