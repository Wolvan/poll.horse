"use strict";

export default abstract class Storage {
    abstract init(): Promise<this>;
    abstract getItem(key: string): Promise<any>;
    abstract setItem(key: string, value: any): Promise<any>;
}