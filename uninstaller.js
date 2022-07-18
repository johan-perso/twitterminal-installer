// Importer quelques libs
const fs = require('fs')
const path = require('path')
const os = require('os')
const lookpath = require('lookpath')
const childProcess = require('child_process')

// Si on est pas sous Windows
if(os.platform() != 'win32'){
	console.log("!! Cet installateur ne fonctionne que sur Windows !!")
	console.log("https://github.com/johan-perso/twitterminal pour installer sur d'autres plateformes")
	process.exit()
}

// Fonction pour vérifier si NPM est installé ou non
async function checkNPM(){
	if(await lookpath.lookpath('npm')) rest(true)
	else rest(false)
}; checkNPM()

// Fonction pour bah faire le reste
async function rest(npmExist=false){
	// Obtenir le chemin de Twitterminal
	var twitterminalPath = fs.readdirSync(path.join(process.env.APPDATA, '..', 'Local', 'Programs'))
	.filter(file => file.startsWith('johan-perso-twitterminal'))
	.map(file => path.join(process.env.APPDATA, '..', 'Local', 'Programs', file))[0]

	// Si Twitterminal est présent
	if(twitterminalPath){
		// Afficher une info
		console.log(`Suppression du dossier : ${twitterminalPath}`)

		// Supprimer l'ancien dossier
		fs.rmSync(twitterminalPath, { recursive: true, force: true });
	}

	// Si Twitterminal est encore installé
	if(npmExist && await lookpath.lookpath('twitterminal')){
		// Désinstaller avec npm
		try {
			childProcess.execSync(`npm uninstall twitterminal --location=global`)
			childProcess.execSync(`npm unlink twitterminal --force`)
		} catch(e){}

		// Afficher une info
		console.log("Suppression des commandes Twitterminal terminée")
	}

	// Supprimer le lien vers le désinstallateur du registre
	console.log("\nSuppression du lien du désinstallateur...")
	fs.writeFileSync(path.join(os.tmpdir(), 'removeUninstaller.cmd'), `@echo off\n:init\n	setlocal DisableDelayedExpansion\n	set cmdInvoke=1\n	set winSysFolder=System32\n	set "batchPath=%~dpnx0"\n	for %%k in (%0) do set batchName=%%~nk\n	set "vbsGetPrivileges=%temp%\\OEgetPriv_%batchName%.vbs"\n	setlocal EnableDelayedExpansion\n:checkPrivileges\n	net file 1>NUL 2>NUL\n	if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )\n:getPrivileges\n	if '%1'=='ELEV' (echo ELEV & shift /1 & goto gotPrivileges)\n	echo Set UAC = CreateObject^("Shell.Application"^) > "%vbsGetPrivileges%"\n	echo args = "ELEV " >> "%vbsGetPrivileges%"\n	echo For Each strArg in WScript.Arguments >> "%vbsGetPrivileges%"\n	echo args = args ^& strArg ^& " "  >> "%vbsGetPrivileges%"\n	echo Next >> "%vbsGetPrivileges%"\n	if '%cmdInvoke%'=='1' goto InvokeCmd \n	echo UAC.ShellExecute "!batchPath!", args, "", "runas", 1 >> "%vbsGetPrivileges%"\n	goto ExecElevation\n:InvokeCmd\n	echo args = "/c """ + "!batchPath!" + """ " + args >> "%vbsGetPrivileges%"\n	echo UAC.ShellExecute "%SystemRoot%\\%winSysFolder%\\cmd.exe", args, "", "runas", 1 >> "%vbsGetPrivileges%"\n:ExecElevation\n	"%SystemRoot%\\%winSysFolder%\\WScript.exe" "%vbsGetPrivileges%" %*\n	exit /B\n:gotPrivileges\n	setlocal & cd /d %~dp0\n	if '%1'=='ELEV' (del "%vbsGetPrivileges%" 1>nul 2>nul  &  shift /1)\n	reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Johanstickman.Twitterminal" /f\n	exit`.replace(/\\n/g, '\n')) 
	childProcess.execSync(`cmd /C ${path.join(os.tmpdir(), 'removeUninstaller.cmd')}`)
	console.log("Suppression du lien terminée\n")

	// Afficher une info
	console.log("\nDésinstallation terminée ! Un redémarrage peut être nécessaire.")
}