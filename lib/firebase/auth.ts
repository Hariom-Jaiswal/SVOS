import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();
// Request additional scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return { user: result.user, credential };
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
}

export async function signOutUser() {
  return signOut(auth);
}
