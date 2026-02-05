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
            chain: document.getElementById('chain'),
            prefix: document.getElementById('prefix'),
            action: document.getElementById('action'),
            prepend: document.getElementById('prepend'),
            description: document.getElementById('description'),
            comment: document.getElementById('comment'),
            rule: document.getElementById('rule'),
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
        this.elements.ruleModal.addEventListener('hidden.bs.modal', () => this.resetForm());
        
        // Event delegation for dynamic table buttons
        this.elements.filtersTableBody.addEventListener('click', (event) => {
            if (event.target.closest('.edit-btn')) {
                event.preventDefault();
                const button = event.target.closest('.edit-btn');
                const index = parseInt(button.getAttribute('data-index'));
                this.showAddEditModal(index);
            } else if (event.target.closest('.delete-btn')) {
                event.preventDefault();
                const button = event.target.closest('.delete-btn');
                const index = parseInt(button.getAttribute('data-index'));
                this.deleteFilter(index);
            } else if (event.target.closest('.add-first-rule-btn')) {
                event.preventDefault();
                this.showAddEditModal();
            }
        });
    }

    loadSampleData() {
        // Sample data for demo purposes
        this.filters = [
            {
                id: 1,
                chain: 'isp-HE-out',
                prefix: '23.145.224.0/24',
                action: 'accept',
                prepend: null,
                description: 'Announce prefix - CX Bradford Broadband',
                comment: 'Announce prefix - CX Bradford Broadband',
                rule: 'if (dst == 23.145.224.0/24) { accept; }'
            },
            {
                id: 2,
                chain: 'bgp-in',
                prefix: '10.0.0.0/8',
                action: 'reject',
                prepend: null,
                description: 'RFC 1918 space',
                comment: 'Block private IP space',
                rule: 'if (dst == 10.0.0.0/8) { reject; }'
            },
            {
                id: 3,
                chain: 'bgp-out',
                prefix: '203.0.113.0/24',
                action: 'accept',
                prepend: 1,
                description: 'Test network',
                comment: 'Documentation network',
                rule: 'if (dst == 203.0.113.0/24) { accept; }'
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
                    const chainMatch = line.match(/chain=([^\s]+)/i);
                    const prefixMatch = line.match(/prefix=([^\\s]+)/i);
                    const actionMatch = line.match(/action=(accept|reject|drop)/i);
                    const commentMatch = line.match(/comment="([^"]*)"/i);
                    const ruleMatch = line.match(/rule="([^"]*)"/i);

                    // Try to extract prefix from rule if not in prefix parameter
                    let extractedPrefix = prefixMatch ? prefixMatch[1] : null;
                    if (!extractedPrefix && ruleMatch) {
                        const ruleContent = ruleMatch[1];
                        const prefixFromRule = ruleContent.match(/dst\s*==\s*([\d./]+|\[[\da-fA-F:]+\]/\d+)/);
                        if (prefixFromRule) {
                            extractedPrefix = prefixFromRule[1];
                        }
                    }

                    if (chainMatch || extractedPrefix) {
                        parsedFilters.push({
                            id: Date.now(),
                            chain: chainMatch ? chainMatch[1] : 'bgp-in',
                            prefix: extractedPrefix || '0.0.0.0/0',
                            action: actionMatch ? actionMatch[1] : 'accept',
                            prepend: null,
                            description: commentMatch ? commentMatch[1] : 'Parsed from input',
                            comment: commentMatch ? commentMatch[1] : 'Imported from RouterOS commands',
                            rule: ruleMatch ? ruleMatch[1] : null
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
            this.elements.chain.value = filter.chain || '';
            this.elements.prefix.value = filter.prefix;
            this.elements.action.value = filter.action;
            this.elements.prepend.value = filter.prepend || '';
            this.elements.description.value = filter.description || '';
            this.elements.comment.value = filter.comment || '';
            this.elements.rule.value = filter.rule || '';
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

        const newRule = {
            id: this.editingIndex !== null ? this.filters[this.editingIndex].id : Date.now(),
            chain: this.elements.chain.value.trim(),
            prefix: this.elements.prefix.value.trim(),
            action: this.elements.action.value,
            prepend: this.elements.prepend.value ? parseInt(this.elements.prepend.value) : null,
            description: this.elements.description.value.trim(),
            comment: this.elements.comment.value.trim(),
            rule: this.elements.rule.value.trim() || this.generateRule(this.elements.action.value, this.elements.prefix.value.trim())
        };

        if (this.editingIndex !== null) {
            // Update existing filter
            this.filters[this.editingIndex] = newRule;
            this.showMessage('Filter updated successfully', 'success');
        } else {
            // Add new filter
            this.filters.push(newRule);
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
        
        // Validate chain
        const chain = this.elements.chain.value.trim();
        if (!chain) {
            this.markInvalid(this.elements.chain, 'Chain is required');
            isValid = false;
        } else {
            this.markValid(this.elements.chain);
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

    generateRule(action, prefix) {
        // Generate a rule based on action and prefix
        const actionMap = {
            'accept': 'accept',
            'reject': 'reject',
            'drop': 'jump-target=bgp-drop'
        };
        
        const mappedAction = actionMap[action] || 'accept';
        
        if (mappedAction === 'jump-target=bgp-drop') {
            return `if (dst == ${prefix}) { jump-target=bgp-drop; }`;
        } else {
            return `if (dst == ${prefix}) { ${mappedAction}; }`;
        }
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
        this.elements.chain.value = '';
        this.elements.prefix.value = '';
        this.elements.action.value = 'accept';
        this.elements.prepend.value = '';
        this.elements.description.value = '';
        this.elements.comment.value = '';
        this.elements.rule.value = '';
        
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
                    <td colspan="8" class="text-center text-muted py-5">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>No BGP filters configured yet</p>
                        <button id="addFirstRuleButtonTbl" class="btn btn-outline-primary add-first-rule-btn">Add Your First Rule</button>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        this.filters.forEach((filter, index) => {
            const actionClass = `asn-${filter.action}`;
            const actionText = filter.action.charAt(0).toUpperCase() + filter.action.slice(1);
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${filter.chain || 'default'}</td>
                    <td class="prefix-cell">${filter.prefix}</td>
                    <td><span class="${actionClass}">${actionText}</span></td>
                    <td>${filter.prepend ? filter.prepend : '-'}</td>
                    <td>${filter.description || '-'}</td>
                    <td class="prefix-cell">${filter.rule || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary action-btn edit-btn" 
                                data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger action-btn delete-btn" 
                                data-index="${index}">
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
        
        // Count unique chains
        const uniqueChains = new Set(this.filters.map(f => f.chain));
        this.elements.asnCount.textContent = uniqueChains.size;
    }

    generateOutput() {
        let output = '# Generated BGP Filter Configuration for MikroTik RouterOS v7\n';
        output += '# Generated on: ' + new Date().toLocaleString() + '\n\n';

        // Generate routing filters based on chains and actions
        const chainGroups = {};
        this.filters.forEach(filter => {
            if (!chainGroups[filter.chain]) {
                chainGroups[filter.chain] = { accept: [], reject: [], drop: [] };
            }
            chainGroups[filter.chain][filter.action].push(filter);
        });

        // Generate routing filters for each chain
        for (const [chain, actions] of Object.entries(chainGroups)) {
            if (actions.accept.length > 0) {
                output += `# Accept filters for chain ${chain}\n`;
                actions.accept.forEach(filter => {
                    output += `/routing/filter/rule add chain=${filter.chain}`;
                    if (filter.rule) {
                        output += ` rule="${filter.rule}"`;
                    } else {
                        output += ` action=accept prefix=${filter.prefix}`;
                        if (filter.prepend) {
                            output += ` set-bgp-prepend-path=${filter.prepend}`;
                        }
                    }
                    output += ` comment="${filter.description || filter.comment || `Accept prefix ${filter.prefix}`}"\n`;
                });
                output += '\n';
            }

            if (actions.reject.length > 0) {
                output += `# Reject filters for chain ${chain}\n`;
                actions.reject.forEach(filter => {
                    output += `/routing/filter/rule add chain=${filter.chain}`;
                    if (filter.rule) {
                        output += ` rule="${filter.rule}"`;
                    } else {
                        output += ` action=reject prefix=${filter.prefix}`;
                    }
                    output += ` comment="${filter.description || filter.comment || `Reject prefix ${filter.prefix}`}"\n`;
                });
                output += '\n';
            }

            if (actions.drop.length > 0) {
                output += `# Drop filters for chain ${chain}\n`;
                actions.drop.forEach(filter => {
                    output += `/routing/filter/rule add chain=${filter.chain}`;
                    if (filter.rule) {
                        output += ` rule="${filter.rule}"`;
                    } else {
                        output += ` action=jump jump-target=bgp-drop prefix=${filter.prefix}`;
                    }
                    output += ` comment="${filter.description || filter.comment || `Drop prefix ${filter.prefix}`}"\n`;
                });
                output += '\n';
            }
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