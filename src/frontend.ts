"use strict";
import fs from "fs-extra";
import { resolve } from "path";
import { Transform as TransformStream, Stream } from "stream";
import { Router, Request, Response } from "express";
import fetch from 'node-fetch';
import { program } from "commander";
import { FrontendPoll as Poll, PollResult } from "./Poll";
import { MAX_CHARACTER_LENGTH, MAX_POLL_OPTIONS } from "./Config";
import crypto from "crypto";

const RenderBuffer = new WeakMap();
const RenderReplacements = new WeakMap();

interface NodeError extends Error {
    code?: string;
}

class RenderTransform extends TransformStream {
    constructor(replacements = {}) {
        super();
        RenderReplacements.set(this, replacements);
        RenderBuffer.set(this, "");
    }

    _transform(chunk: any, encoding: string, callback: () => void) {
        const r = RenderReplacements.get(this);
        let c = RenderBuffer.get(this) + chunk.toString();
        Object.entries(r).forEach(([key, value]) => c = c.replace(new RegExp("{{ ?" + key + " ?}}", "ig"), value));

        if (c.match(/\{\{.*?(?<!\}\})$/)) RenderBuffer.set(this, c);
        else {
            RenderBuffer.set(this, "");
            this.push(c.replace(/\\\{/g, "{").replace(/\\\}/g, "}"));
        }
        callback();
    }

    _flush(callback: () => void) {
        const c = RenderBuffer.get(this);
        if (c) this.push(c.replace(/\\\{/g, "{").replace(/\\\}/g, "}"));
        callback();
    }
}

class MinificationTransform extends RenderTransform {
    constructor(replacements = {}) {
        super(replacements);
    }

    _transform(chunk: any, encoding: string, callback: () => void) {
        super._transform(chunk.toString().replace(/\s{2,}/g, ""), encoding, callback);
    }
}

const defaultReplacements = {
    "TITLE": "Poll Horse",
    "DEVELOPER_CONTACT_INFO": "developer@poll.horse",
    "FOOTER_COPYRIGHT": `© ${ (new Date()).getFullYear() } Based Department`,
    "FOOTER_LINKS": `
        <li><a href="https://github.com/Wolvan/poll.horse" target="_blank" rel="noreferrer">Github Repo</a></li>
        <li><a href="https://www.mppp.horse/" target="_blank" rel="noreferrer">/mppp/ - Mass Production plushies</a></li>
        <li><a href="https://www.pon3.stream/" target="_blank" rel="noreferrer">Pon3.Stream</a></li>
        <li><a href="https://ko-fi.com/wolvan" target="_blank" rel="noreferrer">Support me</a></li>
    `,
    "SYSTEM_VERSION": ((): string => {
        try {
            const packageJson = JSON.parse(fs.readFileSync(resolve(__dirname, "../package.json"), "utf8"));
            return packageJson.version;
        } catch (error) {
            return "0.0.0";
        }
    })(),
    "GIT_URL": ((): string => {
        try {
            if (process.env.HEROKU_SLUG_COMMIT) {
                return `<a href="https://github.com/Wolvan/poll.horse/commit/${ process.env.HEROKU_SLUG_COMMIT }">git~${ process.env.HEROKU_SLUG_COMMIT.substring(0, 8) }</a>`;
            }
            const packageJson = JSON.parse(fs.readFileSync(resolve(__dirname, "../package.json"), "utf8"));
            return `<a href="https://github.com/Wolvan/poll.horse/releases/tag/v${ packageJson.version }">v${ packageJson.version }</a>`;
        } catch (error) {
            return "v0.0.0";
        }
    })(),
};
class Defaults2RenderTransform extends MinificationTransform {
    constructor(replacements = {}) {
        super(Object.assign({}, defaultReplacements, replacements));
    }
}
async function displayPage(req: Request, res: Response, htmlFilename: string, replacements = {}, statusCode = 200) {
    const promisifyStream = (fn: Stream) => new Promise(pRes => fn.on("finish", pRes));
    
    try {
        await fs.stat(resolve(__dirname, "../frontend/html", htmlFilename));
        await promisifyStream(
            fs.createReadStream(resolve(__dirname, "../frontend/html", htmlFilename))
            .pipe(new Defaults2RenderTransform(replacements))
            .pipe(res.status(statusCode))
        );
    } catch (error) {
        if (error instanceof Error)
            if ((error as NodeError).code === "ENOENT") {
                await promisifyStream(
                    fs.createReadStream(resolve(__dirname, "../frontend/errors/404.html"))
                    .pipe(new Defaults2RenderTransform())
                    .pipe(res.status(404))
                );
            } else {
                await promisifyStream( 
                    fs.createReadStream(resolve(__dirname, "../frontend/errors/500.html")).pipe(new Defaults2RenderTransform({
                        "JS_ERROR_STACK": (error as NodeError).stack,
                        "HTTP_ERROR_CODE": 500
                    }))
                    .pipe(res.status(500))
                );
            }
    }
}

function xss(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default function init(router: Router): void {
    router.all("*", (req, res, next) => {
        res.header("Content-Type", "text/html; charset=utf-8");
        next();
    });
    router.get("/:id/r", async (req, res) => {
        const id = req.params.id;
        try {
            const poll: PollResult = await fetch(
                (program.opts().backendBaseUrl || "http://localhost:" + program.opts().port) + "/_backend/api/poll-result/" + id
            ).then(r => r.json()) as PollResult;
            if (!poll || poll.error) return res.redirect("/");
            const totalVotes = Object.values(poll.votes).reduce((acc, cur) => acc + cur, 0);
            const pollOptionsDivs = Object.entries(poll.votes).sort((a, b) => b[1] - a[1]).map(([option, votes]) => `
                <div class="poll-option" option="${ xss(option) }">
                    <div class="poll-option-info">
                        <div class="poll-option-text">${ xss(option) }</div><div class="poll-option-votes">${ votes }</div>
                    </div>
                    <div class="progress">
                        <div class="poll-bar">
                            <div class="poll-bar-fill" style="width: ${ totalVotes > 0 ? (votes / totalVotes) * 100 : 0 }%"></div>
                        </div><div class="poll-bar-text">${ totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0 }</div>
                    </div>
                </div>
            `).join("");

            await displayPage(req, res, "result.html", {
                "POLL_ID": id,
                "POLL_TITLE": xss(poll.title),
                "POLL_OPTION_DIVS": pollOptionsDivs,
                "POLL_VOTES_TOTAL": totalVotes,
                "BACKEND_BASE_PATH": (program.opts().backendBaseUrl || ""),
                "POLL_OPTION_VOTES": Buffer.from(JSON.stringify(Object.entries(poll.votes))).toString("base64"),
                "QR_CODE": `https://chart.googleapis.com/chart?cht=qr&chs=190x190&chld=L|1&chl=${ encodeURIComponent(`${ req.protocol }://${ req.headers.host }/${ id }`) }`,
                "CANONICAL_HOST": req.protocol + "://" + (req.headers.host || "") + "/" + id + "/r",
                "POLL_META_DESCRIPTION": xss(poll.title || "Simple, free and open source way to host polls for people to vote on. Create your own polls and share them with others!").substring(0, 150),
                "CORS_SCRIPT_NONCE": res.locals.cspNonce,
                "HOST": req.protocol + "://" + (req.headers.host || "")
            });
        } catch (error) {
            console.log(error);
            res.redirect(`/`);
        }
    });
    router.get("/:id", async (req, res) => {
        const id = req.params.id;
        const options = (typeof req.query.options === "string" ? req.query.options.split("\uFFFE") : []).filter(i => i);
        try {
            const poll: Poll = await fetch(
                (program.opts().backendBaseUrl || "http://localhost:" + program.opts().port) + "/_backend/api/poll/" + id
            ).then(r => r.json()) as Poll;
            if (!poll || poll.error) return res.redirect("/");

            const pollOptions = poll.options.map(option =>
                `<div class="poll-option">
                    <div class="input-container">
                        <input type="${poll.multiSelect ? "checkbox" : "radio"}" name="poll-option" value="${xss(option)}"" ${options.includes(option) ? "checked" : ""}/><div class="checkmark"><svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></div>
                    </div><div class="text">${xss(option)}</div>
                </div>`
            ).join("");

            const csrfToken = req.cookies.csrftoken || crypto.randomBytes(32).toString("base64");
            res.cookie("csrftoken", csrfToken, {
                httpOnly: true,
            });

            await displayPage(req, res, "poll.html", {
                "CSRF_TOKEN": csrfToken,
                "POLL_ID": poll.id,
                "POLL_TITLE": xss(poll.title),
                "POLL_OPTION_DIVS": pollOptions,
                "BACKEND_BASE_PATH": (program.opts().backendBaseUrl || ""),
                "FORM_SUBMISSION_ERROR": xss(req.query.error + ""),
                "FORM_SUBMISSION_ERROR_SHOWN_CLASS": req.query.error ? "error-visible" : "",
                "QR_CODE": `https://chart.googleapis.com/chart?cht=qr&chs=190x190&chld=L|1&chl=${ encodeURIComponent(`${ req.protocol }://${ req.headers.host }/${ id }`) }`,
                "CANONICAL_HOST": req.protocol + "://" + (req.headers.host || "") + "/" + id,
                "POLL_META_DESCRIPTION": xss(poll.title || "Simple, free and open source way to host polls for people to vote on. Create your own polls and share them with others!").substring(0, 150),
                "CORS_SCRIPT_NONCE": res.locals.cspNonce,
                "HOST": req.protocol + "://" + (req.headers.host || "")
            });
        } catch (error) {
            console.log(error);
            res.redirect(`/`);
        }
    });

    router.get("/", (req, res) => {
        const options = (typeof req.query.options === "string" ? req.query.options.split("\uFFFE") : Array.isArray(req.query["poll-option"]) ? req.query["poll-option"] as string[] : [])
            .filter(i => i);
        if (options.length < 3)
            for (let i = options.length; i < 2; ++i) options.push("");
        if (options.length < MAX_POLL_OPTIONS) options.push("");
        
        const pollOptionDivs = options.map(option => `
            <div class="poll-option">
                <input type="text" name="poll-option" maxlength="${MAX_CHARACTER_LENGTH}" placeholder="Enter your option here" value="${xss(option)}">
            </div>
        `).join("");

        displayPage(req, res, "index.html", {
            "BACKEND_BASE_PATH": (program.opts().backendBaseUrl || ""),
            "FORM_SUBMISSION_ERROR": xss(req.query.error + ""),
            "FORM_SUBMISSION_ERROR_SHOWN_CLASS": req.query.error ? "error-visible" : "",
            "FORM_TITLE": xss((req.query.title || req.query["poll-title"] || "") + ""),
            "FORM_DUPECHECK_IP": req.query.dupecheck === "ip" || req.query["dupe-check"] === "ip" ? "selected" : "",
            "FORM_DUPECHECK_COOKIE": req.query.dupecheck === "cookie" || req.query["dupe-check"] === "cookie" ? "selected" : "",
            "FORM_DUPECHECK_NONE": req.query.dupecheck === "none" || req.query["dupe-check"] === "none" ? "selected" : "",
            "FORM_MULTI_SELECT": req.query.multiselect === "true" || req.query["multi-select"] === "on" ? "checked" : "",  
            "FORM_CAPTCHA": req.query.captcha === "true" ? "checked" : "",
            "FORM_OPTION_DIVS": pollOptionDivs,
            "MAX_POLL_OPTIONS": MAX_POLL_OPTIONS,
            "MAX_CHARACTER_LENGTH": MAX_CHARACTER_LENGTH,
            "CANONICAL_HOST": req.protocol + "://" + (req.headers.host || ""),
            "CORS_SCRIPT_NONCE": res.locals.cspNonce,
            "HOST": req.protocol + "://" + (req.headers.host || "")
        });
    });
}