// ================================
// Application Configuration
// ================================

const CONFIG = {
    // Application Settings
    app: {
        name: 'Project Folder Generator',
        version: '2.0.0',
        author: 'Professional Workflow Tools'
    },

    // Project Settings
    project: {
        // Standard folder structure for all projects
        folders: [
            'Assets',
            'Working Files', 
            'Exports',
            'Deliverables',
            'Project Management'
        ],

        // Project type options
        types: [
            { value: 'Website', label: 'Website' },
            { value: 'Application', label: 'Application' },
            { value: 'Branding', label: 'Branding/Identity' },
            { value: 'Campaign', label: 'Campaign/Marketing' },
            { value: 'Print', label: 'Print Design' },
            { value: 'Presentation', label: 'Presentation' },
            { value: 'Video', label: 'Video Production' },
            { value: 'Music', label: 'Music' },
            { value: 'Strategy', label: 'Strategy/Consulting' }
        ],

        // Validation rules
        validation: {
            clientName: {
                required: true,
                minLength: 2,
                maxLength: 50
            },
            clientCode: {
                required: true,
                minLength: 2,
                maxLength: 10,
                pattern: /^[a-zA-Z0-9]+$/,
                message: 'Only alphanumeric characters allowed'
            },
            projectType: {
                required: true
            },
            descriptor: {
                required: true,
                minLength: 2,
                maxLength: 50
            },
            customReadme: {
                required: false,
                maxLength: 1000
            }
        },

        // Naming convention settings
        naming: {
            separator: '-',
            timestampFormat: 'YYYYMMDDHHMMSS',
            caseStyle: 'preserve' // 'preserve', 'upper', 'lower'
        }
    },

    // Local folder creation settings
    local: {
        // Download method preference
        method: 'zip', // 'zip', 'script', 'direct' (if supported)
        
        // ZIP file settings
        zip: {
            compression: 'DEFLATE',
            compressionLevel: 6,
            addEmptyFolders: true
        },

        // Script generation settings
        script: {
            format: 'batch', // 'batch' (Windows), 'bash' (Mac/Linux)
            includeInstructions: true
        }
    },

    // Google Drive settings (for future implementation)
    googleDrive: {
        enabled: false,
        clientId: '', // To be configured when implementing
        apiKey: '', // To be configured when implementing
        scopes: [
            'https://www.googleapis.com/auth/drive.file'
        ],
        discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
        ]
    },

    // UI Settings
    ui: {
        // Animation and transition settings
        animations: {
            duration: 250,
            easing: 'ease-in-out'
        },

        // Form behavior
        form: {
            liveValidation: true,
            showPreviewOnChange: true,
            autoSuggestClientCode: true,
            resetAfterSuccess: true
        },

        // Status message settings
        statusMessages: {
            autoHide: true,
            autoHideDelay: 5000, // milliseconds
            showIcons: true
        }
    },

    // Debug and development settings
    debug: {
        enabled: true, // Set to true for development
        logLevel: 'debug', // 'error', 'warn', 'info', 'debug'
        showValidationDetails: true
    }
};

// ================================
// Utility Functions for Config
// ================================

// Generate timestamp for project naming
CONFIG.utils = {
    generateTimestamp: function() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    },

    // Generate client code from client name
    generateClientCode: function(clientName) {
        if (!clientName) return '';
        
        const words = clientName.trim().split(/\s+/).filter(word => word.length > 0);
        let code = '';
        
        if (words.length === 1) {
            // Single word: take first 2-3 characters
            code = words[0].substring(0, 3).toUpperCase();
        } else {
            // Multiple words: take first letter of each word
            code = words.map(word => word.charAt(0)).join('').toUpperCase();
            // Limit to 4 characters
            if (code.length > 4) {
                code = code.substring(0, 4);
            }
        }
        
        return code;
    },

    // Generate project folder name
    generateProjectName: function(clientCode, projectType, descriptor) {
        const timestamp = this.generateTimestamp();
        const separator = CONFIG.project.naming.separator;
        
        return `${timestamp}${separator}${clientCode}${separator}${projectType}${separator}${descriptor}`;
    },

    // Validate field value against config rules
    validateField: function(fieldName, value) {
        const rules = CONFIG.project.validation[fieldName];
        if (!rules) return { isValid: true };

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
    },

    // Logging utility
    log: function(level, message, data) {
        if (!CONFIG.debug.enabled && level === 'debug') return;

        const logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        const configLevel = logLevels[CONFIG.debug.logLevel] || 2;
        const messageLevel = logLevels[level] || 2;

        if (messageLevel <= configLevel) {
            const timestamp = new Date().toISOString();
            const prefix = `[${level.toUpperCase()}] ${timestamp}`;

            if (data !== undefined) {
                console.log(prefix, message, data);
            } else {
                console.log(prefix, message);
            }
        }
    }
};