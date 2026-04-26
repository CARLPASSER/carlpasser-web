$folder = Get-Location
$filter = "*.*"
$watcher = New-Object IO.FileSystemWatcher $folder, $filter -Property @{
    IncludeSubdirectories = $true
    NotifyFilter = [IO.NotifyFilters]'FileName, LastWrite'
}

$debounceTime = 3 # seconds
$lastChange = [DateTime]::MinValue
$changeDetected = $false

$action = {
    $path = $Event.SourceEventArgs.FullPath
    # Ignore git, node_modules, and self
    if ($path -match "\\.git\\" -or $path -match "\\node_modules\\" -or $path -match "watch\.ps1") {
        return
    }
    
    $global:lastChange = Get-Date
    $global:changeDetected = $true
    Write-Host "Change detected: $($Event.SourceEventArgs.Name)" -ForegroundColor Yellow
}

Register-ObjectEvent $watcher Changed -SourceIdentifier FileChanged -Action $action
Register-ObjectEvent $watcher Created -SourceIdentifier FileCreated -Action $action
Register-ObjectEvent $watcher Deleted -SourceIdentifier FileDeleted -Action $action
Register-ObjectEvent $watcher Renamed -SourceIdentifier FileRenamed -Action $action

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Netlify Auto-Deploy Watcher Started    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Watching folder: $folder"
Write-Host "Save any file to trigger deployment."
Write-Host "Press Ctrl+C to stop."

while ($true) {
    Start-Sleep -Seconds 1
    if ($global:changeDetected) {
        $span = (Get-Date) - $global:lastChange
        if ($span.TotalSeconds -ge $debounceTime) {
            Write-Host "Starting deployment..." -ForegroundColor Green
            $global:changeDetected = $false
            
            try {
                # Ensure correct path to netlify
                $env:Path = "C:\Users\oishi\AppData\Roaming\npm;" + "C:\Program Files\nodejs;" + $env:Path
                & "C:\Users\oishi\AppData\Roaming\npm\netlify.cmd" deploy --prod --dir .
                
                Write-Host "Deployment finished!" -ForegroundColor Cyan
                Write-Host "Waiting for next change..." -ForegroundColor Gray
            } catch {
                Write-Host "Error during deployment." -ForegroundColor Red
            }
        }
    }
}
