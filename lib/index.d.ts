import type { Context } from '@deepseek-ai/cordis';
export declare const name = "web-agent";
export declare const inject: string[];
export interface Config {
    readonly deepseekUrl?: string;
}
/** M0/M1: DeepSeek Web entry point plus explicit browser-control bridge. */
export declare function apply(ctx: Context, config?: Config): void;
