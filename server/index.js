import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setupDatabase } from './db.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import sharp from 'sharp';
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';

const twitterClients = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'super-secret-key-for-development-only'; // In production, use env variables
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

const uploadDir = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'))
  }),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadDir));

let db;

// Initialize database
setupDatabase().then(database => {
  db = database;
  console.log('Database connected and ready');
}).catch(err => {
  console.error('Failed to setup database:', err);
});

// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;

    // Insert user
    const result = await db.run(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, avatar]
    );

    // Generate token
    const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET, { expiresIn: '24h' });

    // Fetch user without password
    const user = await db.get('SELECT id, name, email, bio, avatar FROM users WHERE id = ?', [result.lastID]);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, email, bio, avatar FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PROTECTED API ROUTES ---

// GET user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, email, bio, avatar FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT (update) user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, bio, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    await db.run(
      'UPDATE users SET name = ?, email = ?, bio = ?, avatar = ? WHERE id = ?',
      [name, email, bio, avatar, req.user.id]
    );

    const updatedUser = await db.get('SELECT id, name, email, bio, avatar FROM users WHERE id = ?', [req.user.id]);
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET user settings
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (!settings) {
      // Create default settings if not exist
      await db.run('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.id]);
      settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    }
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT (update) user settings
app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { language, timezone, ai_provider, ai_custom_base_url, ai_api_key, ai_messages } = req.body;

    // Check if exists
    const existing = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (existing) {
      await db.run(
        'UPDATE user_settings SET language = ?, timezone = ?, ai_provider = ?, ai_custom_base_url = ?, ai_api_key = ?, ai_messages = ? WHERE user_id = ?',
        [
          language !== undefined ? language : existing.language,
          timezone !== undefined ? timezone : existing.timezone,
          ai_provider !== undefined ? ai_provider : existing.ai_provider,
          ai_custom_base_url !== undefined ? ai_custom_base_url : existing.ai_custom_base_url,
          ai_api_key !== undefined ? ai_api_key : existing.ai_api_key,
          ai_messages !== undefined ? ai_messages : existing.ai_messages,
          req.user.id
        ]
      );
    } else {
      await db.run(
        'INSERT INTO user_settings (user_id, language, timezone, ai_provider, ai_custom_base_url, ai_api_key, ai_messages) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, language, timezone, ai_provider, ai_custom_base_url, ai_api_key, ai_messages]
      );
    }

    const updatedSettings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    res.json(updatedSettings);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai/chat (Proxy to avoid CORS and hide keys)
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { model, messages } = req.body;

    const apiKey = process.env.AI_API_KEY;
    const aiProvider = process.env.AI_PROVIDER || 'openai';
    const customBaseUrl = process.env.AI_CUSTOM_BASE_URL;

    if (!apiKey) {
      return res.status(500).json({ error: 'AI API key is missing in server configuration.' });
    }

    let endpoint = 'https://api.openai.com/v1/chat/completions';

    if (aiProvider === 'nvidia') {
      endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
    } else if (aiProvider === 'custom' && customBaseUrl) {
      endpoint = customBaseUrl.endsWith('/')
        ? `${customBaseUrl}chat/completions`
        : `${customBaseUrl}/chat/completions`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || (aiProvider === 'nvidia' ? 'meta/llama-3.1-70b-instruct' : 'gpt-3.5-turbo'),
        messages: messages,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI API Provider Error:', errorData);
      return res.status(response.status).json({ error: 'AI provider request failed', details: errorData });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('AI Proxy Error:', err);
    res.status(500).json({ error: 'Internal server error while calling AI provider' });
  }
});

// --- CALENDAR EVENTS ROUTES ---

// GET all events for user
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const events = await db.all('SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date ASC, time ASC', [req.user.id]);
    // Parse channels JSON string back to array
    const formattedEvents = events.map(e => ({
      ...e,
      channels: e.channels ? JSON.parse(e.channels) : []
    }));
    res.json(formattedEvents);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST new event
app.post('/api/events', authenticateToken, diskUpload.single('file'), async (req, res) => {
  try {
    const { date, time, timezone, type, caption } = req.body;
    let channels = [];
    try {
      channels = typeof req.body.channels === 'string' ? JSON.parse(req.body.channels) : req.body.channels;
    } catch (e) {
      channels = req.body.channels || [];
    }

    let media_path = req.file ? req.file.filename : null;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (['.png', '.webp', '.gif', '.tiff'].includes(ext)) {
        const newFilename = `${req.file.filename}.jpg`;
        const oldPath = req.file.path;
        const newPath = path.join(path.dirname(oldPath), newFilename);

        await sharp(oldPath)
          .jpeg({ quality: 90 })
          .toFile(newPath);

        fs.unlinkSync(oldPath); // delete original
        media_path = newFilename;
      }
    }

    const result = await db.run(
      'INSERT INTO calendar_events (user_id, date, time, timezone, type, caption, channels, status, media_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, date, time, timezone, type, caption, JSON.stringify(channels), 'scheduled', media_path]
    );
    const newEvent = await db.get('SELECT * FROM calendar_events WHERE id = ?', [result.lastID]);
    newEvent.channels = newEvent.channels ? JSON.parse(newEvent.channels) : [];
    res.json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// DELETE event
app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// --- SOCIAL MEDIA INTEGRATION ROUTES ---

// 1. Initiate Facebook OAuth
app.get('/api/auth/facebook', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(401).send('Token required');

  try {
    const user = jwt.verify(token, JWT_SECRET); // Using same secret as above
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback';

    // Pass user ID in the state parameter
    const state = user.id;
    const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish,business_management';

    const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
    res.redirect(fbAuthUrl);
  } catch (err) {
    res.status(403).send('Invalid token');
  }
});

// 2. Facebook OAuth Callback
app.get('/api/auth/facebook/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;
  const frontendRedirect = 'http://localhost:5173/settings';

  if (error || !code) {
    return res.redirect(`${frontendRedirect}?error=oauth_failed`);
  }

  try {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback';

    // Exchange code for token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) throw new Error(tokenData.error.message);

    const accessToken = tokenData.access_token;

    // Get user info to fetch a name/id
    const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`);
    const userData = await userResponse.json();

    if (userData.error) throw new Error(userData.error.message);

    // Save or update in DB
    const existing = await db.get('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ? AND provider_account_id = ?', [userId, 'Facebook', userData.id]);

    if (existing) {
      await db.run('UPDATE social_accounts SET access_token = ? WHERE id = ?', [accessToken, existing.id]);
    } else {
      await db.run(
        'INSERT INTO social_accounts (user_id, platform, provider_account_id, username, access_token) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Facebook', userData.id, userData.name, accessToken]
      );
    }

    // Check for linked Instagram account
    try {
      const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          const igRes = await fetch(`https://graph.facebook.com/v17.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
          const igData = await igRes.json();
          if (igData.instagram_business_account) {
            const igId = igData.instagram_business_account.id;
            const existingIg = await db.get('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?', [userId, 'Instagram']);
            if (existingIg) {
              await db.run('UPDATE social_accounts SET access_token = ?, provider_account_id = ? WHERE id = ?', [accessToken, igId, existingIg.id]);
            } else {
              await db.run(
                'INSERT INTO social_accounts (user_id, platform, provider_account_id, username, access_token) VALUES (?, ?, ?, ?, ?)',
                [userId, 'Instagram', igId, 'Instagram Account', accessToken]
              );
            }
            break;
          }
        }
      }
    } catch (igErr) {
      console.error('Failed to check for linked Instagram account:', igErr);
    }

    res.redirect(`${frontendRedirect}?social=success`);
  } catch (err) {
    console.error('Facebook OAuth Error:', err);
    res.redirect(`${frontendRedirect}?error=oauth_error`);
  }
});
// LinkedIn OAuth
app.get('/api/auth/linkedin', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send('Unauthorized');

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/api/auth/linkedin/callback';

    const state = user.id;
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=w_member_social%20openid%20profile%20email`;
    res.redirect(linkedinAuthUrl);
  } catch (e) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/auth/linkedin/callback', async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) return res.status(400).send('Missing code or state');

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/api/auth/linkedin/callback';

    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const urn = profileResponse.data.sub;
    const name = profileResponse.data.name || 'LinkedIn User';

    const existing = await db.get('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?', [userId, 'LinkedIn']);

    if (existing) {
      await db.run(
        'UPDATE social_accounts SET access_token = ?, provider_account_id = ?, username = ? WHERE id = ?',
        [accessToken, urn, name, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO social_accounts (user_id, platform, provider_account_id, username, access_token) VALUES (?, ?, ?, ?, ?)',
        [userId, 'LinkedIn', urn, name, accessToken]
      );
    }

    res.send('<script>window.close();</script>');
  } catch (error) {
    console.error('LinkedIn Auth Error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// Twitter (X) OAuth
app.get('/api/auth/twitter', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send('Unauthorized');

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });

    const callbackUrl = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/auth/twitter/callback';
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(callbackUrl, {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
    });

    twitterClients.set(state, { codeVerifier, userId: user.id });
    res.redirect(url);
  } catch (e) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/auth/twitter/callback', async (req, res) => {
  const { state, code } = req.query;
  if (!state || !code) return res.status(400).send('Missing state or code');

  const sessionData = twitterClients.get(state);
  if (!sessionData) return res.status(400).send('Invalid state or session expired');

  twitterClients.delete(state);

  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });

    const callbackUrl = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/auth/twitter/callback';
    const { client: loggedClient, accessToken, refreshToken } = await client.loginWithOAuth2({
      code,
      codeVerifier: sessionData.codeVerifier,
      redirectUri: callbackUrl
    });

    const currentUser = await loggedClient.v2.me();
    const providerAccountId = currentUser.data.id;
    const username = currentUser.data.username;
    const tokens = JSON.stringify({ accessToken, refreshToken });

    const existing = await db.get('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?', [sessionData.userId, 'X']);

    if (existing) {
      await db.run(
        'UPDATE social_accounts SET access_token = ?, provider_account_id = ?, username = ? WHERE id = ?',
        [tokens, providerAccountId, username, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO social_accounts (user_id, platform, provider_account_id, username, access_token) VALUES (?, ?, ?, ?, ?)',
        [sessionData.userId, 'X', providerAccountId, username, tokens]
      );
    }

    res.send('<script>window.close();</script>');
  } catch (error) {
    console.error('Twitter Auth Error:', error);
    res.status(500).send('Authentication failed');
  }
});
// 3. Get connected social accounts
app.get('/api/social/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await db.all('SELECT id, platform, username, created_at FROM social_accounts WHERE user_id = ?', [req.user.id]);
    res.json(accounts);
  } catch (err) {
    console.error('Fetch accounts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Post to social media
app.post('/api/social/post', authenticateToken, upload.single('file'), async (req, res) => {
  let platforms = [];
  try {
    platforms = typeof req.body.platforms === 'string' ? JSON.parse(req.body.platforms) : req.body.platforms;
  } catch (e) {
    platforms = req.body.platforms || [];
  }

  const { content, type = 'text' } = req.body;
  const userId = req.user.id;
  const file = req.file;

  try {
    const results = [];

    for (const platform of platforms) {
      // Find the user's account for this platform
      const account = await db.get('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?', [userId, platform]);

      if (!account) {
        results.push({ platform, status: 'failed', error: 'Not connected' });
        continue;
      }

      if (platform === 'Facebook') {
        try {
          // Get Pages the user manages
          const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${account.access_token}`);
          const pagesData = await pagesRes.json();

          if (!pagesData.data || pagesData.data.length === 0) {
            results.push({ platform, status: 'failed', error: 'No Facebook Page found to post to. Create a Page first.' });
            continue;
          }

          const page = pagesData.data[0];
          const pageAccessToken = page.access_token;
          const pageId = page.id;

          // Post to the page
          let postEndpoint = `https://graph.facebook.com/${pageId}/feed`;

          let formData = new FormData();
          formData.append('access_token', pageAccessToken);

          if (type === 'image' && file) {
            postEndpoint = `https://graph.facebook.com/${pageId}/photos`;
            formData.append('message', content || '');
            formData.append('source', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
          } else if (type === 'video' && file) {
            postEndpoint = `https://graph.facebook.com/${pageId}/videos`;
            formData.append('description', content || '');
            formData.append('source', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
          } else {
            formData.append('message', content || '');
          }

          const postRes = await fetch(postEndpoint, {
            method: 'POST',
            body: formData
          });

          const postData = await postRes.json();
          if (postData.error) {
            results.push({ platform, status: 'failed', error: postData.error.message });
          } else {
            results.push({ platform, status: 'success', id: postData.id });
          }
        } catch (e) {
          results.push({ platform, status: 'failed', error: e.message });
        }
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error('Posting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- BACKGROUND CRON JOB FOR SCHEDULER ---
cron.schedule('* * * * *', async () => {
  if (!db) return;
  try {
    const now = new Date();
    const events = await db.all("SELECT * FROM calendar_events WHERE status = 'scheduled'");

    for (const event of events) {
      const eventTime = new Date(event.date);
      const [hours, minutes] = event.time.split(':');
      eventTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      if (now >= eventTime) {
        console.log(`Processing scheduled event ID: ${event.id}`);
        // Mark as processing immediately to prevent duplicate runs by next minute's cron
        await db.run("UPDATE calendar_events SET status = 'processing' WHERE id = ?", [event.id]);

        const platforms = event.channels ? JSON.parse(event.channels).map(id => {
          const strId = String(id).toLowerCase();
          if (strId === '2' || strId === 'fb1' || strId.includes('fb') || strId.includes('facebook')) return 'Facebook';
          if (strId === 'ig1' || strId.includes('ig') || strId.includes('insta')) return 'Instagram';
          if (strId === 'li1' || strId.includes('linkedin')) return 'LinkedIn';
          if (strId === 'x1' || strId.includes('x') || strId.includes('twitter')) return 'X';
          return null;
        }).filter(Boolean) : [];

        let successCount = 0;
        let lastPostId = null;

        for (const platform of platforms) {
          const account = await db.get('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?', [event.user_id, platform]);
          if (!account) continue;

          if (platform === 'Facebook') {
            try {
              const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${account.access_token}`);
              const pagesData = await pagesRes.json();
              if (pagesData.data && pagesData.data.length > 0) {
                const page = pagesData.data[0];
                let postEndpoint = `https://graph.facebook.com/${page.id}/feed`;
                let formData = new FormData();
                formData.append('access_token', page.access_token);

                if (event.type === 'image' && event.media_path) {
                  postEndpoint = `https://graph.facebook.com/${page.id}/photos`;
                  formData.append('message', event.caption || '');
                  const filePath = path.join(__dirname, 'uploads', event.media_path);
                  if (fs.existsSync(filePath)) {
                    const buffer = fs.readFileSync(filePath);
                    formData.append('source', new Blob([buffer]), event.media_path);
                  }
                } else if (event.type === 'video' && event.media_path) {
                  postEndpoint = `https://graph.facebook.com/${page.id}/videos`;
                  formData.append('description', event.caption || '');
                  const filePath = path.join(__dirname, 'uploads', event.media_path);
                  if (fs.existsSync(filePath)) {
                    const buffer = fs.readFileSync(filePath);
                    formData.append('source', new Blob([buffer]), event.media_path);
                  }
                } else {
                  formData.append('message', event.caption || '');
                }

                const postRes = await fetch(postEndpoint, { method: 'POST', body: formData });
                const postData = await postRes.json();

                if (!postData.error) {
                  successCount++;
                  lastPostId = postData.id;
                } else {
                  console.error('Cron FB Post Error:', postData.error.message);
                }
              }
            } catch (e) {
              console.error('Cron FB Error:', e.message);
            }
          }

          if (platform === 'Instagram') {
            try {
              if (!event.media_path) {
                console.error('Cron IG Error: Instagram does not support text-only posts.');
                continue;
              }
              const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${account.access_token}`);
              const pagesData = await pagesRes.json();

              if (pagesData.data && pagesData.data.length > 0) {
                const page = pagesData.data[0];

                const igRes = await fetch(`https://graph.facebook.com/v17.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
                const igData = await igRes.json();

                if (igData.instagram_business_account) {
                  const igAccountId = igData.instagram_business_account.id;

                  if (!process.env.PUBLIC_URL) {
                    console.error('Cron IG Error: PUBLIC_URL is missing in .env. Run localtunnel to test locally.');
                    continue;
                  }

                  const publicMediaUrl = `${process.env.PUBLIC_URL}/uploads/${event.media_path}`;
                  let containerEndpoint = `https://graph.facebook.com/v17.0/${igAccountId}/media?access_token=${page.access_token}&caption=${encodeURIComponent(event.caption || '')}`;

                  if (event.type === 'image') {
                    containerEndpoint += `&image_url=${encodeURIComponent(publicMediaUrl)}`;
                  } else if (event.type === 'video') {
                    containerEndpoint += `&media_type=VIDEO&video_url=${encodeURIComponent(publicMediaUrl)}`;
                  }

                  const containerRes = await fetch(containerEndpoint, { method: 'POST' });
                  const containerData = await containerRes.json();

                  if (containerData.id) {
                    // Instagram needs time to process the media before we can publish it.
                    let publishData = null;
                    let retries = 5;
                    let delay = 5000; // Start with 5s delay

                    while (retries > 0) {
                      await new Promise(r => setTimeout(r, delay));
                      const publishEndpoint = `https://graph.facebook.com/v17.0/${igAccountId}/media_publish?creation_id=${containerData.id}&access_token=${page.access_token}`;
                      const publishRes = await fetch(publishEndpoint, { method: 'POST' });
                      publishData = await publishRes.json();

                      if (publishData.id) {
                        break; // Success
                      } else if (publishData.error && publishData.error.code === 9007) {
                        // 9007: Media not ready to be published yet. Wait and retry.
                        retries--;
                        delay += 3000; // Increase wait time for next retry
                        console.log(`Cron IG: Media not ready, retrying in ${delay / 1000}s... (${retries} retries left)`);
                      } else {
                        break; // Other error, exit loop
                      }
                    }

                    if (publishData && publishData.id) {
                      successCount++;
                      lastPostId = publishData.id;
                    } else {
                      console.error('Cron IG Publish Error:', publishData ? publishData.error : 'Max retries reached');
                    }
                  } else {
                    console.error('Cron IG Container Error:', containerData.error);
                  }
                } else {
                  console.error('Cron IG Error: No Instagram Business Account linked to this Facebook Page.');
                }
              }
            } catch (e) {
              console.error('Cron IG Error:', e.message);
            }
          }
          if (platform === 'LinkedIn') {
            try {
              let requestBody = {
                author: `urn:li:person:${account.provider_account_id}`,
                lifecycleState: "PUBLISHED",
                specificContent: {
                  "com.linkedin.ugc.ShareContent": {
                    shareCommentary: { text: event.caption || '' },
                    shareMediaCategory: "NONE"
                  }
                },
                visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
              };

              if (event.type === 'image' && event.media_path) {
                const filePath = path.join(__dirname, 'uploads', event.media_path);
                if (fs.existsSync(filePath)) {
                  const registerRes = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
                    registerUploadRequest: {
                      recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                      owner: `urn:li:person:${account.provider_account_id}`,
                      serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }]
                    }
                  }, { headers: { Authorization: `Bearer ${account.access_token}` } });

                  const uploadUrl = registerRes.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
                  const asset = registerRes.data.value.asset;

                  const fileBuffer = fs.readFileSync(filePath);
                  await axios.post(uploadUrl, fileBuffer, {
                    headers: { 'Content-Type': 'application/octet-stream', 'Authorization': `Bearer ${account.access_token}` }
                  });

                  requestBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE";
                  requestBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
                    { status: "READY", media: asset }
                  ];
                }
              }

              const postRes = await axios.post('https://api.linkedin.com/v2/ugcPosts', requestBody, {
                headers: { Authorization: `Bearer ${account.access_token}` }
              });

              if (postRes.data && postRes.data.id) {
                successCount++;
                lastPostId = postRes.data.id;
              }
            } catch (e) {
              console.error('Cron LinkedIn Error:', e.response?.data || e.message);
            }
          }

          if (platform === 'X') {
            try {
              const tokens = JSON.parse(account.access_token);
              const client = new TwitterApi(tokens.accessToken);

              let tweetOptions = { text: event.caption || '' };
              if (event.media_path) {
                const filePath = path.join(__dirname, 'uploads', event.media_path);
                if (fs.existsSync(filePath)) {
                  const mediaId = await client.v1.uploadMedia(filePath);
                  tweetOptions.media = { media_ids: [mediaId] };
                }
              }

              const tweetResponse = await client.v2.tweet(tweetOptions);
              if (tweetResponse.data && tweetResponse.data.id) {
                successCount++;
                lastPostId = tweetResponse.data.id;
              }
            } catch (e) {
              console.error('Cron X Error:', e.message);
            }
          }
        }

        if (platforms.length === 0) {
          // If no valid platforms, fail it
          await db.run("UPDATE calendar_events SET status = 'failed' WHERE id = ?", [event.id]);
        } else if (successCount === platforms.length) {
          // All succeeded
          await db.run("UPDATE calendar_events SET status = 'posted', social_post_id = ? WHERE id = ?", [lastPostId, event.id]);
        } else if (successCount > 0) {
          // Partially succeeded
          await db.run("UPDATE calendar_events SET status = 'partial', social_post_id = ? WHERE id = ?", [lastPostId, event.id]);
        } else {
          // None succeeded
          await db.run("UPDATE calendar_events SET status = 'failed' WHERE id = ?", [event.id]);
        }
      }
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
