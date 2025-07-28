import { useFirebaseStore } from '../lib/firebaseStore';
import { usePuterStore } from '../lib/puter';

export const DebugInfo = () => {
  const firebaseStore = useFirebaseStore();
  const puterStore = usePuterStore();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Debug Info:</h4>
      
      <div className="mb-2">
        <strong>Firebase:</strong>
        <div>Auth: {firebaseStore.auth.isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {firebaseStore.auth.user?.displayName || 'None'}</div>
        <div>Loading: {firebaseStore.isLoading ? 'Yes' : 'No'}</div>
        {firebaseStore.error && <div className="text-red-400">Error: {firebaseStore.error}</div>}
      </div>

      <div>
        <strong>Puter:</strong>
        <div>Ready: {puterStore?.puterReady ? '✅' : '❌'}</div>
        <div>Loading: {puterStore?.isLoading ? 'Yes' : 'No'}</div>
        <div>FS: {puterStore?.fs ? '✅' : '❌'}</div>
        <div>AI: {puterStore?.ai ? '✅' : '❌'}</div>
        <div>KV: {puterStore?.kv ? '✅' : '❌'}</div>
        {puterStore?.error && <div className="text-red-400">Error: {puterStore.error}</div>}
      </div>
    </div>
  );
};
