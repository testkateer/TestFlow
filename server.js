const express = require('express');
const cors = require('cors');
const path = require('path');
const PlaywrightTestRunner = require('./src/utils/playwrightRunner');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Static files için React build folder'ını serve et
app.use(express.static(path.join(__dirname, 'build')));

// Test çalıştırma API endpoint'i
app.post('/api/run-test', async (req, res) => {
  const { testName, steps } = req.body;
  
  if (!steps || steps.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Test adımları boş olamaz'
    });
  }

  try {
    const runner = new PlaywrightTestRunner();
    const result = await runner.runTestSequence(steps);
    await runner.closeBrowser();
    
    res.json(result);
  } catch (error) {
    console.error('Test çalıştırma hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tek adım çalıştırma endpoint'i (Git adımı için özellikle)
app.post('/api/run-single-step', async (req, res) => {
  const { step } = req.body;
  
  if (!step) {
    return res.status(400).json({
      success: false,
      error: 'Adım bilgisi boş olamaz'
    });
  }

  try {
    const runner = new PlaywrightTestRunner();
    const result = await runner.executestep(step);
    await runner.closeBrowser();
    
    res.json(result);
  } catch (error) {
    console.error('Adım çalıştırma hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// React Router için fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`http://localhost:${PORT}`);
}); 