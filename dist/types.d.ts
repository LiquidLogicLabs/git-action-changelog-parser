export interface ChangelogEntry {
    version: string;
    date?: string;
    status: 'prereleased' | 'released' | 'unreleased' | 'yanked';
    changes: string;
}
export interface ActionConfig {
    path?: string;
    repo_url?: string;
    ref?: string;
    validation_level?: 'none' | 'warn' | 'error';
    validation_depth?: number;
}
export interface ParsedChangelog {
    entries: ChangelogEntry[];
}
