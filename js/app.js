// ================================
// Main Application Logic
// ================================

class ProjectFolderGenerator {
    constructor() {
        this.elements = {};
        this.formData = {
            clientName: '',
            clientCode: '',
            projectType: '',
            descriptor: '',
            customReadme: ''
        };
        this.isValid = false;
        
        // Initialize script generator
        this.scriptGenerator = null;
        
        this.init();
    }

    // ================================
    // Initialization
    // ================================

    init() {
        CONFIG.utils.log('info', 'Initializing Project Folder Generator');
        
        this.cacheElements();
        this.bindEvents();
        this.setupForm();
        this.initializeScriptGenerator();
        
        CONFIG.utils.log('info', 'Application initialized successfully');
    }

    initializeScriptGenerator() {
        try {
            if (typeof ScriptGenerator !== 'undefined') {
                this.scriptGenerator = new ScriptGenerator();
                CONFIG.utils.log('info', 'Script generator initialized');
            } else {
                CONFIG.utils.log('warn', 'ScriptGenerator class not available');
            }
        } catch (error) {
            CONFIG.utils.log('error', 'Failed to initialize script generator', error);
        }
    }

    cacheElements() {
        // Form elements
        this.elements.form = document.getElementById('project-form');
        this.elements.clientName = document.getElementById('client-name');
        this.elements.clientCode = document.getElementById('client-code');
        this.elements.projectType = document.getElementById('project-type');
        this.elements.descriptor = document.getElementById('descriptor');
        this.elements.customReadme = document.getElementById('custom-readme');

        // Error elements
        this.elements.clientNameError = document.getElementById('client-name-error');
        this.elements.clientCodeError = document.getElementById('client-code-error');
        this.elements.projectTypeError = document.getElementById('project-type-error');
        this.elements.descriptorError = document.getElementById('descriptor-error');
        this.elements.customReadmeError = document.getElementById('custom-readme-error');

        // Preview elements
        this.elements.previewFull = document.getElementById('preview-full');
        this.elements.previewFolder = document.getElementById('preview-folder');
        this.elements.mainFolderPreview = document.getElementById('main-folder-preview');

        // Action buttons
        this.elements.createLocalBtn = document.getElementById('create-local-btn');
        this.elements.createScriptBtn = document.getElementById('create-script-btn');
        this.elements.saveGoogleBtn = document.getElementById('save-google-btn');

        // Status message
        this.elements.statusMessage = document.getElementById('status-message');

        CONFIG.utils.log('debug', 'Elements cached', this.elements);
    }

    bindEvents() {
        // Form input events
        this.elements.clientName.addEventListener('input', this.handleClientNameChange.bind(this));
        this.elements.clientCode.addEventListener('input', this.handleClientCodeChange.bind(this));
        this.elements.projectType.addEventListener('change', this.handleProjectTypeChange.bind(this));
        this.elements.descriptor.addEventListener('input', this.handleDescriptorChange.bind(this));
        this.elements.customReadme.addEventListener('input', this.handleCustomReadmeChange.bind(this));

        // Form validation events
        this.elements.clientName.addEventListener('blur', () => this.validateField('clientName'));
        this.elements.clientCode.addEventListener('blur', () => this.validateField('clientCode'));
        this.elements.projectType.addEventListener('blur', () => this.validateField('projectType'));
        this.elements.descriptor.addEventListener('blur', () => this.validateField('descriptor'));
        this.elements.customReadme.addEventListener('blur', () => this.validateField('customReadme'));

        // Button events
        this.elements.createLocalBtn.addEventListener('click', this.handleCreateLocal.bind(this));
        this.elements.createScriptBtn.addEventListener('click', this.handleCreateScript.bind(this));
        this.elements.saveGoogleBtn.addEventListener('click', this.handleSaveGoogle.bind(this));

        // Form submission (prevent default)
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateLocal();
        });

        CONFIG.utils.log('debug', 'Events bound successfully');
    }

    setupForm() {
        // Initial validation state
        this.updateButtonStates();
        
        CONFIG.utils.log('debug', 'Form setup complete');
    }

    // ================================
    // Event Handlers
    // ================================

    handleClientNameChange(event) {
        const value = event.target.value;
        this.formData.clientName = value;
        
        // Auto-generate client code if enabled and field is empty
        if (CONFIG.ui.form.autoSuggestClientCode && !this.elements.clientCode.value) {
            const suggestedCode = CONFIG.utils.generateClientCode(value);
            this.elements.clientCode.value = suggestedCode;
            this.formData.clientCode = suggestedCode;
            
            CONFIG.utils.log('debug', 'Auto-generated client code', suggestedCode);
        }
        
        this.updatePreview();
        
        if (CONFIG.ui.form.liveValidation) {
            this.validateField('clientName');
        }
    }

    handleClientCodeChange(event) {
        const value = event.target.value.toUpperCase();
        event.target.value = value; // Force uppercase
        this.formData.clientCode = value;
        
        this.updatePreview();
        
        if (CONFIG.ui.form.liveValidation) {
            this.validateField('clientCode');
        }
    }

    handleProjectTypeChange(event) {
        this.formData.projectType = event.target.value;
        this.updatePreview();
        
        if (CONFIG.ui.form.liveValidation) {
            this.validateField('projectType');
        }
    }

    handleDescriptorChange(event) {
        this.formData.descriptor = event.target.value;
        this.updatePreview();
        
        if (CONFIG.ui.form.liveValidation) {
            this.validateField('descriptor');
        }
    }

    handleCustomReadmeChange(event) {
        this.formData.customReadme = event.target.value;
        this.updateFormValidation();
    }

    async handleCreateLocal() {
        this.showStatus('Creating folder structure...', 'info');
        
        if (!this.validateForm()) {
            this.showStatus('Please fix the form errors before creating folders.', 'error');
            return;
        }

        try {
            this.setButtonLoading(this.elements.createLocalBtn, true);
            
            // Generate project name
            const projectName = this.generateProjectName();
            this.showStatus('Generating project structure...', 'info');
            
            // Get folder list
            const folders = CONFIG.project.folders;
            
            // Verify JSZip is available
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library not loaded. Please refresh the page.');
            }
            
            // Create folder generator
            const folderGenerator = new LocalFolderGenerator();
            
            // Create ZIP file
            this.showStatus('Creating ZIP file...', 'info');
            const zipBlob = await folderGenerator.createZipFile(projectName, folders, this.formData.customReadme);
            
            if (!zipBlob) {
                throw new Error('Failed to create ZIP file');
            }
            
            // Download ZIP
            this.showStatus('Starting download...', 'info');
            await folderGenerator.downloadZip(zipBlob, projectName);
            
            this.showStatus('Folder structure created and downloaded successfully!', 'success');
            
            if (CONFIG.ui.form.resetAfterSuccess) {
                this.resetForm();
            }
            
        } catch (error) {
            CONFIG.utils.log('error', 'Create local failed', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(this.elements.createLocalBtn, false);
        }
    }

    async handleCreateScript() {
        this.showStatus('Generating script file...', 'info');
        
        if (!this.validateForm()) {
            this.showStatus('Please fix the form errors before creating script.', 'error');
            return;
        }

        if (!this.scriptGenerator) {
            this.showStatus('Script generator not available. Please refresh the page.', 'error');
            return;
        }

        try {
            this.setButtonLoading(this.elements.createScriptBtn, true);
            
            // Generate project name
            const projectName = this.generateProjectName();
            this.showStatus('Creating script file...', 'info');
            
            // Get folder list
            const folders = CONFIG.project.folders;
            
            // Create script file
            const filename = this.scriptGenerator.createScript(projectName, folders, this.formData.customReadme);
            
            this.showStatus(`Script downloaded: ${filename}. Check download folder for instructions.`, 'success');
            
            if (CONFIG.ui.form.resetAfterSuccess) {
                this.resetForm();
            }
            
        } catch (error) {
            CONFIG.utils.log('error', 'Script creation failed', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(this.elements.createScriptBtn, false);
        }
    }

    handleSaveGoogle() {
        // Cloud storage functionality coming soon
        this.showStatus('Cloud storage integration coming soon!', 'info');
        CONFIG.utils.log('info', 'Cloud storage functionality requested (not yet implemented)');
    }

    // ================================
    // Validation
    // ================================

    validateField(fieldName, value) {
        // Skip validation if validation configuration is missing
        if (!CONFIG.project || !CONFIG.project.validation) {
            return { isValid: true };
        }
        
        // Skip validation if no rules defined for this field
        if (!CONFIG.project.validation[fieldName]) {
            return { isValid: true };
        }
        
        // If value not provided, get it from form data
        if (value === undefined) {
            value = this.formData[fieldName] || '';
        }
        
        const rules = CONFIG.project.validation[fieldName];
        const result = {
            isValid: true,
            message: ''
        };

        // Check required
        if (rules.required && (!value || value.trim() === '')) {
            result.isValid = false;
            result.message = 'This field is required';
            return result;
        }

        // Skip length checks if value is null/undefined
        if (value === null || value === undefined) {
            return result;
        }

        // Check length
        if (rules.minLength && value.length < rules.minLength) {
            result.isValid = false;
            result.message = `Must be at least ${rules.minLength} characters`;
            return result;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            result.isValid = false;
            result.message = `Must be no more than ${rules.maxLength} characters`;
            return result;
        }

        // Check pattern
        if (rules.pattern && !rules.pattern.test(value)) {
            result.isValid = false;
            result.message = rules.message || 'Invalid format';
            return result;
        }

        return result;
    }

    validateForm() {
        const fields = ['clientName', 'clientCode', 'projectType', 'descriptor', 'customReadme'];
        let allValid = true;

        fields.forEach(field => {
            const validation = this.validateField(field, this.formData[field]);
            if (!validation.isValid) allValid = false;
        });

        this.isValid = allValid;
        this.updateButtonStates();
        
        CONFIG.utils.log('debug', 'Form validation result', { isValid: allValid, formData: this.formData });
        
        return allValid;
    }

    updateFormValidation() {
        // Check if we have all required data (customReadme is optional)
        const hasAllData = this.formData.clientName && 
                          this.formData.clientCode && 
                          this.formData.projectType && 
                          this.formData.descriptor;
        
        if (hasAllData) {
            this.validateForm();
        } else {
            this.isValid = false;
            this.updateButtonStates();
        }
    }

    // ================================
    // Preview and UI Updates
    // ================================

    updatePreview() {
        const { clientName, clientCode, projectType, descriptor } = this.formData;

        if (clientName && clientCode && projectType && descriptor) {
            // Generate project names
            const displayName = `${clientName} (${clientCode}) - ${projectType} ${descriptor}`;
            const folderName = CONFIG.utils.generateProjectName(clientCode, projectType, descriptor);

            // Update preview elements
            this.elements.previewFull.textContent = `Project: ${displayName}`;
            this.elements.previewFolder.textContent = `Folder: ${folderName}`;
            this.elements.mainFolderPreview.textContent = `📁 ${folderName}`;

            // Add visual feedback
            this.elements.previewFull.parentElement.parentElement.classList.add('updated');
            
            setTimeout(() => {
                this.elements.previewFull.parentElement.parentElement.classList.remove('updated');
            }, CONFIG.ui.animations.duration);

        } else {
            // Reset to default state
            this.elements.previewFull.textContent = 'Enter details to see preview';
            this.elements.previewFolder.textContent = 'Folder name will appear here';
            this.elements.mainFolderPreview.textContent = '📁 Your-Project-Folder';
        }

        CONFIG.utils.log('debug', 'Preview updated', this.formData);
    }

    updateButtonStates() {
        // Log all form validation values for debugging
        CONFIG.utils.log('debug', 'Form data state:', { 
            clientName: this.formData.clientName,
            clientCode: this.formData.clientCode,
            projectType: this.formData.projectType,
            descriptor: this.formData.descriptor,
            customReadme: this.formData.customReadme,
            isValid: this.isValid
        });

        const hasValidData = this.isValid && 
                           this.formData.clientName && 
                           this.formData.clientCode && 
                           this.formData.projectType && 
                           this.formData.descriptor;
        
        // Smart UI managed buttons (takes precedence)
        if (window.smartUI) {
            window.smartUI.updateButtonStates(hasValidData);
        } else {
            // Legacy button handling (fallback)
            if (this.elements.createLocalBtn) {
                this.elements.createLocalBtn.disabled = !hasValidData;
            }
            if (this.elements.createScriptBtn) {
                this.elements.createScriptBtn.disabled = !hasValidData || !this.scriptGenerator;
            }
            
            // Legacy fallback for direct File System API integration
            if (this.elements.createDirectBtn) {
                this.elements.createDirectBtn.disabled = !hasValidData || !window.fileSystemAPI?.isSupported;
            }
            if (window.fileSystemAPI) {
                window.fileSystemAPI.updateButtonState(hasValidData);
            }
            
            // Google Drive button stays disabled for now
            if (this.elements.saveGoogleBtn) {
                this.elements.saveGoogleBtn.disabled = true;
            }
        }

        CONFIG.utils.log('debug', 'Button states updated', { 
            hasValidData, 
            isValid: this.isValid, 
            smartUIActive: !!window.smartUI,
            buttonsExist: {
                createLocalBtn: !!this.elements.createLocalBtn,
                createDirectBtn: !!this.elements.createDirectBtn,
                saveGoogleBtn: !!this.elements.saveGoogleBtn
            }
        });
    }

    // ================================
    // UI Utilities
    // ================================

    showStatus(message, type = 'info') {
        const statusElement = this.elements.statusMessage;
        
        statusElement.textContent = message;
        statusElement.className = `status-message ${type} show`;
        
        // Auto-hide if configured
        if (CONFIG.ui.statusMessages.autoHide && type === 'success') {
            setTimeout(() => {
                statusElement.classList.remove('show');
            }, CONFIG.ui.statusMessages.autoHideDelay);
        }

        CONFIG.utils.log('info', `Status message: [${type}] ${message}`);
    }

    setButtonLoading(button, isLoading) {
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
            this.updateButtonStates(); // Restore proper disabled state
            
            const icon = button.querySelector('.btn-icon');
            if (icon && icon.hasAttribute('data-original')) {
                icon.textContent = icon.getAttribute('data-original');
                icon.removeAttribute('data-original');
            }
        }
    }

    resetForm() {
        this.elements.form.reset();
        this.formData = {
            clientName: '',
            clientCode: '',
            projectType: '',
            descriptor: '',
            customReadme: ''
        };
        
        // Clear error messages
        Object.keys(this.elements).forEach(key => {
            if (key.endsWith('Error')) {
                this.elements[key].textContent = '';
            }
        });
        
        // Reset preview
        this.updatePreview();
        this.updateButtonStates();
        
        // Clear status message
        this.elements.statusMessage.classList.remove('show');
        
        CONFIG.utils.log('info', 'Form reset');
    }

    // ================================
    // Public API
    // ================================

    getFormData() {
        return { ...this.formData };
    }

    setFormData(data) {
        Object.keys(data).forEach(key => {
            if (this.elements[key]) {
                this.elements[key].value = data[key];
                this.formData[key] = data[key];
            }
        });
        
        this.updatePreview();
        this.validateForm();
    }

    generateProjectName() {
        const { clientCode, projectType, descriptor } = this.formData;
        if (clientCode && projectType && descriptor) {
            return CONFIG.utils.generateProjectName(clientCode, projectType, descriptor);
        }
        return null;
    }
}

// ================================
// Application Initialization
// ================================

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Verify required dependencies
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded. Please refresh the page.');
        }
        
        if (typeof CONFIG === 'undefined') {
            throw new Error('Configuration not loaded. Please refresh the page.');
        }
        
        // Create global app instance
        window.app = new ProjectFolderGenerator();
        
        CONFIG.utils.log('info', 'Project Folder Generator started successfully');
        
    } catch (error) {
        CONFIG.utils.log('error', 'Failed to initialize application', error);
        
        // Show error message to user
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = 'Application failed to start: ' + error.message;
            statusElement.className = 'status-message error show';
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    CONFIG.utils.log('info', 'Application shutting down');
});