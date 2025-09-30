/**
 * Chart Engine Module
 * Handles Chart.js chart creation and configuration
 */

const ChartEngine = (() => {
    // Store chart instances for cleanup
    const chartInstances = new Map();

    // Color palette from CSS variables
    const colors = {
        primary: '#2c5aa0',
        primaryDark: '#1e3d6f',
        primaryLight: '#4a7bc8',
        secondary: '#5c6bc0',
        accent: '#26a69a',
        excellent: '#2e7d32',
        good: '#66bb6a',
        warning: '#ffa726',
        critical: '#d32f2f',
        severityCritical: '#b71c1c',
        severityHigh: '#d84315',
        severityMedium: '#f57c00',
        severityLow: '#fbc02d',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        borderColor: '#e0e4e8'
    };

    // Chart.js default configuration
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    Chart.defaults.color = colors.textSecondary;
    Chart.defaults.borderColor = colors.borderColor;

    /**
     * Create or update a chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} config - Chart.js configuration
     * @returns {Chart} Chart instance
     */
    function createChart(canvasId, config) {
        // Destroy existing chart if it exists
        if (chartInstances.has(canvasId)) {
            chartInstances.get(canvasId).destroy();
        }

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`[ChartEngine] Canvas not found: ${canvasId}`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, config);

        chartInstances.set(canvasId, chart);
        console.log(`[ChartEngine] Created chart: ${canvasId}`);

        return chart;
    }

    /**
     * Create risk trend line chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createRiskTrendChart(canvasId, data) {
        const config = {
            type: 'line',
            data: {
                labels: data.labels || ['Q1 2024', 'Q2 2024', 'Q3 2024'],
                datasets: [
                    {
                        label: 'Enterprise Risk Score',
                        data: data.enterpriseScore || [79.2, 80.5, 81.8],
                        borderColor: colors.primary,
                        backgroundColor: hexToRgba(colors.primary, 0.1),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Target',
                        data: data.target || [85.0, 85.0, 85.0],
                        borderColor: colors.excellent,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 90,
                        ticks: {
                            callback: value => value.toFixed(1)
                        }
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Create findings category doughnut chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createFindingsCategoryChart(canvasId, data) {
        const config = {
            type: 'doughnut',
            data: {
                labels: data.labels || ['AML/BSA', 'KYC/CDD', 'Fraud', 'Cyber Risk', 'Other'],
                datasets: [{
                    data: data.values || [22, 18, 15, 12, 8],
                    backgroundColor: [
                        colors.primary,
                        colors.secondary,
                        colors.accent,
                        colors.warning,
                        colors.textSecondary
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Create compliance metrics bar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createComplianceChart(canvasId, data) {
        const config = {
            type: 'bar',
            data: {
                labels: data.labels || ['SAR Timeliness', 'Training', 'Policy Currency', 'Control Testing'],
                datasets: [{
                    label: 'Compliance Rate (%)',
                    data: data.values || [97.2, 95.9, 92.8, 89.7],
                    backgroundColor: [
                        colors.excellent,
                        colors.excellent,
                        colors.good,
                        colors.good
                    ],
                    borderColor: colors.borderColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: context => `${context.parsed.y.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Create alert volume line chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createAlertVolumeChart(canvasId, data) {
        const config = {
            type: 'line',
            data: {
                labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                datasets: [
                    {
                        label: 'Total Alerts',
                        data: data.totalAlerts || [342, 356, 389, 378, 401, 425, 412, 398, 386],
                        borderColor: colors.primary,
                        backgroundColor: hexToRgba(colors.primary, 0.1),
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Escalation Rate (%)',
                        data: data.escalationRate || [12.5, 11.8, 13.2, 12.9, 11.5, 10.8, 11.2, 10.5, 9.8],
                        borderColor: colors.warning,
                        backgroundColor: hexToRgba(colors.warning, 0.1),
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Alert Count'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Escalation Rate (%)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Create horizontal bar chart for scenario analysis
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createScenarioChart(canvasId, data) {
        const config = {
            type: 'bar',
            data: {
                labels: data.labels || [
                    'Structuring',
                    'Rapid Movement',
                    'High Risk Geography',
                    'Large Cash Transactions',
                    'Wire Transfer Patterns'
                ],
                datasets: [{
                    label: 'Alert Volume',
                    data: data.values || [89, 76, 62, 54, 45],
                    backgroundColor: colors.primary,
                    borderColor: colors.borderColor,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Create stacked bar chart for findings status
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createFindingsStatusChart(canvasId, data) {
        const config = {
            type: 'bar',
            data: {
                labels: data.labels || ['Critical', 'High', 'Medium', 'Low'],
                datasets: [
                    {
                        label: 'Open',
                        data: data.open || [2, 8, 15, 5],
                        backgroundColor: colors.critical
                    },
                    {
                        label: 'In Progress',
                        data: data.inProgress || [1, 5, 18, 8],
                        backgroundColor: colors.warning
                    },
                    {
                        label: 'Completed',
                        data: data.completed || [0, 2, 6, 5],
                        backgroundColor: colors.excellent
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Create historical trend multi-line chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createHistoricalTrendChart(canvasId, data) {
        const config = {
            type: 'line',
            data: {
                labels: data.labels || ['Q1 22', 'Q2 22', 'Q3 22', 'Q4 22', 'Q1 23', 'Q2 23', 'Q3 23', 'Q4 23', 'Q1 24', 'Q2 24', 'Q3 24'],
                datasets: [
                    {
                        label: 'Risk Score',
                        data: data.riskScore || [75.2, 76.8, 77.5, 78.1, 77.9, 78.8, 79.5, 79.2, 79.2, 80.5, 81.8],
                        borderColor: colors.primary,
                        backgroundColor: hexToRgba(colors.primary, 0.1),
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Compliance Rate',
                        data: data.complianceRate || [88.5, 89.2, 90.1, 90.8, 91.0, 91.5, 91.2, 91.8, 92.1, 91.9, 92.4],
                        borderColor: colors.excellent,
                        backgroundColor: hexToRgba(colors.excellent, 0.1),
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 100
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Create benchmark comparison chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     */
    function createBenchmarkChart(canvasId, data) {
        const config = {
            type: 'radar',
            data: {
                labels: data.labels || ['Risk Management', 'Compliance', 'Audit Coverage', 'Training', 'Technology', 'Reporting'],
                datasets: [
                    {
                        label: 'Our Organization',
                        data: data.ourOrg || [81.8, 92.4, 87.4, 95.9, 78.5, 88.2],
                        borderColor: colors.primary,
                        backgroundColor: hexToRgba(colors.primary, 0.2),
                        borderWidth: 2
                    },
                    {
                        label: 'Industry Average',
                        data: data.industry || [78.5, 85.2, 82.1, 88.5, 75.8, 81.3],
                        borderColor: colors.secondary,
                        backgroundColor: hexToRgba(colors.secondary, 0.2),
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        };

        return createChart(canvasId, config);
    }

    /**
     * Convert hex color to rgba
     * @param {string} hex - Hex color code
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} RGBA color string
     */
    function hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Destroy a chart instance
     * @param {string} canvasId - Canvas element ID
     */
    function destroyChart(canvasId) {
        if (chartInstances.has(canvasId)) {
            chartInstances.get(canvasId).destroy();
            chartInstances.delete(canvasId);
            console.log(`[ChartEngine] Destroyed chart: ${canvasId}`);
        }
    }

    /**
     * Destroy all chart instances
     */
    function destroyAllCharts() {
        chartInstances.forEach((chart, id) => {
            chart.destroy();
            console.log(`[ChartEngine] Destroyed chart: ${id}`);
        });
        chartInstances.clear();
    }

    /**
     * Update chart data
     * @param {string} canvasId - Canvas element ID
     * @param {Object} newData - New data for the chart
     */
    function updateChart(canvasId, newData) {
        const chart = chartInstances.get(canvasId);
        if (chart) {
            chart.data = newData;
            chart.update();
            console.log(`[ChartEngine] Updated chart: ${canvasId}`);
        } else {
            console.warn(`[ChartEngine] Chart not found: ${canvasId}`);
        }
    }

    // Public API
    return {
        createChart,
        createRiskTrendChart,
        createFindingsCategoryChart,
        createComplianceChart,
        createAlertVolumeChart,
        createScenarioChart,
        createFindingsStatusChart,
        createHistoricalTrendChart,
        createBenchmarkChart,
        destroyChart,
        destroyAllCharts,
        updateChart,
        colors
    };
})();

// Make available globally
window.ChartEngine = ChartEngine;