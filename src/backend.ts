"use strict";

import { CookieOptions, Router } from "express";
import { BackendPoll as Poll, DupeCheckMode } from "./Poll";
import { MAX_POLL_OPTIONS, MAX_CHARACTER_LENGTH } from "./Config";
import Storage from "./Storage";

function randomString(length = 10, charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789") {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

export default async function init(router: Router, polls: Storage): Promise<void> {    
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

    async function createPoll(pollData: {
        title: string,
        options: string[],
        dupeCheckMode: DupeCheckMode,
        multiSelect: boolean,
        captcha: boolean
    }): Promise<Poll | string> {
        if (!Array.isArray(pollData.options) || pollData.options.filter(i => i).length < 2)
            return "Options must be an array and have at least 2 entries";
        if (pollData.options.filter(i => i).length > MAX_POLL_OPTIONS)
            return "Only " + MAX_POLL_OPTIONS + " options are allowed";

        let id = randomString(8);
        while (await polls.getItem(id)) id = randomString(6);

        const dupeCheckMode = (
            ["none", "ip", "cookie"].includes((pollData.dupeCheckMode || "").toLowerCase()) ? 
            (pollData.dupeCheckMode || "").toLowerCase() : "ip"
        ) as DupeCheckMode;
        const dupeData =
            dupeCheckMode === "none" ? null :
            dupeCheckMode === "ip" ? [] :
            dupeCheckMode === "cookie" ? randomString(16) : null;
        const poll: Poll = {
            id,
            title: (pollData.title || "").trim().slice(0, MAX_CHARACTER_LENGTH),
            options: (() => {
                const result: { [option: string]: number } = {};
                for (const option of pollData.options.map(i => i.trim().slice(0, MAX_CHARACTER_LENGTH))) {
                    if (option) result[option] = 0;
                }
                return result;
            })(),
            dupeCheckMode,
            dupeData,
            multiSelect: pollData.multiSelect || false,
            captcha: pollData.captcha || false,
            creationTime: new Date()
        };
        await polls.setItem(id, poll);
        return poll;
    }

    router.post("/poll", async (req, res) => {
        try {
            const poll = await createPoll({
                title: (req.body.title || "").trim().slice(0, MAX_CHARACTER_LENGTH),
                options: req.body.options,
                dupeCheckMode: req.body.dupeCheckMode,
                multiSelect: req.body.multiSelect || false,
                captcha: req.body.captcha || false,
            });
            if (typeof poll !== "string") res.json({
                id: poll.id
            });
            else res.status(400).json({
                error: poll
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
    router.post("/poll-form", async (req, res) => {
        try {
            const poll = await createPoll({
                title: (req.body["poll-title"] || "").trim().slice(0, MAX_CHARACTER_LENGTH),
                options: req.body["poll-option"],
                dupeCheckMode: req.body["dupe-check"],
                multiSelect: req.body["multi-select"] === "on",
                captcha: req.body["captcha"] === "on",
            });
            if (typeof poll !== "string") res.redirect("/" + poll.id);
            else res.redirect(`/?error=${
                encodeURIComponent(poll)
            }&title=${
                encodeURIComponent(req.body["poll-title"])
            }&options=${
                encodeURIComponent((req.body["poll-option"] || []).slice(0, MAX_POLL_OPTIONS).join("\uFFFE"))
            }&dupecheck=${
                encodeURIComponent(req.body["dupe-check"])
            }&multiselect=${
                req.body["multi-select"] === "on"
            }&captcha=${
                req.body["captcha"] === "on"
            }`);
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

    async function voteOnPoll(pollId: string, votes: string[], { ip, setCookie, cookies }: {
        ip: string,
        setCookie: (name: string, value: string, options?: CookieOptions) => void,
        cookies: { [key: string]: string }
    }): Promise<null|{
        error: string,
        statusCode: number
    }> {
        const poll: (Poll | undefined) = await polls.getItem(pollId);
        if (!poll) return {
            error: "Poll not found",
            statusCode: 404
        };

        const possibleVotes = Object.keys(poll.options);
        if (!Array.isArray(votes) || votes.filter(i => i && possibleVotes.includes(i)).length < 1) return {
            error: "Votes must be an array and have at least 1 entry",
            statusCode: 400
        };
        if (!poll.multiSelect && votes.filter(i => i && possibleVotes.includes(i)).length > 1) return {
            error: "Single-select polls can only have one vote",
            statusCode: 400
        };

        if (poll.dupeCheckMode === "ip") {
            if (Array.isArray(poll.dupeData) && poll.dupeData.includes(ip as string)) return null;
            if (Array.isArray(poll.dupeData)) poll.dupeData.push(ip as string);
        } else if (poll.dupeCheckMode === "cookie") {
            const cookie = cookies[poll.dupeData as string];
            if (cookie) return null;
            setCookie(poll.dupeData as string, "1", {
                httpOnly: true,
                maxAge: (1000 * 60 * 60 * 24 * 365) / 2
            });
        }
        votes.filter(i => i && possibleVotes.includes(i)).forEach(vote => poll.options[vote]++);
        await polls.setItem(pollId, poll);

        return null;
    }
    router.post("/vote/:id", async (req, res) => {
        try {
            const id = req.params.id;

            const error = await voteOnPoll(id, req.body.votes, {
                ip: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "",
                setCookie: res.cookie.bind(res),
                cookies: req.cookies
            });

            if (error) res.status(error.statusCode).json({
                error: error.error
            });
            else res.json({ status: "ok", id });
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
    router.post("/vote-form/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const votes = [].concat(req.body["poll-option"]);

            const error = await voteOnPoll(id, votes, {
                ip: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "",
                setCookie: res.cookie.bind(res),
                cookies: req.cookies
            });

            if (!error) return res.redirect("/" + id + "/r");
            if (error.statusCode === 404) return res.redirect("/");
            res.redirect(`/${id}?error=${
                encodeURIComponent(error.error)
            }&options=${
                encodeURIComponent(votes.slice(0, MAX_POLL_OPTIONS).join("\uFFFE"))
            }`);
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