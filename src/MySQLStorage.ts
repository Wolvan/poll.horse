"use strict";

import Storage from "./Storage";
import mysql from "mysql2";
import { MAX_CHARACTER_LENGTH } from "./Config";
import { BackendPoll as Poll } from "./Poll";

export default class MySQLStorage extends Storage {
    #db: mysql.Connection;
    #options: mysql.ConnectionOptions;
    #tablePrefix: string;
    #createConnection(mysqlInstance?: mysql.Connection): void {
        if (!mysqlInstance) this.#db = mysql.createConnection(this.#options);
        this.#db.on("error", (err: mysql.QueryError) => {
            if (err.fatal) this.#createConnection();
        });
    }
    
    constructor(options: mysql.ConnectionOptions & { tablePrefix?: string }) {
        super();
        options = Object.assign({}, options);
        this.#tablePrefix = options.tablePrefix || "";
        delete options["tablePrefix"];
        this.#options = options;
        console.debug("Initiating MySQLStorage.");
        this.#db = mysql.createConnection(this.#options);
        this.#createConnection(this.#db);
    }

    async init(): Promise<this> {
        await this.#db.promise().query(`
            CREATE TABLE IF NOT EXISTS ${ this.#tablePrefix || "" }polls (
                id_str VARCHAR(32) NOT NULL PRIMARY KEY,
                title VARCHAR(${MAX_CHARACTER_LENGTH}) NOT NULL DEFAULT '',
                dupe_check_mode ENUM('none', 'ip', 'cookie') NOT NULL DEFAULT 'ip',
                multi_select TINYINT(1) NOT NULL DEFAULT 0,
                captcha TINYINT(1) NOT NULL DEFAULT 0,
                creation_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                dupe_data VARCHAR(8000) DEFAULT '[]',
                options VARCHAR(32000) NOT NULL DEFAULT '{}',
                deleted_at DATETIME DEFAULT NULL,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )  ENGINE=INNODB;
        `);
        await this.#db.promise().query(`
            ALTER TABLE ${ this.#tablePrefix || "" }polls CHANGE dupe_data dupe_data MEDIUMTEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL;
        `);
        return this;
    }

    async getItem(key: string): Promise<Poll|null> {
        const [rows] = await this.#db.promise().execute(`SELECT * FROM ${ this.#tablePrefix || "" }polls WHERE id_str = ? AND deleted_at IS NULL;`, [key]);
        if (!rows || !Array.isArray(rows) || !rows.length) return null;
        const row = rows[0] as {
            id_str: string,
            title: string,
            dupe_check_mode: "none" | "ip" | "cookie",
            multi_select: number,
            captcha: number,
            creation_time: string,
            dupe_data: string,
            options: string
        };
        return {
            id: row.id_str,
            title: row.title,
            dupeCheckMode: row.dupe_check_mode,
            multiSelect: !!row.multi_select,
            captcha: !!row.captcha,
            creationTime: new Date(row.creation_time),
            dupeData: JSON.parse(row.dupe_data),
            options: JSON.parse(row.options)
        };
    }

    async setItem(key: string, value: Poll): Promise<void> {
        await this.#db.promise().execute(`
            INSERT INTO ${ this.#tablePrefix || "" }polls
                (id_str, title, dupe_check_mode, multi_select, captcha, dupe_data, options, creation_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                dupe_data = VALUES(dupe_data),
                options = VALUES(options);
        `, [
            key,
            value.title,
            value.dupeCheckMode,
            value.multiSelect,
            value.captcha,
            JSON.stringify(value.dupeData),
            JSON.stringify(value.options),
            value.creationTime.toISOString()
        ]);
    }
}