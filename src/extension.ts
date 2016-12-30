// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "async-file";
import * as os from "os";
import * as path from 'path';
import * as url from "url";
import * as vscode from "vscode";

import { configTemplate } from "./templates/configTemplateInterface";
import GlobalTemplate from "./templates/globalTemplate";
import SonarlintTemplate from "./templates/sonarlintTemplate";
import LintProvider from "./features/lintProvider";

const https = require('follow-redirects').https;
const extract = require('extract-zip')

const pathToExtract = path.join(__filename, "./../../../tools");
const pathToDownload = path.join(pathToExtract, "sonarlint-cli.zip");

let diagnosticCollection: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    const sonarLintExists = await fs.exists(pathToDownload);
    if (!sonarLintExists) {
        vscode.window.showInformationMessage("SonarLint utility wasn't found. Installation is started.");
        install(context);
        return;
    }

    addSubscriptions(context);

}

function install(context: vscode.ExtensionContext) {
    const URL = "https://github.com/nixel2007/sonarlint-cli/releases/download/console-report-1.0/sonarlint-cli.zip";
    let options = url.parse(URL);

    const configuration = vscode.workspace.getConfiguration();
    const proxy = configuration.get("https.proxy");
    if (proxy) {
        options["proxy"] = proxy;
    }

    return https.get(options, (response) => {
        response.pipe(fs.createWriteStream(pathToDownload))
            .on("finish", () => {
                extract(pathToDownload, { dir: pathToExtract }, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    vscode.window.showInformationMessage("SonarLint was installed.");
                    addSubscriptions(context);
                })
            })
            .on("error", (err) => {
                console.error(err);
                vscode.window.showErrorMessage(err);
            })
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

    context.subscriptions.push(vscode.commands.registerCommand("sonarqube-inject.createGlobalJson", createGlobalJson));

    context.subscriptions.push(vscode.commands.registerCommand("sonarqube-inject.createSonarlintJson", createSonarlintJson));

}

async function createGlobalJson() {
    const rootPath = path.join(os.homedir(), ".sonarlint");

    if (!rootPath) {
        vscode.window.showInformationMessage("SonarLint binary is not installed.")
        return;
    }

    const confPath = path.join(rootPath, "conf");
    try {
        await fs.stat(confPath);
    } catch (error) {
        try {
            await fs.mkdir(confPath);
        } catch (error) {
            vscode.window.showErrorMessage(error);
        }
    }

    const filename = "global.json";

    createConfigFile(rootPath, filename, new GlobalTemplate());

}

async function createSonarlintJson() {
    const rootPath = vscode.workspace.rootPath;
    const filename = "sonarlint.json";

    createConfigFile(rootPath, filename, new SonarlintTemplate());
}

async function createConfigFile(rootPath: string, filename: string, template: configTemplate) {
    if (!rootPath) {
        return;
    }
    const filePath = path.join(rootPath, filename);
    const action = "Open " + filename;
    let selectedAction: string;

    try {
        await fs.stat(filePath);
        selectedAction = await vscode.window.showInformationMessage(filename + " already exists", action);
    } catch (error) {
        try {
            await fs.writeFile(filePath, JSON.stringify(template.getTemplateObject(), undefined, 4));
            selectedAction = await vscode.window.showInformationMessage(filename + " was created", action);
        } catch (error) {
            vscode.window.showErrorMessage(error);
        }
    }

    if (selectedAction) {
        const textDocument = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(textDocument);
    }
}