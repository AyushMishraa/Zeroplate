const fs = require('fs');
const path = require('path');

const backendUrl = process.env.BACKEND_URL || process.env.API_URL;

if (backendUrl) {
  const cleanUrl = backendUrl.replace(/\/+$/, '');
  const envContent = `export const environment = {
  production: true,
  apiUrl: '${cleanUrl}/api',
  socketUrl: '${cleanUrl}'
};
`;
  const envPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`[set-env] Successfully injected BACKEND_URL=${cleanUrl} into environment.prod.ts`);
} else {
  console.log('[set-env] No BACKEND_URL provided, keeping existing environment.prod.ts');
}
