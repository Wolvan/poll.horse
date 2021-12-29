"use strict";

import { resolve } from "path";
import { homedir } from "os";
import fs from "fs-extra";
import { Command, program } from "commander";
import replaceArguments from "./config-handlers";

type CommanderOption = [flags: string, description: string, defaultValueOrHandler?: (((...args:any[]) => any) | any), defaultValue?: any];

async function loadPackageJSONVersion(): Promise<string> {
    try {
        const packageJSON = await fs.readFile(resolve(__dirname, "../package.json"), "utf8");
        const packageJSONObject = JSON.parse(packageJSON);
        return packageJSONObject.version || "0.0.0";
    } catch (error) {
        console.error(error);
        console.warn("Failed to load package.json version");
        return "0.0.0";
    }
}
async function loadConfig(options: CommanderOption[] = [], homedirConfigFilename: (string | null) = null): Promise<void> {
    const version = await loadPackageJSONVersion();
    
    const configCommander = new Command();
    configCommander
        .allowUnknownOption()
        .version(version)
        .option("-c, --config-path <path>", "Path to the configuration file to load", "./config")
        .option("-h, --help", "Don't. Just don't.")
        .parse(process.argv);

    const config = await (async () => {
        try {
            const opts = configCommander.opts();
            const config = await import(resolve(opts.configPath || "./config"));
            console.log(`Loaded config from ${opts.configPath || "./config"}`);
            return config;
        } catch (error) {
            try {
                if (!homedirConfigFilename) throw new Error("homedir config file disabled");
                const config = await import(resolve(homedir(), homedirConfigFilename));
                console.log(`Loaded config from ${resolve(homedir(), homedirConfigFilename)}`);
                return config;
            } catch (error) {
                try {
                    const config = await import(resolve(__dirname, "..", "config"));
                    console.log(`Loaded config from ${resolve(__dirname, "..", "config")}`);
                    return config;
                } catch (error) {
                    return {};
                }
            }
        }
    })();

    program
        .version(version)
        .option("-c, --config-path <path>", "Path to the configuration file to load", "./config");
    options.forEach(([name, description, handler, defaultValue]) => program.option(name, description, handler, defaultValue));
    Object.keys(config).forEach(option => program.setOptionValueWithSource(option, config[option], "config"));

    program.parse(process.argv);

    replaceArguments(program.opts());
}

export default loadConfig;

