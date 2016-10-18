// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs";
import * as path from 'path';
import * as vscode from "vscode";
import LintProvider from "./features/lintProvider";

const https = require('follow-redirects').https;
const extract = require('extract-zip')

const pathToExtract = path.join(__filename, "./../../../tools");
const pathToDownload = path.join(pathToExtract, "sonarlint-cli.zip");

let diagnosticCollection: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    if (!fs.existsSync(pathToDownload)) {
        vscode.window.showInformationMessage("SonarLint utility wasn't found. Installation is started.");
        install(context);
        return;
    }

    addSubscriptions(context);

}

function install(context: vscode.ExtensionContext) {
    const URL = "https://github.com/nixel2007/sonarlint-cli/releases/download/console-report-1.0/sonarlint-cli.zip";
    
    return https.get(URL, (response) => {
        response.pipe(fs.createWriteStream(pathToDownload)).on("finish", () => {
            extract(pathToDownload, { dir: pathToExtract }, (err) => {
                if (err) {
                    console.log(err);
                }
                vscode.window.showInformationMessage("SonarLint was installed.");
                addSubscriptions(context);
            })
        });
    });
}

function addSubscriptions(context: vscode.ExtensionContext) {
    let linter = new LintProvider();
    linter.activate(context.subscriptions);

    context.subscriptions.push(vscode.commands.registerCommand("sonarqube-inject.analyzeProject", () => {
        linter.doLint();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("sonarqube-inject.updateBindings", () => {
        linter.updateBindings();
        linter.doLint();
    }));
}
