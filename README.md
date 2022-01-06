# Poll.horse
### Simple polling service for public polls
With strawpoll being somewhat very broken I decided to implement my own. Let's go!

## What is this
If you have never used strawpoll, in short this is a website to easily make small polls without a fuss.


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