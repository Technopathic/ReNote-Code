//import { app, BrowserWindow } from 'electron';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

function createWindow () {
	const win = new BrowserWindow({
		width: 1000,
		height: 600,
		resizable: true,
		icon:__dirname +'/icon.png'
	});

	return win;
}

var mainWindow;

app.on('ready', function () {
    var mainWindow = createWindow();
    mainWindow.setMenu(null);
    mainWindow.loadURL('file://' + __dirname + '/app.html');
});

app.on('window-all-closed', function () {
    app.quit();
});
