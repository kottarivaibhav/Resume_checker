import { useFirebaseStore } from '../lib/firebaseStore';

export const AuthTest = () => {
  const { auth, isLoading, error, clearError } = useFirebaseStore();

  const handleSignIn = () => {
    clearError(); // Clear any previous errors
    auth.signIn();
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Auth Status:</h3>
      <div className="space-y-2 text-sm">
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Authenticated: {auth.isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User: {auth.user?.displayName || 'None'}</p>
        <p>Email: {auth.user?.email || 'None'}</p>
        {error && (
          <div className="text-red-600">
            <p>Error: {error}</p>
            <button 
              onClick={clearError}
              className="text-blue-600 underline text-xs"
            >
              Clear Error
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 space-x-2">
        <button 
          onClick={handleSignIn}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Sign In'}
        </button>
        
        {auth.isAuthenticated && (
          <button 
            onClick={auth.signOut}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            Sign Out
          </button>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        <p>• Popup authentication attempted first</p>
        <p>• Falls back to redirect if popup blocked</p>
        <p>• Check browser console for detailed logs</p>
      </div>
    </div>
  );
};
