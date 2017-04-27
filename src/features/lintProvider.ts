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
        vscode.workspace.onDidSaveTextDocument(this.doLint, this);
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this.doLint();
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
        } else {
            this.diagnosticCollection.clear();
        }

        const consoleEncoding = this.getConsoleEncoding();

        const args = this.getSpawnArgs(textDocument);

        let result = "";
        const sonarLintCS = spawn(this.getCommandId(), args, this.getSpawnOptions()).on("error", (err) => {
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
                let errorMode = false;
                const lines = result.split(/\r?\n/);
                const regex = /^[^}]*\{([^}]*)\}\s+\{([^}]*)\}\s+\{(\d+|null):(\d+|null)\s-\s(\d+|null):(\d+|null)\}\s+\{([^}]*)\}\s+\{([^}]*)\}/;
                const vscodeDiagnosticArray: Array<[vscode.Uri, vscode.Diagnostic[]]> = [];
                const diagnosticFileMap = new Map<string, string[]>();
                for (const line of lines) {
                    const match = line.match(regex);
                    if (match) {
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
                    } else if (line.match(/.*EXECUTION FAILURE.*/)) {
                        errorMode = true;
                    }
                    if (errorMode) {
                        errorMessage += line + "\n";
                    }
                }
                if (textDocument) {
                    const tempDiagnosticArray: vscode.Diagnostic[] = new Array<vscode.Diagnostic>();
                    vscodeDiagnosticArray.forEach( (element) => {
                        element[1].forEach( (diagnostic) => {
                            tempDiagnosticArray.push(diagnostic);
                        });
                    });
                    this.diagnosticCollection.set(textDocument.uri, tempDiagnosticArray);
                } else {
                    this.diagnosticCollection.set(vscodeDiagnosticArray);
                }
                if (vscodeDiagnosticArray.length !== 0 && !vscode.workspace.rootPath) {
                    this.statusBarItem.text =
                        vscodeDiagnosticArray.length === 0
                            ? "$(check) No Error"
                            : "$(alert) " + vscodeDiagnosticArray.length + " Errors";
                    this.statusBarItem.show();
                } else {
                    this.statusBarItem.hide();
                }
                if (errorMessage) {
                    console.log(errorMessage);
                    vscode.window.showErrorMessage(errorMessage);
                }
            } catch (err) {
                console.log(err);
                vscode.window.showErrorMessage(String(err));
            }
        });

    };

    public updateBindings() {
        const args: string[] = this.getSpawnArgs();
        args.push("-u");

        const consoleEncoding = this.getConsoleEncoding();
        let result = "";

        const sonarLintCS = spawn(this.getCommandId(), args, this.getSpawnOptions()).on("error", (err) => {
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
            vscode.window.showInformationMessage("Bindings updated successefully.");
        });
    }

    private getSpawnOptions(): object {
        const options = {
            cwd: vscode.workspace.rootPath,
            env: process.env,
        };
        return options;
    }

    private getSpawnArgs(textDocument?: vscode.TextDocument): string[] {

        const configuration = vscode.workspace.getConfiguration("sonarqube-inject");

        let sourcePath = String(configuration.get("sourcePath"));
        const testsPath = String(configuration.get("testsPath"));
        const exclude = String(configuration.get("exclude"));
        const charset = String(configuration.get("sourceEncoding"));

        const args = ["--reportType", "console"];

        if (textDocument) {
            sourcePath = path.relative(vscode.workspace.rootPath, textDocument.uri.fsPath);
            sourcePath = sourcePath.replace(/\\/g, "/");
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
    };

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
