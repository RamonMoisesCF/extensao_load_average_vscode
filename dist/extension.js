"use strict";var $=Object.create;var S=Object.defineProperty;var M=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var T=Object.getPrototypeOf,D=Object.prototype.hasOwnProperty;var C=(e,i)=>{for(var a in i)S(e,a,{get:i[a],enumerable:!0})},E=(e,i,a,d)=>{if(i&&typeof i=="object"||typeof i=="function")for(let r of O(i))!D.call(e,r)&&r!==a&&S(e,r,{get:()=>i[r],enumerable:!(d=M(i,r))||d.enumerable});return e};var L=(e,i,a)=>(a=e!=null?$(T(e)):{},E(i||!e||!e.__esModule?S(a,"default",{value:e,enumerable:!0}):a,e)),P=e=>E(S({},"__esModule",{value:!0}),e);var j={};C(j,{activate:()=>R,deactivate:()=>k});module.exports=P(j);var s=L(require("vscode")),t=L(require("fs")),c=L(require("path")),p=L(require("os")),A=require("child_process"),g=null,y="",n,v=!1,o={intervalSeconds:30,threshold:4,logFilePath:c.join(p.homedir(),"load_alerts.log"),showSidebar:!0};function R(e){console.log("[LOAD MONITOR] Ativando extens\xE3o..."),I(),s.window.showInformationMessage("Load Monitor: iniciado."),n=s.window.createStatusBarItem(s.StatusBarAlignment.Right,100),n.text="$(dashboard) Load: --",n.tooltip="Monitor de Load Average",o.showSidebar&&n.show(),e.subscriptions.push(n),t.existsSync(o.logFilePath)||s.window.showWarningMessage(`Arquivo de log n\xE3o encontrado em: ${o.logFilePath}. Deseja gerar o script automaticamente para come\xE7ar a monitorar o sistema?`,"Gerar script","Cancelar").then(d=>{d==="Gerar script"&&b(o.logFilePath,o.threshold,o.intervalSeconds)});let i=()=>{if(!t.existsSync(o.logFilePath)){o.showSidebar&&(n.text="$(dashboard) Load: arquivo n\xE3o encontrado",n.backgroundColor=void 0);return}let r=t.readFileSync(o.logFilePath,"utf8").trim().split(`
`).reverse(),l=r.find(F=>F.includes("[ALERTA]")),h=r[0],m=l?.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/),u=m?m[0]:"",f=h.match(/LOAD=(\d+(\.\d+)?)/)||h.match(/Load average alto: (\d+(\.\d+)?)/),w=f?parseFloat(f[1]):0;o.showSidebar&&(n.text=`$(dashboard) Load: ${isNaN(w)?"--":w.toFixed(2)}`,n.tooltip=v?"ALERTA: Load average acima do limite":"Monitor de Load Average"),w>o.threshold?v||(v=!0,y=u,o.showSidebar&&(n.backgroundColor=new s.ThemeColor("statusBarItem.errorBackground")),s.window.showErrorMessage("ALERTA: Load average alto")):(v=!1,o.showSidebar&&(n.backgroundColor=void 0))},a=()=>{g&&clearInterval(g),g=setInterval(i,o.intervalSeconds*1e3),i()};a(),s.workspace.onDidChangeConfiguration(d=>{if(d.affectsConfiguration("loadMonitor")){let r={...o};I();let l=o.logFilePath!==r.logFilePath,h=o.threshold!==r.threshold,m=o.intervalSeconds!==r.intervalSeconds;o.showSidebar!==r.showSidebar&&(o.showSidebar?n.show():(n.hide(),n.backgroundColor=void 0)),(h||m||l)&&x(),a()}}),e.subscriptions.push({dispose:()=>g&&clearInterval(g)}),e.subscriptions.push(s.commands.registerCommand("load-monitor-alert.runSetup",()=>{b(o.logFilePath,o.threshold,o.intervalSeconds)})),e.subscriptions.push(s.commands.registerCommand("load-monitor-alert.forceCheck",()=>{s.window.showInformationMessage("For\xE7ando verifica\xE7\xE3o manual do log..."),i()})),e.subscriptions.push(s.commands.registerCommand("load-monitor-alert.cleanup",()=>{s.window.showWarningMessage("Deseja parar o monitoramento e excluir os arquivos gerados?","Sim","Cancelar").then(d=>{if(d==="Sim"){let r=c.join(p.homedir(),"load-monitor"),l=c.join(r,"monitor_load.sh"),h=c.join(r,"monitor_load.pid");if(t.existsSync(o.logFilePath)&&t.unlinkSync(o.logFilePath),t.existsSync(l)&&t.unlinkSync(l),t.existsSync(h)){let m=t.readFileSync(h,"utf8").trim();try{process.kill(Number(m),"SIGTERM")}catch(u){console.error("Erro ao encerrar processo:",u)}t.unlinkSync(h)}s.window.showInformationMessage("Arquivos removidos com sucesso.")}})}))}function k(){g&&clearInterval(g)}function I(){let e=s.workspace.getConfiguration("loadMonitor");o.intervalSeconds=e.get("intervalSeconds",30),o.threshold=e.get("threshold",4),o.logFilePath=e.get("logFilePath",c.join(p.homedir(),"load_alerts.log")),o.showSidebar=e.get("showSidebar",!0)}function b(e,i,a,d=!1){let r=c.join(p.homedir(),"load-monitor"),l=c.join(r,"monitor_load.sh"),h=c.join(r,"monitor_load.pid");t.existsSync(r)||t.mkdirSync(r,{recursive:!0});let m=`#!/bin/bash
THRESHOLD=${i}
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
`;t.writeFileSync(l,m,{mode:493});let u=()=>{let f=(0,A.spawn)("bash",[l],{detached:!0,stdio:"ignore"});t.writeFileSync(h,String(f.pid),"utf-8"),f.unref(),s.window.showInformationMessage("Script de monitoramento reiniciado.")};d?u():s.window.showInformationMessage(`Script gerado com sucesso em: ${l}. Deseja execut\xE1-lo agora em background?`,"Executar","Cancelar").then(f=>{f==="Executar"&&u()})}function x(){let e=c.join(p.homedir(),"load-monitor"),i=c.join(e,"monitor_load.pid");if(t.existsSync(i)){let a=t.readFileSync(i,"utf8").trim();try{process.kill(Number(a),"SIGTERM"),t.unlinkSync(i),console.log(`[LOAD MONITOR] Processo antigo encerrado (PID: ${a}).`)}catch(d){console.error("[LOAD MONITOR] Erro ao encerrar processo antigo:",d)}}b(o.logFilePath,o.threshold,o.intervalSeconds,!0)}0&&(module.exports={activate,deactivate});
