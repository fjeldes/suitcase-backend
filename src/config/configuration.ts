export default () => ({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || '1d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromName: process.env.RESEND_FROM_NAME,
    fromEmail: process.env.RESEND_FROM_EMAIL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  storage: {
    projectId: process.env.GCS_PROJECT_ID,
    bucketName: process.env.GCS_BUCKET_NAME,
    clientEmail: process.env.GCS_CLIENT_EMAIL,
    privateKey: process.env.GCS_PRIVATE_KEY,
  },
})