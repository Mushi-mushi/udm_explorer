# UDM Explorer

UDM Explorer is a comprehensive React-based web application for exploring Google Security Operations (SecOps) Unified Data Model (UDM) schema and generating Gostash (Logstash) parsing configurations. The application provides an interactive interface to browse UDM Event and Entity models, search fields, filter by use cases, and automatically generate Gostash mapping code.

## Features

### 🚧 Parser Generator (WORK IN PROGRESS)
Automatically generate complete Gostash parser configurations from sample JSON logs:
- **Paste Sample JSON**: Input a sample log event in JSON format
- **Auto-detect Fields**: Automatically extracts all fields, including nested objects and arrays
- **Interactive Mapping**: Click to map source fields to UDM paths
- **Smart Type Detection**: Automatically detects timestamps, integers, and other data types
- **Repeated Field Detection**: Intelligently identifies UDM fields marked as repeated and fields nested in repeated parents
- **Complete Parser Output**: Generates production-ready Gostash filter configurations with:
  - JSON parsing with error handling
  - Timestamp field parsing
  - Numeric type conversions
  - String field mappings
  - Repeated field array creation using merge patterns
  - Nested-in-repeated field handling with temp objects
  - Event finalization with `@output`
  - Field cleanup
- **One-Click Copy**: Copy the entire generated parser to clipboard

> **Note**: The Parser Generator is actively being refined. Generated parsers should be thoroughly tested in a development environment before production use. Some edge cases may require manual adjustments.

### 🎯 Interactive Field Details
- Select any field to view comprehensive details:
  - Full field path (with copy-to-clipboard)
  - Field type and description
  - Key field use case tags
  - Enum values (if applicable)
  - **Auto-generated Gostash mapping examples** (WORK IN PROGRESS)
- Animated transitions for smooth user experience

> **Note**: Gostash mapping examples are being continuously improved based on real-world parser patterns. Always verify generated code matches your specific use case.

### 📋 Dual Schema Exploration
- **Event Model**: Explore the complete UDM Event schema with all nested fields
- **Entity Model**: Browse the UDM Entity schema structure
- Switch seamlessly between models with preserved search and filter states

### 🔍 Advanced Search & Filtering
- **Text Search**: Find fields by name or search for "repeated" to show all array fields
- **Use Case Filtering**: Filter fields by key use cases (e.g., authentication, network, threat detection)
- **Smart Highlighting**: Search matches are highlighted in the tree for easy identification
- **Auto-Expansion**: Tree automatically expands to show matching fields

### ⚙️ Automatic Gostash Code Generation (WORK IN PROGRESS)
The app generates Gostash filter configurations for every field type:

- **Simple Fields**: Automatic `mutate { rename }` or `convert` + `rename` patterns
- **Timestamp Fields**: `date` filter configurations with ISO8601 parsing
- **Boolean Fields**: Complete conditional logic for boolean conversion
- **Enum Fields**: Static assignment with selectable enum values
- **Repeated Fields**: Multi-pattern solutions including:
  - Split from delimited strings
  - Build arrays from multiple fields using merge
  - Type conversion within loops
- **Nested Repeated Fields**: Temp object creation with merge pattern
- **Copy-to-Clipboard**: One-click copy for all generated configurations

> **Note**: Gostash code generation is being actively refined based on proven parser patterns. The generated examples provide a solid starting point but may need adjustments for complex scenarios.

### 📚 Gostash Operations Reference (WORK IN PROGRESS)
Comprehensive, interactive documentation for all Gostash operations:
- `mutate` variants (rename, replace, copy, convert, merge, split, gsub, remove_field)
- Array processing with `for` loops
- `grok` pattern matching
- `date` timestamp parsing
- Conditional logic (`if/else`)
- Error handling (`on_error`)
- Debugging (`statedump`)
- Finalization patterns (`@output`)

Each operation includes:
- Detailed description
- Real-world examples
- Best practices and common patterns

> **Note**: The Gostash Operations Reference is continuously updated with proven patterns from real-world parsers. Recommendations may evolve as we discover better approaches.

### 🎨 Modern UI/UX
- **Solarized Dark Theme**: Easy on the eyes for extended use
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Framer Motion Animations**: Smooth transitions and interactions
- **Tailwind CSS**: Clean, modern styling

## Repository Structure

```
udm_explorer/
├── README.md                          # This file
├── example-logs.json                  # Sample JSON logs for testing
└── udm-explorer/                      # React application
    ├── package.json                   # Dependencies and scripts
    ├── tailwind.config.js             # Tailwind CSS configuration
    ├── postcss.config.js              # PostCSS configuration
    ├── public/                        # Static assets
    │   ├── index.html
    │   ├── manifest.json
    │   └── robots.txt
    └── src/                           # Application source code
        ├── index.js                   # Entry point
        ├── App.js                     # Main app component
        ├── index.css                  # Global styles
        ├── components/                # React components
        │   ├── UdmField.js           # Tree node component
        │   ├── DetailsPanel.js       # Field details & Gostash generation
        │   ├── LogstashPanel.js      # Operations reference
        │   └── ParserGenerator.js    # Parser generator tool
        └── data/                      # UDM schema definitions (40+ JSON files)
            ├── udm-event.json        # Root event schema
            ├── udm-entity.json       # Root entity schema
            ├── udm-metadata.json
            ├── udm-network.json
            ├── udm-security_result.json
            └── ...                    # Additional schema files
```

## Quick Start (Local Development)

**Prerequisites**: Node.js (LTS recommended) and npm installed.

1. Open PowerShell and navigate to the application folder:
   ```powershell
   cd udm-explorer
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm start
   ```

4. Open your browser to http://localhost:3000

The app will automatically reload when you make changes to the source code.

## Using the Parser Generator

The Parser Generator is a powerful tool that converts sample JSON logs into complete Gostash parser configurations:

### Step 1: Prepare Your Sample JSON
Get a representative sample event from your log source. For example:
```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "event_type": "authentication",
  "src_ip": "192.168.1.100",
  "user": "john.doe@example.com",
  "result": "success",
  "bytes_sent": 1024,
  "threat_indicators": ["malware", "phishing"]
}
```

### Step 2: Parse and Map Fields
1. Click the **Parser Generator** tab
2. Paste your JSON into the text area
3. Click **Parse JSON**
4. For each source field you want to map:
   - Click **Add Mapping**
   - Enter the UDM path (e.g., `udm.principal.ip`)
   - Use the schema explorer tabs to find the correct UDM paths
5. Click **Generate Parser**

### Step 3: Review and Use
- Review the generated Gostash configuration
- Click **Copy Parser** to copy to clipboard
- Test in your development environment
- Adjust as needed for your specific requirements

### Example Mappings
Common field mappings:
- Source IP → `udm.principal.ip`
- Destination IP → `udm.target.ip`
- Username → `udm.principal.user.userid`
- Event timestamp → `udm.metadata.event_timestamp`
- Event type → `udm.metadata.event_type`
- Bytes sent → `udm.network.sent_bytes`

**Tip**: See `example-logs.json` in the repository root for sample JSON events you can use to test the Parser Generator.

## Build for Production

From the `udm-explorer` folder:

```powershell
npm run build
```

This produces an optimized static build in `udm-explorer/build/` ready for deployment.

## Deployment Options

### Option A: GitHub Pages (Configured & Ready)

The project is already configured for GitHub Pages deployment with:
- `homepage` set in `package.json`
- `gh-pages` package installed
- Deploy scripts configured

To deploy:

```powershell
cd udm-explorer
npm run deploy
```

This will build and push to the `gh-pages` branch. Access at: https://mushi-mush.github.io/udm_explorer/

### Option B: Vercel (Continuous Deployment)

1. Sign in at https://vercel.com
2. Import the GitHub repository
3. Configure:
   - **Root Directory**: `udm-explorer`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Deploy automatically on every push

### Option C: Netlify

1. Connect the repository in Netlify
2. Configure:
   - **Base directory**: `udm-explorer`
   - **Build command**: `npm run build`
   - **Publish directory**: `udm-explorer/build`

### Option D: Manual/Static Hosting

Build locally and upload `udm-explorer/build/` to any static host:
- AWS S3 + CloudFront
- Azure Static Web Apps
- Cloudflare Pages
- Any web server (nginx, Apache, IIS)

## Technology Stack

- **React 19**: Modern UI framework with hooks
- **Tailwind CSS 3**: Utility-first CSS framework
- **Framer Motion 12**: Animation library for smooth transitions
- **Create React App**: Development tooling and build configuration

## Schema Data Files

The application loads 40+ JSON schema files representing the complete UDM structure:

- **Core Types**: Event, Entity, Metadata, Noun
- **Network**: Network, Location, LatLng
- **Security**: SecurityResult, AttackDetails, Tactic, Technique
- **Assets**: Asset, Resource, Cloud
- **Identity**: User, Group, Role, Permission
- **Files**: File, FileMetadata variants, X509 certificates
- **Verdicts**: VerdictInfo, ThreatVerdict, IoCStats
- **Risk**: EntityRisk, RiskDelta
- **Processes**: Process, Registry
- **Other**: Label, Attribute, Investigation, Metric, TimeOff

Each schema file is automatically hydrated and assembled into a complete, navigable tree structure.

## Development Workflow

### Making Changes

```powershell
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, then stage and commit
git add -A
git commit -m "Add: description of your change"

# Push and create a pull request
git push -u origin feature/your-feature-name
```

### Adding New Schema Files

1. Add the JSON file to `src/data/`
2. Import it in `App.js`
3. Add the type mapping to `templateMap` if it's a complex type
4. The tree will automatically hydrate nested fields

### Updating Gostash Patterns

Edit the generation logic in `src/components/DetailsPanel.js`:
- Field type detection: ~line 50-150
- Nested repeated logic: ~line 65-100
- Simple field patterns: ~line 110-140

### Adding Gostash Operations

Edit the `logstashOperations` array in `src/components/LogstashPanel.js`:
- Add new operation objects with `name`, `description`, and `example`

## Troubleshooting

### Build Errors

If you encounter build errors:
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install

# Clear cache
npm cache clean --force
```

### Port Already in Use

If port 3000 is taken, create a `.env` file in `udm-explorer/`:
```
PORT=3001
```

### Deployment Issues

For GitHub Pages 404 errors:
- Ensure `homepage` in `package.json` matches your repository name
- Check that the `gh-pages` branch exists and is set as the source

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

## License

This project is internal to Nestlé. Refer to your organization's policies for usage and distribution.

## Support & Contact

For questions, issues, or feature requests, please open an issue on the GitHub repository or contact the development team.

---

**Note**: This application is designed for Google SecOps (Chronicle) UDM schema exploration and Gostash parser development. It is not affiliated with or endorsed by Google.
