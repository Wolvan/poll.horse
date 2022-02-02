#!/usr/bin/env node
"use strict";

const favicons = require("favicons");
const resolve = require("path").resolve;
const fs = require("fs-extra");

const start = new Date();
favicons(resolve(__dirname, "../frontend/static/img/icon.png"), {
    path: "/favicons",
    appName: "Poll.Horse",
    appShortName: "poll_horse",
    appDescription: "Simple, free and open source way to host polls for people to vote on. Create your own polls and share them with others!",
    developerName: "Wolvan",
    developerURL: "https://github.com/wolvan",
    background: "#FFD756",
    theme_color: "#FFD756",
    version: require(resolve(__dirname, "../package.json")).version
}, async (error, response) => {
    if (error) throw new error;
    await fs.remove(resolve(__dirname, "../frontend/favicons"));
    await fs.ensureDir(resolve(__dirname, "../frontend/favicons"));
    await Promise.all(response.images.map(({ name, contents }) => fs.writeFile(resolve(__dirname, "../frontend/favicons", name), contents)));
    await Promise.all(response.files.map(({ name, contents }) => fs.writeFile(resolve(__dirname, "../frontend/favicons", name), contents)));
    
    try {
        if ((await fs.stat(resolve(__dirname, "../frontend/html"))).isDirectory()) {
            const files = await fs.readdir(resolve(__dirname, "../frontend/html"));
            await Promise.all(files.filter(file => file.match(/\.html?/i)).map(async file => {
                let content = await fs.readFile(resolve(__dirname, "../frontend/html", file), "utf8");
                content = content
                    .replace(/<!-- FAVICON_MARKER -->[\s\S]*<!-- \/FAVICON_MARKER -->/i,
    `<!-- FAVICON_MARKER -->
    ${response.html.join("\n    ")}
    <!-- \/FAVICON_MARKER -->`);
                await fs.writeFile(resolve(__dirname, "../frontend/html", file), content);
            }));
        }
    } catch (error) {
        throw error;
    }
    console.log("Finished Favicon generation in", ((new Date() - start) / 1000).toFixed(2), "s");
});