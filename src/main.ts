#!/usr/bin/env node
"use strict";

import loadConfig from "./config-loader";
import { program } from "commander";

async function main(): Promise<void> {
    await loadConfig([
    ], ".poll-horse-config");
    const opts = program.opts();
}

main();