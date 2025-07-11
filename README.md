# Load Monitor Alert

Extensão para VS Code que exibe alertas visuais quando o load average do sistema está alto.

---

## Funcionalidades

- Monitora o arquivo de log gerado pelo script `monitor_load.sh`.
- Exibe notificações no VS Code quando o load average ultrapassa o limite configurado.
- Configurações personalizáveis via `settings.json`:
  - Intervalo de verificação (`loadMonitor.intervalSeconds`)
  - Limite de load (`loadMonitor.threshold`)
  - Caminho do arquivo de log (`loadMonitor.logFilePath`)

---

## Como usar

1. Gere e execute o script de monitoramento (a extensão oferece comando para isso).
2. A extensão verificará periodicamente o log e avisará quando o load estiver alto.

---

## Configurações

Configurações disponíveis na interface do VS Code (`settings.json`):

```json
{
  "loadMonitor.intervalSeconds": 30,
  "loadMonitor.threshold": 4.0,
  "loadMonitor.logFilePath": "/caminho/para/load_alerts.log"
}
