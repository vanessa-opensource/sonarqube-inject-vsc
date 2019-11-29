fs = require("fs-extra");
extract = require("extract-zip");
path = require("path");
request = require("request");

const pathToExtract = path.join(__filename, "./../tools");
const pathToDownload = path.join(pathToExtract, "sonarlint-cli.zip");

const sonarlintCLILocation =
    "https://github.com/nixel2007/sonarlint-cli/releases/download/console-report-1.4/sonarlint-cli.zip";

const options = {
    url: sonarlintCLILocation,
};

console.log("Downloading of sonarlint-cli was started...");

request(options)
    .pipe(fs.createWriteStream(pathToDownload))
    .on("finish", async () => {
        await fs.remove(path.join(pathToExtract, "sonarlint-cli"));

        extract(pathToDownload, { dir: pathToExtract }, async (err) => {
            if (err) {
                console.error(err);
                return;
            }
            await fs.chmod(path.join(pathToExtract, "sonarlint-cli", "bin", "sonarlint"), "755");
            console.log("SonarLint was installed.");
        });
    })
    .on("error", (err) => {
        console.error(err);
    });
