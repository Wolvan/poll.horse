"use strict";

const archiver = require("archiver");
const fs = require("fs");
const { resolve } = require("path");

const { version } = require("../package.json");

fs.mkdirSync(resolve(__dirname, "../releases"), { recursive: true });
const output = fs.createWriteStream(resolve(__dirname, "../releases/Release-" + version + ".zip"));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output
    .on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        if (require("os").platform() !== "win32") {
            if (fs.existsSync(resolve(__dirname, "../releases/latest.zip")))
                fs.unlinkSync(resolve(__dirname, "../releases/latest.zip"));
            fs.symlinkSync("Release-" + version + ".zip", resolve(__dirname, "../releases/latest.zip"));
        }
    });
archive
    .on('warning', function(err) {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            throw err;
        }
    })
    .on('error', function(err) {
        throw err;
    });

archive.pipe(output);

[
    "package.json",
    "package-lock.json"
].forEach(file => archive.append(fs.createReadStream(resolve(__dirname, "..", file)), { name: file }));
[
    "frontend/",
    "dist/"
].forEach(dir => archive.directory(resolve(__dirname, "..", dir), dir));

archive.finalize();