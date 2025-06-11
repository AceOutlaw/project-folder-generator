// ================================
// Smart UI Manager
// Adaptive interface based on browser capabilities
// ================================

class SmartUIManager {
    constructor() {
        this.capabilities = this.detectCapabilities();
        this.buttonStrategy = this.determineButtonStrategy();
        this.init();
    }

    // ================================
    // Capability Detection
    // ================================

    detectCapabilities() {
        const hasFileSystemAPI = 'showDirectoryPicker' in window && window.isSecureContext;
        const userAgent = navigator.userAgent.toLowerCase();
        
        const browserInfo = {
            isChrome: userAgent.includes('chrome') && !userAgent.includes('edge'),
            isEdge: userAgent.includes('edge'),
            isSafari: userAgent.includes('safari') && !userAgent.includes('chrome'),
            isFirefox: userAgent.includes('firefox'),
            isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
        };

        const capabilities = {
            fileSystemAPI: hasFileSystemAPI,
            modernBrowser: hasFileSystemAPI,
            browser: browserInfo,
            protocol: window.location.protocol,
            isSecureContext: window.isSecureContext
        };

        console.log('Browser capabilities detected:', capabilities);
        return capabilities;
    }

    determineButtonStrategy() {
        if (this.capabilities.fileSystemAPI) {
            return {
                type: 'modern',
                primaryAction: 'direct',
                secondaryAction: 'google-drive',
                buttons: [
                    {
                        id: 'create-project-btn',
                        icon: '📂',
                        text: 'Create Project',
                        description: 'Choose location and create folders directly',
                        primary: true,
                        handler: 'handleCreateDirect'
                    },
                    {
                        id: 'save-google-btn',
                        icon: '☁️',
                        text: 'Save to Google Drive',
                        description: 'Create folders in your Google Drive (coming soon)',
                        primary: false,
                        handler: 'handleSaveGoogle',
                        disabled: true,
                        comingSoon: true
                    }
                ]
            };
        } else {
            return {
                type: 'legacy',
                primaryAction: 'download',
                secondaryAction: 'google-drive',
                buttons: [
                    {
                        id: 'download-zip-btn',
                        icon: '📁',
                        text: 'Download ZIP',
                        description: 'Download folder structure as ZIP file',
                        primary: true,
                        handler: 'handleCreateLocal'
                    },
                    {
                        id: 'save-google-btn',
                        icon: '☁️',
                        text: 'Save to Google Drive',
                        description: 'Create folders in your Google Drive (coming soon)',
                        primary: false,
                        handler: 'handleSaveGoogle',
                        disabled: true,
                        comingSoon: true
                    }
                ]
            };
        }
    }

    // ================================
    // UI Generation
    // ================================

    init() {
        console.log('SmartUIManager initializing with strategy:', this.buttonStrategy.type);
        this.replaceActionButtons();
        this.updateDescriptions();
        this.integrateWithMainApp();
    }

    replaceActionButtons() {
        const actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) {
            console.error('Action buttons container not found');
            return;
        }

        // Clear existing buttons
        actionButtons.innerHTML = '';

        // Create new buttons based on strategy
        this.buttonStrategy.buttons.forEach(buttonConfig => {
            const button = this.createButton(buttonConfig);
            actionButtons.appendChild(button);
        });

        console.log(`Created ${this.buttonStrategy.buttons.length} buttons for ${this.buttonStrategy.type} strategy`);
    }

    createButton(config) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = config.id;
        button.className = config.primary ? 'btn btn-primary' : 'btn btn-secondary';
        button.disabled = config.disabled || true; // Start disabled until form is valid
        button.setAttribute('aria-describedby', `${config.id}-description`);

        if (config.comingSoon) {
            button.title = config.description;
        }

        button.innerHTML = `
            <span class="btn-icon">${config.icon}</span>
            ${config.text}${config.comingSoon ? ' (Coming Soon)' : ''}
        `;

        // Store handler name for later binding
        button.setAttribute('data-handler', config.handler);

        return button;
    }

    updateDescriptions() {
        const descriptionsContainer = document.querySelector('.btn-descriptions');
        if (!descriptionsContainer) {
            console.error('Button descriptions container not found');
            return;
        }

        // Clear existing descriptions
        descriptionsContainer.innerHTML = '';

        // Create new descriptions
        this.buttonStrategy.buttons.forEach(buttonConfig => {
            const description = document.createElement('p');
            description.id = `${buttonConfig.id}-description`;
            description.className = 'btn-description';
            description.textContent = buttonConfig.description;
            descriptionsContainer.appendChild(description);
        });
    }

    // ================================
    // Main App Integration
    // ================================

    integrateWithMainApp() {
        // Wait for main app to be available
        const waitForApp = () => {
            if (window.app && window.app.elements) {
                this.bindEventHandlers();
                this.cacheButtonsInMainApp();
                console.log('Integrated with main app');
            } else {
                setTimeout(waitForApp, 50);
            }
        };
        waitForApp();
    }

    bindEventHandlers() {
        this.buttonStrategy.buttons.forEach(buttonConfig => {
            const button = document.getElementById(buttonConfig.id);
            const handlerName = buttonConfig.handler;
            
            if (button && handlerName) {
                // Bind to appropriate handler
                if (handlerName === 'handleCreateDirect' && window.fileSystemAPI) {
                    button.addEventListener('click', window.fileSystemAPI.handleCreateDirect.bind(window.fileSystemAPI));
                } else if (handlerName === 'handleCreateLocal' && window.app) {
                    button.addEventListener('click', window.app.handleCreateLocal.bind(window.app));
                } else if (handlerName === 'handleSaveGoogle' && window.app) {
                    button.addEventListener('click', window.app.handleSaveGoogle.bind(window.app));
                }
                
                console.log(`Bound ${handlerName} to ${buttonConfig.id}`);
            }
        });
    }

    cacheButtonsInMainApp() {
        if (!window.app || !window.app.elements) return;

        // Clear old button references
        delete window.app.elements.createLocalBtn;
        delete window.app.elements.createScriptBtn;
        delete window.app.elements.createDirectBtn;

        // Cache new buttons
        this.buttonStrategy.buttons.forEach(buttonConfig => {
            const button = document.getElementById(buttonConfig.id);
            if (button) {
                // Map to expected property names in main app
                if (buttonConfig.id === 'create-project-btn') {
                    window.app.elements.createDirectBtn = button;
                } else if (buttonConfig.id === 'download-zip-btn') {
                    window.app.elements.createLocalBtn = button;
                } else if (buttonConfig.id === 'save-google-btn') {
                    window.app.elements.saveGoogleBtn = button;
                }
            }
        });

        // Update button states
        window.app.updateButtonStates();
        console.log('Buttons cached in main app');
    }

    // ================================
    // Public API
    // ================================

    updateButtonStates(hasValidData) {
        this.buttonStrategy.buttons.forEach(buttonConfig => {
            const button = document.getElementById(buttonConfig.id);
            if (button && !buttonConfig.comingSoon) {
                button.disabled = !hasValidData;
            }
        });
    }

    getStrategy() {
        return this.buttonStrategy;
    }

    getCapabilities() {
        return this.capabilities;
    }

    getBrowserInfo() {
        const strategy = this.buttonStrategy;
        return {
            type: strategy.type,
            capabilities: this.capabilities,
            supportedFeatures: {
                directFolderCreation: this.capabilities.fileSystemAPI,
                zipDownload: true,
                googleDrive: false // Coming soon
            },
            recommendations: this.getRecommendations()
        };
    }

    getRecommendations() {
        if (this.capabilities.fileSystemAPI) {
            return [
                'Your browser supports direct folder creation',
                'No downloads or file management needed',
                'Choose your project location directly'
            ];
        } else {
            return [
                'For the best experience, try Chrome or Edge',
                'ZIP download works in all browsers',
                'Extract the ZIP where you want your project'
            ];
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other modules to load
    setTimeout(() => {
        if (typeof CONFIG !== 'undefined') {
            window.smartUI = new SmartUIManager();
            CONFIG.utils.log('info', 'Smart UI Manager initialized');
        }
    }, 150); // Slight delay after File System API module
});

// Export for use in main application
window.SmartUIManager = SmartUIManager;