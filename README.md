# SonarQube support for Visual Studio Code extension

[![Join the chat at https://gitter.im/silverbulleters/sonarqube-inject-vsc](https://badges.gitter.im/silverbulleters/sonarqube-inject-vsc.svg)](https://gitter.im/silverbulleters/sonarqube-inject-vsc?utm_source=badge&utm_medium=badge&utm_content=badge)
[![GitHub release](https://img.shields.io/github/release/silverbulleters/sonarqube-inject-vsc.svg)](https://github.com/silverbulleters/sonarqube-inject-vsc/blob/master/CHANGELOG.md)
[![Dependency Status](https://gemnasium.com/badges/github.com/silverbulleters/sonarqube-inject-vsc.svg)](https://gemnasium.com/github.com/silverbulleters/sonarqube-inject-vsc)

SonarQube support for Visual Studio Code that provides on-the-fly feedback to developers on new bugs and quality issues injected into their code.  
Non-official realization of SonarLint for VS Code.

## Important

`sonarlint` utility will be downloaded (~30MB) on first-time activation of the extension.  
If you are working behind a proxy, consider set `http_proxy` or `https_proxy` env variables and/or `http.proxy` and `http.proxyStrictSSL` settings in your Visual Studio Code.

## TLDR: Quick Setup for Standalone mode

* Just open your project dir
* Don't create a project config
* Supported languages: JS, PHP, Python and Java

## TLDR: Quick Setup for Connected mode

* Create global config via `SonarQube Inject: Create global config with credentials to servers` and fill the values
* Create project config via `SonarQube Inject: Create local sonarlint config with project binding` and fill the values
* Update project bindings via `SonarQube Inject: Update bindings to SonarQube server` - it can take a lot of time (~1-2 min) on first binding

## Extension settings

* `sonarqube-inject.enableLinter`  
Enables linting projects through SonarLint.  
Type: Boolean  
Default value: `true`.

* `sonarqube-inject.sonarlintPath`  
Full path to sonarlint binary. Fill this only if you use custom version of `sonarlint`.  
Type: String  
Format: relative (from workspace root) or absulute to `sonarlint` executable.  
Default value: `tools/sonarlint-cli/bin/sonarlint` (relative to the extension path).

* `sonarqube-inject.sourcePath`  
GLOB pattern to identify source files.  
Type: String  
Format: GLOB syntax is close to regexp and can be found on [Wikipedia article](https://en.wikipedia.org/wiki/Glob_(programming)).  
Default value: `src/**/*.*`.  
Example: `src/main/**/*.java`

* `sonarqube-inject.testsPath`  
GLOB pattern to identify test files.  
Type: String  
Format: GLOB syntax is close to regexp and can be found on [Wikipedia article](https://en.wikipedia.org/wiki/Glob_(programming)).  
Default value: empty.  
Example: `src/test/**/*.java`

* `sonarqube-inject.exclude`  
GLOB pattern to exclude files.  
Type: String  
Format: GLOB syntax is close to regexp and can be found on [Wikipedia article](https://en.wikipedia.org/wiki/Glob_(programming)).  
Default value: empty.  
Example: `**/*.properties`

* `sonarqube-inject.sourceEncoding`  
Character encoding of the source files.  
Type: String  
Default value: `UTF-8`.

* `sonarqube-inject.windowsConsoleEncoding`  
Output encoding of Windows command line. Used only on Windows.  
Type: String  
Default value: `windows-1251`.

* `sonarqube-inject.unixConsoleEncoding`  
Output encoding of command line on *nix systems.   
Type: String  
Default value: `utf8`.

> **Hint**:  
If you need to specify multiply paths in GLOB patterns, you can use `{path1,path2}' notation.

## Extension commands

* `SonarQube Inject: Analyze current project`  
Runs full analysis on current project

* `SonarQube Inject: Analyze current file`  
Runs analysis on current file

* `SonarQube Inject: Create global config with credentials to servers`  
Creates and opens a global config file to set server and credentials info

* `SonarQube Inject: Create local sonarlint config with project binding`  
Creates and opens a local config file with current project info

* `SonarQube Inject: Update bindings to SonarQube server`  
Reconnects to SonarQube server and updates all links.


## Connected mode

You can run analysis with connection to your SonarQube server.

To do this you need to create two small config files.  
Create and edit first file - global config - via `SonarQube Inject: Create global config with credentials to servers` command.  
Create and edit second file - procjet config - via `SonarQube Inject: Create local sonarlint config with project binding` command.  
If you have any troubles or questions please follow the instructions on [SonarLint website](http://www.sonarlint.org/commandline/index.html), section `Connected mode`, or start discussion in [Issues page](https://github.com/silverbulleters/sonarqube-inject-vsc/issues) or [Gitter](https://gitter.im/silverbulleters/sonarqube-inject-vsc).  
Don't forget to run `SonarQube Inject: Update bindings to SonarQube server` command in VSC or `sonarlint -u` in command line at your project workspace to update server bindings.

## Limitations

Currently works only with special `sonarlint-cli` version bundled with the extension. Source code can be found [here](https://github.com/nixel2007/sonarlint-cli/tree/feature/console-analysis).

## Supported languages

* java
* javascript
* php
* python
* cobol
* abap
* plsql
* swift
* bsl

## Screenshot

![default](https://cloud.githubusercontent.com/assets/1132840/17891093/7c840dfe-6942-11e6-8452-a8ef23faa951.PNG)
