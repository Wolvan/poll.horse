#!/usr/bin/env node
"use strict";
import loadConfig from "./config-loader";
import { program } from "commander";
import express, { Response } from "express";
import compression from "compression";
import cookiepaser from "cookie-parser";
import { resolve } from "path";
import FlatFileStorage from "./FlatFileStorage";
import Storage from "./Storage";
import MySQLStorage from "./MySQLStorage";
import helmet from "helmet";
import crypto from "crypto";
import { statSync } from "fs";
import serveFavicon from "serve-favicon";

async function main(): Promise<void> {
    await loadConfig([
        ["--no-frontend", "Do not start the frontend server"],
        ["--no-backend", "Do not start the backend server"],
        ["-d, --data-directory <path>", "Path to the data directory", "./data"],
        ["-p, --port <port>", "Port to listen on", (port: any) => parseInt(port) || port, 6969],
        ["--use-mysql", "Use MySQL for storage"],
        ["--mysql-host <host>", "MySQL host", "localhost"],
        ["--mysql-port <port>", "MySQL port", (port: any) => parseInt(port) || port, 3306],
        ["--mysql-user <user>", "MySQL user", "root"],
        ["--mysql-password <password>", "MySQL password", "root"],
        ["--mysql-database <database>", "MySQL database", "polls"],
        ["--mysql-table-prefix <prefix>", "MySQL table prefix", ""],
        ["--mysql-ssl", "Use SSL for MySQL connection"],
        ["--backend-base-url <url>", "Base URL for the backend server", null],
    ], ".poll-horse-config");
    const opts = program.opts();

    const app = express();

    try {
        if (statSync(resolve(__dirname, "../frontend/favicons")).isDirectory()) {
            app.use("/favicons", express.static(resolve(__dirname, "../frontend/favicons")));
            if (statSync(resolve(__dirname, "../frontend/favicons/favicon.ico")).isFile()) app.use(serveFavicon(resolve(__dirname, "../frontend/favicons/favicon.ico")));
        }
    } catch (error) {
        console.warn("FavIcons not available: ", error);
    }

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(compression());
    app.use(cookiepaser());
    app.use((req, res, next) => {
        res.locals.cspNonce = crypto.randomBytes(16).toString("hex");
        next();
    });
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'strict-dynamic'", "https: 'self'", "http: 'self'", (req, res) => `'nonce-${(res as Response).locals.cspNonce}'`],
                imgSrc: ["'self'", "data:", "https://chart.googleapis.com"],
            }
        },
        crossOriginEmbedderPolicy: false
    }));

    const storage: Storage = (opts.useMysql) ?
        new MySQLStorage({
            host: opts.mysqlHost,
            port: opts.mysqlPort,
            user: opts.mysqlUser,
            password: opts.mysqlPassword,
            database: opts.mysqlDatabase,
            ssl: opts.mysqlSsl,
            tablePrefix: opts.mysqlTablePrefix,
        }) :
        new FlatFileStorage({ dir: resolve(process.cwd(), program.opts().dataDirectory) });
    await storage.init();

    if (opts.backend) {
        console.log(`Mounting backend`);
        const backendRouter = express.Router();

        const backend = await import("./backend");
        await backend.default(backendRouter, storage);

        app.use("/_backend/", backendRouter);
    }

    if (opts.frontend) {
        console.log(`Mounting frontend`);
        const frontendRouter = express.Router();
        const frontend = await import("./frontend");
        await frontend.default(frontendRouter);

        app.use("/static", express.static(resolve(__dirname, "../frontend/static")));
        app.get("/robots.txt", (req, res) => res.send(`
            User-Agent: *
            Allow: /$
            Disallow: /
        `));
        app.use("/", frontendRouter);
    }

    app.listen(opts.port, () => {
        console.log(`Listening on port ${opts.port}`);
    });
}

main();