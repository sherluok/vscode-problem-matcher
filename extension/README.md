## The `chrome` task type

Provide new task type `"chrome"` to launch chrome browser at desired `--remote-debugging-port`. Create a `.vscode/tasks.json` file:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "chrome",
      "label": "launch",
      "startingPage": "http://localhost:8080",
      "remoteDebuggingPort": 9230,
      "isBackground": true,
    },
  ]
}
```

This task will launch chrome if there is no chrome process running at this remote debugging port, the task will continue running until the chrome process is closed. This type of task is used before chrome debugger launch, for example, the `.vscode/launch.json` file:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Chrome",
      "type": "chrome",
      "request": "attach",
      "preLaunchTask": "launch",
      "urlFilter": "http://localhost:8080/*",
      "port": 9230,
    }
  ]
}
```

For more detail on this files, go to [example/.vscode](./example/.vscode) folder.

## The `common` Problem Matcher

## The `esbuild` Problem Matcher

For more details, refers to:
- https://esbuild.github.io/api/#logging
- https://github.com/connor4312/esbuild-problem-matchers

## The `wrangler-dev` Problem Matcher
