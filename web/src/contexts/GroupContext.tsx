'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GroupContextType {
  currentGroupId: string | null;
  setCurrentGroupId: (groupId: string | null) => void;
  showGroupMembersOnly: boolean;
  setShowGroupMembersOnly: (show: boolean) => void;
  groupMembers: number[];
  setGroupMembers: (members: number[]) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [showGroupMembersOnly, setShowGroupMembersOnly] = useState(false);
  const [groupMembers, setGroupMembers] = useState<number[]>([]);

  return (
    <GroupContext.Provider
      value={{
        currentGroupId,
        setCurrentGroupId,
        showGroupMembersOnly,
        setShowGroupMembersOnly,
        groupMembers,
        setGroupMembers,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
