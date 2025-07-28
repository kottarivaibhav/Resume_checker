import { create } from "zustand";
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage } from './firebase';

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface FirebaseStore {
  isLoading: boolean;
  error: string | null;
  auth: {
    user: FirebaseUser | null;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    getUser: () => FirebaseUser | null;
  };
  storage: {
    uploadFile: (file: File, path: string) => Promise<string>;
    deleteFile: (path: string) => Promise<void>;
  };
  firestore: {
    saveResume: (resume: Resume) => Promise<void>;
    getResumes: (userId: string) => Promise<Resume[]>;
    deleteResume: (resumeId: string) => Promise<void>;
  };
  init: () => void;
  clearError: () => void;
}

const provider = new GoogleAuthProvider();

export const useFirebaseStore = create<FirebaseStore>((set, get) => {
  const setError = (msg: string) => {
    set({
      error: msg,
      isLoading: false,
    });
  };

  const signIn = async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      // Try popup first, fall back to redirect
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const firebaseUser: FirebaseUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };

        set({
          auth: {
            ...get().auth,
            user: firebaseUser,
            isAuthenticated: true,
          },
          isLoading: false,
        });
      } catch (popupError: any) {
        // If popup fails due to CORP, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.message.includes('Cross-Origin-Opener-Policy')) {
          console.log('Popup blocked, trying redirect...');
          await signInWithRedirect(auth, provider);
          // Note: redirect will reload the page, so we don't set state here
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Sign in failed";
      setError(msg);
    }
  };

  const signOut = async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      await firebaseSignOut(auth);
      set({
        auth: {
          ...get().auth,
          user: null,
          isAuthenticated: false,
        },
        isLoading: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Sign out failed";
      setError(msg);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "File upload failed";
      setError(msg);
      throw error;
    }
  };

  const deleteFile = async (path: string): Promise<void> => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "File deletion failed";
      setError(msg);
      throw error;
    }
  };

  const saveResume = async (resume: Resume): Promise<void> => {
    const user = get().auth.user;
    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      const resumeDoc = doc(db, 'resumes', resume.id);
      await setDoc(resumeDoc, {
        ...resume,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to save resume";
      setError(msg);
      throw error;
    }
  };

  const getResumes = async (userId: string): Promise<Resume[]> => {
    try {
      const resumesRef = collection(db, 'resumes');
      const q = query(
        resumesRef, 
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const resumes: Resume[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        resumes.push({
          id: doc.id,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          imagePath: data.imagePath,
          resumePath: data.resumePath,
          feedback: data.feedback,
        });
      });
      
      return resumes;
    } catch (error) {
      console.error('Firestore error details:', error);
      const msg = error instanceof Error ? error.message : "Failed to get resumes";
      setError(msg);
      throw error;
    }
  };

  const deleteResume = async (resumeId: string): Promise<void> => {
    try {
      const resumeDoc = doc(db, 'resumes', resumeId);
      await deleteDoc(resumeDoc);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete resume";
      setError(msg);
      throw error;
    }
  };

  const init = (): void => {
    // Check for redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const user = result.user;
          const firebaseUser: FirebaseUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          };

          set({
            auth: {
              ...get().auth,
              user: firebaseUser,
              isAuthenticated: true,
            },
            isLoading: false,
          });
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        setError(error.message);
      });

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const firebaseUser: FirebaseUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };

        set({
          auth: {
            ...get().auth,
            user: firebaseUser,
            isAuthenticated: true,
          },
          isLoading: false,
        });
      } else {
        set({
          auth: {
            ...get().auth,
            user: null,
            isAuthenticated: false,
          },
          isLoading: false,
        });
      }
    });
  };

  return {
    isLoading: true,
    error: null,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      getUser: () => get().auth.user,
    },
    storage: {
      uploadFile,
      deleteFile,
    },
    firestore: {
      saveResume,
      getResumes,
      deleteResume,
    },
    init,
    clearError: () => set({ error: null }),
  };
});