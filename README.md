# SonarLint Visual Studio Code Plugin

Adds SonarLint support in your editor.

## Working features

* [x] standalone mode
* [x] connected mode

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

## Connected mode

You can run analysis with connection to your SonarQube server.

To do this you need to create two small config files - follow the instructions on [SonarLint website](http://www.sonarlint.org/commandline/index.html), section `Connected mode`.  
Don't forget to run `sonarlint -u` in your project workspace to update bindings.

## Limitations

Currently works only with speacial manualy built `sonarlint` version. Source code can be found [here](https://github.com/nixel2007/sonarlint-cli/tree/feature/console-analysis).
