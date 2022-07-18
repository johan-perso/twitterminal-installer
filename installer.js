// Importer quelques libs
const fs = require('fs')
const path = require('path')
const os = require('os')
const lookpath = require('lookpath')
const fetch = require('node-fetch')
const childProcess = require('child_process')
const Downloader = require('nodejs-file-downloader')

// Variables
var uninstallerLink="https://github.com/johan-perso/twitterminal-installer/releases/download/6.0.0/uninstaller-6.0.0.exe"

// Si on est pas sous Windows
if(os.platform() != 'win32'){
	console.log("!! Cet installateur ne fonctionne que sur Windows !!")
	console.log("https://github.com/johan-perso/twitterminal pour installer sur d'autres plateformes")
	process.exit()
}

// Fonction pour vérifier que toute les commandes soit d'abord installé
async function checkCommands(){
	// Vérifier si les commandes existe
	var nodeExist = await lookpath.lookpath('node')
	var npmExist = await lookpath.lookpath('npm')

	// Effectuer des actions
	if(!nodeExist?.length) return console.log("NodeJS n'est pas installé, veuillez l'installer manuellement.")
	if(!npmExist?.length) return console.log("NPM n'est pas installé, veuillez l'installer manuellement.")

	// Si tout est ok, télécharger les fichiers requis pour Twitterminal
	installTwitterminal()
}; checkCommands()

// Fonction pour bah faire le reste
async function installTwitterminal(){
	// Si le dossier Programs n'existe pas dans AppData/Local
	if(!fs.existsSync(path.join(process.env.APPDATA, '..', 'Local', 'Programs'))) fs.mkdirSync(path.join(process.env.APPDATA, '..', 'Local', 'Programs'))

	// Vérifier si Twitterminal n'est pas déjà installé
	var oldTwitterminal = fs.readdirSync(path.join(process.env.APPDATA, '..', 'Local', 'Programs'))
	.filter(file => file.startsWith('johan-perso-twitterminal'))
	.map(file => path.join(process.env.APPDATA, '..', 'Local', 'Programs', file))[0]

	// Si Twitterminal est déjà installé
	if(oldTwitterminal){
		// Afficher une info
		console.log("(1) Twitterminal est déjà installé, suppression de l'ancienne version...")

		// Supprimer l'ancien dossier
		fs.rmSync(oldTwitterminal, { recursive: true, force: true });

		// Afficher une info
		console.log("Suppression de la précédente version effectué\n")
	}

	// Si Twitterminal est encore installé
	if(await lookpath.lookpath('twitterminal')){
		// Afficher une info
		console.log("(2) Twitterminal est déjà installé, suppression de l'ancienne version...")

		// Désinstaller avec npm
		try {
			childProcess.execSync(`npm uninstall twitterminal --location=global`)
			childProcess.execSync(`npm unlink twitterminal --force`)
		} catch(e){}

		// Afficher une info
		console.log("Suppression de la précédente version effectué\n")
	}

	// Afficher une info
	console.log("Obtention du lien de téléchargement de la dernière version disponible")

	// Utiliser l'API de GitHub pour obtenir la liste des versions du repo
	var data = await fetch('https://api.github.com/repos/johan-perso/twitterminal/releases/latest', { headers: { 'User-Agent': 'Twitterminal-Installer' } })
	.then(res => res.json())

	// Afficher une info
	console.log(`Version ${data.tag_name} disponible. Date de création : ${new Date(data.published_at).toLocaleString()}`)
	console.log("\nTéléchargement en cours...")

	// Télécharger dans le dossier temporaire
	await new Downloader({
		directory: path.join(os.tmpdir()),
		url: data.tarball_url,
		filename: 'twitterminal.tar.gz',
		headers: { 'User-Agent': 'Twitterminal-Installer' }
	}).download()

	// Afficher une info
	console.log("Téléchargement terminé")

	// Extraire l'archive
	console.log("\nExtraction de l'archive...")
	childProcess.execSync(`tar -xf ${path.join(os.tmpdir(), 'twitterminal.tar.gz')} -C ${path.join(process.env.APPDATA, '..', 'Local', 'Programs')}`)
	console.log("Extraction terminée")

	// Afficher une info
	console.log("\nInstallation des dépendances liés à Twitterminal...")

	// Obtenir le chemin utilisé par l'extraction
	var pathToTwitterminal = fs.readdirSync(path.join(process.env.APPDATA, '..', 'Local', 'Programs'))
	.filter(file => file.startsWith('johan-perso-twitterminal'))
	.map(file => path.join(process.env.APPDATA, '..', 'Local', 'Programs', file))[0]

	// Si aucun chemin
	if(!pathToTwitterminal?.length) return console.log("Erreur lors de l'extraction de l'archive : chemin final introuvable")

	// Installer les dépendances
	childProcess.execSync(`npm install`, { cwd: pathToTwitterminal })
	childProcess.execSync(`npm link --force`, { cwd: pathToTwitterminal })

	// Afficher une info
	console.log("Installation des dépendances terminée")

	// Ajouter une indication
	console.log("\nAjout d'une indication")
	fs.writeFileSync(path.join(pathToTwitterminal, '.installed_with_installer'), '')
	console.log("Indication ajouté")

	// Télécharger le désinstallateur
	console.log("\nTéléchargement du désinstallateur...")
	await new Downloader({
		directory: pathToTwitterminal,
		url: uninstallerLink,
		filename: 'uninstaller.exe',
		headers: { 'User-Agent': 'Twitterminal-Installer' }
	}).download()
	console.log("Téléchargement terminé")

	// Modifier les règles d'exécution powershell
	// (et on en profite pour ajouter le lien vers le désinstallateur)
	console.log("\nModification des règles d'exécution powershell...")
	fs.writeFileSync(path.join(os.tmpdir(), 'allowExecution.cmd'), `@echo off\n:init\n	setlocal DisableDelayedExpansion\n	set cmdInvoke=1\n	set winSysFolder=System32\n	set "batchPath=%~dpnx0"\n	for %%k in (%0) do set batchName=%%~nk\n	set "vbsGetPrivileges=%temp%\\OEgetPriv_%batchName%.vbs"\n	setlocal EnableDelayedExpansion\n:checkPrivileges\n	net file 1>NUL 2>NUL\n	if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )\n:getPrivileges\n	if '%1'=='ELEV' (echo ELEV & shift /1 & goto gotPrivileges)\n	echo Set UAC = CreateObject^("Shell.Application"^) > "%vbsGetPrivileges%"\n	echo args = "ELEV " >> "%vbsGetPrivileges%"\n	echo For Each strArg in WScript.Arguments >> "%vbsGetPrivileges%"\n	echo args = args ^& strArg ^& " "  >> "%vbsGetPrivileges%"\n	echo Next >> "%vbsGetPrivileges%"\n	if '%cmdInvoke%'=='1' goto InvokeCmd \n	echo UAC.ShellExecute "!batchPath!", args, "", "runas", 1 >> "%vbsGetPrivileges%"\n	goto ExecElevation\n:InvokeCmd\n	echo args = "/c """ + "!batchPath!" + """ " + args >> "%vbsGetPrivileges%"\n	echo UAC.ShellExecute "%SystemRoot%\\%winSysFolder%\\cmd.exe", args, "", "runas", 1 >> "%vbsGetPrivileges%"\n:ExecElevation\n	"%SystemRoot%\\%winSysFolder%\\WScript.exe" "%vbsGetPrivileges%" %*\n	exit /B\n:gotPrivileges\n	setlocal & cd /d %~dp0\n	if '%1'=='ELEV' (del "%vbsGetPrivileges%" 1>nul 2>nul  &  shift /1)\n	powershell -Command "Set-ExecutionPolicy RemoteSigned"\n	reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Johanstickman.Twitterminal"\n	reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Johanstickman.Twitterminal" /v "DisplayName" /t REG_SZ /d TwitterminalCLI\n	reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Johanstickman.Twitterminal" /v "DisplayVersion" /t REG_SZ /d ${data.tag_name || 'Inconnu'}\n	reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Johanstickman.Twitterminal" /v "HelpLink" /t REG_SZ /d https://twitterminal.johanstickman.com\n	reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Johanstickman.Twitterminal" /v "UninstallString" /t REG_SZ /d "${path.join(pathToTwitterminal, 'uninstaller.exe')}"\n	exit`.replace(/\\n/g, '\n')) 
	childProcess.execSync(`cmd /C ${path.join(os.tmpdir(), 'allowExecution.cmd')}`)
	console.log("Modification des règles d'exécution powershell terminée\n")

	// Afficher une info
	console.log("\nInstallation terminée. Twitterminal pourra être démarra avec la commande `twitterminal`, un redémarrage peut être nécessaire.")
}
