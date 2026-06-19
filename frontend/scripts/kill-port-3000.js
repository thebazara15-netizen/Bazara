const { execFile } = require("node:child_process");

if (process.platform !== "win32") {
  process.exit(0);
}

const command = [
  "$ErrorActionPreference = 'SilentlyContinue';",
  "$ids = Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique;",
  "foreach ($id in $ids) {",
  "  if ($id -and $id -ne $PID) { Stop-Process -Id $id -Force }",
  "}",
].join(" ");

execFile(
  "powershell.exe",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
  { windowsHide: true },
  () => process.exit(0)
);
