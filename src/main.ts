#!/usr/bin/env node
"use strict";
import loadConfig from "./config-loader";
import { program } from "commander";
import express from "express";
import compression from "compression";
import cookiepaser from "cookie-parser";
import { resolve } from "path";

async function main(): Promise<void> {
    await loadConfig([
        ["--no-frontend", "Do not start the frontend server"],
        ["--no-backend", "Do not start the backend server"],
        ["-d, --data-directory <path>", "Path to the data directory", "./data"],
        ["-p, --port <port>", "Port to listen on", (port: any) => parseInt(port), 6969],
        ["--backend-base-url <url>", "Base URL for the backend server", null],
    ], ".poll-horse-config");
    const opts = program.opts();

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(compression());
    app.use(cookiepaser());

    if (opts.backend) {
        console.log(`Mounting backend`);
        const backendRouter = express.Router();

        const backend = await import("./backend");
        await backend.default(backendRouter);

        app.use("/_backend/", backendRouter);
    }

    if (opts.frontend) {
        console.log(`Mounting frontend`);
        const frontendRouter = express.Router();
        const frontend = await import("./frontend");
        await frontend.default(frontendRouter);

        app.use("/static", express.static(resolve(__dirname, "../frontend/static")));
        app.use("/", frontendRouter);
    }

    app.listen(opts.port, () => {
        console.log(`Listening on port ${opts.port}`);
    });
}

main();