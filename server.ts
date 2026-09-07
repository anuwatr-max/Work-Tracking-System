import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_TASKS, INITIAL_MONTHLY_SUMMARIES } from './src/data/initialData';
import { DEFAULT_SHARED_USERS } from './src/utils/storage';
import { syncAllSummariesForTasks } from './src/utils/summarySync';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'work_tracking_data.json');

interface StoredData {
  tasks: typeof INITIAL_TASKS;
  summaries: typeof INITIAL_MONTHLY_SUMMARIES;
  sharedUsers: typeof DEFAULT_SHARED_USERS;
  lastUpdated: string;
  isDefault?: boolean;
}

function ensureDataFile(): StoredData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tasks)) {
        return {
          tasks: parsed.tasks,
          summaries: Array.isArray(parsed.summaries) ? parsed.summaries : INITIAL_MONTHLY_SUMMARIES,
          sharedUsers: Array.isArray(parsed.sharedUsers) ? parsed.sharedUsers : DEFAULT_SHARED_USERS,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          isDefault: parsed.isDefault ?? false,
        };
      }
    }
  } catch (err) {
    console.error('Error reading data file, initializing defaults:', err);
  }

  const initialData: StoredData = {
    tasks: INITIAL_TASKS,
    summaries: INITIAL_MONTHLY_SUMMARIES,
    sharedUsers: DEFAULT_SHARED_USERS,
    lastUpdated: new Date().toISOString(),
    isDefault: true,
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial data file:', err);
  }

  return initialData;
}

function writeDataFile(data: Partial<StoredData>): StoredData {
  const current = ensureDataFile();
  const updated: StoredData = {
    tasks: data.tasks ?? current.tasks,
    summaries: data.summaries ?? current.summaries,
    sharedUsers: data.sharedUsers ?? current.sharedUsers,
    lastUpdated: new Date().toISOString(),
    isDefault: false,
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting data file:', err);
  }

  return updated;
}

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure initial data file exists
  ensureDataFile();

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get full synchronized dataset
  app.get('/api/data', (_req, res) => {
    const data = ensureDataFile();
    res.json(data);
  });

  // Update tasks and auto-sync summaries
  app.post('/api/tasks', (req, res) => {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'tasks must be an array' });
    }
    const current = ensureDataFile();
    const syncedSummaries = syncAllSummariesForTasks(tasks, current.summaries);
    const updated = writeDataFile({ tasks, summaries: syncedSummaries });
    res.json({ 
      success: true, 
      count: updated.tasks.length, 
      lastUpdated: updated.lastUpdated,
      summariesCount: updated.summaries.length 
    });
  });

  // Update monthly summaries
  app.post('/api/summaries', (req, res) => {
    const { summaries } = req.body;
    if (!Array.isArray(summaries)) {
      return res.status(400).json({ error: 'summaries must be an array' });
    }
    const updated = writeDataFile({ summaries });
    res.json({ success: true, count: updated.summaries.length, lastUpdated: updated.lastUpdated });
  });

  // Update shared users
  app.post('/api/shared-users', (req, res) => {
    const { sharedUsers } = req.body;
    if (!Array.isArray(sharedUsers)) {
      return res.status(400).json({ error: 'sharedUsers must be an array' });
    }
    const updated = writeDataFile({ sharedUsers });
    res.json({ success: true, count: updated.sharedUsers.length, lastUpdated: updated.lastUpdated });
  });

  // Reset to default data
  app.post('/api/reset', (_req, res) => {
    const resetData: StoredData = {
      tasks: INITIAL_TASKS,
      summaries: INITIAL_MONTHLY_SUMMARIES,
      sharedUsers: DEFAULT_SHARED_USERS,
      lastUpdated: new Date().toISOString(),
      isDefault: true,
    };
    writeDataFile(resetData);
    res.json({ success: true, data: resetData });
  });

  // Vite middleware in development; static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Work Tracking System server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
