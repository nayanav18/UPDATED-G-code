import { Router, Request, Response } from 'express';
import { db, UserRecord, DashboardRecord, DashboardVisual } from './db';
import { bigQueryService } from './bigquery';
import { aiRouterService } from './ai';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', enterprise: 'Enterprise Analytics AI' });
});

// Helper for standardized error response (Doc Page 35-36)
function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({
    error: true,
    code,
    message
  });
}

/* =========================================================================
   1. AUTHENTICATION (POST /api/auth/register, /api/auth/login, /api/auth/verify)
   ========================================================================= */

// POST /api/auth/register
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, name } = req.body || {};

    if (!email || !password || !confirmPassword || !name) {
      return sendError(res, 400, 'EMPTY_FIELDS', 'All fields (name, email, password, confirm password) are required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'INVALID_EMAIL', 'Please enter a valid email address.');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'PASSWORD_TOO_SHORT', 'Password must be at least 6 characters in length.');
    }

    if (password !== confirmPassword) {
      return sendError(res, 400, 'PASSWORD_MISMATCH', 'Password and confirmation password do not match.');
    }

    // Check duplicate email
    const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return sendError(res, 409, 'DUPLICATE_EMAIL', 'An account with this email address already exists.');
    }

    // Create verification code (local mechanism for development, doc Page 6)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash: password, // in production we'd use bcrypt; local safe store
      isVerified: false,
      verificationCode,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    db.users.set(newUser.id, newUser);
    db.saveToDisk();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. A verification step is required.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isVerified: false
      },
      // Note: for development, return code to allow instant testing in UI without mock email sending (Page 6)
      verificationHint: verificationCode
    });
  } catch (err: any) {
    return sendError(res, 500, 'REGISTRATION_FAILED', err.message || 'Internal registration error');
  }
});

// POST /api/auth/verify
apiRouter.post('/auth/verify', (req: Request, res: Response) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return sendError(res, 400, 'EMPTY_FIELDS', 'Email and verification code are required.');
    }

    const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User record not found.');
    }

    // Accept matching verification code or '123456' for ease of testing
    if (user.verificationCode !== code && code !== '123456' && code !== user.verificationCode) {
      return sendError(res, 400, 'INVALID_VERIFICATION_CODE', 'The entered verification code is incorrect.');
    }

    user.isVerified = true;
    db.users.set(user.id, user);
    db.saveToDisk();

    return res.json({
      success: true,
      message: 'User account successfully verified.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: true
      }
    });
  } catch (err: any) {
    return sendError(res, 500, 'VERIFICATION_FAILED', err.message || 'Verification failed');
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return sendError(res, 400, 'EMPTY_FIELDS', 'Email and password are required.');
    }

    const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return sendError(res, 401, 'INVALID_LOGIN', 'Invalid email or password.');
    }

    if (user.passwordHash !== password) {
      return sendError(res, 401, 'INVALID_LOGIN', 'Invalid email or password.');
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: true,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Account created but requires verification before sign in.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: false
        },
        verificationHint: user.verificationCode
      });
    }

    return res.json({
      success: true,
      token: `session-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true
      }
    });
  } catch (err: any) {
    return sendError(res, 500, 'LOGIN_FAILED', err.message || 'Login failed');
  }
});

/* =========================================================================
   2. BUSINESSES, PERSONAS, DATASETS & METADATA (Pages 7, 8, 14, 15, 35)
   ========================================================================= */

// GET /api/businesses
apiRouter.get('/businesses', (req: Request, res: Response) => {
  return res.json(Array.from(db.businesses.values()));
});

// GET /api/personas
apiRouter.get('/personas', (req: Request, res: Response) => {
  return res.json(Array.from(db.personas.values()));
});

// GET /api/datasets
apiRouter.get('/datasets', (req: Request, res: Response) => {
  return res.json(Array.from(db.datasets.values()));
});

// GET /api/datasets/:id/metadata
apiRouter.get('/datasets/:id/metadata', (req: Request, res: Response) => {
  const datasetId = req.params.id;
  const meta = bigQueryService.getFullDatasetMetadata(datasetId);
  if (!meta) {
    return sendError(res, 404, 'DATASET_NOT_FOUND', `Dataset '${datasetId}' was not found in BigQuery.`);
  }
  return res.json(meta);
});

// Safe BigQuery Table Query endpoint
apiRouter.post('/datasets/:id/query', (req: Request, res: Response) => {
  try {
    const datasetId = req.params.id;
    const { table, dimension, measure, aggregation, limit, rawSql } = req.body || {};
    
    if (rawSql) {
      const check = bigQueryService.validateSqlSafety(rawSql);
      if (!check.safe) {
        return sendError(res, 403, 'FORBIDDEN_SQL', check.reason || 'Query blocked by safety policy.');
      }
    }

    const result = bigQueryService.executeQuery(table || 'customer_churn_and_revenue', {
      dimension,
      measure,
      aggregation,
      limit: limit ? Number(limit) : 20,
      rawSql
    });

    return res.json(result);
  } catch (err: any) {
    return sendError(res, 400, 'QUERY_FAILED', err.message || 'BigQuery execution error');
  }
});

/* =========================================================================
   3. CHAT & INTENT ROUTER (Pages 16-24, 35)
   ========================================================================= */

// POST /api/chat
apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversation_id, user_id, persona_id, business_id, dataset_id, current_visual_context } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, 400, 'EMPTY_MESSAGE', 'Message text cannot be empty.');
    }

    // Ensure conversation exists or create one
    let convId = conversation_id;
    if (!convId || !db.conversations.has(convId)) {
      convId = `conv-${Date.now()}`;
      const newConv = {
        conversation_id: convId,
        user_id: user_id || 'usr-anon',
        title: message.slice(0, 32) + (message.length > 32 ? '...' : ''),
        business_id: business_id || 'vf-ireland',
        persona_id: persona_id || 'ceo',
        dataset_id: dataset_id || 'KarthikRudrapati',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.conversations.set(convId, newConv);
    }

    // Record user message
    const userMsgRecord = {
      message_id: `msg-${Date.now()}-u`,
      conversation_id: convId,
      role: 'user' as const,
      content: message.trim(),
      provider: 'development_fallback' as const,
      created_at: new Date().toISOString()
    };
    db.messages.set(userMsgRecord.message_id, userMsgRecord);

    // Process through AiRouterService
    const assistantMsg = await aiRouterService.processMessage({
      message,
      conversation_id: convId,
      user_id: user_id || 'usr-anon',
      persona_id: persona_id || 'ceo',
      business_id: business_id || 'vf-ireland',
      dataset_id: dataset_id || 'KarthikRudrapati',
      current_visual_context
    });

    db.messages.set(assistantMsg.message_id, assistantMsg);
    
    // Update conversation timestamp
    const conv = db.conversations.get(convId);
    if (conv) {
      conv.updated_at = new Date().toISOString();
      db.conversations.set(convId, conv);
    }

    db.saveToDisk();

    return res.json({
      conversation_id: convId,
      user_message: userMsgRecord,
      response: assistantMsg
    });
  } catch (err: any) {
    return sendError(res, 500, 'CHAT_ERROR', err.message || 'Error processing chat message');
  }
});

/* =========================================================================
   4. CONVERSATIONS (Pages 19, 35)
   ========================================================================= */

// GET /api/conversations
apiRouter.get('/conversations', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || '';
  const list = Array.from(db.conversations.values())
    .filter(c => !userId || c.user_id === userId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return res.json(list);
});

// GET /api/conversations/:id
apiRouter.get('/conversations/:id', (req: Request, res: Response) => {
  const conv = db.conversations.get(req.params.id);
  if (!conv) {
    return sendError(res, 404, 'CONVERSATION_NOT_FOUND', `Conversation '${req.params.id}' not found.`);
  }

  const messages = Array.from(db.messages.values())
    .filter(m => m.conversation_id === req.params.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return res.json({
    conversation: conv,
    messages
  });
});

// DELETE /api/conversations/:id
apiRouter.delete('/conversations/:id', (req: Request, res: Response) => {
  const convId = req.params.id;
  if (!db.conversations.has(convId)) {
    return sendError(res, 404, 'CONVERSATION_NOT_FOUND', `Conversation '${convId}' not found.`);
  }

  db.conversations.delete(convId);
  // delete associated messages
  for (const [mId, m] of db.messages.entries()) {
    if (m.conversation_id === convId) {
      db.messages.delete(mId);
    }
  }
  db.saveToDisk();

  return res.json({ success: true, message: 'Conversation deleted.' });
});

/* =========================================================================
   5. DASHBOARDS & SHARING (Pages 28, 29, 35)
   ========================================================================= */

// GET /api/dashboards
apiRouter.get('/dashboards', (req: Request, res: Response) => {
  const userEmail = (req.query.user_email as string) || '';
  const userId = (req.query.user_id as string) || '';

  const all = Array.from(db.dashboards.values()).map(d => {
    // Check permission
    let userPermission: 'owner' | 'editor' | 'viewer' = 'viewer';
    if (d.user_id === userId) {
      userPermission = 'owner';
    } else {
      const share = Array.from(db.shares.values()).find(s => s.dashboard_id === d.dashboard_id && s.email.toLowerCase() === userEmail.toLowerCase());
      if (share) {
        userPermission = share.permission;
      }
    }
    return {
      ...d,
      user_permission: userPermission
    };
  });

  return res.json(all);
});

// POST /api/dashboards
apiRouter.post('/dashboards', (req: Request, res: Response) => {
  try {
    const { user_id, business_id, persona_id, dataset_id, name, description, layout, visuals, filters } = req.body || {};
    
    if (!name) {
      return sendError(res, 400, 'INVALID_NAME', 'Dashboard name is required.');
    }

    const newDash: DashboardRecord = {
      dashboard_id: `dash-${Date.now()}`,
      user_id: user_id || 'usr-anon',
      business_id: business_id || 'vf-ireland',
      persona_id: persona_id || 'ceo',
      dataset_id: dataset_id || 'KarthikRudrapati',
      name: name.trim(),
      description: description || '',
      layout: layout || 'grid',
      visuals: visuals || [],
      filters: filters || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.dashboards.set(newDash.dashboard_id, newDash);
    db.saveToDisk();

    return res.status(201).json(newDash);
  } catch (err: any) {
    return sendError(res, 500, 'DASHBOARD_CREATE_FAILED', err.message);
  }
});

// GET /api/dashboards/:id
apiRouter.get('/dashboards/:id', (req: Request, res: Response) => {
  const dash = db.dashboards.get(req.params.id);
  if (!dash) {
    return sendError(res, 404, 'DASHBOARD_NOT_FOUND', `Dashboard '${req.params.id}' not found.`);
  }

  const shares = Array.from(db.shares.values()).filter(s => s.dashboard_id === dash.dashboard_id);
  return res.json({
    ...dash,
    shares
  });
});

// PUT /api/dashboards/:id (Enforce editor/owner permissions, Page 29)
apiRouter.put('/dashboards/:id', (req: Request, res: Response) => {
  try {
    const dashId = req.params.id;
    const dash = db.dashboards.get(dashId);
    if (!dash) {
      return sendError(res, 404, 'DASHBOARD_NOT_FOUND', `Dashboard '${dashId}' not found.`);
    }

    const { user_id, user_email, name, description, visuals, layout, filters } = req.body || {};

    // Backend permission check: Page 29 "Sharing must be enforced by the backend, not only hidden in the frontend."
    const isOwner = dash.user_id === user_id;
    const share = Array.from(db.shares.values()).find(s => s.dashboard_id === dashId && s.email.toLowerCase() === (user_email || '').toLowerCase());
    const isEditor = share?.permission === 'editor';

    if (!isOwner && !isEditor && user_id !== 'usr-admin') {
      return sendError(res, 403, 'PERMISSION_DENIED', 'You only have viewer access to this dashboard and cannot save modifications.');
    }

    if (name !== undefined) dash.name = name;
    if (description !== undefined) dash.description = description;
    if (visuals !== undefined) dash.visuals = visuals;
    if (layout !== undefined) dash.layout = layout;
    if (filters !== undefined) dash.filters = filters;
    dash.updated_at = new Date().toISOString();

    db.dashboards.set(dashId, dash);
    db.saveToDisk();

    return res.json(dash);
  } catch (err: any) {
    return sendError(res, 500, 'DASHBOARD_UPDATE_FAILED', err.message);
  }
});

// DELETE /api/dashboards/:id
apiRouter.delete('/dashboards/:id', (req: Request, res: Response) => {
  const dashId = req.params.id;
  const dash = db.dashboards.get(dashId);
  if (!dash) {
    return sendError(res, 404, 'DASHBOARD_NOT_FOUND', `Dashboard '${dashId}' not found.`);
  }

  db.dashboards.delete(dashId);
  db.saveToDisk();
  return res.json({ success: true, message: 'Dashboard deleted.' });
});

// POST /api/dashboards/:id/share (Page 28-29)
apiRouter.post('/dashboards/:id/share', (req: Request, res: Response) => {
  try {
    const dashId = req.params.id;
    const { email, permission, shared_by } = req.body || {};

    if (!email || !permission) {
      return sendError(res, 400, 'EMPTY_FIELDS', 'Email and permission level (viewer | editor) are required.');
    }

    if (!['viewer', 'editor'].includes(permission)) {
      return sendError(res, 400, 'INVALID_PERMISSION', 'Permission must be either "viewer" or "editor".');
    }

    const dash = db.dashboards.get(dashId);
    if (!dash) {
      return sendError(res, 404, 'DASHBOARD_NOT_FOUND', `Dashboard '${dashId}' not found.`);
    }

    const shareId = `share-${Date.now()}`;
    const shareRecord = {
      share_id: shareId,
      dashboard_id: dashId,
      email: email.trim().toLowerCase(),
      permission: permission as 'viewer' | 'editor',
      shared_by: shared_by || 'owner',
      created_at: new Date().toISOString()
    };

    db.shares.set(shareId, shareRecord);
    db.saveToDisk();

    return res.status(201).json(shareRecord);
  } catch (err: any) {
    return sendError(res, 500, 'SHARE_FAILED', err.message);
  }
});

// GET /api/dashboards/:id/shares
apiRouter.get('/dashboards/:id/shares', (req: Request, res: Response) => {
  const dashId = req.params.id;
  const shares = Array.from(db.shares.values()).filter(s => s.dashboard_id === dashId);
  return res.json(shares);
});

/* =========================================================================
   6. PIPELINE VISIBILITY & FILTERING (Pages 22-23, 35, 48)
   ========================================================================= */

// GET /api/pipeline
apiRouter.get('/pipeline', (req: Request, res: Response) => {
  const { persona, business_area, dataset_id, status } = req.query as Record<string, string>;

  let items = Array.from(db.pipeline.values());

  if (persona && persona !== 'All') {
    items = items.filter(i => i.persona.toLowerCase() === persona.toLowerCase());
  }

  if (business_area && business_area !== 'All') {
    items = items.filter(i => i.business_area.toLowerCase() === business_area.toLowerCase());
  }

  if (dataset_id && dataset_id !== 'All') {
    items = items.filter(i => i.dataset_id.toLowerCase() === dataset_id.toLowerCase());
  }

  if (status && status !== 'All') {
    items = items.filter(i => i.status.toLowerCase() === status.toLowerCase());
  }

  return res.json({
    total: items.length,
    items
  });
});
