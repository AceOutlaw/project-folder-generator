// ================================
// Script Generator for Project Folders
// ================================

class ScriptGenerator {
    constructor() {
        this.scriptConfig = CONFIG.local.script;
    }

    // ================================
    // Windows Batch Script Generation
    // ================================

    generateWindowsBatchScript(projectName, folders, customReadme = '') {
        const timestamp = new Date().toLocaleString();
        const header = `@echo off
REM ================================
REM Project Folder Generator Script
REM Generated: ${timestamp}
REM Project: ${projectName}
REM ================================
REM
REM INSTRUCTIONS:
REM 1. Navigate to your desired project location
REM 2. Double-click this .bat file to run it
REM 3. If Windows blocks it, right-click and "Run as administrator"
REM 4. The project folder will be created in this location
REM
REM ================================

echo Creating project folder structure for: ${projectName}
echo.

REM Create main project directory
if not exist "${projectName}" (
    mkdir "${projectName}"
    echo Created main folder: ${projectName}
) else (
    echo Main folder already exists: ${projectName}
)

cd "${projectName}"

`;

        let folderCommands = '';
        folders.forEach(folder => {
            folderCommands += `REM Create ${folder} folder
if not exist "${folder}" (
    mkdir "${folder}"
    echo Created: ${folder}
) else (
    echo Already exists: ${folder}
)

`;
        });

        let readmeCommand = '';
        if (customReadme) {
            const escapedReadme = customReadme.replace(/"/g, '""').replace(/\n/g, '\\n');
            readmeCommand = `REM Create README file
echo Creating README.md...
echo ${escapedReadme} > README.md
echo Created: README.md

`;
        } else {
            readmeCommand = `REM Create default README file
echo Creating README.md...
echo # ${projectName} > README.md
echo. >> README.md
echo Project created: ${timestamp} >> README.md
echo. >> README.md
echo ## Folder Structure >> README.md
`;
            folders.forEach(folder => {
                readmeCommand += `echo - ${folder} >> README.md\n`;
            });
            readmeCommand += `echo Created: README.md

`;
        }

        const footer = `cd ..
echo.
echo ================================
echo Project folder structure created successfully!
echo Location: %CD%\\${projectName}
echo ================================
echo.
pause`;

        return header + folderCommands + readmeCommand + footer;
    }

    // ================================
    // Mac AppleScript Generation (GUI)
    // ================================

    generateMacAppleScript(projectName, folders, customReadme = '') {
        const timestamp = new Date().toLocaleString();
        const folderCommands = folders.map(folder => `do shell script "mkdir -p " & quoted form of (projectPath & "/${folder}")`).join('\n\t');
        
        let readmeContent = '';
        if (customReadme) {
            const escapedReadme = customReadme.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
            readmeContent = `"${escapedReadme}"`;
        } else {
            readmeContent = `"# ${projectName}\\n\\nProject created: ${timestamp}\\n\\n## Folder Structure\\n${folders.map(f => `- ${f}`).join('\\n')}"`;
        }

        const script = `-- ================================
-- Project Folder Generator Script
-- Generated: ${timestamp}
-- Project: ${projectName}
-- ================================
--
-- INSTRUCTIONS:
-- 1. Double-click this file to run it
-- 2. Choose where to create your project folder
-- 3. The script will create all folders automatically
--
-- ================================

-- Ask user where to create the project
set projectLocation to choose folder with prompt "Choose where to create your project folder:"
set projectPath to (POSIX path of projectLocation) & "${projectName}"

-- Show progress
display dialog "Creating project folder structure for: ${projectName}" buttons {"OK"} default button "OK" with icon note

try
\t-- Create main project directory
\tdo shell script "mkdir -p " & quoted form of projectPath
\t
\t-- Create subfolders
\t${folderCommands}
\t
\t-- Create README file
\tset readmeContent to ${readmeContent}
\tset readmeFile to projectPath & "/README.md"
\tdo shell script "echo " & quoted form of readmeContent & " > " & quoted form of readmeFile
\t
\t-- Success message
\tdisplay dialog "✅ Project folder created successfully!\\n\\nLocation: " & projectPath buttons {"Open Folder", "Done"} default button "Open Folder" with icon note
\t
\t-- If user clicks "Open Folder", open it in Finder
\tif button returned of result is "Open Folder" then
\t\ttell application "Finder"
\t\t\topen folder (projectPath as POSIX file)
\t\t\tactivate
\t\tend tell
\tend if
\t
on error errorMessage
\tdisplay dialog "❌ Error creating project folder:\\n\\n" & errorMessage buttons {"OK"} default button "OK" with icon stop
end try`;

        return script;
    }

    // ================================
    // Mac/Linux Shell Script Generation (Traditional)
    // ================================

    generateMacShellScript(projectName, folders, customReadme = '') {
        const timestamp = new Date().toLocaleString();
        const header = `#!/bin/bash
# ================================
# Project Folder Generator Script
# Generated: ${timestamp}
# Project: ${projectName}
# ================================
#
# INSTRUCTIONS:
# 1. Open Terminal
# 2. Navigate to this file's location: cd /path/to/downloads
# 3. Make executable: chmod +x ${projectName}-project.sh
# 4. Run script: ./${projectName}-project.sh
#
# ================================

echo "Creating project folder structure for: ${projectName}"
echo

# Create main project directory
if [ ! -d "${projectName}" ]; then
    mkdir "${projectName}"
    echo "Created main folder: ${projectName}"
else
    echo "Main folder already exists: ${projectName}"
fi

cd "${projectName}"

`;

        let folderCommands = '';
        folders.forEach(folder => {
            folderCommands += `# Create ${folder} folder
if [ ! -d "${folder}" ]; then
    mkdir "${folder}"
    echo "Created: ${folder}"
else
    echo "Already exists: ${folder}"
fi

`;
        });

        let readmeCommand = '';
        if (customReadme) {
            const escapedReadme = customReadme.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            readmeCommand = `# Create README file
echo "Creating README.md..."
echo "${escapedReadme}" > README.md
echo "Created: README.md"

`;
        } else {
            readmeCommand = `# Create default README file
echo "Creating README.md..."
cat > README.md << EOF
# ${projectName}

Project created: ${timestamp}

## Folder Structure
`;
            folders.forEach(folder => {
                readmeCommand += `- ${folder}\n`;
            });
            readmeCommand += `EOF
echo "Created: README.md"

`;
        }

        const footer = `cd ..
echo
echo "================================"
echo "Project folder structure created successfully!"
echo "Location: $(pwd)/${projectName}"
echo "================================"
echo

# Make script exit gracefully
read -p "Press Enter to continue..."`;

        return header + folderCommands + readmeCommand + footer;
    }

    // ================================
    // Download Script File
    // ================================

    downloadScript(scriptContent, filename) {
        try {
            const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            window.URL.revokeObjectURL(url);
            
            CONFIG.utils.log('info', `Script downloaded: ${filename}`);
            return true;
            
        } catch (error) {
            CONFIG.utils.log('error', 'Script download failed', error);
            throw new Error(`Failed to download script: ${error.message}`);
        }
    }

    // ================================
    // Public API
    // ================================

    createWindowsScript(projectName, folders, customReadme = '') {
        const scriptContent = this.generateWindowsBatchScript(projectName, folders, customReadme);
        const filename = `create-${projectName}-project.bat`;
        this.downloadScript(scriptContent, filename);
        return filename;
    }

    createMacScript(projectName, folders, customReadme = '') {
        const scriptContent = this.generateMacAppleScript(projectName, folders, customReadme);
        const filename = `create-${projectName}-project.scpt`;
        this.downloadScript(scriptContent, filename);
        return filename;
    }

    createMacShellScript(projectName, folders, customReadme = '') {
        const scriptContent = this.generateMacShellScript(projectName, folders, customReadme);
        const filename = `create-${projectName}-project.sh`;
        this.downloadScript(scriptContent, filename);
        return filename;
    }

    // Auto-detect platform and create appropriate script
    createScript(projectName, folders, customReadme = '') {
        const userAgent = navigator.userAgent.toLowerCase();
        const isWindows = userAgent.includes('windows');
        const isMac = userAgent.includes('mac');
        
        if (isWindows) {
            return this.createWindowsScript(projectName, folders, customReadme);
        } else if (isMac) {
            return this.createMacScript(projectName, folders, customReadme);
        } else {
            // Default to shell script for Linux/other Unix systems
            return this.createMacScript(projectName, folders, customReadme);
        }
    }

    // Get platform-specific instructions
    getPlatformInstructions() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isWindows = userAgent.includes('windows');
        
        if (isWindows) {
            return {
                platform: 'Windows',
                fileType: '.bat',
                instructions: [
                    '1. Download the .bat file',
                    '2. Navigate to your desired project location',
                    '3. Double-click the .bat file to run it',
                    '4. The project folders will be created in the same directory'
                ]
            };
        } else {
            return {
                platform: 'Mac/Linux',
                fileType: '.scpt',
                instructions: [
                    '1. Download the .scpt file',
                    '2. Double-click the file to run it',
                    '3. Choose where to create your project folder',
                    '4. Click "Open Folder" to view the created project'
                ]
            };
        }
    }
}

// Export for use in main application
window.ScriptGenerator = ScriptGenerator;