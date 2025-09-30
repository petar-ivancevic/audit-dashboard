/**
 * Export Functions Module
 * Handles PDF export, Excel export, and print functionality
 */

const ExportFunctions = (() => {

    /**
     * Initialize export functions
     */
    function init() {
        console.log('[ExportFunctions] Initializing export functions');

        // PDF Export button
        const pdfButton = document.getElementById('exportPDF');
        if (pdfButton) {
            pdfButton.addEventListener('click', exportToPDF);
        }

        // Excel Export button
        const excelButton = document.getElementById('exportExcel');
        if (excelButton) {
            excelButton.addEventListener('click', exportToExcel);
        }

        // Print button
        const printButton = document.getElementById('printDashboard');
        if (printButton) {
            printButton.addEventListener('click', printDashboard);
        }
    }

    /**
     * Export dashboard to PDF
     * Uses browser's print to PDF functionality
     */
    function exportToPDF() {
        console.log('[ExportFunctions] Exporting to PDF');

        // Show message
        showExportMessage('Preparing PDF export...');

        // Use print dialog which allows "Save as PDF"
        setTimeout(() => {
            window.print();
            hideExportMessage();
        }, 500);
    }

    /**
     * Export data to Excel
     * Creates a CSV file that can be opened in Excel
     */
    async function exportToExcel() {
        console.log('[ExportFunctions] Exporting to Excel');

        try {
            showExportMessage('Preparing Excel export...');

            // Get current active view
            const activeView = document.querySelector('.dashboard-view.active');
            const viewId = activeView ? activeView.id : 'executive-view';

            let csvContent = '';
            let fileName = 'dashboard-export.csv';

            // Export based on active view
            if (viewId === 'business-units-view') {
                csvContent = exportBusinessUnitsToCSV();
                fileName = 'business-units-export.csv';
            } else if (viewId === 'findings-view') {
                csvContent = exportFindingsToCSV();
                fileName = 'findings-export.csv';
            } else {
                csvContent = exportExecutiveSummaryToCSV();
                fileName = 'executive-summary-export.csv';
            }

            // Download CSV file
            downloadCSV(csvContent, fileName);

            hideExportMessage();
            showSuccessMessage('Excel export completed successfully!');

        } catch (error) {
            console.error('[ExportFunctions] Error exporting to Excel:', error);
            hideExportMessage();
            showErrorMessage('Failed to export to Excel. Please try again.');
        }
    }

    /**
     * Export business units table to CSV
     * @returns {string} CSV content
     */
    function exportBusinessUnitsToCSV() {
        const table = document.getElementById('businessUnitsTable');
        if (!table) return '';

        const rows = [];

        // Add header row
        const headers = Array.from(table.querySelectorAll('thead th'))
            .filter(th => !th.querySelector('input[type="checkbox"]'))
            .map(th => escapeCSV(th.textContent.trim()));
        rows.push(headers.join(','));

        // Add data rows
        const tbody = table.querySelector('tbody');
        if (tbody) {
            const dataRows = Array.from(tbody.querySelectorAll('tr'))
                .filter(tr => tr.style.display !== 'none');

            dataRows.forEach(tr => {
                const cells = Array.from(tr.querySelectorAll('td'))
                    .filter(td => !td.querySelector('input[type="checkbox"]'))
                    .map(td => {
                        // Remove action buttons and get text content
                        const clone = td.cloneNode(true);
                        const buttons = clone.querySelectorAll('button');
                        buttons.forEach(btn => btn.remove());
                        return escapeCSV(clone.textContent.trim());
                    });
                rows.push(cells.join(','));
            });
        }

        return rows.join('\n');
    }

    /**
     * Export findings table to CSV
     * @returns {string} CSV content
     */
    function exportFindingsToCSV() {
        const table = document.getElementById('findingsTable');
        if (!table) return '';

        const rows = [];

        // Add header row
        const headers = Array.from(table.querySelectorAll('thead th'))
            .map(th => escapeCSV(th.textContent.trim()));
        rows.push(headers.join(','));

        // Add data rows
        const tbody = table.querySelector('tbody');
        if (tbody) {
            const dataRows = Array.from(tbody.querySelectorAll('tr'))
                .filter(tr => tr.style.display !== 'none');

            dataRows.forEach(tr => {
                const cells = Array.from(tr.querySelectorAll('td'))
                    .map(td => escapeCSV(td.textContent.trim()));
                rows.push(cells.join(','));
            });
        }

        return rows.join('\n');
    }

    /**
     * Export executive summary metrics to CSV
     * @returns {string} CSV content
     */
    function exportExecutiveSummaryToCSV() {
        const rows = [];

        // Add title
        rows.push('Enterprise Audit Dashboard - Executive Summary');
        rows.push('');

        // Add key metrics
        rows.push('Key Metrics');
        rows.push('Metric,Value,Target,Status');

        const metrics = [
            { name: 'Enterprise Risk Score', id: 'enterpriseScore', target: '85.0' },
            { name: 'Total Business Units', id: 'totalBusinessUnits', target: '-' },
            { name: 'Active Findings', id: 'activeFindings', target: '-' },
            { name: 'Compliance Rate', id: 'complianceRate', target: '90.0%' }
        ];

        metrics.forEach(metric => {
            const element = document.getElementById(metric.id);
            const value = element ? element.textContent.trim() : 'N/A';
            const statusElement = element?.closest('.metric-card')?.querySelector('.metric-indicator');
            const status = statusElement ? statusElement.textContent.trim() : '-';
            rows.push(`"${metric.name}",${value},${metric.target},${status}`);
        });

        rows.push('');
        rows.push(`Generated: ${new Date().toLocaleString()}`);

        return rows.join('\n');
    }

    /**
     * Escape CSV field
     * @param {string} field - Field to escape
     * @returns {string} Escaped field
     */
    function escapeCSV(field) {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }

    /**
     * Download CSV file
     * @param {string} content - CSV content
     * @param {string} fileName - File name
     */
    function downloadCSV(content, fileName) {
        // Add BOM for Excel UTF-8 support
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });

        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        console.log(`[ExportFunctions] Downloaded: ${fileName}`);
    }

    /**
     * Print dashboard
     */
    function printDashboard() {
        console.log('[ExportFunctions] Printing dashboard');

        // Show message
        showExportMessage('Preparing print view...');

        // Trigger print dialog
        setTimeout(() => {
            window.print();
            hideExportMessage();
        }, 500);
    }

    /**
     * Export chart as image
     * @param {string} canvasId - Chart canvas ID
     * @param {string} fileName - File name for download
     */
    function exportChartAsImage(canvasId, fileName = 'chart.png') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`[ExportFunctions] Canvas not found: ${canvasId}`);
            return;
        }

        try {
            // Convert canvas to data URL
            const dataURL = canvas.toDataURL('image/png');

            // Create download link
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataURL;
            link.click();

            console.log(`[ExportFunctions] Exported chart: ${fileName}`);
        } catch (error) {
            console.error('[ExportFunctions] Error exporting chart:', error);
            showErrorMessage('Failed to export chart.');
        }
    }

    /**
     * Export all visible charts as images
     */
    function exportAllCharts() {
        console.log('[ExportFunctions] Exporting all charts');

        const activeView = document.querySelector('.dashboard-view.active');
        if (!activeView) return;

        const canvases = activeView.querySelectorAll('canvas');
        canvases.forEach((canvas, index) => {
            const chartContainer = canvas.closest('.chart-container');
            const chartTitle = chartContainer?.querySelector('h3')?.textContent || `chart-${index + 1}`;
            const fileName = `${chartTitle.toLowerCase().replace(/\s+/g, '-')}.png`;

            setTimeout(() => {
                exportChartAsImage(canvas.id, fileName);
            }, index * 500); // Stagger downloads
        });
    }

    /**
     * Copy table to clipboard
     * @param {string} tableId - Table element ID
     */
    async function copyTableToClipboard(tableId) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`[ExportFunctions] Table not found: ${tableId}`);
            return;
        }

        try {
            // Get table HTML
            const tableHTML = table.outerHTML;

            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([tableHTML], { type: 'text/html' }),
                    'text/plain': new Blob([table.textContent], { type: 'text/plain' })
                })
            ]);

            showSuccessMessage('Table copied to clipboard!');
            console.log('[ExportFunctions] Table copied to clipboard');

        } catch (error) {
            console.error('[ExportFunctions] Error copying table:', error);
            showErrorMessage('Failed to copy table to clipboard.');
        }
    }

    /**
     * Show export message
     * @param {string} message - Message to display
     */
    function showExportMessage(message) {
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
     * Hide export message
     */
    function hideExportMessage() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    function showSuccessMessage(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--excellent-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showErrorMessage(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--critical-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Get export statistics
     * @returns {Object} Export statistics
     */
    function getExportStats() {
        return {
            availableFormats: ['PDF', 'Excel (CSV)', 'Print'],
            supportedTables: ['businessUnitsTable', 'findingsTable'],
            chartExport: true
        };
    }

    // Public API
    return {
        init,
        exportToPDF,
        exportToExcel,
        printDashboard,
        exportChartAsImage,
        exportAllCharts,
        copyTableToClipboard,
        getExportStats
    };
})();

// Make available globally
window.ExportFunctions = ExportFunctions;