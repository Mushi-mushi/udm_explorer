// src/App.js
import React from 'react';
import UdmField from './components/UdmField';
import udmEvent from './data/udm-event.json';
import udmMetadata from './data/udm-metadata.json';

// --- Data Integration ---
// Here, we combine our two JSON files. We find the "metadata" field in the main
// event file and replace it with the detailed object from the metadata file.
const eventData = {
  ...udmEvent,
  children: udmEvent.children.map(child =>
    child.name === 'metadata' ? udmMetadata : child
  ),
};

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Unified Data Model Explorer</h1>
          <p className="text-gray-400">An interactive viewer for the UDM schema. Click a field to expand it.</p>
        </header>
        
        <main className="bg-gray-800 rounded-xl p-4 shadow-lg">
          {/* We start the rendering process with the top-level "Event" object */}
          <UdmField field={eventData} />
        </main>
      </div>
    </div>
  );
}

export default App;