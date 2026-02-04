# BGP Filter Manager for MikroTik RouterOS v7

A web-based tool for managing BGP filters on MikroTik routers running RouterOS v7. This tool allows you to visualize, edit, and generate RouterOS compatible BGP filter configurations for connecting to Internet Exchanges.

## Features

- **Import Existing Filters**: Paste RouterOS commands to visualize current BGP filters
- **Visualize Filters**: See all your BGP filters in a clean, organized table
- **Edit Filters**: Modify existing filters with an easy-to-use interface
- **Add New Filters**: Create new BGP filter rules with a form interface
- **Generate RouterOS Commands**: Output properly formatted RouterOS v7 commands
- **Copy to Clipboard**: Easily copy generated commands to paste into your router
- **Filter Statistics**: Track total filters, accepted/rejected counts, and unique ASNs
- **Support for Prepending**: Add AS path prepending to specific routes

## Components

- `index.html`: Main application interface
- `styles.css`: Styling and responsive design
- `app.js`: Frontend logic and data handling
- `package.json`: Dependencies and scripts

## Setup Instructions

### For Development

1. Navigate to the project directory:
   ```bash
   cd bgp-filter-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   or
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3001`

### For Production

Simply serve the files using any web server (Apache, Nginx, etc.). No special server-side requirements.

## Usage

### Importing Existing Filters

1. Paste your current RouterOS BGP filter commands into the "Paste Current Filters" text area
2. Click "Parse Filters" to visualize them in the table
3. The tool will extract ASNs, prefixes, and actions from your commands

### Adding New Filters

1. Click "Add New Rule" to open the rule creation form
2. Fill in the required fields:
   - Chain (e.g., bgp-in, bgp-out)
   - Prefix (e.g., 192.168.1.0/24)
   - Action (Accept/Reject/Drop)
   - Optional rule field (e.g., "if (dst == 192.168.1.0/24) { accept; }") - leave blank to auto-generate
   - Optional prepend value (1-10)
   - Description and comments
3. Click "Save Rule" to add it to your configuration

### Generating RouterOS Commands

1. Click "Generate Commands" to create RouterOS v7 compatible commands
2. The output will appear in the "Generated RouterOS Commands" section
3. Click "Copy All" to copy the commands to your clipboard
4. Paste the commands into your MikroTik terminal

## Supported RouterOS v7 Syntax

The tool generates commands compatible with RouterOS v7, including:

- Address lists for organizing prefixes by ASN
- Routing filter rules with accept/reject/drop actions
- AS path prepending configurations
- Properly formatted BGP session configurations

## Fields Explained

- **Chain**: The routing filter chain name (e.g., bgp-in, bgp-out)
- **Prefix**: The IP prefix to filter (e.g., 192.168.1.0/24)
- **Action**: What to do with matching routes (Accept, Reject, or Drop)
- **Rule**: The conditional rule statement (e.g., "if (dst == 192.168.1.0/24) { accept; }") - auto-generated if left blank
- **Prepend**: Number of times to prepend to the AS path (for traffic engineering)
- **Description**: Brief description of the filter's purpose
- **Comment**: Additional notes about the filter

## Browser Support

Modern browsers supporting ES6+ JavaScript, Bootstrap 5, and CSS Grid/Flexbox.

## Security Note

This is a client-side application that runs entirely in your browser. No data is transmitted to any server. Your BGP configurations remain on your local machine.