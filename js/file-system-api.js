// ================================
// File System API Integration
// Experimental feature for modern browsers
// ================================

class FileSystemProjectGenerator {
    constructor() {
        this.isSupported = this.checkSupport();
        this.init();
    }

    // ================================
    // Feature Detection
    // ================================

    checkSupport() {
        // Check if File System API is available
        const hasFileSystemAccess = 'showDirectoryPicker' in window;
        const isSecureContext = window.isSecureContext;
        
        CONFIG.utils.log('info', 'File System API Support Check', {
            hasFileSystemAccess,
            isSecureContext,
            userAgent: navigator.userAgent
        });

        return hasFileSystemAccess && isSecureContext;
    }

    init() {
        if (this.isSupported) {
            CONFIG.utils.log('info', 'File System API is supported');
            this.setupUI();
        } else {
            CONFIG.utils.log('info', 'File System API not supported - fallback to downloads');
        }
    }

    // ================================
    // UI Integration
    // ================================

    setupUI() {
        // Add a new button for direct folder creation
        this.addDirectCreateButton();
        this.updateButtonDescriptions();
    }

    addDirectCreateButton() {
        const actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) return;

        // Create new button
        const directButton = document.createElement('button');
        directButton.type = 'button';
        directButton.id = 'create-direct-btn';
        directButton.className = 'btn btn-primary';
        directButton.disabled = true;
        directButton.setAttribute('aria-describedby', 'direct-btn-description');

        directButton.innerHTML = `
            <span class="btn-icon">📂</span>
            Create Direct
        `;

        // Insert before the Google Drive button
        const googleBtn = document.getElementById('save-google-btn');
        actionButtons.insertBefore(directButton, googleBtn);

        // Add event listener
        directButton.addEventListener('click', this.handleCreateDirect.bind(this));

        // Cache the element in the main app
        if (window.app && window.app.elements) {
            window.app.elements.createDirectBtn = directButton;
            // Update button states immediately
            window.app.updateButtonStates();
        }

        CONFIG.utils.log('info', 'Direct create button added');
    }

    updateButtonDescriptions() {
        const descriptionsContainer = document.querySelector('.btn-descriptions');
        if (!descriptionsContainer) return;

        // Add description for direct button
        const directDescription = document.createElement('p');
        directDescription.id = 'direct-btn-description';
        directDescription.className = 'btn-description';
        directDescription.textContent = 'Create folders directly in your chosen location (Chrome/Edge only)';

        // Insert before Google Drive description
        const googleDescription = document.getElementById('google-btn-description');
        descriptionsContainer.insertBefore(directDescription, googleDescription);

        CONFIG.utils.log('info', 'Button descriptions updated');
    }

    // ================================
    // File System API Implementation
    // ================================

    async handleCreateDirect() {
        if (!window.app) {
            this.showError('Application not initialized');
            return;
        }

        if (!window.app.validateForm()) {
            // Mark all required fields as touched to show validation errors
            window.app.showAllValidationErrors();
            this.showError('Please fix the form errors before creating folders.');
            return;
        }

        try {
            this.setButtonLoading(true);
            
            // Generate project name
            const projectName = window.app.generateProjectName();
            
            // Ask user to pick a directory
            this.showStatus('Choose where to create your project folder...', 'info');
            
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            
            // Create project structure directly
            await this.createProjectStructure(dirHandle, projectName);
            
            this.showStatus(`✅ Project created successfully in ${dirHandle.name}/${projectName}!`, 'success');
            
            if (CONFIG.ui.form.resetAfterSuccess) {
                window.app.resetForm();
            }
            
        } catch (error) {
            CONFIG.utils.log('error', 'Direct creation failed', error);
            
            if (error.name === 'AbortError') {
                this.showStatus('Folder selection cancelled', 'info');
            } else {
                this.showError(`Error: ${error.message}`);
            }
        } finally {
            this.setButtonLoading(false);
        }
    }

    async createProjectStructure(parentDirHandle, projectName) {
        try {
            this.showStatus('Creating project folder...', 'info');
            
            // Create main project directory
            const projectDirHandle = await parentDirHandle.getDirectoryHandle(projectName, {
                create: true
            });
            
            // Get folder list and custom README
            const folders = CONFIG.project.folders;
            const customReadme = window.app.formData.customReadme;
            
            this.showStatus('Creating subfolders...', 'info');
            
            // Create all subfolders
            for (const folder of folders) {
                await projectDirHandle.getDirectoryHandle(folder, {
                    create: true
                });
            }
            
            this.showStatus('Creating README file...', 'info');
            
            // Create README.md file
            await this.createReadmeFile(projectDirHandle, projectName, folders, customReadme);
            
        } catch (error) {
            throw new Error(`Failed to create project structure: ${error.message}`);
        }
    }

    async createReadmeFile(projectDirHandle, projectName, folders, customReadme) {
        try {
            // Create README.md file
            const readmeHandle = await projectDirHandle.getFileHandle('README.md', {
                create: true
            });
            
            // Create writable stream
            const writable = await readmeHandle.createWritable();
            
            // Generate README content
            let content;
            if (customReadme && customReadme.trim()) {
                content = customReadme;
            } else {
                const timestamp = new Date().toLocaleString();
                content = `# ${projectName}

Project created: ${timestamp}

## Folder Structure
${folders.map(folder => `- ${folder}`).join('\n')}

Generated with Studio Kace Project Folder Generator
`;
            }
            
            // Write content and close
            await writable.write(content);
            await writable.close();
            
        } catch (error) {
            throw new Error(`Failed to create README: ${error.message}`);
        }
    }

    // ================================
    // UI Helpers
    // ================================

    showStatus(message, type = 'info') {
        if (window.app && window.app.showStatus) {
            window.app.showStatus(message, type);
        }
    }

    showError(message) {
        this.showStatus(message, 'error');
    }

    setButtonLoading(isLoading) {
        const button = document.getElementById('create-direct-btn');
        if (!button) return;

        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            
            const icon = button.querySelector('.btn-icon');
            if (icon) {
                icon.setAttribute('data-original', icon.textContent);
                icon.textContent = '⏳';
            }
        } else {
            button.classList.remove('loading');
            
            // Restore proper disabled state based on form validation
            if (window.app && window.app.updateButtonStates) {
                window.app.updateButtonStates();
            }
            
            const icon = button.querySelector('.btn-icon');
            if (icon && icon.hasAttribute('data-original')) {
                icon.textContent = icon.getAttribute('data-original');
                icon.removeAttribute('data-original');
            }
        }
    }

    // ================================
    // Public API
    // ================================

    updateButtonState(hasValidData) {
        const button = document.getElementById('create-direct-btn');
        
        if (button) {
            const shouldEnable = hasValidData && this.isSupported;
            button.disabled = !shouldEnable;
        }
    }

    getBrowserSupport() {
        return {
            isSupported: this.isSupported,
            missingFeatures: this.getMissingFeatures(),
            recommendedBrowsers: ['Chrome 86+', 'Edge 86+'],
            fallbackMessage: 'Use Download ZIP or Download Script instead'
        };
    }

    getMissingFeatures() {
        const missing = [];
        
        if (!('showDirectoryPicker' in window)) {
            missing.push('File System Access API');
        }
        
        if (!window.isSecureContext) {
            missing.push('Secure Context (HTTPS)');
        }
        
        return missing;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for the main app to initialize
    setTimeout(() => {
        if (typeof CONFIG !== 'undefined') {
            window.fileSystemAPI = new FileSystemProjectGenerator();
            CONFIG.utils.log('info', 'File System API module initialized');
        }
    }, 100);
});

// Export for use in main application
window.FileSystemProjectGenerator = FileSystemProjectGenerator;