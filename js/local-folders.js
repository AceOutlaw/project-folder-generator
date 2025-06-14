// ================================
// Local Folder Generation
// ================================

class LocalFolderGenerator {
    constructor() {
        console.log('Initializing LocalFolderGenerator...');
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library is not loaded');
        }
        console.log('JSZip is available:', JSZip.version);
        this.zip = new JSZip();
        this.currentFolder = null;
        console.log('LocalFolderGenerator initialized successfully');
    }

    /**
     * Creates a ZIP file with the project folder structure
     * @param {string} projectName - The main project folder name
     * @param {Array<string>} folders - Array of folder names to create
     * @param {string} [customReadme=''] - Custom README content
     * @returns {Promise<Blob>} - Promise resolving to the ZIP file blob
     */
    async createZipFile(projectName, folders, customReadme = '') {
        try {
            CONFIG.utils.log('info', 'Creating ZIP file structure', { projectName, folders });
            
            // Create main project folder
            this.currentFolder = this.zip.folder(projectName);
            CONFIG.utils.log('debug', `Created main folder: ${projectName}`);
            
            // Create subfolders
            folders.forEach(folderName => {
                this.currentFolder.folder(folderName);
                CONFIG.utils.log('debug', `Created subfolder: ${folderName}`);
            });
            
            // Add README.txt
            const readmeContent = this.generateReadme(projectName, customReadme);
            this.currentFolder.file('README.txt', readmeContent);
            CONFIG.utils.log('debug', 'Added README.txt file');
            
            // Generate ZIP
            CONFIG.utils.log('info', 'Generating ZIP blob');
            const zipBlob = await this.zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                }
            });
            
            CONFIG.utils.log('info', 'ZIP blob created successfully', { size: zipBlob.size });
            return zipBlob;
        } catch (error) {
            CONFIG.utils.log('error', 'Error creating ZIP file', { error });
            throw new Error(`Failed to create ZIP: ${error.message}`);
        }
    }

    /**
     * Generates a README file content
     * @param {string} projectName - The main project folder name
     * @param {string} [customContent=''] - Custom README content
     * @returns {string} - README content
     */
    generateReadme(projectName, customContent = '') {
        CONFIG.utils.log('debug', 'Generating README content', { projectName, customContent });
        
        // Get current date and time
        const now = new Date();
        const generatedDate = now.toLocaleDateString('en-US');
        const generatedTime = now.toLocaleTimeString('en-US');
        
        // Build folder structure display
        const folders = CONFIG.project.folders;
        const folderStructure = folders.map(folder => `  ├─ ${folder}/`).join('\n');
        
        // Build folder descriptions
        const folderDescriptions = [
            '- Assets: Store all raw assets (images, fonts, etc.)',
            '- Working Files: Active project files (PSD, AI, Figma, etc.)',
            '- Exports: Exported versions and iterations',
            '- Deliverables: Final files for client delivery',
            '- Project Management: Documentation, timelines, and communications'
        ].join('\n');
        
        const defaultContent = `# ${projectName}

This folder contains all project assets and deliverables.

Generated on: ${generatedDate}, ${generatedTime}

Folder Structure:
- ${projectName}/
${folderStructure}
  └─ README.txt

Folder Descriptions:
${folderDescriptions}

Generated by Project Folder Generator v${CONFIG.app.version}`;
        
        if (customContent && customContent.trim()) {
            const finalReadme = `${defaultContent}\n\n## Custom Notes\n\n${customContent.trim()}`;
            CONFIG.utils.log('debug', 'Final README content with custom part', { readme: finalReadme });
            return finalReadme;
        }
        
        CONFIG.utils.log('debug', 'Final README content', { readme: defaultContent });
        return defaultContent;
    }

    /**
     * Downloads the ZIP file
     * @param {Blob} blob - The ZIP file blob
     * @param {string} filename - The filename for download
     */
    async downloadZip(blob, filename) {
        try {
            CONFIG.utils.log('info', 'Preparing ZIP download', { filename });
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            CONFIG.utils.log('debug', 'Clicking download link');
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                CONFIG.utils.log('debug', 'Cleaned up download link');
            }, 1000);
            
            CONFIG.utils.log('info', 'ZIP download initiated successfully');
            return true;
        } catch (error) {
            CONFIG.utils.log('error', 'Error downloading ZIP', { error });
            throw new Error(`Failed to download ZIP: ${error.message}`);
        }
    }
}

// Add to window object for global access
window.LocalFolderGenerator = LocalFolderGenerator;
