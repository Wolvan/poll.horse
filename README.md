# Poll.horse
### Simple polling service for public polls
With strawpoll being somewhat very broken I decided to implement my own. Let's go!

## What is this
If you have never used strawpoll, in short this is a website to easily make small polls without a fuss.

A live version is available [here](https://poll.horse/). This version is always based on the current `master` branch and release tags.<br>
You want more cutting edge? Under [dev.poll.horse](https://dev.poll.horse/) you can find the most recent builds based on the current commit of the `dev` branch. New features can be tested here but the integrity of the database is not guaranteed and may be occasionally wiped.

## API
This service offers an API to create and get the status of polls. The API Docs can be found [here](API.md).

## Running your own instance of Poll.Horse
### Standalone
1. Make sure you have [Node](https://www.nodejs.org/) installed.
2. Download the latest release zip from [the releases page](https://github.com/Wolvan/poll.horse/releases/);
3. Extract the zip file anywhere
4. Open a shell in in the directory you just extracted to and run `npm i --production --ignore-scripts`
5. Start the server with `npm start`
6. List all available options with `npm start -- --help` or use shell options with `npm start -- <options>`

### Docker
1. Install [Docker](https://www.docker.com/get-started)
2. Download/clone the contents of this repository
3. Open a shell in the directory and run `docker build -t poll.horse`
4. Use `docker run poll.horse`
5. Optionally mount config file at `/usr/src/app/config.json`
6. Optionally mount persistent directory to `/data`

## Contributing
The core is written in TypeScript, a typed superset to Javascript and executed with NodeJS. Pull Requests welcome.

Before cloning this repository, make sure you have [Node](https://www.nodejs.org/) installed.

Then clone this repository, open a terminal/command prompt and type `npm i` to install the required dependencies.

`ts-node` is recommended to test during development manually, install it with `npm i -g ts-node typescript`.

## Directory Structure
- `./dist` - The finalized and compiled files that can be used with node
- `./src` - The source files of the project
- `./test` - Files required for unit testing, aka test setup/teardown and test spec files
- `./utils` - Various utility scripts not part of the main source code

## Scripts
Execute the scripts with `npm run <script>`

- `find-todo` - Finds remaining `TODO:` in the code and warns the developer that there are still things that are unfinished
- `mocha` - Runs the unit tests in the `/test` directory
- `lint` - Runs `eslint` and checks for code styling problems
- `build` - Compile the TypeScript Source to `dist/`
- `test` - Runs `lint`, `find-todo` and `mocha` in order
- `debug` - Start the `./src/main.ts` with node and start the debugger on port 9229. Files will be watched for changes.
- `start` - Run `test` and `build`, then try and execute the `./dist/main.js` in the `./dist` directory to test

## Components
This project makes use of the following components. Thanks a lot to the respective creators:

- [textFit](https://github.com/STRML/textFit)
- [Google Charts](https://developers.google.com/chart)

## Special thanks
- [Shydale](https://twitter.com/fshydale) for letting me use Checkbox as the mascot
- [dotkwa](https://twitter.com/dotkwa) for drwaing the adorable icon I am using
