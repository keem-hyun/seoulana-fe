'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Depositor {
  id: string;
  amount: number;
  walletAddress: string;
  depositedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
}

interface DepositorListProps {
  communityId: string;
}

export default function DepositorsList({ communityId }: DepositorListProps) {
  const [depositors, setDepositors] = useState<Depositor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Connect to WebSocket for real-time updates
  const { lastDeposit } = useWebSocket(communityId);

  // Create fetchDepositors as a memoized function so we can call it on demand
  const fetchDepositors = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Depositor[]>(`/communities/${communityId}/depositors`);
      
      // The backend is already aggregating the amounts per user
      // so we just need to sort by amount (highest first)
      const sortedDepositors = [...data].sort((a, b) => b.amount - a.amount);
      setDepositors(sortedDepositors);
      
      console.log('Fetched depositors:', data);
    } catch (err) {
      console.error('Error fetching depositors:', err);
      setError('Could not load depositors. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  // Fetch depositors when component mounts or when a new deposit is made
  useEffect(() => {
    fetchDepositors();
  }, [fetchDepositors, lastDeposit]); // Re-fetch when lastDeposit changes

  // Calculate total amount staked
  const totalStaked = depositors.reduce((sum, depositor) => sum + depositor.amount, 0);

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-gray-500 border-b pb-2 flex justify-between items-center">
        <div>
          {depositors.length} staker{depositors.length !== 1 ? 's' : ''} · {totalStaked.toFixed(2)} SOLs total
        </div>
        <button 
          onClick={() => fetchDepositors()} 
          className="text-xs text-pink-500 hover:text-pink-700"
          title="Refresh list"
        >
          ↻
        </button>
      </div>
      
      {loading ? (
        <div className="py-2 px-3 text-sm text-gray-500">
          <div className="animate-pulse flex space-x-2 items-center">
            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="py-2 px-3 text-sm text-red-500">{error}</div>
      ) : depositors.length === 0 ? (
        <div className="py-2 px-3 text-sm text-gray-500 italic">No stakers yet. Be the first to deposit!</div>
      ) : (
        <div className="space-y-2">
          {depositors.map((depositor) => (
            <div 
              key={depositor.id} 
              className="border-2 border-[rgba(255,182,193,0.5)] rounded-lg p-2 bg-white flex justify-between items-center"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 mr-2 bg-[rgba(255,182,193,0.3)] rounded-full flex items-center justify-center">
                  {depositor.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">@{depositor.user.username}</div>
                  <div className="text-xs text-gray-500">
                    Last deposit: {new Date(depositor.depositedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="font-mono font-bold" title={`Last deposit: ${new Date(depositor.depositedAt).toLocaleString()}`}>
                {depositor.amount.toFixed(2)} {depositor.amount === 1 ? 'SOL' : 'SOLs'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 