export interface TestAccount {
  email: string;
  password: string;
  localId: string;
  idToken: string;
}
export function testConfig(): {
  emulated: boolean;
  projectId: string;
  apiKey: string;
  authBase: string;
  documentsBase: string;
};
export function authRequest(
  action: string,
  body: Record<string, unknown>,
): Promise<Record<string, string>>;
export function loginAccount(
  email: string | undefined,
  password: string | undefined,
): Promise<Record<string, string>>;
export function createTestAccount(label?: string): Promise<TestAccount>;
export function deleteTestAccount(account: TestAccount): Promise<void>;
export function commitDocument(
  path: string,
  token: string | null,
  values: Record<string, unknown>,
  creating?: boolean,
  serverTimestampFields?: string[],
): Promise<{ status: number; data: unknown }>;
export function firestoreRequest(
  path: string,
  token: string | null,
  method?: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }>;
