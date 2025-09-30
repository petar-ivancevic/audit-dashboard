/**
 * Performance Module
 * Handles data caching, lazy loading, and optimization
 */

const Performance = (() => {
    // Performance metrics
    const metrics = {
        loadTimes: [],
        cacheHits: 0,
        cacheMisses: 0
    };

    // Lazy load observer
    let lazyObserver = null;

    // Debounce timers
    const debounceTimers = new Map();

    /**
     * Initialize performance optimizations
     */
    function init() {
        console.log('[Performance] Initializing performance optimizations');

        // Setup lazy loading for images and charts
        setupLazyLoading();

        // Setup resize observer for responsive charts
        setupResizeObserver();

        // Monitor performance
        monitorPerformance();

        // Prefetch critical resources
        prefetchCriticalResources();
    }

    /**
     * Setup lazy loading for images and heavy content
     */
    function setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;

                        // Lazy load images
                        if (element.dataset.src) {
                            element.src = element.dataset.src;
                            element.removeAttribute('data-src');
                        }

                        // Lazy load charts
                        if (element.classList.contains('lazy-chart')) {
                            loadChart(element);
                            element.classList.remove('lazy-chart');
                        }

                        lazyObserver.unobserve(element);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            console.log('[Performance] Lazy loading observer initialized');
        }
    }

    /**
     * Observe element for lazy loading
     * @param {HTMLElement} element - Element to observe
     */
    function observeElement(element) {
        if (lazyObserver) {
            lazyObserver.observe(element);
        }
    }

    /**
     * Load chart when it becomes visible
     * @param {HTMLElement} element - Chart container element
     */
    function loadChart(element) {
        const chartId = element.id;
        const chartType = element.dataset.chartType;

        console.log(`[Performance] Lazy loading chart: ${chartId}`);

        // Trigger chart creation based on type
        if (typeof window.createCharts === 'function') {
            window.createCharts();
        }
    }

    /**
     * Setup resize observer for responsive elements
     */
    function setupResizeObserver() {
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(
                debounce((entries) => {
                    entries.forEach(entry => {
                        // Handle chart resizing
                        if (entry.target.classList.contains('chart-container')) {
                            handleChartResize(entry.target);
                        }
                    });
                }, 250)
            );

            // Observe chart containers
            document.querySelectorAll('.chart-container').forEach(container => {
                resizeObserver.observe(container);
            });

            console.log('[Performance] Resize observer initialized');
        }
    }

    /**
     * Handle chart resize
     * @param {HTMLElement} container - Chart container element
     */
    function handleChartResize(container) {
        const canvas = container.querySelector('canvas');
        if (!canvas || !window.ChartEngine) return;

        // Chart.js handles resizing automatically, but we can trigger updates if needed
        console.log(`[Performance] Chart container resized: ${container.id}`);
    }

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Minimum time between executions
     * @returns {Function} Throttled function
     */
    function throttle(func, limit = 300) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Monitor performance metrics
     */
    function monitorPerformance() {
        // Track page load time
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                metrics.loadTimes.push(loadTime);
                console.log(`[Performance] Page load time: ${loadTime}ms`);
            });
        }

        // Monitor long tasks (requires Performance Observer API)
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
                        }
                    }
                });

                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                // Long task monitoring not supported
                console.log('[Performance] Long task monitoring not supported');
            }
        }
    }

    /**
     * Prefetch critical resources
     */
    function prefetchCriticalResources() {
        console.log('[Performance] Prefetching critical resources');

        // Prefetch enterprise data in the background
        if (window.DataLoader) {
            DataLoader.preloadCriticalData().catch(error => {
                console.warn('[Performance] Error prefetching data:', error);
            });
        }
    }

    /**
     * Batch DOM updates to minimize reflows
     * @param {Function} updateFunction - Function containing DOM updates
     */
    function batchDOMUpdates(updateFunction) {
        // Use requestAnimationFrame for optimal timing
        requestAnimationFrame(() => {
            updateFunction();
        });
    }

    /**
     * Optimize table rendering for large datasets
     * @param {string} tableId - Table element ID
     * @param {Array} data - Data array
     * @param {Function} renderFunction - Function to render rows
     */
    function optimizeTableRendering(tableId, data, renderFunction) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        console.log(`[Performance] Optimizing table rendering: ${tableId} (${data.length} rows)`);

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        // Batch render rows
        const batchSize = 50;
        let currentIndex = 0;

        function renderBatch() {
            const end = Math.min(currentIndex + batchSize, data.length);

            for (let i = currentIndex; i < end; i++) {
                const row = renderFunction(data[i]);
                fragment.appendChild(row);
            }

            currentIndex = end;

            if (currentIndex < data.length) {
                // Schedule next batch
                requestAnimationFrame(renderBatch);
            } else {
                // All rows rendered, append to DOM
                tbody.appendChild(fragment);
                console.log(`[Performance] Table rendering complete: ${tableId}`);
            }
        }

        // Clear existing rows
        tbody.innerHTML = '';

        // Start rendering
        renderBatch();
    }

    /**
     * Measure function execution time
     * @param {Function} func - Function to measure
     * @param {string} label - Label for the measurement
     * @returns {*} Function result
     */
    async function measurePerformance(func, label = 'Function') {
        const startTime = performance.now();

        try {
            const result = await func();
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`[Performance] ${label} completed in ${duration.toFixed(2)}ms`);

            return result;
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`, error);
            throw error;
        }
    }

    /**
     * Optimize chart data for rendering
     * @param {Array} data - Chart data array
     * @param {number} maxPoints - Maximum number of data points
     * @returns {Array} Optimized data array
     */
    function optimizeChartData(data, maxPoints = 100) {
        if (!Array.isArray(data) || data.length <= maxPoints) {
            return data;
        }

        console.log(`[Performance] Optimizing chart data: ${data.length} -> ${maxPoints} points`);

        // Sample data evenly
        const step = Math.ceil(data.length / maxPoints);
        const optimized = [];

        for (let i = 0; i < data.length; i += step) {
            optimized.push(data[i]);
        }

        return optimized;
    }

    /**
     * Preload images
     * @param {Array<string>} imageUrls - Array of image URLs
     */
    function preloadImages(imageUrls) {
        console.log(`[Performance] Preloading ${imageUrls.length} images`);

        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    function getMetrics() {
        const avgLoadTime = metrics.loadTimes.length > 0
            ? metrics.loadTimes.reduce((a, b) => a + b, 0) / metrics.loadTimes.length
            : 0;

        return {
            averageLoadTime: avgLoadTime.toFixed(2) + 'ms',
            cacheHitRate: metrics.cacheHits + metrics.cacheMisses > 0
                ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1) + '%'
                : 'N/A',
            cacheHits: metrics.cacheHits,
            cacheMisses: metrics.cacheMisses,
            loadTimes: metrics.loadTimes
        };
    }

    /**
     * Record cache hit
     */
    function recordCacheHit() {
        metrics.cacheHits++;
    }

    /**
     * Record cache miss
     */
    function recordCacheMiss() {
        metrics.cacheMisses++;
    }

    /**
     * Clear performance metrics
     */
    function clearMetrics() {
        metrics.loadTimes = [];
        metrics.cacheHits = 0;
        metrics.cacheMisses = 0;
        console.log('[Performance] Metrics cleared');
    }

    /**
     * Enable performance monitoring mode
     */
    function enableDebugMode() {
        console.log('[Performance] Debug mode enabled');

        // Log all performance marks
        if (window.performance && window.performance.getEntries) {
            const entries = window.performance.getEntries();
            console.table(entries);
        }
    }

    /**
     * Optimize animation frame rate
     * @param {Function} callback - Animation callback
     * @returns {number} Request ID
     */
    function requestOptimizedFrame(callback) {
        // Use requestAnimationFrame for smooth animations
        return requestAnimationFrame(callback);
    }

    /**
     * Cancel optimized frame
     * @param {number} requestId - Request ID from requestOptimizedFrame
     */
    function cancelOptimizedFrame(requestId) {
        cancelAnimationFrame(requestId);
    }

    // Public API
    return {
        init,
        observeElement,
        debounce,
        throttle,
        batchDOMUpdates,
        optimizeTableRendering,
        measurePerformance,
        optimizeChartData,
        preloadImages,
        getMetrics,
        recordCacheHit,
        recordCacheMiss,
        clearMetrics,
        enableDebugMode,
        requestOptimizedFrame,
        cancelOptimizedFrame
    };
})();

// Make available globally
window.Performance = Performance;