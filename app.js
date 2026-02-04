// BGP Filter Manager for MikroTik RouterOS v7
class BGPFilterManager {
    constructor() {
        this.filters = [];
        this.editingIndex = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSampleData(); // For demo purposes
    }

    initializeElements() {
        this.elements = {
            filtersTableBody: document.getElementById('filtersTableBody'),
            importFilters: document.getElementById('importFilters'),
            parseButton: document.getElementById('parseButton'),
            clearButton: document.getElementById('clearButton'),
            addRuleButton: document.getElementById('addRuleButton'),
            addFirstRuleButton: document.getElementById('addFirstRuleButton'),
            generateOutputButton: document.getElementById('generateOutputButton'),
            outputArea: document.getElementById('outputArea'),
            copyOutputButton: document.getElementById('copyOutputButton'),
            ruleModal: document.getElementById('ruleModal'),
            ruleForm: document.getElementById('ruleForm'),
            remoteAsn: document.getElementById('remoteAsn'),
            prefix: document.getElementById('prefix'),
            action: document.getElementById('action'),
            prepend: document.getElementById('prepend'),
            description: document.getElementById('description'),
            comment: document.getElementById('comment'),
            saveRuleButton: document.getElementById('saveRuleButton'),
            totalFilters: document.getElementById('totalFilters'),
            acceptedFilters: document.getElementById('acceptedFilters'),
            rejectedFilters: document.getElementById('rejectedFilters'),
            asnCount: document.getElementById('asnCount')
        };
    }

    bindEvents() {
        // Button events
        this.elements.parseButton.addEventListener('click', () => this.parseFilters());
        this.elements.clearButton.addEventListener('click', () => this.clearAll());
        this.elements.addRuleButton.addEventListener('click', () => this.showAddEditModal());
        this.elements.addFirstRuleButton.addEventListener('click', () => this.showAddEditModal());
        this.elements.generateOutputButton.addEventListener('click', () => this.generateOutput());
        this.elements.copyOutputButton.addEventListener('click', () => this.copyOutput());
        this.elements.saveRuleButton.addEventListener('click', () => this.saveRule());

        // Modal events
        this.elements.ruleModal.addEventListener('hidden.bs-modal', () => this.resetForm());
    }

    loadSampleData() {
        // Sample data for demo purposes
        this.filters = [
            {
                id: 1,
                remoteAsn: '65001',
                prefix: '192.168.1.0/24',
                action: 'accept',
                prepend: 2,
                description: 'Primary upstream',
                comment: 'Main connection to upstream provider'
            },
            {
                id: 2,
                remoteAsn: '65002',
                prefix: '10.0.0.0/8',
                action: 'reject',
                prepend: null,
                description: 'RFC 1918 space',
                comment: 'Block private IP space'
            },
            {
                id: 3,
                remoteAsn: '65003',
                prefix: '203.0.113.0/24',
                action: 'accept',
                prepend: 1,
                description: 'Test network',
                comment: 'Documentation network'
            }
        ];
        
        this.renderTable();
        this.updateStats();
    }

    parseFilters() {
        const input = this.elements.importFilters.value.trim();
        if (!input) {
            this.showMessage('Please paste some RouterOS commands first', 'warning');
            return;
        }

        try {
            // Simple parsing logic - in real implementation this would be more sophisticated
            const lines = input.split('\n');
            let parsedFilters = [];

            lines.forEach(line => {
                line = line.trim();
                if (line.includes('/routing/filter/rule')) {
                    // Extract relevant information from RouterOS commands
                    // This is a simplified example - real parsing would be more complex
                    const asnMatch = line.match(/remote-as=(\d+)/i);
                    const prefixMatch = line.match(/prefix=([^\\s]+)/i);
                    const actionMatch = line.match(/action=(accept|reject|drop)/i);

                    if (asnMatch || prefixMatch) {
                        parsedFilters.push({
                            id: Date.now(),
                            remoteAsn: asnMatch ? asnMatch[1] : 'unknown',
                            prefix: prefixMatch ? prefixMatch[1] : '0.0.0.0/0',
                            action: actionMatch ? actionMatch[1] : 'accept',
                            prepend: null,
                            description: 'Parsed from input',
                            comment: 'Imported from RouterOS commands'
                        });
                    }
                }
            });

            if (parsedFilters.length > 0) {
                this.filters = [...this.filters, ...parsedFilters];
                this.renderTable();
                this.updateStats();
                this.showMessage(`${parsedFilters.length} filters imported successfully`, 'success');
            } else {
                this.showMessage('No valid BGP filter commands found in input', 'warning');
            }
        } catch (error) {
            console.error('Error parsing filters:', error);
            this.showMessage('Error parsing filters. Please check the format.', 'danger');
        }
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all filters? This cannot be undone.')) {
            this.filters = [];
            this.renderTable();
            this.updateStats();
            this.showMessage('All filters cleared', 'info');
        }
    }

    showAddEditModal(index = null) {
        this.editingIndex = index;

        if (index !== null) {
            // Editing existing filter
            const filter = this.filters[index];
            this.elements.remoteAsn.value = filter.remoteAsn;
            this.elements.prefix.value = filter.prefix;
            this.elements.action.value = filter.action;
            this.elements.prepend.value = filter.prepend || '';
            this.elements.description.value = filter.description || '';
            this.elements.comment.value = filter.comment || '';
            document.getElementById('ruleModalLabel').textContent = 'Edit BGP Filter Rule';
        } else {
            // Adding new filter
            this.resetForm();
            document.getElementById('ruleModalLabel').textContent = 'Add New BGP Filter Rule';
        }

        const modal = new bootstrap.Modal(this.elements.ruleModal);
        modal.show();
    }

    saveRule() {
        // Validate inputs
        if (!this.validateForm()) {
            return;
        }

        const rule = {
            id: this.editingIndex !== null ? this.filters[this.editingIndex].id : Date.now(),
            remoteAsn: this.elements.remoteAsn.value.trim(),
            prefix: this.elements.prefix.value.trim(),
            action: this.elements.action.value,
            prepend: this.elements.prepend.value ? parseInt(this.elements.prepend.value) : null,
            description: this.elements.description.value.trim(),
            comment: this.elements.comment.value.trim()
        };

        if (this.editingIndex !== null) {
            // Update existing filter
            this.filters[this.editingIndex] = rule;
            this.showMessage('Filter updated successfully', 'success');
        } else {
            // Add new filter
            this.filters.push(rule);
            this.showMessage('Filter added successfully', 'success');
        }

        this.renderTable();
        this.updateStats();

        // Close modal
        const modal = bootstrap.Modal.getInstance(this.elements.ruleModal);
        modal.hide();
    }

    validateForm() {
        let isValid = true;
        
        // Validate remote ASN
        const asn = this.elements.remoteAsn.value.trim();
        if (!asn) {
            this.markInvalid(this.elements.remoteAsn, 'ASN is required');
            isValid = false;
        } else if (!/^(AS)?\d+$/.test(asn.replace(/^AS/i, ''))) {
            this.markInvalid(this.elements.remoteAsn, 'Invalid ASN format');
            isValid = false;
        } else {
            this.markValid(this.elements.remoteAsn);
        }

        // Validate prefix
        const prefix = this.elements.prefix.value.trim();
        if (!prefix) {
            this.markInvalid(this.elements.prefix, 'Prefix is required');
            isValid = false;
        } else if (!this.isValidPrefix(prefix)) {
            this.markInvalid(this.elements.prefix, 'Invalid prefix format');
            isValid = false;
        } else {
            this.markValid(this.elements.prefix);
        }

        // Validate prepend if provided
        const prepend = this.elements.prepend.value;
        if (prepend && (parseInt(prepend) < 1 || parseInt(prepend) > 10)) {
            this.markInvalid(this.elements.prepend, 'Prepend must be between 1 and 10');
            isValid = false;
        } else {
            this.markValid(this.elements.prepend);
        }

        return isValid;
    }

    isValidPrefix(prefix) {
        // Basic IPv4 prefix validation
        const ipv4PrefixRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        if (ipv4PrefixRegex.test(prefix)) {
            // Additional check for valid IP ranges
            const [ip, cidr] = prefix.split('/');
            const octets = ip.split('.');
            
            if (parseInt(cidr) > 32) return false;
            
            for (let octet of octets) {
                const num = parseInt(octet);
                if (num < 0 || num > 255) return false;
            }
            
            return true;
        }
        
        // Could extend to validate IPv6 if needed
        return false;
    }

    markInvalid(element, message) {
        element.classList.add('is-invalid');
        // Add feedback element if it doesn't exist
        let feedback = element.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            element.parentNode.appendChild(feedback);
        }
        feedback.textContent = message;
    }

    markValid(element) {
        element.classList.remove('is-invalid');
    }

    resetForm() {
        this.elements.ruleForm.reset();
        // Clear any validation states
        const inputs = this.elements.ruleForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            const feedback = input.parentNode.querySelector('.invalid-feedback');
            if (feedback) feedback.remove();
        });
    }

    renderTable() {
        if (this.filters.length === 0) {
            this.elements.filtersTableBody.innerHTML = `
                <tr id="emptyRow">
                    <td colspan="7" class="text-center text-muted py-5">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>No BGP filters configured yet</p>
                        <button id="addFirstRuleButtonTbl" class="btn btn-outline-primary">Add Your First Rule</button>
                    </td>
                </tr>
            `;
            // Bind event to the new button
            document.getElementById('addFirstRuleButtonTbl').addEventListener('click', () => this.showAddEditModal());
            return;
        }

        let html = '';
        this.filters.forEach((filter, index) => {
            const actionClass = `asn-${filter.action}`;
            const actionText = filter.action.charAt(0).toUpperCase() + filter.action.slice(1);
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${filter.remoteAsn}</td>
                    <td class="prefix-cell">${filter.prefix}</td>
                    <td><span class="${actionClass}">${actionText}</span></td>
                    <td>${filter.prepend ? filter.prepend : '-'}</td>
                    <td>${filter.description || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary action-btn" 
                                onclick="bgpManager.showAddEditModal(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger action-btn" 
                                onclick="bgpManager.deleteFilter(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        this.elements.filtersTableBody.innerHTML = html;
    }

    deleteFilter(index) {
        if (confirm('Are you sure you want to delete this filter?')) {
            this.filters.splice(index, 1);
            this.renderTable();
            this.updateStats();
            this.showMessage('Filter deleted successfully', 'info');
        }
    }

    updateStats() {
        this.elements.totalFilters.textContent = this.filters.length;
        this.elements.acceptedFilters.textContent = this.filters.filter(f => f.action === 'accept').length;
        this.elements.rejectedFilters.textContent = this.filters.filter(f => f.action === 'reject' || f.action === 'drop').length;
        
        // Count unique ASNs
        const uniqueAsns = new Set(this.filters.map(f => f.remoteAsn));
        this.elements.asnCount.textContent = uniqueAsns.size;
    }

    generateOutput() {
        let output = '# Generated BGP Filter Configuration for MikroTik RouterOS v7\n';
        output += '# Generated on: ' + new Date().toLocaleString() + '\n\n';

        // Generate address lists for filtering
        const asnLists = {};
        const actionLists = { accept: [], reject: [], drop: [] };

        this.filters.forEach(filter => {
            // Group by action
            actionLists[filter.action].push(filter);

            // Group by ASN for address lists
            if (!asnLists[filter.remoteAsn]) {
                asnLists[filter.remoteAsn] = [];
            }
            asnLists[filter.remoteAsn].push(filter);
        });

        // Generate address lists for each ASN
        for (const [asn, filters] of Object.entries(asnLists)) {
            output += `# Address list for ASN ${asn}\n`;
            filters.forEach(filter => {
                output += `/ip firewall address-list add list=bgp-asn-${asn} address=${filter.prefix} comment="${filter.description || filter.comment || `ASN ${asn}`}"\n`;
            });
            output += '\n';
        }

        // Generate routing filters based on actions
        if (actionLists.accept.length > 0) {
            output += '# Accept filters\n';
            actionLists.accept.forEach(filter => {
                output += `/routing/filter/rule add chain=bgp-in action=accept prefix=${filter.prefix}`;
                if (filter.prepend) {
                    output += ` set-bgp-prepend-path=${filter.prepend},${filter.remoteAsn}`;
                }
                output += ` comment="${filter.description || filter.comment || `Accept ASN ${filter.remoteAsn}`}"\n`;
            });
            output += '\n';
        }

        if (actionLists.reject.length > 0) {
            output += '# Reject filters\n';
            actionLists.reject.forEach(filter => {
                output += `/routing/filter/rule add chain=bgp-in action=reject prefix=${filter.prefix} comment="${filter.description || filter.comment || `Reject ASN ${filter.remoteAsn}`}"\n`;
            });
            output += '\n';
        }

        if (actionLists.drop.length > 0) {
            output += '# Drop filters\n';
            actionLists.drop.forEach(filter => {
                output += `/routing/filter/rule add chain=bgp-in action=jump jump-target=bgp-drop prefix=${filter.prefix} comment="${filter.description || filter.comment || `Drop ASN ${filter.remoteAsn}`}"\n`;
            });
            output += '\n';
        }

        // Add BGP configuration examples
        output += '# Example BGP peer configuration with filters\n';
        output += '# Replace with your actual peer details\n';
        output += '/routing/bgp/session add name=peer-1 remote.address=192.168.1.1 remote.as=65001 in.routing-filter=bgp-in\n';

        this.elements.outputArea.textContent = output;
        this.showMessage('RouterOS commands generated successfully', 'success');
    }

    copyOutput() {
        if (this.elements.outputArea.textContent.trim() === '') {
            this.showMessage('No output to copy. Please generate commands first.', 'warning');
            return;
        }

        navigator.clipboard.writeText(this.elements.outputArea.textContent)
            .then(() => {
                this.showMessage('Commands copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                this.showMessage('Failed to copy to clipboard. Please try again.', 'danger');
            });
    }

    showMessage(message, type = 'info') {
        // Create a temporary alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize the BGP Filter Manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bgpManager = new BGPFilterManager();
});