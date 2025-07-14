// Criar um WebView e registrar um provider na sidebar
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";

let interval: NodeJS.Timeout | null = null;
let lastAlertTimestamp = "";
let statusBarItem: vscode.StatusBarItem | undefined;

let userSettings = {
  intervalSeconds: 30,
  threshold: 4.0,
  logFilePath: path.join(os.homedir(), "load_alerts.log"),
  showSidebar: true,
};

export function activate(context: vscode.ExtensionContext) {
  carregarConfiguracoes();

  vscode.window.showInformationMessage("Load Monitor: iniciado.");

  if (userSettings.showSidebar) {
    statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.text = `Load: --`;
    statusBarItem.tooltip = "Monitor de Load Average";
    statusBarItem.show();
  }

  if (!fs.existsSync(userSettings.logFilePath)) {
    vscode.window
      .showWarningMessage(
        `Arquivo de log não encontrado em: ${userSettings.logFilePath}. Deseja gerar o script automaticamente para começar a monitorar o sistema?`,
        "Gerar script",
        "Cancelar"
      )
      .then((res) => {
        if (res === "Gerar script") {
          gerarESugerirExecucaoDoScript(
            userSettings.logFilePath,
            userSettings.threshold,
            userSettings.intervalSeconds
          );
        }
      });
  }

  const checkLog = () => {
    if (!fs.existsSync(userSettings.logFilePath)) {
      if (statusBarItem) statusBarItem.text = `Load: arquivo não encontrado`;
      return;
    }

    const content = fs.readFileSync(userSettings.logFilePath, "utf8");
    const lines = content.trim().split("\n").reverse();

    const lastAlertLine = lines.find((line) => line.includes("[ALERTA]"));
    if (!lastAlertLine) {
      if (statusBarItem) {
        statusBarItem.text = `Load: --`;
        statusBarItem.backgroundColor = undefined;
      }
      return;
    }

    const timestampMatch = lastAlertLine.match(
      /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
    );
    const timestamp = timestampMatch ? timestampMatch[0] : "";
    const loadMatch = lastAlertLine.match(/Load average alto: (\d+(\.\d+)?)/);
    const load = loadMatch ? parseFloat(loadMatch[1]) : 0;

    if (statusBarItem) {
      statusBarItem.text = `Load: ${load.toFixed(2)}`;
      statusBarItem.backgroundColor =
        load > userSettings.threshold
          ? new vscode.ThemeColor("statusBarItem.errorBackground")
          : undefined;
    }

    if (timestamp !== lastAlertTimestamp && load > userSettings.threshold) {
      lastAlertTimestamp = timestamp;
      vscode.window.showErrorMessage(`ALERTA: Load average alto: ${load}`);
    }
  };

  const startChecking = () => {
    if (interval) clearInterval(interval);
    interval = setInterval(checkLog, userSettings.intervalSeconds * 1000);
    checkLog();
  };
  startChecking();

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("loadMonitor")) {
      const oldSettings = { ...userSettings };
      carregarConfiguracoes();

      const mudouLogFilePath =
        userSettings.logFilePath !== oldSettings.logFilePath;
      const mudouThreshold = userSettings.threshold !== oldSettings.threshold;
      const mudouInterval =
        userSettings.intervalSeconds !== oldSettings.intervalSeconds;

      const mudouSidebar = userSettings.showSidebar !== oldSettings.showSidebar;
      if (mudouSidebar) {
        if (userSettings.showSidebar && !statusBarItem) {
          statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
          );
          statusBarItem.tooltip = "Monitor de Load Average";
          statusBarItem.show();
        } else if (!userSettings.showSidebar && statusBarItem) {
          statusBarItem.dispose();
          statusBarItem = undefined;
        }
      }

      const precisaReiniciarScript =
        mudouThreshold || mudouInterval || mudouLogFilePath;
      if (precisaReiniciarScript) {
        pararScriptEReiniciar();
      }

      startChecking();
    }
  });

  context.subscriptions.push({
    dispose: () => interval && clearInterval(interval),
  });

  context.subscriptions.push({
    dispose: () => statusBarItem?.dispose(),
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("load-monitor-alert.runSetup", () => {
      gerarESugerirExecucaoDoScript(
        userSettings.logFilePath,
        userSettings.threshold,
        userSettings.intervalSeconds
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("load-monitor-alert.forceCheck", () => {
      vscode.window.showInformationMessage(
        "Forçando verificação manual do log..."
      );
      checkLog();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("load-monitor-alert.cleanup", () => {
      vscode.window
        .showWarningMessage(
          "Deseja parar o monitoramento e excluir os arquivos gerados?",
          "Sim",
          "Cancelar"
        )
        .then((resposta) => {
          if (resposta === "Sim") {
            const scriptDir = path.join(os.homedir(), "load-monitor");
            const scriptPath = path.join(scriptDir, "monitor_load.sh");
            const pidFile = path.join(scriptDir, "monitor_load.pid");

            if (fs.existsSync(userSettings.logFilePath))
              fs.unlinkSync(userSettings.logFilePath);
            if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
            if (fs.existsSync(pidFile)) {
              const pid = fs.readFileSync(pidFile, "utf8").trim();
              try {
                process.kill(Number(pid), "SIGTERM");
              } catch (e) {
                console.error("Erro ao encerrar processo:", e);
              }
              fs.unlinkSync(pidFile);
            }

            vscode.window.showInformationMessage(
              "Arquivos removidos com sucesso."
            );
          }
        });
    })
  );
}

function gerarESugerirExecucaoDoScript(
  logFilePath: string,
  threshold: number,
  intervalSeconds: number,
  executarAuto: boolean = false
) {
  const scriptDir = path.join(os.homedir(), "load-monitor");
  const scriptPath = path.join(scriptDir, "monitor_load.sh");
  const pidFile = path.join(scriptDir, "monitor_load.pid");

  if (!fs.existsSync(scriptDir)) {
    fs.mkdirSync(scriptDir, { recursive: true });
  }

  const scriptContent = `#!/bin/bash
THRESHOLD=${threshold}
INTERVAL=${intervalSeconds}
LOGFILE="${logFilePath}"
MAX_SIZE=51200

export LC_NUMERIC=C
mkdir -p "$(dirname \"$LOGFILE\")"
echo "[INFO] Monitoramento de load iniciado: $(date)" >> "$LOGFILE"

while true; do
    if [ -f "$LOGFILE" ] && [ $(stat -c%s "$LOGFILE") -gt $MAX_SIZE ]; then
        echo "[INFO] $(date) - Log truncado por atingir limite de $MAX_SIZE bytes." > "$LOGFILE"
    fi

    RAW_LOAD=$(cut -d ' ' -f1 /proc/loadavg)
    LOAD=$(echo "$RAW_LOAD" | sed 's/,/./')

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    if (( $(echo "$LOAD > $THRESHOLD" | bc -l) )); then
        echo "[ALERTA] $TIMESTAMP - Load average alto: $LOAD" >> "$LOGFILE"
    fi

    sleep $INTERVAL
done
`;

  fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

  const runScript = () => {
    const child = spawn("bash", [scriptPath], {
      detached: true,
      stdio: "ignore",
    });
    fs.writeFileSync(pidFile, String(child.pid), "utf-8");
    child.unref();
    vscode.window.showInformationMessage("Script de monitoramento reiniciado.");
  };

  if (executarAuto) {
    runScript();
  } else {
    vscode.window
      .showInformationMessage(
        `Script gerado com sucesso em: ${scriptPath}. Deseja executá-lo agora em background?`,
        "Executar",
        "Cancelar"
      )
      .then((escolha) => {
        if (escolha === "Executar") {
          runScript();
        }
      });
  }
}

export function deactivate() {
  if (interval) clearInterval(interval);
}

function carregarConfiguracoes() {
  const config = vscode.workspace.getConfiguration("loadMonitor");
  userSettings.intervalSeconds = config.get<number>("intervalSeconds", 30);
  userSettings.threshold = config.get<number>("threshold", 4.0);
  userSettings.logFilePath = config.get<string>(
    "logFilePath",
    path.join(os.homedir(), "load_alerts.log")
  );
  userSettings.showSidebar = config.get<boolean>("showSidebar", true);
}

function pararScriptEReiniciar() {
  const scriptDir = path.join(os.homedir(), "load-monitor");
  const pidFile = path.join(scriptDir, "monitor_load.pid");

  if (fs.existsSync(pidFile)) {
    const pid = fs.readFileSync(pidFile, "utf8").trim();
    try {
      process.kill(Number(pid), "SIGTERM");
      fs.unlinkSync(pidFile);
    } catch (e) {
      console.error(`[LOAD MONITOR] Erro ao encerrar processo antigo:`, e);
    }
  }

  gerarESugerirExecucaoDoScript(
    userSettings.logFilePath,
    userSettings.threshold,
    userSettings.intervalSeconds,
    true
  );
}

// Remove o log
// if (fs.existsSync(logFilePath)) {
//   try {
//     fs.unlinkSync(logFilePath);
//   } catch (e) {
//     console.error("[LOAD MONITOR] Falha ao remover o log:", e);
//   }
// }

// // Encerra o processo em background
// if (fs.existsSync(pidFile)) {
//   const pid = fs.readFileSync(pidFile, "utf-8").trim();
//   try {
//     process.kill(Number(pid), "SIGTERM");
//     fs.unlinkSync(pidFile);
//   } catch (e) {
//     console.error(
//       `[LOAD MONITOR] Falha ao encerrar processo (PID: ${pid}):`,
//       e
//     );
//   }
// }

// // Remove o script bash
// if (fs.existsSync(scriptPath)) {
//   try {
//     fs.unlinkSync(scriptPath);
//   } catch (e) {
//     console.error("[LOAD MONITOR] Falha ao remover script:", e);
//   }
// }
