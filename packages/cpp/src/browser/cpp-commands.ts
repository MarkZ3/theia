/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from "inversify";
import { SelectionService } from '@theia/core/lib/common';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import URI from "@theia/core/lib/common/uri";
import { open, OpenerService } from '@theia/core/lib/browser';
import { CppClientContribution } from "./cpp-client-contribution";
import { SwitchSourceHeaderRequest } from "./cpp-protocol";
import { TextDocumentIdentifier } from "@theia/languages/lib/common";
import { EditorManager } from "@theia/editor/lib/browser";
import { ExecuteCommandRequest, ExecuteCommandParams } from "vscode-languageserver-protocol";

/**
 * Switch between source/header file
 */
export const SWITCH_SOURCE_HEADER: Command = {
    id: 'switch_source_header',
    label: 'Switch between source/header file'
};

export const DUMP_INCLUSIONS: Command = {
    id: 'dump_inclusions',
    label: 'Dump file inclusions (Debug)'
};

export const DUMP_INCLUDED_BY: Command = {
    id: 'dump_included_by',
    label: 'Dump files including this file (Debug)'
};

export const REINDEX: Command = {
    id: 'reindex',
    label: 'Reindex workspace (Debug)'
};

export const PRINT_STATS: Command = {
    id: 'print_stats',
    label: 'Print Index Statistics (Debug)'
};

export const FILE_OPEN_PATH = (path: string): Command => <Command>{
    id: `file:openPath`
};

@injectable()
export class CppCommandContribution implements CommandContribution {

    constructor(
        @inject(CppClientContribution) protected readonly clientContribution: CppClientContribution,
        @inject(OpenerService) protected readonly openerService: OpenerService,
        @inject(EditorManager) private editorService: EditorManager,
        protected readonly selectionService: SelectionService

    ) { }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(SWITCH_SOURCE_HEADER, {
            isEnabled: () => (this.editorService && !!this.editorService.activeEditor &&
                (this.editorService.activeEditor.editor.document.uri.endsWith(".cpp") || this.editorService.activeEditor.editor.document.uri.endsWith(".h"))),
            execute: () => {
                this.switchSourceHeader();
            }
        });
        commands.registerCommand(REINDEX, {
            isEnabled: () => true,
            execute: () => this.reindex()
        });
        commands.registerCommand(DUMP_INCLUSIONS, {
            isEnabled: () => true,
            execute: () => this.dumpInclusions()
        });
        commands.registerCommand(DUMP_INCLUDED_BY, {
            isEnabled: () => true,
            execute: () => this.dumpIncludedBy()
        });
        commands.registerCommand(PRINT_STATS, {
            isEnabled: () => true,
            execute: () => this.printStats()
        });
    }

    protected switchSourceHeader(): void {
        const docIdentifier = TextDocumentIdentifier.create(this.selectionService.selection.uri.toString());
        this.clientContribution.languageClient.then(languageClient => {
            languageClient.sendRequest(SwitchSourceHeaderRequest.type, docIdentifier).then(sourceUri => {
                if (sourceUri !== undefined) {
                    open(this.openerService, new URI(sourceUri.toString()));
                }
            });
        });
    }

    private dumpInclusions(): void {
        const docIdentifier = TextDocumentIdentifier.create(this.selectionService.selection.uri.toString());
        const params: ExecuteCommandParams = { command: "dumpinclusions", arguments: [docIdentifier] };
        this.clientContribution.languageClient.then(languageClient => {
            languageClient.sendRequest(ExecuteCommandRequest.type, params);
        });
    }

    private dumpIncludedBy(): void {
        const docIdentifier = TextDocumentIdentifier.create(this.selectionService.selection.uri.toString());
        const params: ExecuteCommandParams = { command: "dumpincludedby", arguments: [docIdentifier] };
        this.clientContribution.languageClient.then(languageClient => {
            languageClient.sendRequest(ExecuteCommandRequest.type, params);
        });
    }

    private reindex(): void {
        const params: ExecuteCommandParams = { command: "reindex" };
        this.clientContribution.languageClient.then(languageClient => {
            languageClient.sendRequest(ExecuteCommandRequest.type, params);
        });
    }
    private printStats(): void {
        const params: ExecuteCommandParams = { command: "printstats" };
        this.clientContribution.languageClient.then(languageClient => {
            languageClient.sendRequest(ExecuteCommandRequest.type, params);
        });
    }
}
