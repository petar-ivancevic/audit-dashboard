/**
 * Filter Controls Module
 * Handles filtering, searching, and sorting for tables and data views
 */

const FilterControls = (() => {
    // Store current filter states
    const filterStates = {
        businessUnits: {
            division: 'all',
            riskTier: 'all',
            search: ''
        },
        findings: {
            severity: 'all',
            status: 'all',
            search: ''
        }
    };

    // Store current sort state
    const sortStates = {};

    /**
     * Initialize filter controls
     */
    function init() {
        console.log('[FilterControls] Initializing filter controls');

        // Business Units filters
        setupBusinessUnitFilters();

        // Findings filters
        setupFindingsFilters();

        // Table sorting
        setupTableSorting();
    }

    /**
     * Setup business unit filters
     */
    function setupBusinessUnitFilters() {
        const divisionFilter = document.getElementById('divisionFilter');
        const riskTierFilter = document.getElementById('riskTierFilter');
        const searchInput = document.getElementById('buSearchInput');

        if (divisionFilter) {
            divisionFilter.addEventListener('change', (e) => {
                filterStates.businessUnits.division = e.target.value;
                applyBusinessUnitFilters();
            });
        }

        if (riskTierFilter) {
            riskTierFilter.addEventListener('change', (e) => {
                filterStates.businessUnits.riskTier = e.target.value;
                applyBusinessUnitFilters();
            });
        }

        if (searchInput) {
            // Debounce search input
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    filterStates.businessUnits.search = e.target.value.toLowerCase();
                    applyBusinessUnitFilters();
                }, 300);
            });
        }
    }

    /**
     * Setup findings filters
     */
    function setupFindingsFilters() {
        const severityFilter = document.getElementById('findingsSeverityFilter');

        if (severityFilter) {
            severityFilter.addEventListener('change', (e) => {
                filterStates.findings.severity = e.target.value;
                applyFindingsFilters();
            });
        }
    }

    /**
     * Apply business unit filters
     */
    function applyBusinessUnitFilters() {
        const tbody = document.getElementById('businessUnitsTableBody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        let visibleCount = 0;

        rows.forEach(row => {
            const division = row.dataset.division || '';
            const riskTier = row.dataset.riskTier || '';
            const searchText = row.textContent.toLowerCase();

            const divisionMatch = filterStates.businessUnits.division === 'all' ||
                                  division === filterStates.businessUnits.division;

            const riskMatch = filterStates.businessUnits.riskTier === 'all' ||
                             riskTier === filterStates.businessUnits.riskTier;

            const searchMatch = filterStates.businessUnits.search === '' ||
                               searchText.includes(filterStates.businessUnits.search);

            if (divisionMatch && riskMatch && searchMatch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        console.log(`[FilterControls] Business units visible: ${visibleCount}/${rows.length}`);
    }

    /**
     * Apply findings filters
     */
    function applyFindingsFilters() {
        const tbody = document.getElementById('findingsTableBody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        let visibleCount = 0;

        rows.forEach(row => {
            const severity = row.dataset.severity || '';

            const severityMatch = filterStates.findings.severity === 'all' ||
                                 severity === filterStates.findings.severity;

            if (severityMatch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        console.log(`[FilterControls] Findings visible: ${visibleCount}/${rows.length}`);
    }

    /**
     * Setup table sorting
     */
    function setupTableSorting() {
        // Business units table
        const buTable = document.getElementById('businessUnitsTable');
        if (buTable) {
            const headers = buTable.querySelectorAll('th.sortable');
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    const sortKey = header.dataset.sort;
                    sortTable('businessUnitsTableBody', sortKey, header);
                });
            });
        }

        // Findings table
        const findingsTable = document.getElementById('findingsTable');
        if (findingsTable) {
            const headers = findingsTable.querySelectorAll('th.sortable');
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    const sortKey = header.dataset.sort;
                    sortTable('findingsTableBody', sortKey, header);
                });
            });
        }
    }

    /**
     * Sort table by column
     * @param {string} tbodyId - Table body element ID
     * @param {string} sortKey - Data attribute to sort by
     * @param {HTMLElement} headerElement - Header element clicked
     */
    function sortTable(tbodyId, sortKey, headerElement) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        // Get current sort direction
        const currentSort = sortStates[tbodyId] || {};
        const isAscending = currentSort.key === sortKey ? !currentSort.ascending : true;

        // Update sort state
        sortStates[tbodyId] = {
            key: sortKey,
            ascending: isAscending
        };

        // Update header classes
        const allHeaders = headerElement.parentElement.querySelectorAll('th.sortable');
        allHeaders.forEach(h => {
            h.classList.remove('sorted-asc', 'sorted-desc');
        });
        headerElement.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');

        // Get and sort rows
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((a, b) => {
            let aValue = a.dataset[sortKey] || '';
            let bValue = b.dataset[sortKey] || '';

            // Handle numeric values
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return isAscending ? aNum - bNum : bNum - aNum;
            }

            // Handle string values
            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();

            if (aValue < bValue) return isAscending ? -1 : 1;
            if (aValue > bValue) return isAscending ? 1 : -1;
            return 0;
        });

        // Reorder rows in DOM
        rows.forEach(row => tbody.appendChild(row));

        console.log(`[FilterControls] Sorted ${tbodyId} by ${sortKey} (${isAscending ? 'asc' : 'desc'})`);
    }

    /**
     * Reset all filters
     * @param {string} filterGroup - Filter group to reset ('businessUnits' or 'findings')
     */
    function resetFilters(filterGroup) {
        if (filterGroup === 'businessUnits') {
            filterStates.businessUnits = {
                division: 'all',
                riskTier: 'all',
                search: ''
            };

            // Reset UI
            const divisionFilter = document.getElementById('divisionFilter');
            const riskTierFilter = document.getElementById('riskTierFilter');
            const searchInput = document.getElementById('buSearchInput');

            if (divisionFilter) divisionFilter.value = 'all';
            if (riskTierFilter) riskTierFilter.value = 'all';
            if (searchInput) searchInput.value = '';

            applyBusinessUnitFilters();

        } else if (filterGroup === 'findings') {
            filterStates.findings = {
                severity: 'all',
                status: 'all',
                search: ''
            };

            // Reset UI
            const severityFilter = document.getElementById('findingsSeverityFilter');
            if (severityFilter) severityFilter.value = 'all';

            applyFindingsFilters();
        }

        console.log(`[FilterControls] Reset filters for ${filterGroup}`);
    }

    /**
     * Get current filter state
     * @param {string} filterGroup - Filter group name
     * @returns {Object} Current filter state
     */
    function getFilterState(filterGroup) {
        return filterStates[filterGroup] || {};
    }

    /**
     * Setup select all checkbox
     * @param {string} checkboxId - Select all checkbox ID
     * @param {string} tableBodyId - Table body ID
     */
    function setupSelectAll(checkboxId, tableBodyId) {
        const selectAllCheckbox = document.getElementById(checkboxId);
        const tbody = document.getElementById(tableBodyId);

        if (!selectAllCheckbox || !tbody) return;

        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (checkbox.closest('tr').style.display !== 'none') {
                    checkbox.checked = e.target.checked;
                }
            });

            console.log(`[FilterControls] Select all: ${e.target.checked}`);
        });

        // Update select all state when individual checkboxes change
        tbody.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const visibleCheckboxes = Array.from(tbody.querySelectorAll('input[type="checkbox"]'))
                    .filter(cb => cb.closest('tr').style.display !== 'none');

                const allChecked = visibleCheckboxes.every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked && visibleCheckboxes.length > 0;
            }
        });
    }

    /**
     * Get selected rows from table
     * @param {string} tableBodyId - Table body ID
     * @returns {Array} Array of selected row data
     */
    function getSelectedRows(tableBodyId) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return [];

        const selectedRows = [];
        const checkboxes = tbody.querySelectorAll('input[type="checkbox"]:checked');

        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            selectedRows.push({
                element: row,
                data: { ...row.dataset }
            });
        });

        return selectedRows;
    }

    /**
     * Filter data array based on criteria
     * @param {Array} data - Data array to filter
     * @param {Object} criteria - Filter criteria
     * @returns {Array} Filtered data array
     */
    function filterData(data, criteria) {
        return data.filter(item => {
            for (const [key, value] of Object.entries(criteria)) {
                if (value === 'all' || value === '') continue;

                const itemValue = item[key];

                if (typeof value === 'string' && typeof itemValue === 'string') {
                    if (!itemValue.toLowerCase().includes(value.toLowerCase())) {
                        return false;
                    }
                } else if (itemValue !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Sort data array
     * @param {Array} data - Data array to sort
     * @param {string} key - Property to sort by
     * @param {boolean} ascending - Sort direction
     * @returns {Array} Sorted data array
     */
    function sortData(data, key, ascending = true) {
        return [...data].sort((a, b) => {
            let aValue = a[key];
            let bValue = b[key];

            // Handle numeric values
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return ascending ? aNum - bNum : bNum - aNum;
            }

            // Handle string values
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();

            if (aValue < bValue) return ascending ? -1 : 1;
            if (aValue > bValue) return ascending ? 1 : -1;
            return 0;
        });
    }

    // Public API
    return {
        init,
        applyBusinessUnitFilters,
        applyFindingsFilters,
        resetFilters,
        getFilterState,
        setupSelectAll,
        getSelectedRows,
        filterData,
        sortData,
        sortTable
    };
})();

// Make available globally
window.FilterControls = FilterControls;