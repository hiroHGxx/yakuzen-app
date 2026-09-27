import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  use: { ...config.use, baseURL: 'http://127.0.0.1:4174/yakuzen-app/' },
  webServer: {
    command: 'npm run preview -- --port 4174 --base /yakuzen-app/',
    url: 'http://127.0.0.1:4174/yakuzen-app/',
    reuseExistingServer: false,
  },
});
