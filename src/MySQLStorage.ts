"use strict";

import Storage from "./Storage";
import mysql from "mysql2";
import { MAX_CHARACTER_LENGTH } from "./Config";
import { BackendPoll as Poll } from "./Poll";

export default class MySQLStorage extends Storage {
    #db: mysql.Connection;
    constructor(options: mysql.ConnectionOptions) {
        super();
        console.debug("Initiating MySQLStorage.");
        this.#db = mysql.createConnection(options);
    }

    async init(): Promise<this> {
        await this.#db.promise().connect();
        await this.#db.promise().query(`
            CREATE TABLE IF NOT EXISTS polls (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_str VARCHAR(32) NOT NULL UNIQUE,
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
        return this;
    }

    async getItem(key: string): Promise<Poll|null> {
        const [rows] = await this.#db.promise().execute("SELECT * FROM polls WHERE id_str = ? AND deleted_at IS NULL;", [key]);
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
            INSERT INTO polls
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