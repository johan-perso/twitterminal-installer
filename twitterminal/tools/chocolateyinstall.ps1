
# Vérifier si la commande "node" est présente
if (Get-Command "node" -errorAction SilentlyContinue)
{} else {
	Write-Host "!! Node.js n'est pas installé, utiliser la commande suivante pour l'installer !!"
	Write-Host "!!    choco install nodejs                                                    !!"
	exit 1
}

$ErrorActionPreference = 'Stop';
$toolsDir   = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$url        = 'https://github.com/johan-perso/twitterminal-installer/releases/download/6.0.0/installer-6.0.0.exe'

$packageArgs = @{
  packageName   = $env:ChocolateyPackageName
  unzipLocation = $toolsDir
  fileType      = 'exe'
  url           = $url
  url64bit      = $url64

  softwareName  = 'twitterminal*'

  checksum      = ''
  checksumType  = 'sha256'
  checksum64    = ''
  checksumType64= 'sha256'

  silentArgs    = "/qn /norestart /l*v `"$($env:TEMP)\$($packageName).$($env:chocolateyPackageVersion).MsiInstall.log`""
  validExitCodes= @(0, 3010, 1641)
}

Install-ChocolateyPackage @packageArgs

















