"use strict";var S=Object.create;var f=Object.defineProperty;var N=Object.getOwnPropertyDescriptor;var w=Object.getOwnPropertyNames;var F=Object.getPrototypeOf,C=Object.prototype.hasOwnProperty;var b=(o,e)=>{for(var a in e)f(o,a,{get:e[a],enumerable:!0})},v=(o,e,a,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of w(e))!C.call(o,s)&&s!==a&&f(o,s,{get:()=>e[s],enumerable:!(t=N(e,s))||t.enumerable});return o};var u=(o,e,a)=>(a=o!=null?S(F(o)):{},v(e||!o||!o.__esModule?f(a,"default",{value:o,enumerable:!0}):a,o)),x=o=>v(f({},"__esModule",{value:!0}),o);var H={};b(H,{activate:()=>y,deactivate:()=>G});module.exports=x(H);var r=u(require("vscode")),n=u(require("fs")),m=u(require("path")),A=u(require("os")),O=null,c=null,M="",d=30,l=4;function y(o){console.log("[LOAD MONITOR] Ativando extens\xE3o...");let e=r.workspace.getConfiguration("loadMonitor");function a(){d=e.get("intervalSeconds",30),l=e.get("threshold",4),console.log(`[LOAD MONITOR] Config atualizada: intervalSeconds=${d}, threshold=${l}`)}a();let t=e.get("logFilePath",m.join(A.homedir(),"load_alerts.log"));console.log(`[LOAD MONITOR] Usando logFilePath: ${t}`),r.window.showInformationMessage("Load Monitor: iniciado."),n.existsSync(t)||r.window.showWarningMessage(`Arquivo de log n\xE3o encontrado em: ${t}. Deseja gerar o script automaticamente para come\xE7ar a monitorar o sistema?`,"Gerar script","Cancelar").then(i=>{i==="Gerar script"&&E(t,l,d)});function s(){try{if(console.log("[LOAD MONITOR] Verificando log..."),!n.existsSync(t)){console.log("[LOAD MONITOR] Arquivo de log n\xE3o encontrado. Abortando verifica\xE7\xE3o.");return}let h=[...n.readFileSync(t,"utf8").trim().split(`
`)].reverse().find(R=>R.includes("[ALERTA]"));if(!h){console.log("[LOAD MONITOR] Nenhuma linha com ALERTA encontrada.");return}console.log(`[LOAD MONITOR] \xDAltima linha com ALERTA: ${h}`);let T=h.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/),L=T?T[0]:"";console.log(`[LOAD MONITOR] Timestamp extra\xEDdo: ${L}`),console.log(`[LOAD MONITOR] \xDAltimo alerta salvo: ${M}`);let $=h.match(/Load average alto: (\d+(\.\d+)?)/),I=$?parseFloat($[1]):0;console.log(`[LOAD MONITOR] Load extra\xEDdo: ${I} | Threshold configurado: ${l}`),L&&L!==M&&I>l?(M=L,r.window.showErrorMessage(`ALERTA: Load average alto: ${I}`),console.log("[LOAD MONITOR] Alerta exibido para o usu\xE1rio.")):console.log("[LOAD MONITOR] Nenhum novo alerta a ser exibido.")}catch(i){console.error("[LOAD MONITOR] Erro ao verificar log:",i)}}function g(){c&&clearInterval(c),c=setInterval(s,d*1e3)}g(),r.workspace.onDidChangeConfiguration(i=>{(i.affectsConfiguration("loadMonitor.intervalSeconds")||i.affectsConfiguration("loadMonitor.threshold"))&&(a(),g())}),o.subscriptions.push({dispose:()=>{c&&clearInterval(c)}});let p=r.commands.registerCommand("load-monitor-alert.runSetup",()=>{E(t,l,d)});o.subscriptions.push(p);let D=r.commands.registerCommand("load-monitor-alert.forceCheck",()=>{r.window.showInformationMessage("For\xE7ando verifica\xE7\xE3o manual do log..."),s()});o.subscriptions.push(D)}function E(o,e,a){let t=m.join(A.homedir(),"load-monitor"),s=m.join(t,"monitor_load.sh");n.existsSync(t)||n.mkdirSync(t,{recursive:!0});let g=`#!/bin/bash

THRESHOLD=${e}
INTERVAL=${a}
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
`;n.writeFileSync(s,g,{mode:493}),r.window.showInformationMessage(`Script gerado com sucesso em: ${s}. Deseja execut\xE1-lo agora?`,"Executar","N\xE3o").then(p=>{p==="Executar"&&(O=r.window.createTerminal("Load Monitor Script"),O.sendText(`bash "${s}"`),O.show())})}function G(){c&&clearInterval(c);let o=m.join(A.homedir(),"load_alerts.log");if(n.existsSync(o))try{n.unlinkSync(o),console.log("[LOAD MONITOR] Arquivo de log removido.")}catch(e){console.error("[LOAD MONITOR] Falha ao remover o log:",e)}if(O)try{O.dispose(),console.log("[LOAD MONITOR] Terminal do script encerrado.")}catch(e){console.error("[LOAD MONITOR] Falha ao encerrar terminal:",e)}}0&&(module.exports={activate,deactivate});
