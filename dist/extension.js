"use strict";var v=Object.create;var L=Object.defineProperty;var D=Object.getOwnPropertyDescriptor;var R=Object.getOwnPropertyNames;var S=Object.getPrototypeOf,N=Object.prototype.hasOwnProperty;var F=(o,e)=>{for(var t in e)L(o,t,{get:e[t],enumerable:!0})},T=(o,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of R(e))!N.call(o,r)&&r!==t&&L(o,r,{get:()=>e[r],enumerable:!(s=D(e,r))||s.enumerable});return o};var g=(o,e,t)=>(t=o!=null?v(S(o)):{},T(e||!o||!o.__esModule?L(t,"default",{value:o,enumerable:!0}):t,o)),x=o=>T(L({},"__esModule",{value:!0}),o);var y={};F(y,{activate:()=>w,deactivate:()=>b});module.exports=x(y);var n=g(require("vscode")),a=g(require("fs")),l=g(require("path")),h=g(require("os")),c=null;function w(o){console.log("[LOAD MONITOR] Ativando extens\xE3o...");let e="",t=n.workspace.getConfiguration("loadMonitor"),s=t.get("intervalSeconds",30),r=t.get("threshold",4),i=t.get("logFilePath",l.join(h.homedir(),"load_alerts.log"));console.log(`[LOAD MONITOR] Usando logFilePath: ${i}`),n.window.showInformationMessage("Load Monitor: iniciado."),a.existsSync(i)||n.window.showWarningMessage(`Arquivo de log n\xE3o encontrado em: ${i}. Deseja gerar o script automaticamente para come\xE7ar a monitorar o sistema?`,"Gerar script","Cancelar").then(d=>{d==="Gerar script"&&I(i,r,s)});let $=setInterval(()=>{try{if(console.log("[LOAD MONITOR] Verificando log..."),!a.existsSync(i)){console.log("[LOAD MONITOR] Arquivo de log n\xE3o encontrado. Abortando verifica\xE7\xE3o.");return}let O=[...a.readFileSync(i,"utf8").trim().split(`
`)].reverse().find(E=>E.includes("[ALERTA]"));if(!O){console.log("[LOAD MONITOR] Nenhuma linha com ALERTA encontrada.");return}console.log(`[LOAD MONITOR] \xDAltima linha com ALERTA: ${O}`);let f=O.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/),m=f?f[0]:"";console.log(`[LOAD MONITOR] Timestamp extra\xEDdo: ${m}`),console.log(`[LOAD MONITOR] \xDAltimo alerta salvo: ${e}`);let u=O.match(/Load average alto: (\d+(\.\d+)?)/),A=u?parseFloat(u[1]):0;console.log(`[LOAD MONITOR] Load extra\xEDdo: ${A} | Threshold configurado: ${r}`),m&&m!==e&&A>r?(e=m,n.window.showWarningMessage(`\u26A0\uFE0F ALERTA: Load average alto: ${A}`),console.log("[LOAD MONITOR] Alerta exibido para o usu\xE1rio.")):console.log("[LOAD MONITOR] Nenhum novo alerta a ser exibido.")}catch(d){console.error("[LOAD MONITOR] Erro ao verificar log:",d)}},s*1e3);o.subscriptions.push({dispose:()=>clearInterval($)});let M=n.commands.registerCommand("load-monitor-alert.runSetup",()=>{I(i,r,s)});o.subscriptions.push(M)}function I(o,e,t){let s=l.join(h.homedir(),"load-monitor"),r=l.join(s,"monitor_load.sh");a.existsSync(s)||a.mkdirSync(s,{recursive:!0});let i=`#!/bin/bash

THRESHOLD=${e}
INTERVAL=${t}
LOGFILE="$HOME/load_alerts.log"
MAX_SIZE=51200  # 50 KB

export LC_NUMERIC=C
mkdir -p "$(dirname "$LOGFILE")"
echo "[INFO] Monitoramento de load iniciado: $(date)" >> "$LOGFILE"

while true; do
    if [ -f "$LOGFILE" ] && [ $(stat -c%s "$LOGFILE") -gt $MAX_SIZE ]; then
        echo "[INFO] $(date) - Log truncado por atingir limite de $MAX_SIZE bytes." > "$LOGFILE"
    fi

    RAW_LOAD=$(cut -d ' ' -f1 /proc/loadavg)
    LOAD=$(echo "$RAW_LOAD" | sed 's/,/./')

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[DEBUG] $TIMESTAMP - LOAD=$LOAD THRESHOLD=$THRESHOLD" >> "$LOGFILE"

    if (( $(echo "$LOAD > $THRESHOLD" | bc -l) )); then
        echo "[ALERTA] $TIMESTAMP - Load average alto: $LOAD" >> "$LOGFILE"
    fi

    sleep $INTERVAL
done
`;a.writeFileSync(r,i,{mode:493}),n.window.showInformationMessage(`Script gerado com sucesso em: ${r}. Deseja execut\xE1-lo agora?`,"Executar","N\xE3o").then(p=>{p==="Executar"&&(c=n.window.createTerminal("Load Monitor Script"),c.sendText(`bash "${r}"`),c.show())})}function b(){let o=l.join(h.homedir(),"load_alerts.log");if(a.existsSync(o))try{a.unlinkSync(o),console.log("[LOAD MONITOR] Arquivo de log removido.")}catch(e){console.error("[LOAD MONITOR] Falha ao remover o log:",e)}if(c)try{c.dispose(),console.log("[LOAD MONITOR] Terminal do script encerrado.")}catch(e){console.error("[LOAD MONITOR] Falha ao encerrar terminal:",e)}}0&&(module.exports={activate,deactivate});
