import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";

let scriptProcess: vscode.Terminal | null = null;

export function activate(context: vscode.ExtensionContext) {
  console.log("[LOAD MONITOR] Ativando extensão...");
  let lastAlertTimestamp = "";

  const config = vscode.workspace.getConfiguration("loadMonitor");
  const intervalSeconds = config.get<number>("intervalSeconds", 30);
  const threshold = config.get<number>("threshold", 4.0);
  const logFilePath = config.get<string>("logFilePath", path.join(os.homedir(), "load_alerts.log"));

  console.log(`[LOAD MONITOR] Usando logFilePath: ${logFilePath}`);

  vscode.window.showInformationMessage("Load Monitor: iniciado.");

  if (!fs.existsSync(logFilePath)) {
    vscode.window
      .showWarningMessage(
        `Arquivo de log não encontrado em: ${logFilePath}. Deseja gerar o script automaticamente para começar a monitorar o sistema?`,
        "Gerar script",
        "Cancelar"
      )
      .then((res) => {
        if (res === "Gerar script") {
          gerarESugerirExecucaoDoScript(logFilePath, threshold, intervalSeconds);
        }
      });
  }

  const checkLog = () => {
  try {
    console.log("[LOAD MONITOR] Verificando log...");
    if (!fs.existsSync(logFilePath)) {
      console.log("[LOAD MONITOR] Arquivo de log não encontrado. Abortando verificação.");
      return;
    }

    const content = fs.readFileSync(logFilePath, "utf8");
    const lines = content.trim().split("\n");
    const lastAlertLine = [...lines].reverse().find(line => line.includes("[ALERTA]"));
    if (!lastAlertLine) {
      console.log("[LOAD MONITOR] Nenhuma linha com ALERTA encontrada.");
      return;
    }

    console.log(`[LOAD MONITOR] Última linha com ALERTA: ${lastAlertLine}`);

    const timestampMatch = lastAlertLine.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    const timestamp = timestampMatch ? timestampMatch[0] : "";
    console.log(`[LOAD MONITOR] Timestamp extraído: ${timestamp}`);
    console.log(`[LOAD MONITOR] Último alerta salvo: ${lastAlertTimestamp}`);

    const loadMatch = lastAlertLine.match(/Load average alto: (\d+(\.\d+)?)/);
    const load = loadMatch ? parseFloat(loadMatch[1]) : 0;
    console.log(`[LOAD MONITOR] Load extraído: ${load} | Threshold configurado: ${threshold}`);

    if (timestamp && timestamp !== lastAlertTimestamp && load > threshold) {
      lastAlertTimestamp = timestamp;
      vscode.window.showWarningMessage(`⚠️ ALERTA: Load average alto: ${load}`);
      console.log("[LOAD MONITOR] Alerta exibido para o usuário.");
    } else {
      console.log("[LOAD MONITOR] Nenhum novo alerta a ser exibido.");
    }
  } catch (error) {
    console.error("[LOAD MONITOR] Erro ao verificar log:", error);
  }
};

  const interval = setInterval(checkLog, intervalSeconds * 1000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });

  const disposable = vscode.commands.registerCommand("load-monitor-alert.runSetup", () => {
    gerarESugerirExecucaoDoScript(logFilePath, threshold, intervalSeconds);
  });
  context.subscriptions.push(disposable);
}

function gerarESugerirExecucaoDoScript(logFilePath: string, threshold: number, intervalSeconds: number) {
  const scriptDir = path.join(os.homedir(), "load-monitor");
  const scriptPath = path.join(scriptDir, "monitor_load.sh");

  if (!fs.existsSync(scriptDir)) {
    fs.mkdirSync(scriptDir, { recursive: true });
  }

  const scriptContent = `#!/bin/bash

THRESHOLD=${threshold}
INTERVAL=${intervalSeconds}
LOGFILE=\"$HOME/load_alerts.log\"
MAX_SIZE=51200  # 50 KB

export LC_NUMERIC=C
mkdir -p \"$(dirname \"$LOGFILE\")\"
echo \"[INFO] Monitoramento de load iniciado: $(date)\" >> \"$LOGFILE\"

while true; do
    if [ -f \"$LOGFILE\" ] && [ $(stat -c%s \"$LOGFILE\") -gt $MAX_SIZE ]; then
        echo \"[INFO] $(date) - Log truncado por atingir limite de $MAX_SIZE bytes.\" > \"$LOGFILE\"
    fi

    RAW_LOAD=$(cut -d ' ' -f1 /proc/loadavg)
    LOAD=$(echo \"$RAW_LOAD\" | sed 's/,/./')

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo \"[DEBUG] $TIMESTAMP - LOAD=$LOAD THRESHOLD=$THRESHOLD\" >> \"$LOGFILE\"

    if (( $(echo \"$LOAD > $THRESHOLD\" | bc -l) )); then
        echo \"[ALERTA] $TIMESTAMP - Load average alto: $LOAD\" >> \"$LOGFILE\"
    fi

    sleep $INTERVAL
done
`;

  fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

  vscode.window
    .showInformationMessage(`Script gerado com sucesso em: ${scriptPath}. Deseja executá-lo agora?`, "Executar", "Não")
    .then((escolha) => {
      if (escolha === "Executar") {
        scriptProcess = vscode.window.createTerminal("Load Monitor Script");
        scriptProcess.sendText(`bash \"${scriptPath}\"`);
        scriptProcess.show();
      }
    });
}

export function deactivate() {
  const logFilePath = path.join(os.homedir(), "load_alerts.log");

  if (fs.existsSync(logFilePath)) {
    try {
      fs.unlinkSync(logFilePath);
      console.log("[LOAD MONITOR] Arquivo de log removido.");
    } catch (e) {
      console.error("[LOAD MONITOR] Falha ao remover o log:", e);
    }
  }

  if (scriptProcess) {
    try {
      scriptProcess.dispose();
      console.log("[LOAD MONITOR] Terminal do script encerrado.");
    } catch (e) {
      console.error("[LOAD MONITOR] Falha ao encerrar terminal:", e);
    }
  }
}
