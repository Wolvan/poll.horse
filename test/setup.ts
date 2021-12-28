"use strict";

import fs from "fs-extra";
import { TEST_DIRECTORY } from "./const";

console.log("Setting up Mocha Tests");

export async function mochaGlobalSetup(): Promise<void> {
    console.log(`Setting up TEST_DIRECTORY '${TEST_DIRECTORY}'`);
    await fs.remove(TEST_DIRECTORY);
    await fs.mkdirp(TEST_DIRECTORY);
}

export async function mochaGlobalTeardown(): Promise<void> {
    console.log(`Cleaning up TEST_DIRECTORY '${TEST_DIRECTORY}'`);
    await fs.remove(TEST_DIRECTORY);
}
