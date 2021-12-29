"use strict";
import fs from "fs-extra";
import { resolve } from "path";
import { Transform as TransformStream, Stream } from "stream";
import { Router, Request, Response } from "express";
import fetch from 'node-fetch';
import { program } from "commander";
import { FrontendPoll as Poll, PollResult } from "./Poll";

const RenderBuffer = new WeakMap();
const RenderReplacements = new WeakMap();

interface NodeError extends Error {
    code?: string;
}

// TODO: Implement conditional transform
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
    "DEVELOPER_CONTACT_INFO": "developer@poll.horse"
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

export default function init(router: Router): void {
    router.get("/:id/r", async (req, res) => {
        const id = req.params.id;
        try {
            const poll: PollResult = await fetch(
                (program.opts().backendBaseUrl || "http://localhost:" + program.opts().port) + "/_backend/poll-result/" + id
            ).then(r => r.json()) as PollResult;
            if (!poll || poll.error) return res.redirect("/");
            await displayPage(req, res, "result.html", {
                "POLL_ID": id,
                "POLL_TITLE": poll.title,
                
            });
        } catch (error) {
            console.log(error);
            res.redirect(`/`);
        }
    });
    router.get("/:id", async (req, res) => {
        const id = req.params.id;
        try {
            const poll: Poll = await fetch(
                (program.opts().backendBaseUrl || "http://localhost:" + program.opts().port) + "/_backend/poll/" + id
            ).then(r => r.json()) as Poll;
            if (!poll || poll.error) return res.redirect("/");
            await displayPage(req, res, "poll.html", {
                "POLL_ID": id,
                "POLL_TITLE": poll.title,
                
            });
        } catch (error) {
            console.log(error);
            res.redirect(`/`);
        }
    });
    router.get("/", (req, res) => displayPage(req, res, "index.html"));
}