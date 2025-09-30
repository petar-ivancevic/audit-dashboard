/**
 * Data Loader Module
 * Handles loading JSON data files, caching, and error handling
 */

const DataLoader = (() => {
    // Cache storage
    const cache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Load JSON data from a file with caching
     * @param {string} filePath - Path to the JSON file
     * @param {boolean} forceRefresh - Force reload bypassing cache
     * @returns {Promise<Object>} Parsed JSON data
     */
    async function loadJSON(filePath, forceRefresh = false) {
        // Check cache first
        if (!forceRefresh && cache.has(filePath)) {
            const cached = cache.get(filePath);
            const now = Date.now();

            if (now - cached.timestamp < CACHE_DURATION) {
                console.log(`[DataLoader] Using cached data for: ${filePath}`);
                return cached.data;
            } else {
                console.log(`[DataLoader] Cache expired for: ${filePath}`);
                cache.delete(filePath);
            }
        }

        try {
            console.log(`[DataLoader] Loading data from: ${filePath}`);
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Store in cache
            cache.set(filePath, {
                data: data,
                timestamp: Date.now()
            });

            console.log(`[DataLoader] Successfully loaded: ${filePath}`);
            return data;

        } catch (error) {
            console.error(`[DataLoader] Error loading ${filePath}:`, error);
            throw new Error(`Failed to load data from ${filePath}: ${error.message}`);
        }
    }

    /**
     * Load enterprise dashboard data
     * @returns {Promise<Object>} Enterprise dashboard data
     */
    async function loadEnterpriseData() {
        return loadJSON('data/enterprise-dashboard-q3-2024.json');
    }

    /**
     * Load business unit data by ID
     * @param {string} businessUnitId - Business unit identifier
     * @returns {Promise<Object>} Business unit data
     */
    async function loadBusinessUnitData(businessUnitId) {
        const fileName = `${businessUnitId}-q3-2024.json`;
        return loadJSON(`data/business-units/${fileName}`);
    }

    /**
     * Load all business units data
     * @returns {Promise<Array>} Array of all business unit data
     */
    async function loadAllBusinessUnits() {
        const businessUnitIds = [
            'consumer-banking',
            'commercial-banking',
            'investment-banking',
            'operations-tech',
            'wealth-management',
            'treasury',
            'human-resources',
            'corporate-real-estate',
            'vendor-management',
            'legal-compliance',
            'northeast-region',
            'southeast-region',
            'west-coast-region',
            'international',
            'digital-banking'
        ];

        try {
            const promises = businessUnitIds.map(id => loadBusinessUnitData(id));
            const results = await Promise.allSettled(promises);

            // Filter successful results
            const successfulData = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            // Log failures
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.warn(`[DataLoader] Failed to load ${businessUnitIds[index]}:`, result.reason);
                }
            });

            console.log(`[DataLoader] Loaded ${successfulData.length}/${businessUnitIds.length} business units`);
            return successfulData;

        } catch (error) {
            console.error('[DataLoader] Error loading business units:', error);
            throw error;
        }
    }

    /**
     * Load historical trends data
     * @returns {Promise<Object>} Historical trends data
     */
    async function loadHistoricalTrends() {
        return loadJSON('data/time-series/historical-trends-2022-2024.json');
    }

    /**
     * Clear the data cache
     */
    function clearCache() {
        console.log('[DataLoader] Clearing cache');
        cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    function getCacheStats() {
        return {
            size: cache.size,
            entries: Array.from(cache.keys())
        };
    }

    /**
     * Preload critical data for faster initial render
     * @returns {Promise<Object>} Preloaded data
     */
    async function preloadCriticalData() {
        console.log('[DataLoader] Preloading critical data...');

        try {
            const [enterpriseData, businessUnitsData] = await Promise.all([
                loadEnterpriseData(),
                loadAllBusinessUnits()
            ]);

            return {
                enterprise: enterpriseData,
                businessUnits: businessUnitsData
            };
        } catch (error) {
            console.error('[DataLoader] Error preloading data:', error);
            throw error;
        }
    }

    /**
     * Load data by reporting period
     * @param {string} period - Reporting period (e.g., 'q3-2024')
     * @returns {Promise<Object>} Period-specific data
     */
    async function loadDataByPeriod(period) {
        // For now, we only have Q3 2024 data
        // This function can be extended when more periods are available
        if (period === 'q3-2024') {
            return loadEnterpriseData();
        } else {
            console.warn(`[DataLoader] Data for period ${period} not available, using Q3 2024`);
            return loadEnterpriseData();
        }
    }

    /**
     * Validate data structure
     * @param {Object} data - Data to validate
     * @param {Array<string>} requiredFields - Required field names
     * @returns {boolean} Whether data is valid
     */
    function validateData(data, requiredFields = []) {
        if (!data || typeof data !== 'object') {
            console.error('[DataLoader] Invalid data: not an object');
            return false;
        }

        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`[DataLoader] Invalid data: missing required field "${field}"`);
                return false;
            }
        }

        return true;
    }

    /**
     * Handle data loading errors with user-friendly messages
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message
     */
    function getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Unable to load data. Please check your network connection.';
        } else if (error.message.includes('HTTP 404')) {
            return 'Data file not found. Please contact support.';
        } else if (error.message.includes('JSON')) {
            return 'Data format error. Please contact support.';
        } else {
            return 'An unexpected error occurred while loading data.';
        }
    }

    /**
     * Retry failed data loads
     * @param {Function} loadFunction - Function to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} delay - Delay between retries in ms
     * @returns {Promise<Object>} Data result
     */
    async function retryLoad(loadFunction, maxRetries = 3, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[DataLoader] Attempt ${attempt}/${maxRetries}`);
                return await loadFunction();
            } catch (error) {
                lastError = error;
                console.warn(`[DataLoader] Attempt ${attempt} failed:`, error.message);

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }

        throw lastError;
    }

    // Public API
    return {
        loadJSON,
        loadEnterpriseData,
        loadBusinessUnitData,
        loadAllBusinessUnits,
        loadHistoricalTrends,
        loadDataByPeriod,
        preloadCriticalData,
        clearCache,
        getCacheStats,
        validateData,
        getErrorMessage,
        retryLoad
    };
})();

// Make available globally
window.DataLoader = DataLoader;