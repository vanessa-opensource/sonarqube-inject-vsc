"use strict";

import * as vscode from "vscode";
import * as path from "path";
let iconv = require('iconv-lite');
let spawn = require("cross-spawn");
let glob = require('glob')

export default class LintProvider {

    private commandId: string;
    private diagnosticCollection: vscode.DiagnosticCollection;
    private statusBarItem: vscode.StatusBarItem;
    private diagnosticSeverityMap: Map<string, vscode.DiagnosticSeverity>;

    public activate(subscriptions: vscode.Disposable[]) {
        this.diagnosticSeverityMap = new Map<string, vscode.DiagnosticSeverity>();
        this.diagnosticSeverityMap.set("INFO", vscode.DiagnosticSeverity.Information);
        this.diagnosticSeverityMap.set("MINOR", vscode.DiagnosticSeverity.Warning);
        this.diagnosticSeverityMap.set("MAJOR", vscode.DiagnosticSeverity.Error);
        this.diagnosticSeverityMap.set("CRITICAL", vscode.DiagnosticSeverity.Error);
        this.diagnosticSeverityMap.set("BLOCKER", vscode.DiagnosticSeverity.Error);

        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
        vscode.workspace.onDidSaveTextDocument(this.doLint, this);
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this.commandId = this.getCommandId();
        this.doLint();
    }

    public dispose(): void {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
        this.statusBarItem.hide();
    }

    public doLint(textDocument?: vscode.TextDocument) {
        let configuration = vscode.workspace.getConfiguration("sonarlint");
        let linterEnabled = Boolean(configuration.get("enableLinter"));
        if (!linterEnabled) {
            return;
        }
        if (textDocument) {
            let filename = textDocument.uri.fsPath;
            let arrFilename = filename.split(".");
            if (arrFilename.length === 0) {
                return;
            }
        } else {
            this.diagnosticCollection.clear();
        }

        let sourcePath = String(configuration.get("sourcePath"));
        let testsPath = String(configuration.get("testsPath"));
        let exclude = String(configuration.get("exclude"));
        let charset = String(configuration.get("sourceEncoding"));

        let args = ['--reportType', 'console'];

        if (textDocument) {
            sourcePath = path.relative(vscode.workspace.rootPath, textDocument.uri.fsPath);
            sourcePath = sourcePath.replace(/\\/g, "/");
        }

        if (sourcePath) {
            args.push('--src');
            args.push(sourcePath);
        }
        if (testsPath) {
            args.push('--tests');
            args.push(testsPath);
        }
        if (exclude) {
            args.push('--exclude');
            args.push(exclude);
        }
        if (charset) {
            args.push('--charset');
            args.push(charset);
        }

        let result = "";
        let sonarLintCS = spawn(this.commandId, args, this.getSpawnOptions()).on('error', function (err) { throw err });
        sonarLintCS.stderr.on("data", function (buffer) {
            result += iconv.decode(buffer, "windows-1251");
        });
        sonarLintCS.stdout.on("data", function (buffer) {
            result += iconv.decode(buffer, "windows-1251");
        });
        sonarLintCS.on("close", () => {
            try {
                result = result.trim();
                let lines = result.split(/\r?\n/);
                let regex = /^.*\{(.*)\}\s+\{(.*)\}\s+\{(\d+):(\d+)\s-\s(\d+):(\d+)\}\s+\{(.*)\}\s+\{(.*)\}/;
                let vscodeDiagnosticArray: [vscode.Uri, vscode.Diagnostic[]][] = [];
                let diagnosticFileMap = new Map<string, Array<string>>();
                for (let line in lines) {
                    let match = undefined;
                    match = lines[line].match(regex);
                    if (match) {
                        let range = new vscode.Range(
                                new vscode.Position(+match[3] - 1, +match[4]),
                                new vscode.Position(+match[5] - 1, +match[6])
                                );
                        let vscodeDiagnostic = new vscode.Diagnostic(range, match[8], this.diagnosticSeverityMap.get(match[2]));
                        vscodeDiagnostic.source = "sonarlint";
                        let fileUri: vscode.Uri = vscode.Uri.file(match[1]);
                        vscodeDiagnosticArray.push([fileUri, [vscodeDiagnostic]]);
                    }
                }
                if (textDocument) {
                    let tempDiagnosticArray: Array<vscode.Diagnostic> = new Array<vscode.Diagnostic>();
                    vscodeDiagnosticArray.forEach(element => {
                        element[1].forEach(diagnostic => {
                            tempDiagnosticArray.push(diagnostic);
                        });
                    });
                    this.diagnosticCollection.set(textDocument.uri, tempDiagnosticArray);
                } else {
                    this.diagnosticCollection.set(vscodeDiagnosticArray);
                }
                if (vscodeDiagnosticArray.length !== 0 && !vscode.workspace.rootPath) {
                    this.statusBarItem.text = vscodeDiagnosticArray.length === 0 ? "$(check) No Error" : "$(alert) " + vscodeDiagnosticArray.length + " Errors";
                    this.statusBarItem.show();
                } else {
                    this.statusBarItem.hide();
                }
            } catch (e) {
                console.error(e);
            }
        });

    };

    public updateBindings() {
        let args: Array<String> = ['-u'];
        let sonarLintCS = spawn(this.commandId, args, this.getSpawnOptions()).on('error', function (err) { throw err });
    }

    private getSpawnOptions(): Object {
        let options = {
            cwd: vscode.workspace.rootPath,
            env: process.env
        };
        return options;
    }    
    
    private getCommandId(): string {
        let command = "";
        let commandConfig = vscode.workspace.getConfiguration("sonarlint").get("sonarlintPath");
        if (!commandConfig || String(commandConfig).length === 0) {
            command = "sonarlint";
        } else {
            command = String(commandConfig);
        }
        return command;
    };

}

