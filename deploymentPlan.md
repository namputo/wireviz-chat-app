# WireViz Editor - Deployment & Authentication Plan

## 🎯 Core Architecture
- **YAML Editor & Preview**: Fully public, no authentication required
- **AI Chat Window**: Protected behind user authentication
- **API Key Management**: Encrypted storage in database with user accounts
- **Hybrid Access**: Best of both worlds - immediate utility + premium AI features

## 🔐 Security-First Implementation

### **Database & Encryption**
- **User Table**: email, hashed_password, created_at, last_login
- **API Keys Table**: user_id, provider (openai/anthropic), encrypted_key, created_at
- **Encryption**: AES-256 encryption for API keys with server-side encryption key
- **Password Security**: bcrypt/argon2 for password hashing
- **No Plaintext**: API keys never stored in plaintext anywhere

### **Authentication Flow**
1. **Guest Mode**: Editor and preview work immediately
2. **Chat Access**: Click chat → Login/Register modal appears
3. **Account Creation**: Simple email/password signup
4. **API Key Setup**: After login, user adds their OpenAI/Anthropic keys
5. **Secure Chat**: Chat unlocked with user's encrypted keys

## 🏗 Technical Implementation

### **Frontend Architecture**
```
Frontend Components:
├── PublicLayout (Editor + Preview - always accessible)
├── ChatAuthModal (Login/Register)
├── ApiKeySetupModal (Add/manage API keys)
├── AuthenticatedChat (Protected chat interface)
└── UserMenu (Logout, manage keys)
```

### **Backend Architecture**
```
Backend Services:
├── auth_service.py (JWT tokens, password validation)
├── user_service.py (User CRUD operations)
├── encryption_service.py (API key encryption/decryption)
├── llm_service.py (Modified to use user's decrypted keys)
└── database/
    ├── models.py (User, ApiKey models)
    └── migrations/ (Database schema management)
```

## 📋 Implementation Plan

### **Phase 1: Database & Authentication Foundation (2-3 days)**

**Backend Setup:**
- Add SQLAlchemy models for Users and ApiKeys
- Implement encryption service with AES-256
- Create authentication endpoints (register, login, logout)
- Add JWT token management with refresh tokens
- Set up database migrations

**Frontend Setup:**
- Add NextAuth.js or custom auth context
- Create login/register modal components
- Implement protected route logic for chat
- Add user session management

### **Phase 2: API Key Management (1-2 days)**

**Backend:**
- API key CRUD endpoints (add, list, delete, update)
- Encryption/decryption before database operations
- Key validation service (test keys before saving)
- Modify LLM service to use user-specific keys

**Frontend:**
- API key management modal/page
- Provider selection (OpenAI/Anthropic)
- Key validation UI with status indicators
- Secure key display (masked with option to reveal)

### **Phase 3: Chat Integration (1-2 days)**

**Backend:**
- Modify chat endpoint to authenticate user
- Retrieve and decrypt user's API keys
- Enhanced error handling for missing/invalid keys

**Frontend:**
- Conditional chat rendering based on auth state
- Smooth transition from guest to authenticated mode
- User menu with logout and key management options
- Loading states and error handling

### **Phase 4: Security & Polish (1-2 days)**

**Security Hardening:**
- Rate limiting per user
- Input validation and sanitization
- Secure headers and CORS configuration
- Session timeout handling

**User Experience:**
- Onboarding flow for new users
- Help documentation for API key setup
- Error messages and recovery flows
- Mobile responsiveness

## 🛠 Technical Stack Additions

### **Frontend Dependencies**
```json
{
  "next-auth": "^4.24.0",
  "jose": "^5.0.0",
  "bcryptjs": "^2.4.3",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0",
  "react-hook-form": "^7.48.0"
}
```

### **Backend Dependencies**
```txt
sqlalchemy>=2.0.0
alembic>=1.12.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
cryptography>=41.0.0
```

## 🗄 Database Schema

### **Users Table**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### **API Keys Table**
```sql
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- 'openai' or 'anthropic'
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

## 🚀 Deployment Strategy

### **Recommended: Vercel + Railway**
- **Frontend**: Vercel (Next.js with auth)
- **Backend**: Railway (FastAPI + PostgreSQL)
- **Database**: Railway PostgreSQL addon
- **Environment Variables**: Encryption keys, JWT secrets
- **Cost**: $10-20/month for production-ready setup

### **Alternative: Render**
- **Frontend**: Render Static Site
- **Backend**: Render Web Service
- **Database**: Render PostgreSQL
- **Cost**: $7-25/month depending on usage

### **Enterprise: AWS/GCP**
- **Frontend**: AWS S3/CloudFront or GCP Storage/CDN
- **Backend**: AWS ECS/Lambda or GCP Cloud Run
- **Database**: AWS RDS or GCP Cloud SQL
- **Cost**: $20-100+/month depending on scale

### **Environment Variables Needed**
```bash
# Backend
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=<32-byte-key>
JWT_SECRET_KEY=<random-secret>
JWT_ALGORITHM=HS256

# Frontend  
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<random-secret>
```

## 🎨 User Experience Flow

### **New User Journey**
1. **Immediate Value**: Land on app, use YAML editor and preview immediately
2. **Discover AI**: Notice chat panel with "Login to unlock AI chat" message
3. **Quick Signup**: Click login → simple email/password registration
4. **API Key Setup**: "Add your API keys to enable AI chat" onboarding
5. **Full Experience**: AI-powered chat with their own API keys

### **Returning User**
1. **Public Tools**: Editor and preview always work
2. **Auto-Login**: JWT token auto-authenticates if valid
3. **Instant Chat**: Chat immediately available with saved keys
4. **Key Management**: Easy access to update/rotate API keys

## 🔒 Security Features

### **Data Protection**
- API keys encrypted with AES-256 before database storage
- Encryption keys stored as environment variables (not in code)
- Password hashing with bcrypt (12+ rounds)
- JWT tokens with reasonable expiration (1-24 hours)

### **Access Controls**
- Users can only access their own API keys
- Database queries filtered by user_id
- Proper authorization checks on all endpoints
- Session invalidation on logout

### **Security Best Practices**
- HTTPS-only in production
- Secure cookie settings
- Rate limiting per user
- Input validation on all endpoints
- SQL injection prevention with ORM

## 💰 Cost Breakdown

### **Development Time**
- **Phase 1**: 2-3 days (Database & Auth)
- **Phase 2**: 1-2 days (API Key Management)
- **Phase 3**: 1-2 days (Chat Integration)
- **Phase 4**: 1-2 days (Security & Polish)
- **Total**: 5-8 days

### **Infrastructure Costs**
- **Vercel + Railway**: $10-20/month
- **Render**: $7-25/month
- **AWS/GCP**: $20-100+/month
- **Domain**: $10-15/year (optional)

### **Scaling Considerations**
- **0-100 users**: Free tiers sufficient
- **100-1000 users**: $10-30/month
- **1000+ users**: $50-200+/month depending on usage

## ✨ Key Benefits

### **For Users**
1. **Immediate Utility**: Anyone can use the core YAML editor
2. **Professional Security**: Industry-standard encryption and auth
3. **Convenience**: API keys saved securely, work across devices
4. **Privacy**: Users control their own API keys and usage

### **For Deployment**
1. **Freemium Model**: Core features free, AI features premium
2. **Scalable Architecture**: Can handle growth efficiently
3. **Cost Effective**: Pay-as-you-scale pricing
4. **Professional**: Enterprise-ready security and features

## 🔄 Migration Strategy

### **Current → Authenticated**
1. **Maintain Compatibility**: Existing editor/preview functionality unchanged
2. **Gradual Rollout**: Deploy authentication as optional feature first
3. **User Migration**: Existing users can continue using without signup
4. **Progressive Enhancement**: Add auth features without breaking existing flows

### **Testing Strategy**
1. **Unit Tests**: Authentication, encryption, API key management
2. **Integration Tests**: Full user flow from signup to chat
3. **Security Tests**: Penetration testing, encryption validation
4. **Performance Tests**: Database queries, API response times

## 📝 Implementation Checklist

### **Backend Development**
- [ ] Set up database models and migrations
- [ ] Implement encryption service
- [ ] Create authentication endpoints
- [ ] Add API key management endpoints
- [ ] Modify LLM service for user-specific keys
- [ ] Add rate limiting and security middleware
- [ ] Write comprehensive tests

### **Frontend Development**
- [ ] Add authentication context/state management
- [ ] Create login/register modal components
- [ ] Build API key management interface
- [ ] Implement protected chat interface
- [ ] Add user menu and account management
- [ ] Handle loading states and error cases
- [ ] Ensure mobile responsiveness

### **Deployment Preparation**
- [ ] Choose hosting platform
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring and logging
- [ ] Test production deployment
- [ ] Set up backup and recovery

### **Security Audit**
- [ ] Code review for security vulnerabilities
- [ ] Test encryption/decryption flows
- [ ] Validate authentication mechanisms
- [ ] Check for SQL injection vulnerabilities
- [ ] Test rate limiting effectiveness
- [ ] Verify HTTPS configuration

## 🚦 Go-Live Strategy

### **Phase 1: Internal Testing**
- Deploy to staging environment
- Test all user flows and edge cases
- Verify security implementations
- Performance testing under load

### **Phase 2: Beta Release**
- Deploy to production with authentication optional
- Invite small group of beta users
- Monitor usage patterns and performance
- Gather feedback and iterate

### **Phase 3: Full Launch**
- Enable authentication for all users
- Marketing and user acquisition
- Monitor system performance and costs
- Plan for scaling based on usage

---

**Last Updated**: January 2025  
**Status**: Planning Phase  
**Next Action**: Ready for implementation when needed