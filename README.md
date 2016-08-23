# SonarLint Visual Studio Code Plugin

SonarLint support for Visual Studio Code that provides on-the-fly feedback to developers on new bugs and quality issues injected into their code.

## Extension settings

* `sonarlint.enableLinter`  
Enables linting projects through SonarLint.  
Type: Boolean  
Default value: `true`.

* `sonarlint.sonarlintPath`  
Full path to sonarlint binary. Fill this only if sonarlint is not in your $PATH.  
Type: String  
Format: relative (from workspace root) or absulute to `sonarlint` executable.  
Default value: empty.

* `sonarlint.sourcePath`  
GLOB pattern to identify source files.  
Type: String  
Format: GLOB syntax is close to regexp and can be found on [Wikipedia article](https://en.wikipedia.org/wiki/Glob_(programming)).  
Default value: empty.  
Example: `src/main/*.java`

* `sonarlint.testsPath`  
GLOB pattern to identify test files.  
Type: String  
Format: GLOB syntax is close to regexp and can be found on [Wikipedia article](https://en.wikipedia.org/wiki/Glob_(programming)).  
Default value: empty.  
Example: `src/test/*.java`

* `sonarlint.exclude`  
GLOB pattern to exclude files.  
Type: String  
Format: GLOB syntax is close to regexp and can be found on [Wikipedia article](https://en.wikipedia.org/wiki/Glob_(programming)).  
Default value: empty.  
Example: `**/*.properties`

* `sonarlint.sourceEncoding`  
Character encoding of the source files.  
Type: String  
Default value: `UTF-8`.

> **Hint**:  
If you need to specify multiply paths in GLOB patterns, you can use `{path1,path2}' notation.

## Extension commands

* `SonarLint: Analyze current project`  
Runs full analysis on current project

* `SonarLint: Update bindings to SonarQube server`  
Reconnects to SonarQube server and updates all links.

## Connected mode

You can run analysis with connection to your SonarQube server.

To do this you need to create two small config files - follow the instructions on [SonarLint website](http://www.sonarlint.org/commandline/index.html), section `Connected mode`.  
Don't forget to run `SonarLint: Update bindings to SonarQube server` command in VSC or `sonarlint -u` in command line at your project workspace to update server bindings.

## Limitations

Currently works only with speacial manualy built `sonarlint` version. Source code can be found [here](https://github.com/nixel2007/sonarlint-cli/tree/feature/console-analysis).

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
