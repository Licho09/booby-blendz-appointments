# Supabase Setup Guide for Booby_Blendz Barbershop App

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `booby-blendz-barbershop`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...`)

## Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `database-schema.sql`
4. Click "Run" to execute the schema
5. Verify the tables were created in **Table Editor**

## Step 4: Configure Environment Variables

1. Copy `env.example` to `.env` in your backend folder
2. Update the Supabase configuration:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_here
```

## Step 5: Install Dependencies

```bash
cd backend
npm install
```

## Step 6: Test the Setup

1. Start your backend server:
```bash
npm run dev
```

2. Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

3. Register a test user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Step 7: Configure Row Level Security (RLS)

The schema includes RLS policies, but you may need to adjust them:

1. Go to **Authentication** → **Policies** in Supabase
2. Verify the policies are applied to your tables
3. For a single-user system, the current policies allow all operations

## Step 8: Enable Real-time Features (Optional)

1. Go to **Database** → **Replication**
2. Enable real-time for the tables you want to sync:
   - `appointments`
   - `clients`
   - `users`

## Step 9: Set Up Authentication (Optional)

If you want to use Supabase Auth instead of custom JWT:

1. Go to **Authentication** → **Settings**
2. Configure your authentication providers
3. Update the frontend to use Supabase Auth

## Troubleshooting

### Common Issues:

1. **Connection Error**: Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. **Permission Denied**: Verify RLS policies are correctly set
3. **JWT Error**: Make sure `JWT_SECRET` is set and consistent
4. **Table Not Found**: Run the schema SQL again

### Testing Database Connection:

```javascript
// Add this to your server.js temporarily
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Use strong passwords** for database and JWT secrets
3. **Regularly rotate** your API keys
4. **Monitor** your Supabase usage and costs
5. **Backup** your data regularly

## Deployment Considerations

1. **Environment Variables**: Set all environment variables in your hosting platform
2. **CORS**: Update `FRONTEND_URL` to your production domain
3. **SSL**: Ensure your production domain uses HTTPS
4. **Rate Limiting**: Consider implementing rate limiting for production

## Next Steps

1. Update your frontend to use the new API endpoints
2. Test all CRUD operations
3. Implement real-time updates if needed
4. Set up monitoring and logging
5. Deploy to production

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
