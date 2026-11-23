export function validateTestDatabaseEnvironment(env: Record<string, string | undefined>): { connectionString: string; databaseName: string; endpoint: string } | null;
