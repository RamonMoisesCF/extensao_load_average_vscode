// Criar um WebView e registrar um provider na sidebar
import * as vscode from 'vscode';

export class LoadViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'loadMonitorSidebar.view';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    const config = vscode.workspace.getConfiguration("loadMonitor");
    const threshold = config.get<number>("threshold", 4.0);

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview, threshold);

    setInterval(() => {
      const load = getCurrentLoad();
      webviewView.webview.postMessage({ command: 'update', value: load });
    }, 5000);
  }

  private getHtmlForWebview(webview: vscode.Webview, threshold: number): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: sans-serif;
            padding: 10px;
          }
          h2 {
            margin-bottom: 0.5em;
          }
          .load {
            font-size: 2em;
            font-weight: bold;
            transition: color 0.3s;
          }
          .normal {
            color: green;
          }
          .high {
            color: red;
          }
        </style>
      </head>
      <body>
        <h2>Load Average</h2>
        <div class="load normal" id="loadValue">--</div>

        <script>
          const threshold = ${threshold};

          window.addEventListener('message', event => {
            const { command, value } = event.data;
            if (command === 'update') {
              const loadEl = document.getElementById('loadValue');
              const load = parseFloat(value);
              loadEl.innerText = value;
              if (!isNaN(load) && load > threshold) {
                loadEl.className = 'load high';
              } else {
                loadEl.className = 'load normal';
              }
            }
          });
        </script>
      </body>
      </html>`;
  }
}

function getCurrentLoad(): string {
  try {
    const raw = require('fs').readFileSync('/proc/loadavg', 'utf8');
    return raw.split(' ')[0];
  } catch {
    return 'N/A';
  }
}