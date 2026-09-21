import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

// Each value must be read as a complete `process.env.FIREBASE_*` expression
// so Next.js can inline it into the client bundle at build time. These names
// have no NEXT_PUBLIC_ prefix, so `env` in next.config.ts is what exposes
// them to the browser.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  // Only Firebase Storage needs a bucket and nothing uses it yet, so this
  // one stays optional rather than blocking auth and Firestore.
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const requiredVars: Partial<Record<keyof typeof firebaseConfig, string>> = {
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId: 'FIREBASE_APP_ID',
};

let appInstance: FirebaseApp | null = null;

function resolveApp(): FirebaseApp {
  if (appInstance) return appInstance;

  const missing = (Object.keys(requiredVars) as (keyof typeof firebaseConfig)[])
    .filter((key) => !firebaseConfig[key])
    .map((key) => requiredVars[key]);

  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured: missing ${missing.join(', ')}. ` +
        'Set these variables in your hosting provider and in .env.local, then redeploy — ' +
        'they are inlined into the browser bundle at build time, not read at runtime.'
    );
  }

  appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return appInstance;
}

/**
 * Defers `create()` until the service is actually touched.
 *
 * Firebase used to be constructed while this module was evaluated, which meant
 * every static page Next.js prerenders (`/_not-found`, `/login`, ...) needed
 * valid credentials at build time and the build died with
 * `auth/invalid-api-key` without them. Nothing here reads Firebase during
 * render, so initialization can wait until the first browser-side call.
 */
function lazyService<T extends object>(create: () => T): T {
  let instance: T | null = null;
  const resolve = (): T => (instance ??= create());

  return new Proxy({} as T, {
    get(_target, prop) {
      const service = resolve();
      const value = Reflect.get(service, prop, service);
      // Bind methods to the real service so `this` is never the proxy.
      return typeof value === 'function' ? value.bind(service) : value;
    },
    set: (_target, prop, value) => Reflect.set(resolve(), prop, value),
    has: (_target, prop) => Reflect.has(resolve(), prop),
    deleteProperty: (_target, prop) => Reflect.deleteProperty(resolve(), prop),
    defineProperty: (_target, prop, descriptor) => Reflect.defineProperty(resolve(), prop, descriptor),
    ownKeys: () => Reflect.ownKeys(resolve()),
    getPrototypeOf: () => Reflect.getPrototypeOf(resolve()),
    getOwnPropertyDescriptor(_target, prop) {
      const descriptor = Reflect.getOwnPropertyDescriptor(resolve(), prop);
      // The proxy target is an empty object, so the Proxy invariants require
      // every property we report to be configurable.
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}

const app = lazyService<FirebaseApp>(resolveApp);
const db = lazyService<Firestore>(() => getFirestore(resolveApp()));
const storage = lazyService<FirebaseStorage>(() => getStorage(resolveApp()));
const auth = lazyService<Auth>(() => getAuth(resolveApp()));

export { app, db, storage, auth };
