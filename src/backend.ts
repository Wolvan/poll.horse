"use strict";

import { Router } from "express";
import persist from "node-persist";
import { program } from "commander";

type Poll = {
    id: string,
    title: string,
    options: {
        [option: string]: number
    },
    dupeCheckMode: "none" | "ip" | "cookie",
    dupeData: null | string[] | string,
    multiSelect: boolean,
    captcha: boolean,
    creationTime: Date,
};

function randomString(length = 10, charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789") {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

export default async function init(router: Router): Promise<void> {
    const polls = await persist.create({
        dir: program.opts().dataDirectory
    });
    await polls.init();
    
    router.get("/poll/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const poll: (Poll | undefined) = await polls.getItem(id);
            if (!poll) return res.status(404).json({ error: "Poll not found" });
            res.json(Object.assign({}, poll, {
                options: Object.keys(poll.options),
                dupeData: null
            }));
        } catch (error) {
            console.error(error);
            if (error instanceof Error) res.status(500).json({
                error: error.message
            });
            else res.status(500).json({
                error: error
            });
        }
    });

    router.get("/poll-result/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const poll: (Poll | undefined) = await polls.getItem(id);
            if (!poll) return res.status(404).json({ error: "Poll not found" });
            res.json({
                title: poll.title,
                votes: poll.options
            });
        } catch (error) {
            console.error(error);
            if (error instanceof Error) res.status(500).json({
                error: error.message
            });
            else res.status(500).json({
                error: error
            });
        }
    });

    router.post("/poll", async (req, res) => {
        try {
            const options = req.body.options;
            if (!Array.isArray(options) || options.filter(i => i).length < 2)
                return res.status(400).json({ error: "Options must be an array and have at least 2 entries" });
            let id = randomString(8);
            while (await polls.getItem(id)) id = randomString(6);
            await polls.setItem(id, {});
            const dupeCheckMode = ["none", "ip", "cookie"].includes((req.body.dupeCheckMode || "").toLowerCase()) ? (req.body.dupeCheckMode || "").toLowerCase() : "ip";
            const dupeData =
                dupeCheckMode === "none" ? null :
                dupeCheckMode === "ip" ? [] :
                dupeCheckMode === "cookie" ? randomString(16) : null;
            const poll: Poll = {
                id,
                title: req.body.title || "",
                options: (() => {
                    const result: { [option: string]: number } = {};
                    for (const option of options) {
                        result[option] = 0;
                    }
                    return result;
                })(),
                dupeCheckMode,
                dupeData,
                multiSelect: req.body.multiSelect || false,
                captcha: req.body.captcha || false,
                creationTime: new Date()
            };
            await polls.setItem(id, poll);
            res.json({
                id: id
            });
        } catch (error) {
            console.error(error);
            if (error instanceof Error) res.status(500).json({
                error: error.message
            });
            else res.status(500).json({
                error: error
            });
        }
    });

    router.post("/vote/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const poll: (Poll | undefined) = await polls.getItem(id);
            if (!poll) return res.status(404).json({ error: "Poll not found" });
            
            const votes = req.body.votes;
            const possibleVotes = Object.keys(poll.options);
            if (!Array.isArray(votes) || votes.filter(i => i && possibleVotes.includes(i)).length < 1)
                return res.status(400).json({ error: "Votes must be an array and have at least 1 entry" });
            if (!poll.multiSelect && votes.filter(i => i && possibleVotes.includes(i)).length > 1)
                return res.status(400).json({ error: "Single-select polls can only have one vote" });

            if (poll.dupeCheckMode === "ip") {
                const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
                if (Array.isArray(poll.dupeData) && poll.dupeData.includes(ip as string)) return res.status(200).json({ status: "ok", id });
                if (Array.isArray(poll.dupeData)) poll.dupeData.push(ip as string);
            } else if (poll.dupeCheckMode === "cookie") {
                const cookie = req.cookies[poll.dupeData as string];
                if (cookie) return res.status(200).json({ status: "ok", id });
                res.cookie(poll.dupeData as string, "1", {
                    httpOnly: true,
                    maxAge: (1000 * 60 * 60 * 24 * 365) / 2
                });
            }

            votes.filter(i => i && possibleVotes.includes(i)).forEach(vote => poll.options[vote]++);
            await polls.setItem(id, poll);

            res.json({ status: "ok", id });
        } catch (error) {
            console.error(error);
            if (error instanceof Error) res.status(500).json({
                error: error.message
            });
            else res.status(500).json({
                error: error
            });
        }
    });
}