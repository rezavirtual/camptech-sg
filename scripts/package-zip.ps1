Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$ErrorActionPreference = 'Stop'
$rootDir = (Get-Item -Path $PSScriptRoot).Parent.FullName
$sourceDir = Join-Path $rootDir 'dist'
$zipPath = Join-Path $rootDir 'camptech-dist.zip'

if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem -Path $sourceDir -Recurse -File
foreach ($file in $files) {
    $relative = $file.FullName.Substring($sourceDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

$zip.Dispose()

Write-Host "Successfully created camptech-dist.zip with POSIX forward slashes"
