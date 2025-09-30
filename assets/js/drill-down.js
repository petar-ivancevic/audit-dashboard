/**
 * Drill-Down Module
 * Handles business unit detail panel and navigation between views
 */

const DrillDown = (() => {
    let currentBusinessUnit = null;
    let detailCharts = [];

    /**
     * Initialize drill-down functionality
     */
    function init() {
        console.log('[DrillDown] Initializing drill-down functionality');

        // Setup close button
        const closeButton = document.getElementById('closeDetailPanel');
        if (closeButton) {
            closeButton.addEventListener('click', closeDetailPanel);
        }

        // Setup escape key to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDetailPanel();
            }
        });

        // Setup click outside to close
        const detailPanel = document.getElementById('buDetailPanel');
        if (detailPanel) {
            detailPanel.addEventListener('click', (e) => {
                if (e.target === detailPanel) {
                    closeDetailPanel();
                }
            });
        }
    }

    /**
     * Open business unit detail panel
     * @param {string} businessUnitId - Business unit identifier
     */
    async function openBusinessUnitDetail(businessUnitId) {
        console.log(`[DrillDown] Opening detail for: ${businessUnitId}`);

        const detailPanel = document.getElementById('buDetailPanel');
        const detailTitle = document.getElementById('buDetailTitle');
        const detailContent = document.getElementById('buDetailContent');

        if (!detailPanel || !detailTitle || !detailContent) {
            console.error('[DrillDown] Detail panel elements not found');
            return;
        }

        try {
            // Show loading state
            detailContent.innerHTML = '<div class="loading-state">Loading business unit details...</div>';
            detailPanel.classList.remove('hidden');

            // Load business unit data
            const data = await DataLoader.loadBusinessUnitData(businessUnitId);
            currentBusinessUnit = data;

            // Update title
            detailTitle.textContent = data.businessUnit?.name || 'Business Unit Details';

            // Render detail content
            renderDetailContent(data);

            // Create detail charts
            createDetailCharts(data);

        } catch (error) {
            console.error('[DrillDown] Error loading business unit details:', error);
            detailContent.innerHTML = `
                <div class="error-state">
                    <p>Unable to load business unit details.</p>
                    <p class="error-message">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Render detail panel content
     * @param {Object} data - Business unit data
     */
    function renderDetailContent(data) {
        const detailContent = document.getElementById('buDetailContent');
        if (!detailContent) return;

        // Extract data from the correct JSON structure
        const bu = data.businessUnits?.[0] || {};
        const scorecard = data.executiveScorecard || {};
        const findings = data.auditFindings?.findings || [];
        const complianceMetrics = data.complianceMetrics || {};
        const riskMetrics = data.riskMetrics || {};

        // Calculate metrics
        const overallScore = scorecard.overallScore?.value || 0;
        const complianceRate = complianceMetrics.training?.completion?.overall || 0;
        const activeFindings = findings.filter(f => f.status !== 'Closed').length;
        const auditCoverage = complianceMetrics.controlTesting?.passRate || 0;

        // Get category display name
        let categoryDisplay = bu.category;
        if (categoryDisplay === 'core-banking') categoryDisplay = 'Core Banking';
        else if (categoryDisplay === 'support-operations') categoryDisplay = 'Support & Operations';
        else if (categoryDisplay === 'geographic-region') categoryDisplay = 'Geographic Region';

        detailContent.innerHTML = `
            <!-- Overview Section -->
            <div class="detail-section">
                <h3>Overview</h3>
                <div class="detail-metrics">
                    <div class="detail-metric">
                        <div class="detail-metric-label">Risk Score</div>
                        <div class="detail-metric-value" style="color: ${getRiskColor(overallScore)}">${overallScore.toFixed(1)}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Compliance Rate</div>
                        <div class="detail-metric-value">${complianceRate.toFixed(1)}%</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Active Findings</div>
                        <div class="detail-metric-value">${activeFindings}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Audit Coverage</div>
                        <div class="detail-metric-value">${auditCoverage.toFixed(1)}%</div>
                    </div>
                </div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">
                    <strong>Category:</strong> ${categoryDisplay}<br>
                    <strong>Region:</strong> ${bu.region || 'N/A'}<br>
                    <strong>Head Count:</strong> ${bu.headcount?.toLocaleString() || 'N/A'}<br>
                    <strong>Risk Tier:</strong> ${bu.riskTier || 'N/A'}
                </p>
            </div>

            <!-- Risk Assessment Section -->
            <div class="detail-section">
                <h3>Risk Assessment</h3>
                <div class="chart-container">
                    <canvas id="detailRiskChart"></canvas>
                </div>
            </div>

            <!-- Compliance Metrics Section -->
            <div class="detail-section">
                <h3>Compliance Metrics</h3>
                <div class="detail-metrics">
                    <div class="detail-metric">
                        <div class="detail-metric-label">AML/BSA</div>
                        <div class="detail-metric-value">${(data.operationalMetrics?.amlMonitoring?.effectiveness?.modelAccuracy || 0).toFixed(1)}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">KYC/CDD</div>
                        <div class="detail-metric-value">${(riskMetrics.kycCompliance?.completion?.cdd || 0).toFixed(1)}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Fraud Prevention</div>
                        <div class="detail-metric-value">${(riskMetrics.fraudPrevention?.detection?.modelAccuracy || 0).toFixed(1)}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Cyber Security</div>
                        <div class="detail-metric-value">${(complianceMetrics.training?.completion?.cyberSecurity || 0).toFixed(1)}</div>
                    </div>
                </div>
            </div>

            <!-- Findings Summary Section -->
            <div class="detail-section">
                <h3>Findings Summary</h3>
                <div class="findings-breakdown">
                    ${renderFindingsBreakdown(findings)}
                </div>
            </div>

            <!-- Transaction Monitoring Section -->
            <div class="detail-section">
                <h3>Transaction Monitoring</h3>
                <div class="chart-container">
                    <canvas id="detailTransactionChart"></canvas>
                </div>
            </div>

            <!-- Key Risks Section -->
            <div class="detail-section">
                <h3>Key Risk Areas</h3>
                <div class="detail-metrics">
                    <div class="detail-metric">
                        <div class="detail-metric-label">AML/BSA Risk</div>
                        <div class="detail-metric-value">${getRiskLevel(data.operationalMetrics?.amlMonitoring?.effectiveness?.modelAccuracy || 0)}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Fraud Risk</div>
                        <div class="detail-metric-value">${getRiskLevel(riskMetrics.fraudPrevention?.detection?.modelAccuracy || 0)}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Operational Risk</div>
                        <div class="detail-metric-value">${getRiskLevel(riskMetrics.operationalRisk?.overallScore || 0)}</div>
                    </div>
                    <div class="detail-metric">
                        <div class="detail-metric-label">Cyber Risk</div>
                        <div class="detail-metric-value">${getRiskLevel(complianceMetrics.training?.completion?.cyberSecurity || 0)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render findings breakdown
     * @param {Array} findings - Findings array
     * @returns {string} HTML string
     */
    function renderFindingsBreakdown(findings) {
        const breakdown = {
            critical: findings.filter(f => f.severity?.toLowerCase() === 'critical').length,
            high: findings.filter(f => f.severity?.toLowerCase() === 'high').length,
            medium: findings.filter(f => f.severity?.toLowerCase() === 'medium').length,
            low: findings.filter(f => f.severity?.toLowerCase() === 'low').length
        };

        return `
            <div class="detail-metrics">
                <div class="detail-metric" style="border-left-color: var(--severity-critical)">
                    <div class="detail-metric-label">Critical</div>
                    <div class="detail-metric-value" style="color: var(--severity-critical)">${breakdown.critical}</div>
                </div>
                <div class="detail-metric" style="border-left-color: var(--severity-high)">
                    <div class="detail-metric-label">High</div>
                    <div class="detail-metric-value" style="color: var(--severity-high)">${breakdown.high}</div>
                </div>
                <div class="detail-metric" style="border-left-color: var(--severity-medium)">
                    <div class="detail-metric-label">Medium</div>
                    <div class="detail-metric-value" style="color: var(--severity-medium)">${breakdown.medium}</div>
                </div>
                <div class="detail-metric" style="border-left-color: var(--severity-low)">
                    <div class="detail-metric-label">Low</div>
                    <div class="detail-metric-value" style="color: var(--severity-low)">${breakdown.low}</div>
                </div>
            </div>
        `;
    }

    /**
     * Render key risks
     * @param {Array} risks - Key risks array
     * @returns {string} HTML string
     */
    function renderKeyRisks(risks) {
        if (!risks || risks.length === 0) {
            return '<p style="color: var(--text-secondary);">No key risks identified.</p>';
        }

        return `
            <ul style="list-style: none; padding: 0;">
                ${risks.map(risk => `
                    <li style="margin-bottom: 1rem; padding: 0.75rem; background: var(--background-color); border-radius: var(--radius-md); border-left: 3px solid var(--warning-color);">
                        <strong>${risk.category || 'Risk'}</strong><br>
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">${risk.description || 'No description'}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    /**
     * Render recent activity
     * @param {Array} activities - Recent activity array
     * @returns {string} HTML string
     */
    function renderRecentActivity(activities) {
        if (!activities || activities.length === 0) {
            return '<p style="color: var(--text-secondary);">No recent activity.</p>';
        }

        return `
            <ul style="list-style: none; padding: 0;">
                ${activities.slice(0, 5).map(activity => `
                    <li style="margin-bottom: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong>${activity.type || 'Activity'}</strong><br>
                                <span style="color: var(--text-secondary); font-size: 0.85rem;">${activity.description || 'No description'}</span>
                            </div>
                            <span style="color: var(--text-muted); font-size: 0.8rem; white-space: nowrap; margin-left: 1rem;">
                                ${formatDate(activity.date)}
                            </span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    /**
     * Create charts for detail panel
     * @param {Object} data - Business unit data
     */
    function createDetailCharts(data) {
        // Destroy existing charts
        destroyDetailCharts();

        // Extract data from correct JSON structure
        const operationalMetrics = data.operationalMetrics || {};
        const riskMetrics = data.riskMetrics || {};
        const complianceMetrics = data.complianceMetrics || {};

        // Calculate scores
        const amlScore = operationalMetrics.amlMonitoring?.effectiveness?.modelAccuracy || 0;
        const kycScore = riskMetrics.kycCompliance?.completion?.cdd || 0;
        const fraudScore = riskMetrics.fraudPrevention?.detection?.modelAccuracy || 0;
        const cyberScore = complianceMetrics.training?.completion?.cyberSecurity || 0;
        const operationalScore = riskMetrics.operationalRisk?.overallScore || 0;
        const complianceScore = complianceMetrics.training?.completion?.overall || 0;

        // Risk assessment radar chart
        setTimeout(() => {
            const riskChart = ChartEngine.createChart('detailRiskChart', {
                type: 'radar',
                data: {
                    labels: ['AML/BSA', 'KYC/CDD', 'Fraud', 'Cyber', 'Operational', 'Compliance'],
                    datasets: [{
                        label: 'Risk Score',
                        data: [
                            amlScore,
                            kycScore,
                            fraudScore,
                            cyberScore,
                            operationalScore,
                            complianceScore
                        ],
                        borderColor: ChartEngine.colors.primary,
                        backgroundColor: ChartEngine.colors.primary.replace(')', ', 0.2)').replace('rgb', 'rgba'),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            if (riskChart) detailCharts.push(riskChart);
        }, 100);

        // Transaction monitoring chart - use AML scenarios from operational metrics
        setTimeout(() => {
            const scenarios = operationalMetrics.amlMonitoring?.scenarios || [];
            const scenarioNames = scenarios.map(s => s.name);
            const alertVolumes = scenarios.map(s => s.alertVolume);

            const transactionChart = ChartEngine.createChart('detailTransactionChart', {
                type: 'bar',
                data: {
                    labels: scenarioNames.length > 0 ? scenarioNames : ['No Data'],
                    datasets: [{
                        label: 'Alerts Generated',
                        data: alertVolumes.length > 0 ? alertVolumes : [0],
                        backgroundColor: ChartEngine.colors.primary,
                        borderColor: ChartEngine.colors.borderColor,
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
                        title: {
                            display: true,
                            text: 'AML Alert Volume by Scenario'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            if (transactionChart) detailCharts.push(transactionChart);
        }, 200);
    }

    /**
     * Destroy detail panel charts
     */
    function destroyDetailCharts() {
        detailCharts.forEach(chart => {
            if (chart) chart.destroy();
        });
        detailCharts = [];
    }

    /**
     * Close detail panel
     */
    function closeDetailPanel() {
        const detailPanel = document.getElementById('buDetailPanel');
        if (detailPanel) {
            detailPanel.classList.add('hidden');
            destroyDetailCharts();
            currentBusinessUnit = null;
            console.log('[DrillDown] Closed detail panel');
        }
    }

    /**
     * Get risk color based on score
     * @param {number} score - Risk score
     * @returns {string} CSS color variable
     */
    function getRiskColor(score) {
        if (score >= 85) return 'var(--excellent-color)';
        if (score >= 75) return 'var(--good-color)';
        if (score >= 65) return 'var(--warning-color)';
        return 'var(--critical-color)';
    }

    /**
     * Get risk level label based on score
     * @param {number} score - Risk score (0-100)
     * @returns {string} Risk level label
     */
    function getRiskLevel(score) {
        if (score >= 85) return 'Low Risk';
        if (score >= 75) return 'Moderate Risk';
        if (score >= 65) return 'Elevated Risk';
        return 'High Risk';
    }

    /**
     * Format date string
     * @param {string} dateString - Date string
     * @returns {string} Formatted date
     */
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Navigate to specific view
     * @param {string} viewId - View identifier
     */
    function navigateToView(viewId) {
        console.log(`[DrillDown] Navigating to view: ${viewId}`);

        // Hide all views
        const views = document.querySelectorAll('.dashboard-view');
        views.forEach(view => view.classList.remove('active'));

        // Show target view
        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Update navigation tabs
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            if (tab.dataset.view === viewId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Close detail panel if open
        closeDetailPanel();
    }

    /**
     * Setup comparison functionality
     * @param {Array} selectedBusinessUnits - Selected business unit IDs
     */
    async function compareBusinessUnits(selectedBusinessUnits) {
        console.log('[DrillDown] Comparing business units:', selectedBusinessUnits);

        if (selectedBusinessUnits.length < 2) {
            alert('Please select at least 2 business units to compare.');
            return;
        }

        if (selectedBusinessUnits.length > 5) {
            alert('Please select no more than 5 business units to compare.');
            return;
        }

        try {
            // Load data for all selected business units
            const buDataPromises = selectedBusinessUnits.map(id => DataLoader.loadBusinessUnitData(id));
            const buDataArray = await Promise.all(buDataPromises);

            // Create comparison HTML
            let comparisonHTML = '<table class="comparison-table"><thead><tr><th>Metric</th>';

            buDataArray.forEach(buData => {
                const bu = buData.businessUnits?.[0];
                comparisonHTML += `<th>${bu?.name || 'Unknown'}</th>`;
            });

            comparisonHTML += '</tr></thead><tbody>';

            // Add rows for key metrics
            const metrics = [
                { label: 'Overall Risk Score', getValue: (data) => data.executiveScorecard?.overallScore?.value?.toFixed(1) || 'N/A' },
                { label: 'Compliance Rate', getValue: (data) => (data.complianceMetrics?.training?.completion?.overall?.toFixed(1) || 'N/A') + '%' },
                { label: 'Active Findings', getValue: (data) => data.auditFindings?.findings?.filter(f => f.status !== 'Closed').length || 0 },
                { label: 'Risk Tier', getValue: (data) => data.businessUnits?.[0]?.riskTier || 'N/A' },
                { label: 'Headcount', getValue: (data) => data.businessUnits?.[0]?.headcount?.toLocaleString() || 'N/A' }
            ];

            metrics.forEach(metric => {
                comparisonHTML += `<tr><td><strong>${metric.label}</strong></td>`;
                buDataArray.forEach(buData => {
                    comparisonHTML += `<td>${metric.getValue(buData)}</td>`;
                });
                comparisonHTML += '</tr>';
            });

            comparisonHTML += '</tbody></table>';

            // Show comparison in the detail panel
            const detailPanel = document.getElementById('buDetailPanel');
            const detailTitle = document.getElementById('buDetailTitle');
            const detailContent = document.getElementById('buDetailContent');

            if (detailPanel && detailTitle && detailContent) {
                detailTitle.textContent = `Comparison: ${selectedBusinessUnits.length} Business Units`;
                detailContent.innerHTML = `
                    <div class="detail-section">
                        <h3>Business Unit Comparison</h3>
                        ${comparisonHTML}
                    </div>
                    <style>
                        .comparison-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 1rem;
                        }
                        .comparison-table th,
                        .comparison-table td {
                            padding: 0.75rem;
                            text-align: left;
                            border-bottom: 1px solid var(--border-color);
                        }
                        .comparison-table thead th {
                            background-color: var(--primary-color);
                            color: white;
                            font-weight: 600;
                        }
                        .comparison-table tbody tr:hover {
                            background-color: var(--bg-secondary);
                        }
                    </style>
                `;
                detailPanel.classList.remove('hidden');
            }

        } catch (error) {
            console.error('[DrillDown] Error comparing business units:', error);
            alert('Error loading business unit data for comparison.');
        }
    }

    /**
     * Get current business unit data
     * @returns {Object|null} Current business unit data
     */
    function getCurrentBusinessUnit() {
        return currentBusinessUnit;
    }

    // Public API
    return {
        init,
        openBusinessUnitDetail,
        closeDetailPanel,
        navigateToView,
        compareBusinessUnits,
        getCurrentBusinessUnit
    };
})();

// Make available globally
window.DrillDown = DrillDown;