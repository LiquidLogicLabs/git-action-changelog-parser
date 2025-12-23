import { ChangelogEntry, ParsedChangelog, ActionConfig } from './types';
/**
 * Parses a Keep a Changelog formatted file
 */
export declare function parseChangelog(content: string): ParsedChangelog;
/**
 * Validates changelog entries
 */
export declare function validateChangelog(parsed: ParsedChangelog, config: ActionConfig): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Finds a specific version entry
 */
export declare function findVersionEntry(parsed: ParsedChangelog, version?: string): ChangelogEntry | null;
/**
 * Loads configuration from a file
 */
export declare function loadConfig(configPath: string): Promise<ActionConfig>;
/**
 * Finds configuration file in repository root
 */
export declare function findConfigFile(): Promise<string | null>;
