"use strict";var A=Object.create;var S=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var M=Object.getOwnPropertyNames;var C=Object.getPrototypeOf,y=Object.prototype.hasOwnProperty;var O=(e,s)=>{for(var n in s)S(e,n,{get:s[n],enumerable:!0})},L=(e,s,n,c)=>{if(s&&typeof s=="object"||typeof s=="function")for(let a of M(s))!y.call(e,a)&&a!==n&&S(e,a,{get:()=>s[a],enumerable:!(c=$(s,a))||c.enumerable});return e};var v=(e,s,n)=>(n=e!=null?A(C(e)):{},L(s||!e||!e.__esModule?S(n,"default",{value:e,enumerable:!0}):n,e)),P=e=>L(S({},"__esModule",{value:!0}),e);var k={};O(k,{activate:()=>x,deactivate:()=>R});module.exports=P(k);var t=v(require("vscode")),i=v(require("fs")),l=v(require("path")),g=v(require("os")),b=require("child_process"),p=null,F="",r,o={intervalSeconds:30,threshold:4,logFilePath:l.join(g.homedir(),"load_alerts.log"),showSidebar:!0};function x(e){I(),t.window.showInformationMessage("Load Monitor: iniciado."),o.showSidebar&&(r=t.window.createStatusBarItem(t.StatusBarAlignment.Right,100),r.text="Load: --",r.tooltip="Monitor de Load Average",r.show()),i.existsSync(o.logFilePath)||t.window.showWarningMessage(`Arquivo de log n\xE3o encontrado em: ${o.logFilePath}. Deseja gerar o script automaticamente para come\xE7ar a monitorar o sistema?`,"Gerar script","Cancelar").then(c=>{c==="Gerar script"&&w(o.logFilePath,o.threshold,o.intervalSeconds)});let s=()=>{if(!i.existsSync(o.logFilePath)){r&&(r.text="Load: arquivo n\xE3o encontrado");return}let d=i.readFileSync(o.logFilePath,"utf8").trim().split(`
`).reverse().find(E=>E.includes("[ALERTA]"));if(!d){r&&(r.text="Load: --",r.backgroundColor=void 0);return}let h=d.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/),u=h?h[0]:"",f=d.match(/Load average alto: (\d+(\.\d+)?)/),m=f?parseFloat(f[1]):0;r&&(r.text=`Load: ${m.toFixed(2)}`,r.backgroundColor=m>o.threshold?new t.ThemeColor("statusBarItem.errorBackground"):void 0),u!==F&&m>o.threshold&&(F=u,t.window.showErrorMessage(`ALERTA: Load average alto: ${m}`))},n=()=>{p&&clearInterval(p),p=setInterval(s,o.intervalSeconds*1e3),s()};n(),t.workspace.onDidChangeConfiguration(c=>{if(c.affectsConfiguration("loadMonitor")){let a={...o};I();let d=o.logFilePath!==a.logFilePath,h=o.threshold!==a.threshold,u=o.intervalSeconds!==a.intervalSeconds;o.showSidebar!==a.showSidebar&&(o.showSidebar&&!r?(r=t.window.createStatusBarItem(t.StatusBarAlignment.Right,100),r.tooltip="Monitor de Load Average",r.show()):!o.showSidebar&&r&&(r.dispose(),r=void 0)),(h||u||d)&&T(),n()}}),e.subscriptions.push({dispose:()=>p&&clearInterval(p)}),e.subscriptions.push({dispose:()=>r?.dispose()}),e.subscriptions.push(t.commands.registerCommand("load-monitor-alert.runSetup",()=>{w(o.logFilePath,o.threshold,o.intervalSeconds)})),e.subscriptions.push(t.commands.registerCommand("load-monitor-alert.forceCheck",()=>{t.window.showInformationMessage("For\xE7ando verifica\xE7\xE3o manual do log..."),s()})),e.subscriptions.push(t.commands.registerCommand("load-monitor-alert.cleanup",()=>{t.window.showWarningMessage("Deseja parar o monitoramento e excluir os arquivos gerados?","Sim","Cancelar").then(c=>{if(c==="Sim"){let a=l.join(g.homedir(),"load-monitor"),d=l.join(a,"monitor_load.sh"),h=l.join(a,"monitor_load.pid");if(i.existsSync(o.logFilePath)&&i.unlinkSync(o.logFilePath),i.existsSync(d)&&i.unlinkSync(d),i.existsSync(h)){let u=i.readFileSync(h,"utf8").trim();try{process.kill(Number(u),"SIGTERM")}catch(f){console.error("Erro ao encerrar processo:",f)}i.unlinkSync(h)}t.window.showInformationMessage("Arquivos removidos com sucesso.")}})}))}function w(e,s,n,c=!1){let a=l.join(g.homedir(),"load-monitor"),d=l.join(a,"monitor_load.sh"),h=l.join(a,"monitor_load.pid");i.existsSync(a)||i.mkdirSync(a,{recursive:!0});let u=`#!/bin/bash
THRESHOLD=${s}
INTERVAL=${n}
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

    if (( $(echo "$LOAD > $THRESHOLD" | bc -l) )); then
        echo "[ALERTA] $TIMESTAMP - Load average alto: $LOAD" >> "$LOGFILE"
    fi

    sleep $INTERVAL
done
`;i.writeFileSync(d,u,{mode:493});let f=()=>{let m=(0,b.spawn)("bash",[d],{detached:!0,stdio:"ignore"});i.writeFileSync(h,String(m.pid),"utf-8"),m.unref(),t.window.showInformationMessage("Script de monitoramento reiniciado.")};c?f():t.window.showInformationMessage(`Script gerado com sucesso em: ${d}. Deseja execut\xE1-lo agora em background?`,"Executar","Cancelar").then(m=>{m==="Executar"&&f()})}function R(){p&&clearInterval(p)}function I(){let e=t.workspace.getConfiguration("loadMonitor");o.intervalSeconds=e.get("intervalSeconds",30),o.threshold=e.get("threshold",4),o.logFilePath=e.get("logFilePath",l.join(g.homedir(),"load_alerts.log")),o.showSidebar=e.get("showSidebar",!0)}function T(){let e=l.join(g.homedir(),"load-monitor"),s=l.join(e,"monitor_load.pid");if(i.existsSync(s)){let n=i.readFileSync(s,"utf8").trim();try{process.kill(Number(n),"SIGTERM"),i.unlinkSync(s)}catch(c){console.error("[LOAD MONITOR] Erro ao encerrar processo antigo:",c)}}w(o.logFilePath,o.threshold,o.intervalSeconds,!0)}0&&(module.exports={activate,deactivate});
