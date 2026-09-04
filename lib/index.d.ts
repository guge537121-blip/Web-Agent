import type { Context } from '@deepseek-ai/cordis';
export declare const name = "web-agent";
export declare const inject: string[];
export interface Config {
    readonly deepseekUrl?: string;
}
/** One persistent visible browser workspace shared by the human and the agent. */
export declare function apply(ctx: Context, config?: Config): void;
