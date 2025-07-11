# Load Monitor Alert

Esta extensão do VS Code exibe alertas quando o *load average* do sistema estiver alto, com base em um arquivo de log externo.

## Configurações disponíveis

- `loadMonitor.intervalSeconds`: intervalo de verificação, em segundos
- `loadMonitor.threshold`: valor de *load average* a partir do qual o alerta será exibido

## Uso

A extensão lê o arquivo `~/load_alerts.log` a cada X segundos e exibe um pop-up de aviso se encontrar uma linha com `[ALERTA]` cujo valor exceda o limite configurado.
