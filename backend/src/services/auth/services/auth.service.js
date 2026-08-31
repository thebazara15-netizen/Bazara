// services/auth/services/auth.service.js

const User = require('../../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PUBLIC_ROLES = new Set(['CLIENT', 'VENDOR']);
const MINIMUM_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationError(code) {
  const error = new Error('Registration validation failed');
  error.code = code;
  return error;
}

const getDisplayName = (user) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.companyName || user.email;
};

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  name: getDisplayName(user),
  role: user.role,
  companyName: user.companyName,
  gstNumber: user.gstNumber,
  phone: user.phone,
  location: user.location,
  businessType: user.businessType,
  aboutCompany: user.aboutCompany,
  responseRate: user.responseRate,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const createToken = (user) => jwt.sign(
  {
    id: user.id,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: getDisplayName(user)
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const redirectWithSocialError = (res, message) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = new URL('/login', frontendUrl);
  url.searchParams.set('socialError', message);
  return res.redirect(url.toString());
};

const getApiBaseUrl = (req) => process.env.API_URL || `${req.protocol}://${req.get('host')}`;

const socialProviders = {
  google: {
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: 'openid email profile',
    getProfile: (profile) => ({
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      name: profile.name
    })
  },
  facebook: {
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/me?fields=id,name,email,first_name,last_name',
    scope: 'email,public_profile',
    getProfile: (profile) => ({
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      name: profile.name
    })
  },
  linkedin: {
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/userinfo',
    scope: 'openid profile email',
    getProfile: (profile) => ({
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      name: profile.name
    })
  }
};

exports.getSocialConfig = () => Object.fromEntries(
  Object.entries(socialProviders).map(([providerName, provider]) => [
    providerName,
    Boolean(process.env[provider.clientIdEnv] && process.env[provider.clientSecretEnv])
  ])
);

// Register User
exports.registerUser = async (data) => {
  const {
    email,
    password,
    role: requestedRole = 'CLIENT',
    firstName,
    lastName,
    companyName,
    gstNumber,
    phone
  } = data;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const role = String(requestedRole || 'CLIENT').trim().toUpperCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw validationError('INVALID_EMAIL');
  }

  if (typeof password !== 'string' || password.length < MINIMUM_PASSWORD_LENGTH) {
    throw validationError('WEAK_PASSWORD');
  }

  if (!PUBLIC_ROLES.has(role)) {
    throw validationError('INVALID_ROLE');
  }

  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    const error = new Error('User already exists');
    error.code = 'EMAIL_EXISTS';
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email: normalizedEmail,
    password: hashedPassword,
    role,
    firstName,
    lastName,
    companyName,
    gstNumber,
    phone,
    isVerified: role === 'CLIENT'
  });

  return serializeUser(user);
};

// Login User
exports.loginUser = async (data) => {
  const { email, password } = data;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = createToken(user);

  return { token, user: serializeUser(user) };
};

exports.startSocialLogin = (providerName, req, res) => {
  const provider = socialProviders[providerName];

  if (!provider) {
    return redirectWithSocialError(res, 'Unsupported social login provider');
  }

  const clientId = process.env[provider.clientIdEnv];
  const clientSecret = process.env[provider.clientSecretEnv];
  if (!clientId || !clientSecret) {
    return redirectWithSocialError(res, `${providerName} login is not configured yet`);
  }

  const redirectUri = `${getApiBaseUrl(req)}/api/auth/${providerName}/callback`;
  const authUrl = new URL(provider.authUrl);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', provider.scope);
  authUrl.searchParams.set('state', providerName);

  return res.redirect(authUrl.toString());
};

exports.handleSocialCallback = async (providerName, req, res) => {
  const provider = socialProviders[providerName];

  if (!provider) {
    return redirectWithSocialError(res, 'Unsupported social login provider');
  }

  const { code } = req.query;
  const clientId = process.env[provider.clientIdEnv];
  const clientSecret = process.env[provider.clientSecretEnv];

  if (!code || !clientId || !clientSecret) {
    return redirectWithSocialError(res, `${providerName} login is not configured yet`);
  }

  try {
    const redirectUri = `${getApiBaseUrl(req)}/api/auth/${providerName}/callback`;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const tokenResponse = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error?.message || 'Social token exchange failed');
    }

    const profileResponse = await fetch(provider.profileUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const rawProfile = await profileResponse.json();

    if (!profileResponse.ok) {
      throw new Error(rawProfile.error?.message || 'Unable to load social profile');
    }

    const profile = provider.getProfile(rawProfile);
    if (!profile.email) {
      throw new Error('Social account did not provide an email address');
    }

    let user = await User.findOne({ where: { email: profile.email } });

    if (!user) {
      const [firstName, ...restName] = String(profile.name || '').split(' ').filter(Boolean);
      user = await User.create({
        email: profile.email,
        password: await bcrypt.hash(`${providerName}-${profile.email}-${Date.now()}`, 10),
        role: 'CLIENT',
        firstName: profile.firstName || firstName,
        lastName: profile.lastName || restName.join(' '),
        isVerified: true
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrl = new URL('/auth/social-callback', frontendUrl);
    callbackUrl.searchParams.set('token', createToken(user));
    return res.redirect(callbackUrl.toString());
  } catch (error) {
    return redirectWithSocialError(res, error.message || 'Social login failed');
  }
};
