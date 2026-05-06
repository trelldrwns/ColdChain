const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wdbgvttgojmcmphmzhgq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYmd2dHRnb2ptY21waG16aGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODM3NjAsImV4cCI6MjA5MzY1OTc2MH0.kaOenYR7H0JC78sicUEReJKeLQQRYx4sQX8w4HJAsvc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = req.cookies.jwt || (authHeader && authHeader.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.user = { 
    id: user.id, 
    email: user.email, 
    role: user.user_metadata?.role || 'admin', 
    name: user.user_metadata?.name || 'Admin' 
  };
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
