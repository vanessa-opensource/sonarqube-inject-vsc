# SonarQube support for Visual Studio Code extension

SonarQube support for Visual Studio Code that provides on-the-fly feedback to developers on new bugs and quality issues injected into their code.  
Non-official realization of SonarLint for VS Code.

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
Default value: empty.  
Example: `src/main/*.java`

* `sonarqube-inject.testsPath`  
GLOB pattern to identify test files.  
Type: String  
Format: GLOB syntax is close to regexp and can be found on [Wikipedia article](https://en.wikipedia.org/wiki/Glob_(programming)).  
Default value: empty.  
Example: `src/test/*.java`

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

* `SonarQube Inject: Update bindings to SonarQube server`  
Reconnects to SonarQube server and updates all links.

## Connected mode

You can run analysis with connection to your SonarQube server.

To do this you need to create two small config files - follow the instructions on [SonarLint website](http://www.sonarlint.org/commandline/index.html), section `Connected mode`.  
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
