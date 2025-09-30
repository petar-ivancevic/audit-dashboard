/**
 * Main Dashboard Controller
 * Initializes and orchestrates all dashboard functionality
 */

(function () {
    'use strict';

    console.log('[Main] Enterprise Audit Dashboard initializing...');

    // Dashboard state
    const state = {
        currentView: 'executive',
        currentPeriod: 'q3-2024',
        enterpriseData: null,
        businessUnitsData: null,
        isLoading: false
    };

    /**
     * Initialize the dashboard
     */
    async function init() {
        try {
            // Show loading overlay
            showLoading('Loading dashboard data...');

            // Initialize modules
            Performance.init();
            FilterControls.init();
            DrillDown.init();
            ExportFunctions.init();

            // Setup event listeners
            setupEventListeners();

            // Load initial data
            await loadDashboardData();

            // Initialize views
            initializeExecutiveView();
            initializeBusinessUnitsView();
            initializeRiskAnalysisView();
            initializeComplianceView();
            initializeFindingsView();
            initializeTrendsView();

            // Set generated date
            updateGeneratedDate();

            // Hide loading overlay
            hideLoading();

            console.log('[Main] Dashboard initialized successfully');

        } catch (error) {
            console.error('[Main] Error initializing dashboard:', error);
            showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    /**
     * Load dashboard data
     */
    async function loadDashboardData() {
        try {
            state.isLoading = true;

            // Load enterprise and business unit data
            const data = await Performance.measurePerformance(
                () => DataLoader.preloadCriticalData(),
                'Data Loading'
            );

            state.enterpriseData = data.enterprise;
            state.businessUnitsData = data.businessUnits;

            console.log('[Main] Dashboard data loaded:', {
                enterprise: !!state.enterpriseData,
                businessUnits: state.businessUnitsData?.length || 0
            });

            state.isLoading = false;

        } catch (error) {
            state.isLoading = false;
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Navigation tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const viewId = tab.dataset.view;
                switchView(viewId);
            });
        });

        // Reporting period selector
        const periodSelector = document.getElementById('reportingPeriod');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                changePeriod(e.target.value);
            });
        }

        // Risk category selector (heat map)
        const riskCategorySelector = document.getElementById('riskCategory');
        if (riskCategorySelector) {
            riskCategorySelector.addEventListener('change', (e) => {
                updateHeatMap(e.target.value);
            });
        }
    }

    /**
     * Initialize executive view
     */
    function initializeExecutiveView() {
        if (!state.enterpriseData) return;

        console.log('[Main] Initializing executive view');

        const execDash = state.enterpriseData.executiveDashboard;

        // Update key metrics
        updateMetricCard('enterpriseScore', execDash.enterpriseRiskScore.current);
        updateMetricCard('totalBusinessUnits', state.businessUnitsData?.length || 15);
        updateMetricCard('activeFindings', execDash.alerts.critical + execDash.alerts.high + execDash.alerts.medium);
        updateMetricCard('complianceRate', execDash.keyMetrics.find(m => m.metric === 'Regulatory Compliance Score')?.value + '%');

        // Create heat map
        createRiskHeatMap(execDash.riskHeatMap);

        // Create executive charts
        createExecutiveCharts();

        // Load insights
        loadInsights(state.enterpriseData);
    }

    /**
     * Initialize business units view
     */
    function initializeBusinessUnitsView() {
        if (!state.businessUnitsData) return;

        console.log('[Main] Initializing business units view');

        // Populate business units table
        populateBusinessUnitsTable(state.businessUnitsData);

        // Setup select all checkbox
        FilterControls.setupSelectAll('selectAllBU', 'businessUnitsTableBody');

        // Setup compare button
        const compareButton = document.getElementById('compareSelected');
        if (compareButton) {
            compareButton.addEventListener('click', () => {
                const selected = FilterControls.getSelectedRows('businessUnitsTableBody');
                if (selected.length > 0) {
                    const ids = selected.map(row => row.data.id);
                    DrillDown.compareBusinessUnits(ids);
                } else {
                    alert('Please select business units to compare.');
                }
            });
        }
    }

    /**
     * Initialize risk analysis view
     */
    function initializeRiskAnalysisView() {
        console.log('[Main] Initializing risk analysis view');

        // Create risk analysis charts (lazy loaded when view is activated)
        // Charts will be created when user switches to this view
    }

    /**
     * Initialize compliance view
     */
    function initializeComplianceView() {
        console.log('[Main] Initializing compliance view');

        // Create compliance charts (lazy loaded when view is activated)
        // Charts will be created when user switches to this view
    }

    /**
     * Initialize findings view
     */
    function initializeFindingsView() {
        if (!state.enterpriseData) return;

        console.log('[Main] Initializing findings view');

        // Update findings summary
        const execDash = state.enterpriseData.executiveDashboard;
        updateElement('criticalFindings', execDash.alerts.critical);
        updateElement('highFindings', execDash.alerts.high);
        updateElement('mediumFindings', execDash.alerts.medium);
        updateElement('lowFindings', execDash.alerts.low);

        // Populate findings table
        populateFindingsTable();
    }

    /**
     * Initialize trends view
     */
    function initializeTrendsView() {
        console.log('[Main] Initializing trends view');

        // Create trend charts (lazy loaded when view is activated)
        // Charts will be created when user switches to this view
    }

    /**
     * Switch active view
     * @param {string} viewId - View identifier
     */
    function switchView(viewId) {
        console.log(`[Main] Switching to view: ${viewId}`);

        state.currentView = viewId;

        // Update navigation
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            if (tab.dataset.view === viewId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update views
        const views = document.querySelectorAll('.dashboard-view');
        views.forEach(view => {
            const currentViewId = view.id.replace('-view', '');
            if (currentViewId === viewId) {
                view.classList.add('active');
                // Lazy load charts for this view
                loadViewCharts(viewId);
            } else {
                view.classList.remove('active');
            }
        });
    }

    /**
     * Load charts for specific view
     * @param {string} viewId - View identifier
     */
    function loadViewCharts(viewId) {
        // Skip if already loaded
        const view = document.getElementById(`${viewId}-view`);
        if (view?.dataset.chartsLoaded === 'true') return;

        console.log(`[Main] Loading charts for view: ${viewId}`);

        switch (viewId) {
            case 'executive':
                createExecutiveCharts();
                break;
            case 'risk-analysis':
                createRiskAnalysisCharts();
                break;
            case 'compliance':
                createComplianceCharts();
                break;
            case 'findings':
                createFindingsCharts();
                break;
            case 'trends':
                createTrendsCharts();
                break;
        }

        if (view) {
            view.dataset.chartsLoaded = 'true';
        }
    }

    /**
     * Create executive dashboard charts
     */
    function createExecutiveCharts() {
        // Risk trend chart
        ChartEngine.createRiskTrendChart('riskTrendChart', {});

        // Findings category chart
        ChartEngine.createFindingsCategoryChart('findingsCategoryChart', {});

        // Compliance chart
        ChartEngine.createComplianceChart('complianceChart', {});

        // Alert volume chart
        ChartEngine.createAlertVolumeChart('alertVolumeChart', {});
    }

    /**
     * Create risk analysis charts
     */
    function createRiskAnalysisCharts() {
        ChartEngine.createScenarioChart('amlScenarioChart', {});

        ChartEngine.createChart('falsePositiveChart', {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                datasets: [{
                    label: 'False Positive Rate (%)',
                    data: [8.5, 8.2, 7.9, 7.5, 7.2, 6.8, 6.5, 6.2, 5.9],
                    borderColor: ChartEngine.colors.warning,
                    backgroundColor: ChartEngine.colors.warning.replace(')', ', 0.1)').replace('rgb', 'rgba'),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { callback: value => value + '%' }
                    }
                }
            }
        });

        // Additional risk charts
        createKYCCharts();
        createFraudCharts();
    }

    /**
     * Create compliance charts
     */
    function createComplianceCharts() {
        ChartEngine.createChart('examResultsChart', {
            type: 'bar',
            data: {
                labels: ['Q1 2024', 'Q2 2024', 'Q3 2024'],
                datasets: [{
                    label: 'Satisfactory',
                    data: [12, 11, 13],
                    backgroundColor: ChartEngine.colors.excellent
                }, {
                    label: 'Needs Improvement',
                    data: [2, 3, 1],
                    backgroundColor: ChartEngine.colors.warning
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });

        ChartEngine.createChart('trainingChart', {
            type: 'doughnut',
            data: {
                labels: ['AML/BSA', 'Fraud Prevention', 'Cyber Security', 'Ethics', 'Data Privacy'],
                datasets: [{
                    data: [98.2, 97.5, 96.8, 99.1, 94.3],
                    backgroundColor: [
                        ChartEngine.colors.primary,
                        ChartEngine.colors.secondary,
                        ChartEngine.colors.accent,
                        ChartEngine.colors.excellent,
                        ChartEngine.colors.good
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    /**
     * Create findings charts
     */
    function createFindingsCharts() {
        ChartEngine.createFindingsStatusChart('findingsStatusChart', {});

        ChartEngine.createChart('remediationChart', {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Remediation Progress (%)',
                    data: [15, 28, 42, 58, 71, 85],
                    borderColor: ChartEngine.colors.excellent,
                    backgroundColor: ChartEngine.colors.excellent.replace(')', ', 0.1)').replace('rgb', 'rgba'),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: value => value + '%' }
                    }
                }
            }
        });
    }

    /**
     * Create trends charts
     */
    function createTrendsCharts() {
        ChartEngine.createHistoricalTrendChart('historicalTrendChart', {});

        ChartEngine.createChart('forecastQ4Chart', {
            type: 'line',
            data: {
                labels: ['Q3 2024 Actual', 'Q4 2024 Forecast'],
                datasets: [{
                    label: 'Risk Score',
                    data: [81.8, 83.5],
                    borderColor: ChartEngine.colors.primary,
                    backgroundColor: ChartEngine.colors.primary.replace(')', ', 0.2)').replace('rgb', 'rgba'),
                    borderWidth: 2,
                    borderDash: [0, 0, 5, 5],
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false, min: 70, max: 90 } }
            }
        });

        ChartEngine.createChart('forecast2025Chart', {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: '2025 Projected Risk Score',
                    data: [84.2, 85.1, 85.8, 86.5],
                    backgroundColor: ChartEngine.colors.good
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false, min: 70, max: 90 } }
            }
        });

        ChartEngine.createBenchmarkChart('benchmarkChart', {});
    }

    /**
     * Create KYC charts
     */
    function createKYCCharts() {
        ChartEngine.createChart('kycCompletionChart', {
            type: 'bar',
            data: {
                labels: ['New Accounts', 'Periodic Reviews', 'High Risk', 'Enhanced DD'],
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: [98.5, 94.2, 96.8, 91.5],
                    backgroundColor: ChartEngine.colors.excellent
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: value => value + '%' }
                    }
                }
            }
        });

        ChartEngine.createChart('periodicReviewChart', {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                datasets: [{
                    label: 'On-Time Completion (%)',
                    data: [92.1, 93.5, 94.2, 93.8, 94.5, 95.1, 94.8, 95.3, 94.9],
                    borderColor: ChartEngine.colors.excellent,
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 90,
                        max: 100,
                        ticks: { callback: value => value + '%' }
                    }
                }
            }
        });
    }

    /**
     * Create fraud charts
     */
    function createFraudCharts() {
        ChartEngine.createChart('fraudLossChart', {
            type: 'bar',
            data: {
                labels: ['Consumer Banking', 'Commercial', 'Investment', 'Digital', 'Cards'],
                datasets: [{
                    label: 'Loss Rate (bps)',
                    data: [2.3, 1.8, 0.5, 3.1, 4.2],
                    backgroundColor: ChartEngine.colors.warning
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });

        ChartEngine.createChart('sanctionsCoverageChart', {
            type: 'doughnut',
            data: {
                labels: ['Screened', 'Not Screened'],
                datasets: [{
                    data: [99.8, 0.2],
                    backgroundColor: [ChartEngine.colors.excellent, ChartEngine.colors.critical]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    /**
     * Create risk heat map
     * @param {Array} heatMapData - Heat map data
     */
    function createRiskHeatMap(heatMapData) {
        const heatMapContainer = document.getElementById('riskHeatMap');
        if (!heatMapContainer || !heatMapData) return;

        heatMapContainer.innerHTML = '';

        heatMapData.forEach(unit => {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';

            // Determine risk level class
            const score = unit.riskScore;
            let riskClass = 'risk-critical';
            if (score >= 85) riskClass = 'risk-excellent';
            else if (score >= 75) riskClass = 'risk-good';
            else if (score >= 65) riskClass = 'risk-warning';

            cell.classList.add(riskClass);

            cell.innerHTML = `
                <div class="heatmap-cell-header">${unit.businessUnit}</div>
                <div class="heatmap-cell-score">${score}</div>
                <div class="heatmap-cell-footer">
                    <span class="heatmap-cell-trend ${unit.trend}">${unit.trend}</span>
                    <span class="heatmap-priority ${unit.priority}">${unit.priority}</span>
                </div>
            `;

            // Add click handler to open detail
            cell.addEventListener('click', () => {
                const buId = unit.businessUnit.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                DrillDown.openBusinessUnitDetail(buId);
            });

            heatMapContainer.appendChild(cell);
        });
    }

    /**
     * Update heat map based on category
     * @param {string} category - Risk category
     */
    function updateHeatMap(category) {
        console.log(`[Main] Updating heat map for category: ${category}`);

        if (!state.businessUnitsData) return;

        const heatMapContainer = document.getElementById('riskHeatMap');
        if (!heatMapContainer) return;

        heatMapContainer.innerHTML = '';

        // Build heat map data based on category
        state.businessUnitsData.forEach(buData => {
            const bu = buData.businessUnits?.[0];
            if (!bu) return;

            let score, scoreLabel;

            // Get score based on selected category
            switch(category) {
                case 'aml':
                    score = buData.operationalMetrics?.amlMonitoring?.effectiveness?.modelAccuracy || 0;
                    scoreLabel = 'AML';
                    break;
                case 'kyc':
                    const kycMetrics = buData.riskMetrics?.kycCompliance;
                    score = kycMetrics ? ((kycMetrics.completion.cip + kycMetrics.completion.cdd + kycMetrics.completion.edd) / 3) : 0;
                    scoreLabel = 'KYC';
                    break;
                case 'fraud':
                    score = buData.riskMetrics?.fraudPrevention?.detection?.modelAccuracy || 0;
                    scoreLabel = 'Fraud';
                    break;
                case 'cyber':
                    score = buData.executiveScorecard?.kpis?.find(k => k.id === 'cyber-posture')?.value || 0;
                    scoreLabel = 'Cyber';
                    break;
                default: // 'overall'
                    score = buData.executiveScorecard?.overallScore?.value || 0;
                    scoreLabel = 'Overall';
            }

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';

            // Determine risk level class
            let riskClass = 'risk-critical';
            if (score >= 85) riskClass = 'risk-excellent';
            else if (score >= 75) riskClass = 'risk-good';
            else if (score >= 65) riskClass = 'risk-warning';

            cell.classList.add(riskClass);

            const trend = buData.executiveScorecard?.overallScore?.trend || 'stable';
            const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';

            cell.innerHTML = `
                <div class="heatmap-cell-header">${bu.name}</div>
                <div class="heatmap-cell-score">${score.toFixed(1)}</div>
                <div class="heatmap-cell-footer">
                    <span class="heatmap-cell-trend ${trend}">${trendIcon} ${trend}</span>
                </div>
            `;

            // Add click handler
            cell.addEventListener('click', () => {
                DrillDown.openBusinessUnitDetail(bu.id);
            });

            heatMapContainer.appendChild(cell);
        });
    }

    /**
     * Populate business units table
     * @param {Array} businessUnits - Business units data
     */
    function populateBusinessUnitsTable(businessUnits) {
        const tbody = document.getElementById('businessUnitsTableBody');
        if (!tbody || !businessUnits) return;

        tbody.innerHTML = '';

        businessUnits.forEach(buData => {
            // Extract business unit info from the JSON structure
            const bu = buData.businessUnits?.[0];
            if (!bu) return;

            const scorecard = buData.executiveScorecard;
            const overallScore = scorecard?.overallScore?.value || 0;
            const trend = scorecard?.overallScore?.trend || 'stable';
            const findings = buData.auditFindings?.summary?.total || 0;

            // Calculate compliance rate from training and policy metrics
            const compliance = buData.complianceMetrics;
            const complianceRate = compliance?.training?.completion?.overall || 0;

            // Determine category display name
            let categoryDisplay = bu.category;
            if (categoryDisplay === 'core-banking') categoryDisplay = 'Core Banking';
            else if (categoryDisplay === 'support-operations') categoryDisplay = 'Support & Operations';
            else if (categoryDisplay === 'geographic-region') categoryDisplay = 'Geographic Region';

            const row = document.createElement('tr');
            row.dataset.id = bu.id;
            row.dataset.category = bu.category;
            row.dataset.score = overallScore;
            row.dataset.risktier = bu.riskTier;

            // Determine risk badge
            let riskBadge = 'critical';
            if (overallScore >= 90) riskBadge = 'excellent';
            else if (overallScore >= 80) riskBadge = 'good';
            else if (overallScore >= 70) riskBadge = 'warning';

            // Trend icon
            const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';

            row.innerHTML = `
                <td><input type="checkbox" class="bu-checkbox"></td>
                <td><strong>${bu.name}</strong></td>
                <td>${categoryDisplay}</td>
                <td><span class="status-badge ${riskBadge}">${overallScore.toFixed(1)}</span></td>
                <td><span class="trend-indicator ${trend}">${trendIcon}</span></td>
                <td>${findings}</td>
                <td>${complianceRate.toFixed(1)}%</td>
                <td><button class="btn btn-secondary" onclick="window.DrillDown.openBusinessUnitDetail('${bu.id}')">View Details</button></td>
            `;

            tbody.appendChild(row);
        });

        console.log(`[Main] Populated ${businessUnits.length} business units`);
    }

    /**
     * Populate findings table
     */
    function populateFindingsTable() {
        const tbody = document.getElementById('findingsTableBody');
        if (!tbody) return;

        // Sample findings data
        const findings = [
            { id: 'F-001', title: 'Incomplete KYC Documentation', unit: 'Consumer Banking', severity: 'high', category: 'KYC/CDD', status: 'Open', dueDate: '2024-10-15', owner: 'J. Smith' },
            { id: 'F-002', title: 'Transaction Monitoring Gaps', unit: 'Digital Banking', severity: 'critical', category: 'AML/BSA', status: 'In Progress', dueDate: '2024-10-01', owner: 'M. Johnson' },
            { id: 'F-003', title: 'Access Control Weakness', unit: 'Operations', severity: 'medium', category: 'Cyber Risk', status: 'In Progress', dueDate: '2024-11-30', owner: 'R. Chen' }
        ];

        tbody.innerHTML = '';

        findings.forEach(finding => {
            const row = document.createElement('tr');
            row.dataset.severity = finding.severity;

            row.innerHTML = `
                <td>${finding.id}</td>
                <td>${finding.title}</td>
                <td>${finding.unit}</td>
                <td><span class="severity-badge ${finding.severity}">${finding.severity}</span></td>
                <td>${finding.category}</td>
                <td><span class="status-badge">${finding.status}</span></td>
                <td>${finding.dueDate}</td>
                <td>${finding.owner}</td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Load insights
     * @param {Object} data - Enterprise data
     */
    function loadInsights(data) {
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        const insights = [
            {
                icon: '✓',
                type: 'positive',
                category: 'Compliance',
                title: 'Strong SAR Filing Performance',
                content: 'SAR filing timeliness improved to 97.2%, exceeding the 95% target. Consistent performance across all business units.',
                impact: 'low'
            },
            {
                icon: '⚠',
                type: 'warning',
                category: 'Risk Management',
                title: 'Operations & Technology Risk Score Below Target',
                content: 'Current score of 73.8 is below the 85.0 target. Key drivers: cyber risk controls and operational resilience gaps.',
                impact: 'high'
            },
            {
                icon: '↑',
                type: 'positive',
                category: 'Trend',
                title: 'Declining Alert False Positive Rate',
                content: 'Transaction monitoring false positives decreased from 8.5% to 5.9% over the past 9 months through scenario tuning.',
                impact: 'medium'
            }
        ];

        container.innerHTML = '';

        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = `insight-card ${insight.type}`;

            card.innerHTML = `
                <div class="insight-header">
                    <div class="insight-icon">${insight.icon}</div>
                    <div>
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-category">${insight.category}</div>
                    </div>
                </div>
                <div class="insight-body">${insight.content}</div>
                <div class="insight-footer">
                    <span class="insight-impact ${insight.impact}">Impact: ${insight.impact}</span>
                    <span class="insight-action">View Details →</span>
                </div>
            `;

            container.appendChild(card);
        });
    }

    /**
     * Change reporting period
     * @param {string} period - New reporting period
     */
    async function changePeriod(period) {
        console.log(`[Main] Changing period to: ${period}`);

        state.currentPeriod = period;

        try {
            showLoading('Loading data for ' + period + '...');

            // Reload data for new period
            const data = await DataLoader.loadDataByPeriod(period);
            state.enterpriseData = data;

            // Reinitialize current view
            initializeExecutiveView();

            hideLoading();

        } catch (error) {
            console.error('[Main] Error changing period:', error);
            hideLoading();
            showError('Failed to load data for the selected period.');
        }
    }

    /**
     * Update metric card value
     * @param {string} elementId - Element ID
     * @param {*} value - New value
     */
    function updateMetricCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Update element text
     * @param {string} elementId - Element ID
     * @param {*} value - New value
     */
    function updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Get risk tier based on score
     * @param {number} score - Risk score
     * @returns {string} Risk tier
     */
    function getRiskTier(score) {
        if (score >= 80) return 'low';
        if (score >= 70) return 'medium';
        return 'high';
    }

    /**
     * Get risk badge
     * @param {number} score - Risk score
     * @returns {Object} Badge object
     */
    function getRiskBadge(score) {
        if (score >= 85) return { class: 'excellent', label: 'Excellent' };
        if (score >= 75) return { class: 'good', label: 'Good' };
        if (score >= 65) return { class: 'warning', label: 'Fair' };
        return { class: 'critical', label: 'Poor' };
    }

    /**
     * Get trend icon
     * @param {string} trend - Trend direction
     * @returns {string} Trend icon
     */
    function getTrendIcon(trend) {
        if (trend === 'up' || trend === 'improving') return '↑';
        if (trend === 'down' || trend === 'declining') return '↓';
        return '→';
    }

    /**
     * Update generated date
     */
    function updateGeneratedDate() {
        const element = document.getElementById('generatedDate');
        if (element) {
            const now = new Date();
            element.textContent = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    function showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const messageElement = overlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showError(message) {
        alert('Error: ' + message);
    }

    // Initialize dashboard when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.DashboardState = state;

})();