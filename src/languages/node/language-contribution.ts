/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Message, isRequestMessage } from 'vscode-ws-jsonrpc';
import { InitializeParams, InitializeRequest } from 'vscode-languageserver/lib/protocol';
import * as server from 'vscode-ws-jsonrpc/lib/server';
import { LanguageDescription } from '../common';
import IConnection = server.IConnection;

export * from 'vscode-ws-jsonrpc/lib/server';

export const LanguageContribution = Symbol('LanguageContribution');

export interface LanguageContribution {
    readonly description: LanguageDescription;
    listen(clientConnection: IConnection): void;
}

export function forward(clientConnection: IConnection, serverConnection: IConnection, map?: (message: Message) => Message): void {
    function _map(message: Message): Message {
        if (isRequestMessage(message)) {
            if (message.method === InitializeRequest.type.method) {
                const initializeParams = message.params as InitializeParams;
                initializeParams.processId = process.pid;
            }
        }
        return message;
    }
    server.forward(clientConnection, serverConnection, message => {
        const mappedMessage = map ? map(message) : message;
        return _map(mappedMessage);
    });
}
