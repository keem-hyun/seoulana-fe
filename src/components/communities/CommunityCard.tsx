'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CommunityProps {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  creatorId: string;
  bountyAmount?: number;
  timeLimit?: number;
  baseFeePercentage?: number;
  lastMessageTime?: string | null;
}

export default function CommunityCard({ 
  id, 
  name, 
  description, 
  createdAt, 
  bountyAmount, 
  timeLimit, 
  baseFeePercentage,
  lastMessageTime: initialLastMessageTime
}: CommunityProps) {
  // Use the WebSocket hook to get real-time updates
  const { lastMessageTime: wsLastMessageTime } = useWebSocket(id);
  const [displayedLastMessageTime, setDisplayedLastMessageTime] = useState<string | null>(initialLastMessageTime || null);

  // Update the displayed last message time whenever it changes from WebSocket
  useEffect(() => {
    if (wsLastMessageTime) {
      setDisplayedLastMessageTime(wsLastMessageTime);
    }
  }, [wsLastMessageTime]);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'No messages yet';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return messageDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/communities/${id}`}>
      <div className="border-2 border-black dark:border-white hover:bg-blue-50 dark:hover:bg-gray-700 p-4 transition-colors cursor-pointer h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg line-clamp-1">{name}</h3>
        </div>

        {description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 flex-grow">
            {description}
          </p>
        )}

        <div className="space-y-2">
          {bountyAmount !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">total bounty:</span>
              <span className="bg-yellow-300 text-black px-2 py-1 text-xs font-mono font-bold border-2 border-black">
                {bountyAmount} SOL
              </span>
            </div>
          )}

          {timeLimit !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">time limit:</span>
              <span className="bg-green-300 text-black px-2 py-1 text-xs font-mono font-bold border-2 border-black">
                {timeLimit} MIN
              </span>
            </div>
          )}

          {baseFeePercentage !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">base fee:</span>
              <span className="bg-blue-300 text-black px-2 py-1 text-xs font-mono font-bold border-2 border-black">
                {baseFeePercentage}%
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500">created:</span>
            <span className="text-xs text-gray-500">
              {new Date(createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500">last activity:</span>
            <span className="text-xs text-gray-500 font-semibold">
              {formatTimestamp(displayedLastMessageTime)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}