import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './styles/index.scss';
import Barbot from './Barbot';
import ConfigEditor from './ConfigEditor';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Barbot />} />
          <Route path="/config" element={<ConfigEditor />} />
        </Routes>
      </BrowserRouter>
    </div>
  </React.StrictMode>
);
