# 🔐 Invitation System with Token Authentication

## 📋 **Overview**
This system provides secure token-based authentication for invitation forms, allowing users to access and save form state using invitation tokens from URLs.

## 🏗️ **Architecture**

### **Server-Side Components**
- **Token Validator** - Validates invitation tokens and manages token lifecycle
- **Auth Middleware** - Handles token authentication for API routes
- **Form State APIs** - CRUD operations for invitation form states
- **Database Schema** - Tables for tokens and form states

### **Client-Side Components**
- **Invitation Service** - API client for invitation operations
- **React Hooks** - State management and form handling
- **Token Extraction** - Automatic token detection from URLs

## 🔧 **Setup Instructions**

### **Step 1: Database Schema**
Run this in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of invitation-system-schema.sql
```

### **Step 2: Environment Variables**
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://pfbcpqifhbqpymnagzss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Step 3: Test the APIs**
```bash
# Test token validation
curl -X POST http://localhost:3000/api/invitation/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "your_token_here"}'

# Test form state operations
curl -X GET "http://localhost:3000/api/invitation/form-state?token=your_token_here" \
  -H "Authorization: Bearer your_token_here"
```

## 📊 **API Endpoints**

### **Token Validation**
- `POST /api/invitation/validate` - Validate token from request body
- `GET /api/invitation/validate?token=xxx` - Validate token from query parameter

### **Form State Management**
- `GET /api/invitation/form-state?token=xxx` - Get form state
- `POST /api/invitation/form-state` - Save form state
- `PUT /api/invitation/form-state` - Update form state
- `DELETE /api/invitation/form-state` - Delete form state

## 🎣 **React Hooks Usage**

### **useInvitationForm Hook**
```typescript
import { useInvitationForm } from '@/hooks/useInvitationForm';

function InvitationForm() {
  const {
    token,
    formState,
    validation,
    loading,
    saving,
    error,
    saveFormState,
    updateFormState,
    autoSaveFormState,
    isTokenValid,
    isAuthenticated,
    userId,
    email
  } = useInvitationForm({
    autoLoad: true,
    autoSave: true,
    saveDelay: 1000
  });

  // Auto-save form data
  const handleFormChange = (formData: any, step: string) => {
    autoSaveFormState(formData, step);
  };

  // Manual save
  const handleSave = async (formData: any, step: string, completed: boolean) => {
    await saveFormState(formData, step, completed);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isAuthenticated) return <div>Invalid invitation token</div>;

  return (
    <div>
      <h1>Welcome, {email}!</h1>
      {/* Your form components */}
    </div>
  );
}
```

### **Invitation Service Usage**
```typescript
import { invitationService } from '@/lib/services/invitation-service';

// Extract token from URL
const token = invitationService.constructor.extractToken();

// Validate token
const validation = await invitationService.validateToken(token);

// Save form state
await invitationService.saveFormState(token, formData, 'step1', false);

// Get form state
const { formState } = await invitationService.getFormState(token);
```

## 🔒 **Security Features**

### **Token Security**
- **Secure Generation** - Cryptographically secure random tokens
- **Expiration** - Configurable token expiration (default 24 hours)
- **One-time Use** - Optional token consumption after use
- **User Binding** - Tokens are bound to specific users

### **API Security**
- **Token Validation** - All API endpoints validate tokens
- **RLS Policies** - Row-level security for data access
- **Input Validation** - Comprehensive input sanitization
- **Error Handling** - Secure error messages without data leakage

### **Data Protection**
- **Encrypted Storage** - Sensitive data encrypted at rest
- **Access Control** - Users can only access their own data
- **Audit Trail** - Complete audit log of all operations

## 📈 **Features**

### **Form State Management**
- **Auto-save** - Automatic form state saving with debouncing
- **Step Tracking** - Track form completion progress
- **Data Persistence** - Form data persists across sessions
- **Conflict Resolution** - Handle concurrent form updates

### **Token Management**
- **URL Extraction** - Automatic token detection from URLs
- **Validation** - Real-time token validation
- **Expiration Handling** - Graceful handling of expired tokens
- **Cleanup** - Automatic cleanup of expired tokens

### **User Experience**
- **Loading States** - Visual feedback during operations
- **Error Handling** - User-friendly error messages
- **Offline Support** - Form data cached locally
- **Responsive Design** - Works on all devices

## 🚀 **Usage Examples**

### **Basic Form with Token Authentication**
```typescript
function InvitationForm() {
  const {
    formState,
    loading,
    error,
    saveFormState,
    isAuthenticated
  } = useInvitationForm();

  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    await saveFormState(formData, 'completed', true);
  };

  if (!isAuthenticated) {
    return <div>Please use a valid invitation link</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  );
}
```

### **Multi-step Form with Auto-save**
```typescript
function MultiStepForm() {
  const {
    formState,
    autoSaveFormState,
    updateFormState
  } = useInvitationForm({ autoSave: true });

  const [currentStep, setCurrentStep] = useState('step1');
  const [formData, setFormData] = useState({});

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
    autoSaveFormState(formData, step);
  };

  const handleFormDataChange = (data: any) => {
    setFormData(data);
    autoSaveFormState(data, currentStep);
  };

  return (
    <div>
      {/* Step navigation */}
      {/* Form fields */}
    </div>
  );
}
```

## 🧪 **Testing**

### **Unit Tests**
```typescript
// Test token validation
import { TokenValidator } from '@/lib/auth/token-validator';

test('should validate valid token', async () => {
  const result = await TokenValidator.validateToken('valid_token');
  expect(result.isValid).toBe(true);
});

// Test invitation service
import { invitationService } from '@/lib/services/invitation-service';

test('should save form state', async () => {
  const result = await invitationService.saveFormState('token', {}, 'step1');
  expect(result.formState).toBeDefined();
});
```

### **Integration Tests**
```typescript
// Test API endpoints
test('POST /api/invitation/validate', async () => {
  const response = await fetch('/api/invitation/validate', {
    method: 'POST',
    body: JSON.stringify({ token: 'test_token' })
  });
  expect(response.status).toBe(200);
});
```

## 📚 **File Structure**
```
src/
├── lib/
│   ├── auth/
│   │   └── token-validator.ts
│   ├── middleware/
│   │   └── auth-middleware.ts
│   └── services/
│       └── invitation-service.ts
├── hooks/
│   └── useInvitationForm.ts
└── app/api/invitation/
    ├── validate/route.ts
    └── form-state/route.ts
```

## 🎯 **Benefits**

### **Security**
- 🔐 **Token-based Authentication** - Secure access control
- 🛡️ **Data Protection** - Encrypted and protected data
- 🚫 **Access Control** - Users can only access their own data

### **User Experience**
- ⚡ **Auto-save** - Never lose form progress
- 🔄 **State Persistence** - Resume where you left off
- 📱 **Responsive** - Works on all devices

### **Developer Experience**
- 🎣 **React Hooks** - Easy integration
- 🔧 **TypeScript** - Full type safety
- 📖 **Comprehensive API** - Well-documented endpoints

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Token Not Found** - Check URL parameters and token format
2. **Token Expired** - Generate new invitation tokens
3. **Permission Denied** - Verify RLS policies and user authentication
4. **Form State Lost** - Check auto-save configuration and network connectivity

### **Debug Tools**
- **Browser Console** - Client-side errors and logs
- **Network Tab** - API request/response debugging
- **Supabase Dashboard** - Database logs and queries
- **Server Logs** - API endpoint debugging

This invitation system provides a complete solution for secure, token-based form authentication with automatic state management! 🚀
