"use strict";

import env from "./config-handlers/env";
import file from "./config-handlers/file";
import secret from "./config-handlers/secret";

const replacers = {
    env,
    file,
    secret
};

function replaceArguments(commanderValues: { [key: string]: any }): void {
    Object.keys(commanderValues).forEach(key => {
        if (key.startsWith("_") || !commanderValues[key] || typeof commanderValues[key] !== "string") return;
        Object.entries(replacers).forEach(([replaceKey, replacer]) => {
            const value = commanderValues[key];
            if (value.match(new RegExp(`^${replaceKey}:`, "i")))
                commanderValues[key] = replacer(value.split(":")[1]);
        });
    });
}

export default replaceArguments;