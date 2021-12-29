"use strict";

type BasePoll = {
    id: string,
    title: string,
    dupeCheckMode: "none" | "ip" | "cookie",
    multiSelect: boolean,
    captcha: boolean,
    creationTime: Date,
};
type FrontendPoll = BasePoll & {
    options: string[],
    error?: string,
};
type BackendPoll = BasePoll & {
    options: {
        [option: string]: number
    },
    dupeData: null | string[] | string
};
type PollResult = {
    title: string,
    votes: {
        [option: string]: number
    },
    error?: string
};


export {
    FrontendPoll,
    BackendPoll,
    PollResult
};
