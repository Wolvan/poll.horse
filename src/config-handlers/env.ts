"use strict";

function get(environmentVariable: string) : (string | null) {
    const envVar = process.env[environmentVariable];
    return typeof envVar === "string" ? envVar : null;
}

export default get;
