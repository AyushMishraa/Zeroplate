const fs = require('fs');
const path = require('path');

let backendUrl = process.env.BACKEND_URL || process.env.API_URL;

if (backendUrl) {
  backendUrl = backendUrl.trim().replace(/\/+$/, '');
  // Ensure protocol is present (Render's 'host' property provides the domain without https://)
  if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    backendUrl = `https://${backendUrl}`;
  }
  const envContent = `export const environment = {
  production: true,
  apiUrl: '${backendUrl}/api',
  socketUrl: '${backendUrl}'
};
`;
  const envPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`[set-env] Successfully injected BACKEND_URL=${backendUrl} into environment.prod.ts`);
} else {
  console.log('[set-env] No BACKEND_URL provided, keeping existing environment.prod.ts');
}
