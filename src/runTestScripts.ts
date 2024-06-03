import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Path to the directory containing scripts
const scriptsDir = path.join(__dirname, 'test');

// Function to execute a single script
const runScript = (scriptPath: string) => {
	return new Promise((resolve, reject) => {
		exec(`node ${scriptPath}`, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing ${scriptPath}:`, error);
				reject(error);
			} else {
				console.log(`Output from ${scriptPath}:\n${stdout}`);
				if (stderr) {
					console.error(`Errors from ${scriptPath}:\n${stderr}`);
				}
				resolve();
			}
		});
	});
};

// Read the directory and run each script
fs.readdir(scriptsDir, async (err, files) => {
	if (err) {
		console.error(`Error reading directory ${scriptsDir}:`, err);
		return;
	}

	// Filter out only .js files
	const scriptFiles = files.filter(file => file.endsWith('.js'));

	// Run each script file sequentially
	for (const file of scriptFiles) {
		const scriptPath = path.join(scriptsDir, file);
		try {
			await runScript(scriptPath);
		} catch (err) {
			console.error(`Failed to run script ${file}:`, err);
		}
	}
});

