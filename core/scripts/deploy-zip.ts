import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";

async function deploy(zipPath: string, agentId: string) {
  const targetDir = path.resolve(".agentTeam", "agents", agentId);
  
  console.log(`🚀 Deploying agent ${agentId}...`);
  console.log(`📦 ZIP Path: ${zipPath}`);
  console.log(`📂 Target: ${targetDir}`);

  if (!fs.existsSync(zipPath)) {
    console.error(`❌ Error: ZIP file not found at ${zipPath}`);
    process.exit(1);
  }

  try {
    const zip = new AdmZip(zipPath);
    
    // Ensure cleanup of previous deployment
    if (fs.existsSync(targetDir)) {
      console.log(`🧹 Cleaning up existing folder...`);
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    fs.mkdirSync(targetDir, { recursive: true });
    
    console.log(`📤 Extracting...`);
    zip.extractAllTo(targetDir, true);
    
    console.log(`✅ Success! Agent ${agentId} deployed.`);
    console.log(`👀 The AgentTeam engine should now automatically detect and register it.`);
  } catch (err: any) {
    console.error(`❌ Deployment failed: ${err.message}`);
  }
}

// Get arguments from CLI
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: npx tsx scripts/deploy-zip.ts <path-to-zip> <agent-id>");
  process.exit(1);
}

deploy(args[0], args[1]);
