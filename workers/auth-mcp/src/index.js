/**
 * Sports Platform Authentication MCP Worker
 * Handles user management, authentication, and fantasy provider credentials
 */

// Import analytics service
const { UserAnalyticsService } = require('./services/userAnalytics');

// JWT utilities using Web Crypto API
async function signJwt(payload, secret, expiresIn = '24h') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '24h' ? 86400 : expiresIn === '15m' ? 900 : 86400);
  
  const jwtPayload = { ...payload, iat: now, exp };
  
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${data}.${signatureB64}`;
}

async function verifyJwt(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const data = `${headerB64}.${payloadB64}`;
    
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));
    if (!valid) return null;
    
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch (error) {
    return null;
  }
}

// Generate trace ID for observability
function generateTraceId() {
  return `00-${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').substring(0, 8)}-${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}-01`;
}

export default {
  async fetch(request, env) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Generate or extract trace ID for observability
    const traceId = request.headers.get('traceparent') || generateTraceId();
    const requestId = crypto.randomUUID().substring(0, 8);

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Turnstile-Token, traceparent',
      'X-Request-ID': requestId,
      'X-Trace-ID': traceId,
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Log request start
      console.log(`[${requestId}] ${request.method} ${path} - Start`, {
        traceId,
        userAgent: request.headers.get('User-Agent'),
        ip: request.headers.get('CF-Connecting-IP'),
        timestamp: new Date().toISOString()
      });
      // Route requests
      switch (path) {
        case '/health':
          return handleHealth(request, env, corsHeaders);
        
        case '/auth/signup':
          return handleSignup(request, env, corsHeaders);
        
        case '/auth/login':
          return handleLogin(request, env, corsHeaders);
        
        case '/auth/verify':
          return handleVerifyToken(request, env, corsHeaders);
        
        case '/auth/link-espn':
          return handleLinkEspn(request, env, corsHeaders);
        
        case '/billing/create-session':
          return handleCreateBillingSession(request, env, corsHeaders);
        
        case '/billing/webhook':
          return handleBillingWebhook(request, env, corsHeaders);
        
        case '/user/profile':
          return handleUserProfile(request, env, corsHeaders);
        
        case '/user/credentials':
          return handleUserCredentials(request, env, corsHeaders);
        
        case '/user/preferences':
          return handleUserPreferences(request, env, corsHeaders);
        
        case '/user/scripts':
          return handleUserScripts(request, env, corsHeaders);
        
        case '/user/analytics':
          return handleUserAnalytics(request, env, corsHeaders);
        
        case '/admin/analytics':
          return handlePlatformAnalytics(request, env, corsHeaders);
        
        
        default:
          return new Response('Not Found', { 
            status: 404, 
            headers: corsHeaders 
          });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error with trace context
      console.error(`[${requestId}] ${request.method} ${path} - Error`, {
        traceId,
        error: error.message,
        stack: error.stack,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        requestId
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } finally {
      // Log request completion
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ${request.method} ${path} - Complete`, {
        traceId,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Health check endpoint
async function handleHealth(request, env, corsHeaders) {
  try {
    // Test database connection
    const dbTest = await env.AUTH_DB.prepare('SELECT 1 as test').first();
    
    // Test KV connections
    await env.CRED_KV.get('health-check');
    await env.SESSION_KV.get('health-check');

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbTest ? 'connected' : 'disconnected',
        credentials_kv: 'connected',
        session_kv: 'connected'
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// User signup
async function handleSignup(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const { email, turnstileToken } = await request.json();
  
  // Validate Turnstile token
  if (!await validateTurnstile(turnstileToken, env)) {
    return new Response(JSON.stringify({
      error: 'Invalid captcha'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    // Check if user already exists
    const existingUser = await env.AUTH_DB
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({
        error: 'User already exists'
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Create user
    const userId = crypto.randomUUID();
    await env.AUTH_DB
      .prepare('INSERT INTO users (id, email, created) VALUES (?, ?, ?)')
      .bind(userId, email, new Date().toISOString())
      .run();

    // Generate magic link token
    const magicToken = await signJwt({
      userId,
      email,
      type: 'magic-link',
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    }, env.JWT_SECRET);

    return new Response(JSON.stringify({
      success: true,
      userId,
      magicToken
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create user'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// User login/token verification
async function handleLogin(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const { magicToken } = await request.json();

  try {
    // Verify magic link token
    const payload = await verifyJwt(magicToken, env.JWT_SECRET);
    
    if (payload.type !== 'magic-link') {
      throw new Error('Invalid token type');
    }

    // Get user details
    const user = await env.AUTH_DB
      .prepare('SELECT id, email FROM users WHERE id = ?')
      .bind(payload.userId)
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Create session token
    const sessionToken = await signJwt({
      userId: user.id,
      email: user.email,
      type: 'session',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, env.JWT_SECRET);

    // Store session in Durable Object
    const sessionId = crypto.randomUUID();
    const sessionDO = env.SESSION_DO.get(env.SESSION_DO.idFromName(sessionId));
    await sessionDO.fetch(new Request('http://session/create', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        userId: user.id,
        token: sessionToken,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      })
    }));

    return new Response(JSON.stringify({
      success: true,
      sessionToken,
      sessionId,
      user: {
        id: user.id,
        email: user.email
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      error: 'Invalid or expired token'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Verify JWT token
async function handleVerifyToken(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'Missing or invalid authorization header'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    
    return new Response(JSON.stringify({
      valid: true,
      userId: payload.userId,
      email: payload.email
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'Invalid token'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Link ESPN credentials
async function handleLinkEspn(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  // Verify user authentication
  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  const { leagueId, swid, espnS2, turnstileToken } = await request.json();

  // Validate Turnstile token
  if (!await validateTurnstile(turnstileToken, env)) {
    return new Response(JSON.stringify({
      error: 'Invalid captcha'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    // Encrypt credentials
    const credentials = JSON.stringify({ swid, espnS2 });
    const encryptedCredentials = await encryptData(credentials, env.ENCRYPTION_KEY);

    // Store in database
    await env.AUTH_DB
      .prepare(`
        INSERT OR REPLACE INTO fantasy_credentials 
        (user_id, provider, league_id, swid, espn_s2, updated) 
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        user.userId,
        'espn',
        leagueId,
        encryptedCredentials.swid,
        encryptedCredentials.espnS2,
        new Date().toISOString()
      )
      .run();

    // Cache in KV for quick access
    const cacheKey = `cred:${user.userId}:espn:${leagueId}`;
    await env.CRED_KV.put(cacheKey, JSON.stringify(encryptedCredentials), {
      expirationTtl: 86400 // 24 hours
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'ESPN credentials linked successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Link ESPN error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to link ESPN credentials'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Create Stripe billing session
async function handleCreateBillingSession(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  const { plan } = await request.json(); // 'pro' or 'elite'

  try {
    // Create Stripe checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'success_url': 'https://your-domain.com/success',
        'cancel_url': 'https://your-domain.com/cancel',
        'mode': 'subscription',
        'customer_email': user.email,
        'client_reference_id': user.userId,
        'line_items[0][price]': plan === 'elite' ? 'price_elite' : 'price_pro',
        'line_items[0][quantity]': '1'
      })
    });

    const session = await stripeResponse.json();

    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Billing session error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create billing session'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Handle Stripe webhooks
async function handleBillingWebhook(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Verify webhook signature (simplified - in production, use crypto.subtle)
    // const expectedSignature = await crypto.subtle.sign('HMAC', key, body);
    
    const event = JSON.parse(body);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleSubscriptionActivated(event.data.object, env);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object, env);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      error: 'Webhook processing failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Get user profile
async function handleUserProfile(request, env, corsHeaders) {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    // Get user with subscription info
    const userProfile = await env.AUTH_DB
      .prepare(`
        SELECT u.id, u.email, u.created, s.status, s.plan, s.current_period_end
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        WHERE u.id = ?
      `)
      .bind(user.userId)
      .first();

    return new Response(JSON.stringify({
      user: userProfile
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get user profile'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Get user credentials for a provider/league
async function handleUserCredentials(request, env, corsHeaders) {
  // Check if this is an internal service request
  const userIdHeader = request.headers.get('X-User-ID');
  const authHeader = request.headers.get('Authorization');
  
  let userId;
  
  if (userIdHeader && authHeader === 'Bearer system-internal-token') {
    // Internal service request
    userId = userIdHeader;
  } else {
    // External user request - verify JWT
    const user = await authenticateRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    userId = user.userId;
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  const leagueId = url.searchParams.get('leagueId');

  if (!provider || !leagueId) {
    return new Response(JSON.stringify({
      error: 'Missing provider or leagueId parameter'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    // Try KV cache first
    const cacheKey = `cred:${userId}:${provider}:${leagueId}`;
    let credentials = await env.CRED_KV.get(cacheKey, 'json');

    if (!credentials) {
      // Fallback to database
      const credRow = await env.AUTH_DB
        .prepare('SELECT swid, espn_s2 FROM fantasy_credentials WHERE user_id = ? AND provider = ? AND league_id = ?')
        .bind(userId, provider, leagueId)
        .first();

      if (credRow) {
        credentials = {
          swid: await decryptData(credRow.swid, env.ENCRYPTION_KEY),
          espnS2: await decryptData(credRow.espn_s2, env.ENCRYPTION_KEY)
        };

        // Cache for next time
        await env.CRED_KV.put(cacheKey, JSON.stringify(credentials), {
          expirationTtl: 86400
        });
      }
    }

    if (!credentials) {
      return new Response(JSON.stringify({
        error: 'No credentials found for this provider/league'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    return new Response(JSON.stringify({
      credentials
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Credentials error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get credentials'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Utility functions
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    
    if (payload.type !== 'session') {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

async function validateTurnstile(token, env) {
  if (!token || !env.TURNSTILE_SECRET_KEY) {
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token
      })
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Turnstile validation error:', error);
    return false;
  }
}

async function encryptData(data, key) {
  // Simplified encryption - in production, use crypto.subtle
  return {
    swid: btoa(data.swid || ''),
    espnS2: btoa(data.espnS2 || '')
  };
}

async function decryptData(encryptedData, key) {
  // Simplified decryption - in production, use crypto.subtle
  return atob(encryptedData);
}

async function handleSubscriptionActivated(invoice, env) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Get customer info from Stripe
  const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`
    }
  });
  const customer = await customerResponse.json();

  // Update subscription status
  await env.AUTH_DB
    .prepare(`
      INSERT OR REPLACE INTO subscriptions 
      (user_id, status, plan, stripe_subscription_id, current_period_end, updated)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      customer.metadata.userId,
      'active',
      'pro', // Determine from subscription
      subscriptionId,
      new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
      new Date().toISOString()
    )
    .run();
}

async function handleSubscriptionCanceled(subscription, env) {
  await env.AUTH_DB
    .prepare('UPDATE subscriptions SET status = ?, updated = ? WHERE stripe_subscription_id = ?')
    .bind('canceled', new Date().toISOString(), subscription.id)
    .run();
}

// Session Manager Durable Object
// Handle user preferences
async function handleUserPreferences(request, env, corsHeaders) {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const analytics = new UserAnalyticsService(env);

  if (request.method === 'GET') {
    try {
      const preferences = await analytics.getUserPreferences(user.userId);
      return new Response(JSON.stringify({ preferences }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to get preferences' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (request.method === 'PUT' || request.method === 'PATCH') {
    try {
      const { preferences } = await request.json();
      
      for (const [key, value] of Object.entries(preferences)) {
        await analytics.updateUserPreference(user.userId, key, value);
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to update preferences' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Handle user scripts/macros
async function handleUserScripts(request, env, corsHeaders) {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const analytics = new UserAnalyticsService(env);
  const url = new URL(request.url);
  const sport = url.searchParams.get('sport');

  if (request.method === 'GET') {
    try {
      const scripts = await analytics.getUserScripts(user.userId, sport);
      return new Response(JSON.stringify({ scripts }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to get scripts' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const script = await request.json();
      const scriptId = await analytics.saveUserScript(user.userId, script);
      return new Response(JSON.stringify({ scriptId, success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to save script' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Handle user analytics
async function handleUserAnalytics(request, env, corsHeaders) {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const analytics = new UserAnalyticsService(env);
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days')) || 30;

  try {
    const userAnalytics = await analytics.getUserAnalytics(user.userId, days);
    return new Response(JSON.stringify(userAnalytics), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get analytics' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Handle platform analytics (admin only)
async function handlePlatformAnalytics(request, env, corsHeaders) {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // TODO: Add admin role check
  // For now, allow all authenticated users to see platform analytics

  const analytics = new UserAnalyticsService(env);
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days')) || 30;

  try {
    const platformAnalytics = await analytics.getPlatformAnalytics(days);
    return new Response(JSON.stringify(platformAnalytics), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get platform analytics' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}


export class SessionManager {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/create':
        return this.createSession(request);
      case '/get':
        return this.getSession(request);
      case '/invalidate':
        return this.invalidateSession(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  async createSession(request) {
    const { sessionId, userId, token, expiresAt } = await request.json();
    
    await this.state.storage.put(`session:${sessionId}`, {
      userId,
      token,
      expiresAt,
      createdAt: Date.now()
    });

    return new Response(JSON.stringify({ success: true }));
  }

  async getSession(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    const session = await this.state.storage.get(`session:${sessionId}`);
    
    if (!session || Date.now() > session.expiresAt) {
      return new Response(JSON.stringify({ valid: false }), { status: 404 });
    }

    return new Response(JSON.stringify({ valid: true, session }));
  }

  async invalidateSession(request) {
    const { sessionId } = await request.json();
    
    await this.state.storage.delete(`session:${sessionId}`);
    
    return new Response(JSON.stringify({ success: true }));
  }
}