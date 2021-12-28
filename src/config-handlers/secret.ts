"use strict";

import fs from "fs";
import { resolve } from "path";

function get(secret: string) : (string | null) {
    try {
        return fs.readFileSync(resolve("/run/secrets", secret), "utf8").trim();
    } catch (error) {
        return null;
    }
}

export default get;
