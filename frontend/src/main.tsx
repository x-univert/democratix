import ReactDOM from 'react-dom/client';

import { initApp } from 'lib';

import { App } from './App';
import { config } from './initConfig';
import './i18n'; // Initialiser i18n
import './styles/accessibility.css'; // Styles d'accessibilité WCAG 2.1 AA

initApp(config).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
