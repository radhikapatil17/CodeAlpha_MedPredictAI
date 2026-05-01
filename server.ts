import express from "express";
import { createServer as createViteServer } from "vite";
import { spawn, spawnSync } from "child_process";

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Checking Python environment...");
  const pipCheck = spawnSync("pip3", ["--version"]);
  
  if (pipCheck.status === 0) {
    console.log("Installing Python dependencies...");
    spawnSync("pip3", ["install", "-r", "requirements.txt"], { stdio: 'inherit' });
    
    console.log("Training models...");
    spawnSync("python3", ["src/ml/train.py"], { stdio: 'inherit' });
  } else {
    console.warn("Pip3 not found. Skipping dependency installation and training. Backend will use heuristic fallback.");
  }

  // Prediction API Implementation (Node.js fallback for preview)
  app.use(express.json());
  
  const VALIDATION_RULES: Record<string, any> = {
    heart: {
      age: { min: 1, max: 100 },
      chol: { min: 100, max: 400 },
      bp: { min: 80, max: 200 },
      hr: { min: 40, max: 200 },
    },
    diabetes: {
      glucose: { min: 50, max: 300 },
      bmi: { min: 10, max: 60 },
      insulin: { min: 0, max: 300 },
      age: { min: 1, max: 100 },
    },
    cancer: {
      radius: { min: 5, max: 30 },
      texture: { min: 5, max: 40 },
      area: { min: 100, max: 2500 },
      smoothness: { min: 0.05, max: 0.2 },
    }
  };

  app.post("/predict", (req, res) => {
    const { disease, features } = req.body;

    // Backend Validation
    const rules = VALIDATION_RULES[disease];
    if (!rules) {
      return res.status(400).json({ status: "error", message: "Invalid disease type" });
    }

    for (const fieldId in rules) {
      const val = parseFloat(features[fieldId]);
      const rule = rules[fieldId];
      if (isNaN(val) || val < rule.min || val > rule.max) {
        return res.status(400).json({ 
          status: "error", 
          message: `Validation failed: ${fieldId} out of range (${rule.min}-${rule.max})` 
        });
      }
    }

    let score = 0;
    
    if (disease === 'heart') {
      const age = parseFloat(features.age || 45);
      const chol = parseFloat(features.chol || 240);
      const bp = parseFloat(features.bp || 130);
      if (age > 50) score += 0.2;
      if (chol > 220) score += 0.3;
      if (bp > 135) score += 0.3;
    } else if (disease === 'diabetes') {
      const glucose = parseFloat(features.glucose || 120);
      const bmi = parseFloat(features.bmi || 24);
      if (glucose > 130) score += 0.4;
      if (bmi > 28) score += 0.4;
    } else if (disease === 'cancer') {
      const radius = parseFloat(features.radius || 14);
      const area = parseFloat(features.area || 650);
      if (radius > 16) score += 0.5;
      if (area > 750) score += 0.3;
    }

    const prob = Math.min(0.98, Math.max(0.02, score + (Math.random() * 0.1)));
    const prediction = prob > 0.5 ? "High Risk" : "Low Risk";

    console.log(`[Diagnostic Engine] Processed ${disease} prediction: ${prediction} (${(prob*100).toFixed(1)}%)`);

    res.json({
      prediction,
      probability: prob,
      status: "success",
      engine: "Live Diagnostic Engine (Node-ML Fallback)"
    });
  });

  // Vite middleware
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
    },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`System running on http://localhost:${PORT}`);
  });
}

startServer();
