"use strict";

import fs from "fs";
import { resolve } from "path";

function get(filename: string) : (string | null) {
    try {
        return fs.readFileSync(resolve(filename), "utf8").trim();
    } catch (error) {
        return null;
    }
}

export default get;
