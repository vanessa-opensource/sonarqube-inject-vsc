
import * as fs from 'fs'
import * as path from 'path';
const https = require('follow-redirects').https;
const extract = require('extract-zip')

const URL = "https://github.com/nixel2007/sonarlint-cli/releases/download/console-report-1.0/sonarlint-cli.zip";
const pathToExtract = path.join(__filename, "./../../../../tools");
const pathToDownload = path.join(pathToExtract, "sonarlint-cli.zip");

const request = https.get(URL, (response) => {
    response.pipe(fs.createWriteStream(pathToDownload)).on("finish", () => {
        extract(pathToDownload, { dir: pathToExtract }, (err) => {
            if (err) {
                console.log(err);
            }
        })
    });
});