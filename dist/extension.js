"use strict";var $=Object.create;var v=Object.defineProperty;var M=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var D=Object.getPrototypeOf,T=Object.prototype.hasOwnProperty;var C=(e,s)=>{for(var a in s)v(e,a,{get:s[a],enumerable:!0})},I=(e,s,a,d)=>{if(s&&typeof s=="object"||typeof s=="function")for(let r of O(s))!T.call(e,r)&&r!==a&&v(e,r,{get:()=>s[r],enumerable:!(d=M(s,r))||d.enumerable});return e};var L=(e,s,a)=>(a=e!=null?$(D(e)):{},I(s||!e||!e.__esModule?v(a,"default",{value:e,enumerable:!0}):a,e)),P=e=>I(v({},"__esModule",{value:!0}),e);var x={};C(x,{activate:()=>y,deactivate:()=>R});module.exports=P(x);var t=L(require("vscode")),i=L(require("fs")),l=L(require("path")),p=L(require("os")),E=require("child_process"),g=null,b="",n,o={intervalSeconds:30,threshold:4,logFilePath:l.join(p.homedir(),"load_alerts.log"),showSidebar:!0};function y(e){console.log("[LOAD MONITOR] Ativando extens\xE3o..."),A(),t.window.showInformationMessage("Load Monitor: iniciado."),n=t.window.createStatusBarItem(t.StatusBarAlignment.Right,100),n.text="Load: --",n.tooltip="Monitor de Load Average",o.showSidebar&&n.show(),i.existsSync(o.logFilePath)||t.window.showWarningMessage(`Arquivo de log n\xE3o encontrado em: ${o.logFilePath}. Deseja gerar o script automaticamente para come\xE7ar a monitorar o sistema?`,"Gerar script","Cancelar").then(d=>{d==="Gerar script"&&w(o.logFilePath,o.threshold,o.intervalSeconds)});let s=()=>{if(!i.existsSync(o.logFilePath)){o.showSidebar&&(n.text="Load: arquivo n\xE3o encontrado",n.backgroundColor=void 0);return}let r=i.readFileSync(o.logFilePath,"utf8").trim().split(`
`).reverse(),c=r.find(F=>F.includes("[ALERTA]")),h=c||r[0],m=c?.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/),u=m?m[0]:"",f=h.match(/LOAD=(\d+(\.\d+)?)/)||h.match(/Load average alto: (\d+(\.\d+)?)/),S=f?parseFloat(f[1]):0;o.showSidebar&&(n.text=`Load: ${isNaN(S)?"--":S.toFixed(2)}`),c&&u!==b&&S>o.threshold?(b=u,o.showSidebar&&(n.backgroundColor=new t.ThemeColor("statusBarItem.errorBackground")),t.window.showErrorMessage(`ALERTA: Load average alto: ${S}`)):o.showSidebar&&(n.backgroundColor=void 0)},a=()=>{g&&clearInterval(g),g=setInterval(s,o.intervalSeconds*1e3),s()};a(),t.workspace.onDidChangeConfiguration(d=>{if(d.affectsConfiguration("loadMonitor")){let r={...o};A();let c=o.logFilePath!==r.logFilePath,h=o.threshold!==r.threshold,m=o.intervalSeconds!==r.intervalSeconds;o.showSidebar!==r.showSidebar&&(o.showSidebar&&!n?(n=t.window.createStatusBarItem(t.StatusBarAlignment.Right,100),n.tooltip="Monitor de Load Average",n.show()):!o.showSidebar&&n&&n.hide()),(h||m||c)&&k(),a()}}),e.subscriptions.push({dispose:()=>g&&clearInterval(g)}),e.subscriptions.push({dispose:()=>n?.dispose()}),e.subscriptions.push(t.commands.registerCommand("load-monitor-alert.runSetup",()=>{w(o.logFilePath,o.threshold,o.intervalSeconds)})),e.subscriptions.push(t.commands.registerCommand("load-monitor-alert.forceCheck",()=>{t.window.showInformationMessage("For\xE7ando verifica\xE7\xE3o manual do log..."),s()})),e.subscriptions.push(t.commands.registerCommand("load-monitor-alert.cleanup",()=>{t.window.showWarningMessage("Deseja parar o monitoramento e excluir os arquivos gerados?","Sim","Cancelar").then(d=>{if(d==="Sim"){let r=l.join(p.homedir(),"load-monitor"),c=l.join(r,"monitor_load.sh"),h=l.join(r,"monitor_load.pid");if(i.existsSync(o.logFilePath)&&i.unlinkSync(o.logFilePath),i.existsSync(c)&&i.unlinkSync(c),i.existsSync(h)){let m=i.readFileSync(h,"utf8").trim();try{process.kill(Number(m),"SIGTERM")}catch(u){console.error("Erro ao encerrar processo:",u)}i.unlinkSync(h)}t.window.showInformationMessage("Arquivos removidos com sucesso.")}})}))}function R(){g&&clearInterval(g)}function A(){let e=t.workspace.getConfiguration("loadMonitor");o.intervalSeconds=e.get("intervalSeconds",30),o.threshold=e.get("threshold",4),o.logFilePath=e.get("logFilePath",l.join(p.homedir(),"load_alerts.log")),o.showSidebar=e.get("showSidebar",!0)}function w(e,s,a,d=!1){let r=l.join(p.homedir(),"load-monitor"),c=l.join(r,"monitor_load.sh"),h=l.join(r,"monitor_load.pid");i.existsSync(r)||i.mkdirSync(r,{recursive:!0});let m=`#!/bin/bash
THRESHOLD=${s}
INTERVAL=${a}
LOGFILE="${e}"
MAX_SIZE=51200

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
`;i.writeFileSync(c,m,{mode:493});let u=()=>{let f=(0,E.spawn)("bash",[c],{detached:!0,stdio:"ignore"});i.writeFileSync(h,String(f.pid),"utf-8"),f.unref(),t.window.showInformationMessage("Script de monitoramento reiniciado.")};d?u():t.window.showInformationMessage(`Script gerado com sucesso em: ${c}. Deseja execut\xE1-lo agora em background?`,"Executar","Cancelar").then(f=>{f==="Executar"&&u()})}function k(){let e=l.join(p.homedir(),"load-monitor"),s=l.join(e,"monitor_load.pid");if(i.existsSync(s)){let a=i.readFileSync(s,"utf8").trim();try{process.kill(Number(a),"SIGTERM"),i.unlinkSync(s),console.log(`[LOAD MONITOR] Processo antigo encerrado (PID: ${a}).`)}catch(d){console.error("[LOAD MONITOR] Erro ao encerrar processo antigo:",d)}}w(o.logFilePath,o.threshold,o.intervalSeconds,!0)}0&&(module.exports={activate,deactivate});
