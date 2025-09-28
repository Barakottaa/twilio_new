#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const apiRoutes = [
  'src/app/api/conversations/[id]/route.ts',
  'src/app/api/conversations/[id]/status/route.ts',
  'src/app/api/conversations/[id]/priority/route.ts',
  'src/app/api/conversations/[id]/assign/route.ts',
];

function fixApiRoute(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix params type from { id: string } to Promise<{ id: string }>
  content = content.replace(
    /{ params }: { params: { id: string } }/g,
    '{ params }: { params: Promise<{ id: string }> }'
  );
  
  // Add await for params resolution
  content = content.replace(
    /params\.id/g,
    'resolvedParams.id'
  );
  
  // Add resolvedParams declaration after try {
  content = content.replace(
    /try \{\s*\n/g,
    'try {\n    const resolvedParams = await params;\n'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

console.log('Fixing API routes...');

apiRoutes.forEach(fixApiRoute);

console.log('Done!');
