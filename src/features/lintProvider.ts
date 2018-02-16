import * as iconv from "iconv-lite";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import spawn = require("cross-spawn");

export default class LintProvider {

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
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        vscode.workspace.onDidOpenTextDocument(this.doLint, this);
        vscode.workspace.onDidSaveTextDocument(this.doLint, this);

        if (vscode.window.activeTextEditor) {
            this.doLint(vscode.window.activeTextEditor.document);
        }
    }

    public dispose(): void {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
        this.statusBarItem.hide();
    }

    public doLint(textDocument?: vscode.TextDocument) {
        const configuration = vscode.workspace.getConfiguration("sonarqube-inject");

        const linterEnabled = Boolean(configuration.get("enableLinter"));
        if (!linterEnabled) {
            return;
        }
        if (textDocument) {
            const filename = textDocument.uri.fsPath;
            const arrFilename = filename.split(".");
            if (arrFilename.length === 0) {
                return;
            }
            // Strange behavior of VSCode.
            // Analyzis runs 2 times - for "file" scheme and for "git" scheme
            if (textDocument.uri.scheme === "git") {
                return;
            }
        } else {
            this.diagnosticCollection.clear();
        }

        if (textDocument) {
            this.executeLint(textDocument, this.getSpawnOptions(textDocument));
        } else {
            const allWorkspaceFolders = this.getAllWorkspaceFolders();
            if (allWorkspaceFolders) {
                for (const folder of allWorkspaceFolders) {
                    this.executeLint(null, this.getSpawnOptionsWithPath(folder.uri.fsPath));
                }
            }
        }

    }

    public updateBindings() {
        const args: string[] = this.getSpawnArgs();
        args.push("-u");

        const workSpaceFolders = this.getAllWorkspaceFolders();
        if (workSpaceFolders && workSpaceFolders.length > 0) {
            for (const folder of workSpaceFolders) {
                const spawnOptions = this.getSpawnOptionsWithPath(folder.uri.fsPath);
                this.updateBinding(args, spawnOptions);
            }
        }
    }

    private executeLint(textDocument?: vscode.TextDocument, spawnOptions?: object) {
        const consoleEncoding = this.getConsoleEncoding();

        let result = "";

        const sonarLintCS = spawn(
            this.getCommandId(),
            this.getSpawnArgs(textDocument),
            spawnOptions,
        ).on("error", (err) => {
            console.log(err);
            vscode.window.showErrorMessage(String(err));
        });
        sonarLintCS.stderr.on("data", (buffer) => {
            result += iconv.decode(buffer, consoleEncoding);
        });
        sonarLintCS.stdout.on("data", (buffer) => {
            result += iconv.decode(buffer, consoleEncoding);
        });
        sonarLintCS.on("close", () => {
            try {
                result = result.trim();
                let errorMessage = "";

                const errRegex = /.*EXECUTION FAILURE[\s|\S]*/gm;
                const errMatcher = new RegExp(errRegex);
                const errMatch = errMatcher.exec(result);
                if (errMatch) {
                    errorMessage = errMatch[0];
                    console.log(errorMessage);
                    vscode.window.showErrorMessage(errorMessage);

                    return;
                }

                // tslint:disable-next-line:max-line-length
                const regex = /^[^}]*\{([^}]*)\}\s+\{([^}]*)\}\s+\{(\d+|null):(\d+|null)\s-\s(\d+|null):(\d+|null)\}\s+\{([^}]*)\}\s+\{([^}]*)\}/gm;
                const matcher = new RegExp(regex);
                const vscodeDiagnosticArray: Array<[vscode.Uri, vscode.Diagnostic[]]> = [];
                while (true) {
                    const matches = matcher.exec(result);
                    if (matches == null) {
                        break;
                    }
                    const match = matches;

                    const startLine = match[3] === "null" ? 0 : +match[3] - 1;
                    const startCharacter = match[4] === "null" ? 0 : +match[4];
                    const endLine = match[5] === "null" ? 0 : +match[5] - 1;
                    const endCharacter = match[6] === "null" ? 0 : +match[6];

                    const range = new vscode.Range(
                        startLine,
                        startCharacter,
                        endLine,
                        endCharacter // tslint:disable-line:trailing-comma
                    );
                    const vscodeDiagnostic =
                        new vscode.Diagnostic(range, match[8], this.diagnosticSeverityMap.get(match[2]));
                    vscodeDiagnostic.source = "sonarqube-inject";
                    const fileUri: vscode.Uri = vscode.Uri.file(match[1]);
                    vscodeDiagnosticArray.push([fileUri, [vscodeDiagnostic]]);
                }
                if (textDocument) {
                    const tempDiagnosticArray: vscode.Diagnostic[] = new Array<vscode.Diagnostic>();
                    vscodeDiagnosticArray.forEach((element) => {
                        element[1].forEach((diagnostic) => {
                            tempDiagnosticArray.push(diagnostic);
                        });
                    });
                    this.diagnosticCollection.set(textDocument.uri, tempDiagnosticArray);
                } else {
                    this.diagnosticCollection.set(vscodeDiagnosticArray);
                }
                if (vscodeDiagnosticArray.length !== 0 && !this.getRootPath(textDocument)) {
                    this.statusBarItem.text =
                        vscodeDiagnosticArray.length === 0
                            ? "$(check) No Error"
                            : "$(alert) " + vscodeDiagnosticArray.length + " Errors";
                    this.statusBarItem.show();
                } else {
                    this.statusBarItem.hide();
                }
            } catch (err) {
                console.log(err);
                vscode.window.showErrorMessage(String(err));
            }
        });
    }

    private getAllWorkspaceFolders(): vscode.WorkspaceFolder[] {
        return vscode.workspace.workspaceFolders;
    }

    private updateBinding(args?: string[], spawnOptions?: object) {
        const consoleEncoding = this.getConsoleEncoding();
        let result = "";
        const sonarLintCS = spawn(this.getCommandId(), args, spawnOptions).on("error", (err) => {
            console.log(err);
            vscode.window.showErrorMessage(String(err));
        });
        sonarLintCS.stderr.on("data", (buffer) => {
            result += iconv.decode(buffer, consoleEncoding);
        });
        sonarLintCS.stdout.on("data", (buffer) => {
            result += iconv.decode(buffer, consoleEncoding);
        });
        sonarLintCS.on("close", () => {
            console.log(result);
            vscode.window.showInformationMessage("Bindings updated successfully.");
        });
    }

    private getSpawnOptions(textDocument?: vscode.TextDocument): object {
        const options = {
            cwd: this.getRootPath(textDocument),
            env: process.env,
        };
        return options;
    }

    private getSpawnOptionsWithPath(pathString?: string): object {
        const options = {
            cwd: pathString,
            env: process.env,
        };
        return options;
    }

    private getRelativePath(textDocument?: vscode.TextDocument): string {
        let sourcePath = path.relative(this.getRootPath(textDocument), textDocument.uri.fsPath);
        sourcePath = sourcePath.replace(/\\/g, "/");
        return sourcePath;
    }

    private getRootPath(textDocument?: vscode.TextDocument): string {
        let rootPath;
        if (textDocument) {
            const activeWorkspacefolder = vscode.workspace.getWorkspaceFolder(textDocument.uri);
            rootPath = activeWorkspacefolder && activeWorkspacefolder.uri.fsPath;
        }

        return rootPath;
    }

    private getSpawnArgs(textDocument?: vscode.TextDocument): string[] {
        const configuration = vscode.workspace.getConfiguration("sonarqube-inject");

        let sourcePath = String(configuration.get("sourcePath"));
        const testsPath = String(configuration.get("testsPath"));
        const exclude = String(configuration.get("exclude"));
        const charset = String(configuration.get("sourceEncoding"));

        const args = ["--reportType", "console"];

        if (textDocument) {
            sourcePath = this.getRelativePath(textDocument);
        }

        if (sourcePath) {
            args.push("--src");
            args.push(sourcePath);
        }
        if (testsPath) {
            args.push("--tests");
            args.push(testsPath);
        }
        if (exclude) {
            args.push("--exclude");
            args.push(exclude);
        }
        if (charset) {
            args.push("--charset");
            args.push(charset);
        }

        return args;
    }

    private getCommandId(): string {
        let command = "";
        const commandConfig = vscode.workspace.getConfiguration("sonarqube-inject").get("sonarlintPath");
        if (!commandConfig || String(commandConfig).length === 0) {
            command = path.resolve(__filename, "./../../../../tools/sonarlint-cli/bin/sonarlint");
        } else {
            command = String(commandConfig);
        }
        return command;
    }

    private getConsoleEncoding(): string {
        const configuration = vscode.workspace.getConfiguration("sonarqube-inject");
        let consoleEncoding: string;
        let consoleEncodingDefaultValue: string;
        if (this.isWindows()) {
            consoleEncoding = String(configuration.get("windowsConsoleEncoding"));
            consoleEncodingDefaultValue = "windows-1251";
        } else {
            consoleEncoding = String(configuration.get("unixConsoleEncoding"));
            consoleEncodingDefaultValue = "utf8";
        }
        if (!consoleEncoding) {
            consoleEncoding = consoleEncodingDefaultValue;
        }
        return consoleEncoding;
    }

    private isWindows(): boolean {
        return os.platform() === "win32";
    }
}
