"use strict";

import Storage from "./Storage";
import persist from "node-persist";
import { BackendPoll as Poll } from "./Poll";

export default class FlatFileStorage extends Storage {
    #storage: persist.LocalStorage;
    constructor(options: persist.InitOptions) {
        super();
        console.debug("Initiating FlatFileStorage.");
        this.#storage = persist.create(options);
    }
    
    async init() {
        await this.#storage.init();
        return this;
    }

    getItem(key: string): Promise<Poll> {
        return this.#storage.getItem(key);
    }

    setItem(key: string, value: Poll, options?: persist.DatumOptions): Promise<persist.WriteFileResult> {
        return this.#storage.setItem(key, value, options);
    }
}