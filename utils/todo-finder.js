"use strict";

const fs = require("fs-extra");
const path = require("path");
const readline = require("readline");
const klaw = require("klaw");
const WritableStream = require("stream").Writable;

const outstream = new WritableStream();

if (!process.argv[2]) throw new Error("No path to check given");

let found = 0;
klaw(process.argv[2], {
    filter: p => !path.relative(process.argv[2], p).includes("node_modules") && p !== __filename
})
    .on("data", async item => {
        if (item.stats.isFile()) {
            if (![
                ".js",
                ".ts",
                ".mjs",
                ".cjs"
            ].includes(path.parse(item.path).ext.toLowerCase())) return;
            const rl = readline.createInterface({
                input: fs.createReadStream(item.path),
                output: outstream,
                terminal: false
            });
            let lnCnt = 0;
            rl.on("line", line => {
                lnCnt++;
                const index = line.search(/TODO:/);
                if (index !== -1) {
                    console.log(`${path.relative(process.argv[2], item.path)}:${lnCnt}:${index + 1}\t${line}`);
                    found++;
                }
            });
        }
    })
    .on("end", () => {
        if (found) {
            console.error(`${found} TODO: have been found in the code`);
            process.exit(1);
        }
    });
