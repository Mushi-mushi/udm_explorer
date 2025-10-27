// src/App.js
import React, { useState, useMemo } from 'react';
import UdmField from './components/UdmField';
import DetailsPanel from './components/DetailsPanel';

// Import all data models
import udmEvent from './data/udm-event.json';
import udmEntity from './data/udm-entity.json';

// Import all data templates
import udmMetadata from './data/udm-metadata.json';
import udmEntityMetadata from './data/udm-entity-metadata.json';
import udmNoun from './data/udm-noun.json';
import udmSecurityResult from './data/udm-security_result.json';
import udmNetwork from './data/udm-network.json';

// --- Data Hydration Function ---
const hydrateUdmTree = (field, path = []) => {
  let hydratedField = JSON.parse(JSON.stringify(field));
  let childTemplate = null;

  if (hydratedField.name === 'metadata' && path.includes('Event')) childTemplate = udmMetadata.children;
  else if (hydratedField.name === 'metadata' && path.includes('Entity')) childTemplate = udmEntityMetadata.children;
  else if (hydratedField.name === 'security_result') childTemplate = udmSecurityResult.children;
  else if (hydratedField.name === 'network') childTemplate = udmNetwork.children;
  else if (hydratedField.type === 'Noun') childTemplate = udmNoun.children;

  if (childTemplate) hydratedField.children = childTemplate;

  if (hydratedField.logstashMapping) {
    const fullPath = [...path, hydratedField.name].slice(1);
    const udmPathString = `[udm][${fullPath.join('][')}]`;
    hydratedField.logstashMapping = hydratedField.logstashMapping.replace(/%%PATH%%/g, udmPathString);
  }

  if (hydratedField.children) {
    const newPath = [...path, hydratedField.name];
    hydratedField.children = hydratedField.children.map(child => hydrateUdmTree(child, newPath));
  }

  return hydratedField;
};

// --- Build Both Data Trees ---
const eventData = hydrateUdmTree(udmEvent, ['Event']);
const entityData = hydrateUdmTree(udmEntity, ['Entity']);

// --- Helper function to collect all unique use cases ---
const collectUseCases = (node, useCaseSet) => {
  if (node.keyFieldInfo) {
    node.keyFieldInfo.forEach(uc => useCaseSet.add(uc));
  }
  if (node.children) {
    node.children.forEach(child => collectUseCases(child, useCaseSet));
  }
};

function App() {
  const [selectedField, setSelectedField] = useState(null);
  const [view, setView] = useState('event');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState('');

  const handleFieldSelect = (field) => {
    setSelectedField(field);
  };

  const currentData = view === 'event' ? eventData : entityData;

  const allUseCases = useMemo(() => {
    const useCaseSet = new Set();
    if (eventData) collectUseCases(eventData, useCaseSet);
    if (entityData) collectUseCases(entityData, useCaseSet);
    return Array.from(useCaseSet).sort();
  }, []);

  return (
    <div className="bg-solarized-base03 text-solarized-base0 min-h-screen p-4 sm:p-8 font-[sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-solarized-base1">Unified Data Model Explorer</h1>
          <p className="text-solarized-base00">An interactive viewer for the UDM schema. Select a model to explore.</p>
        </header>

        {/* --- Model Toggle Buttons --- */}
        <div className="flex justify-center mb-4 gap-4">
          <button
            onClick={() => { setView('event'); setSelectedField(null); setSearchQuery(''); setSelectedUseCase(''); }}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              view === 'event' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'
            }`}
          >
            Event Model
          </button>
          <button
            onClick={() => { setView('entity'); setSelectedField(null); setSearchQuery(''); setSelectedUseCase(''); }}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              view === 'entity' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'
            }`}
          >
            Entity Model
          </button>
        </div>

        {/* --- Search Input --- */}
        <div className="mb-4 max-w-lg mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedUseCase(''); }}
            placeholder="Search for a UDM field (or 'repeated')..."
            className="w-full px-4 py-2 bg-solarized-base02 text-solarized-base1 rounded-full border-2 border-transparent focus:outline-none focus:border-solarized-cyan"
          />
        </div>

        {/* --- Use Case Filter Buttons --- */}
        <div className="flex justify-center flex-wrap gap-2 mb-8 max-w-3xl mx-auto">
          <button
            onClick={() => setSelectedUseCase('')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${!selectedUseCase ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}
          >
            All Fields
          </button>
          {allUseCases.map(uc => (
            <button
              key={uc}
              onClick={() => { setSelectedUseCase(uc); setSearchQuery(''); }}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedUseCase === uc ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}
            >
              {uc}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <main className="bg-solarized-base02 rounded-xl p-4 shadow-lg md:w-1/2 min-w-0">
            <UdmField
              key={view + searchQuery + selectedUseCase}
              field={currentData}
              selectedField={selectedField}
              searchQuery={searchQuery}
              selectedUseCase={selectedUseCase}
              onSelect={handleFieldSelect}
            />
          </main>
          
          <aside className="md:w-1/2 min-w-0">
            <DetailsPanel field={selectedField} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;