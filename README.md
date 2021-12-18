# Burger Ping


## Setup Node & Yarn
1. Open console and execute `node -v`
    - if there is an error or the version is _< 16.10_, either:
        - use nvm to manage node versions (recommended):
            1. download `nvm`:
                - linux: execute `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash`
                - windows: download release `https://github.com/coreybutler/nvm-windows/releases/download/1.1.8/nvm-setup.zip`
            2. execute `nvm install 16.10.0` and `nvm use 16.10.0`
        - or go to `https://nodejs.org/en/download/` and download the latest node version manually
2. Execute `corepack enable`
4. Run `yarn init`

## Run

To start the dev server, type `yarn run dev`