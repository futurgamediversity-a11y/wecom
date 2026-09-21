import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

// Each value must be read as a complete `process.env.NEXT_PUBLIC_*` expression
// so Next.js can inline it into the client bundle at build time.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const envVarNames: Record<keyof typeof firebaseConfig, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
};

let appInstance: FirebaseApp | null = null;

function resolveApp(): FirebaseApp {
  if (appInstance) return appInstance;

  const missing = (Object.keys(envVarNames) as (keyof typeof firebaseConfig)[])
    .filter((key) => !firebaseConfig[key])
    .map((key) => envVarNames[key]);

  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured: missing ${missing.join(', ')}. ` +
        'Set these variables in your hosting provider and in .env.local, then rebuild — ' +
        'NEXT_PUBLIC_* values are inlined at build time, not read at runtime.'
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
