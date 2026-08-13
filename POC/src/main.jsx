import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LangProvider } from './i18n.jsx';
import { StoreProvider } from './store.jsx';
import App from './App.jsx';
import './styles.css';

// Queries are cancelled on navigation (see store.applyNav), so retries are off —
// an aborted request must not resurrect itself on the next page.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </LangProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
