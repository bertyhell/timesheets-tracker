/// <reference types="vite/client" />

interface Window {
  electron?: {
    selectDirectory: () => Promise<string | null>;
  };
}
