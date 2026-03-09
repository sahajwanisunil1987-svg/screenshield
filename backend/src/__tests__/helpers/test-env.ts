export const prepareTestEnv = () => {
  vi.resetModules();

  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/sparekart?schema=public";
  process.env.DIRECT_URL = "postgresql://test:test@localhost:5432/sparekart?schema=public";
  process.env.JWT_SECRET = "test-secret-123";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-123";
  process.env.FRONTEND_URL = "http://localhost:3000";
};
