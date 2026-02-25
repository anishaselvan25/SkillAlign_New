/**
 * TestMaster Pro - Storage Manager
 * Handles localStorage operations for data persistence
 */

const StorageManager = {
    STORAGE_KEY: 'assessmentAppData',

    /**
     * Get data from localStorage
     * @returns {Object} Application data
     */
    getData: function() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : INITIAL_DATA;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return INITIAL_DATA;
        }
    },

    /**
     * Save data to localStorage
     * @param {Object} data - Data to save
     * @returns {boolean} Success status
     */
    setData: function(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    /**
     * Initialize storage with default data if empty
     */
    initialize: function() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.setData(INITIAL_DATA);
        }
    },

    /**
     * Reset storage to initial state
     */
    reset: function() {
        this.setData(INITIAL_DATA);
        console.log('Storage reset to initial state');
    },

    /**
     * Clear all storage
     */
    clear: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Storage cleared');
    },

    /**
     * Export data as JSON file
     * @returns {string} JSON string of data
     */
    export: function() {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON string
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} Success status
     */
    import: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return this.setData(data);
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// Initialize storage on script load
StorageManager.initialize();
