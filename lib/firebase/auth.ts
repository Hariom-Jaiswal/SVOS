import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Initiates the Google OAuth sign-in flow via a popup window.
 *
 * @returns A Promise resolving to the signed-in user and their credentials
 * @throws {FirebaseError} if the sign-in is cancelled or fails
 */
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

/**
 * Signs out the currently authenticated user session.
 */
export async function signOutUser() {
  return signOut(auth);
}
