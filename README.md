# UDM Explorer

Interactive web application for exploring Google Chronicle UDM (Unified Data Model) schema and generating Gostash parsers.

## Features

- **📖 Schema Explorer**: Browse UDM Event and Entity models with search and filtering
- **🔍 Field Details**: View comprehensive field information with auto-generated Gostash examples
- **⚙️ Parser Generator**: Convert sample JSON logs into complete Gostash configurations
- **📚 Gostash Reference**: Interactive documentation for all Gostash operations
- **🧪 Parser Testing**: Test parsers with Chronicle CLI integration

## Quick Start

### Local Development

```powershell
cd udm-explorer
npm install
npm start
```

Open http://localhost:3000

### Parser Testing with Chronicle CLI

The parser testing feature requires the Google Chronicle CLI (`secops`) and a backend server:

1. **Install Chronicle CLI**:
   ```powershell
   pip install secops
   ```

2. **Start the backend** (in a separate terminal):
   ```powershell
   npm run server
   ```

3. **Use the Parser Generator** to test your parsers

> **Important**: The parser testing feature will **not work on the deployed GitHub Pages version** because GitHub Pages only serves static files and cannot run the Node.js backend server. You must run the application locally to use parser testing.

## Deployment

### GitHub Pages (Static Only)

```powershell
cd udm-explorer
npm run deploy
```

Deployed at: https://mushi-mush.github.io/udm_explorer/

**Note**: Parser testing is disabled on GitHub Pages. Only the schema explorer, field details, Gostash reference, and parser generator (without testing) are available.

### For Full Functionality

To use parser testing, run locally:
- Frontend: `npm start` (port 3000)
- Backend: `npm run server` (port 3001)
- Chronicle CLI: `secops` must be installed and accessible

## Technology Stack

- React 19
- Tailwind CSS 3
- Framer Motion 12
- Express.js (backend server)
- Google Chronicle CLI (secops)

## Project Structure

```
udm_explorer/
├── udm-explorer/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UdmField.js         # Schema tree
│   │   │   ├── DetailsPanel.js     # Field details
│   │   │   ├── LogstashPanel.js    # Gostash reference
│   │   │   └── ParserGenerator.js  # Parser generator
│   │   └── data/                   # UDM schema files
│   ├── server.js                   # Backend API server
│   └── package.json
└── README.md
```

## License

Internal Nestlé project. Refer to organization policies for usage.

---

**Note**: This application is for Google Chronicle UDM schema exploration and Gostash parser development. Not affiliated with Google.
