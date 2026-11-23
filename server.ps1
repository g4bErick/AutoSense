# AutoSense - Servidor web local simples (PowerShell)
# Uso: clique duas vezes em iniciar.bat  (ou: powershell -ExecutionPolicy Bypass -File server.ps1)
# Dica: o site tambem funciona abrindo index.html direto no navegador.

$port = 8080
$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = (Get-Location).Path }
$rootFull = [System.IO.Path]::GetFullPath($rootPath)

$mimes = @{
    ".html" = "text/html; charset=utf-8"; ".htm" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"; ".js" = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"; ".png" = "image/png"; ".jpg" = "image/jpeg"
    ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"; ".woff2" = "font/woff2"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "=========================================================="
    Write-Host " AutoSense OBD - Servidor iniciado em http://localhost:$port/" -ForegroundColor Green
    Write-Host " Pressione Ctrl + C para encerrar."
    Write-Host "=========================================================="
    Start-Process "http://localhost:$port/"

    while ($listener.IsListening) {
        # Espera assincrona: permite que Ctrl+C funcione
        $task = $listener.GetContextAsync()
        while (-not $task.AsyncWaitHandle.WaitOne(300)) { }
        $context = $task.GetAwaiter().GetResult()
        $response = $context.Response
        try {
            $path = [System.Uri]::UnescapeDataString($context.Request.Url.LocalPath)
            if ($path -eq "/" -or [string]::IsNullOrEmpty($path)) { $path = "/index.html" }
            $filePath = [System.IO.Path]::GetFullPath((Join-Path $rootFull $path.TrimStart('/').Replace('/', '\')))

            # Bloqueia acesso fora da pasta do site (../)
            if ($filePath.StartsWith($rootFull) -and (Test-Path $filePath -PathType Leaf)) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $response.ContentType = if ($mimes.ContainsKey($ext)) { $mimes[$ext] } else { "application/octet-stream" }
                $response.Headers.Add("Cache-Control", "no-cache")
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Arquivo nao encontrado")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        } catch {
            Write-Host "Erro na requisicao: $_" -ForegroundColor Yellow
        } finally {
            $response.Close()
        }
    }
}
catch { Write-Host "Servidor encerrado: $_" -ForegroundColor Red }
finally { $listener.Stop() }
