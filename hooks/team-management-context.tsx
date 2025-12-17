import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';

export interface TeamMember {
  id: string;
  teamId: string;
  playerId: string;
  status: 'pending' | 'active' | 'inactive' | 'removed';
  jerseyNumber?: number;
  joinedDate: Date;
  position?: string;
  role: 'player' | 'captain' | 'vice_captain';
  playerName?: string;
  playerAvatar?: string;
  playerSport?: string;
  playerPosition?: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  playerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  invitedBy?: string;
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
  teamName?: string;
  teamAvatar?: string;
}

export interface AttendanceRecord {
  id: string;
  teamId: string;
  playerId: string;
  sessionDate: Date;
  sessionType: 'training' | 'match' | 'meeting' | 'other';
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recordedBy?: string;
  playerName?: string;
  playerAvatar?: string;
}

export interface InjuryRecord {
  id: string;
  teamId: string;
  playerId: string;
  injuryType: string;
  injuryDate: Date;
  severity: 'minor' | 'moderate' | 'severe';
  status: 'active' | 'recovering' | 'recovered';
  expectedRecoveryDate?: Date;
  actualRecoveryDate?: Date;
  description?: string;
  treatmentNotes?: string;
  recordedBy?: string;
  playerName?: string;
  playerAvatar?: string;
}

export interface MatchRecord {
  id: string;
  teamId: string;
  opponentName: string;
  matchDate: Date;
  location?: string;
  matchType: 'friendly' | 'league' | 'cup' | 'tournament';
  result?: 'win' | 'loss' | 'draw' | 'pending';
  teamScore?: number;
  opponentScore?: number;
  notes?: string;
}

export interface PlayerMatchPerformance {
  id: string;
  matchId: string;
  playerId: string;
  minutesPlayed?: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  rating?: number;
  notes?: string;
  playerName?: string;
  playerAvatar?: string;
}

export interface TrainingSession {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  sessionDate: Date;
  durationMinutes?: number;
  location?: string;
  focusAreas?: string[];
  createdBy?: string;
}

export interface TeamAnnouncement {
  id: string;
  teamId: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  published: boolean;
  createdBy?: string;
  createdAt: Date;
  createdByName?: string;
  createdByAvatar?: string;
}

interface TeamManagementState {
  members: TeamMember[];
  invitations: TeamInvitation[];
  attendanceRecords: AttendanceRecord[];
  injuryRecords: InjuryRecord[];
  matchRecords: MatchRecord[];
  trainingSession: TrainingSession[];
  announcements: TeamAnnouncement[];
  isLoading: boolean;
  
  loadTeamMembers: (teamId: string) => Promise<void>;
  loadInvitations: (userId: string) => Promise<void>;
  loadAttendance: (teamId: string, startDate?: Date, endDate?: Date) => Promise<void>;
  loadInjuries: (teamId: string) => Promise<void>;
  loadMatches: (teamId: string) => Promise<void>;
  loadTrainingSessions: (teamId: string) => Promise<void>;
  loadAnnouncements: (teamId: string) => Promise<void>;
  
  invitePlayer: (teamId: string, playerId: string, message?: string) => Promise<{ error?: string }>;
  respondToInvitation: (invitationId: string, accept: boolean) => Promise<{ error?: string }>;
  removePlayer: (memberId: string) => Promise<{ error?: string }>;
  updateMember: (memberId: string, updates: Partial<TeamMember>) => Promise<{ error?: string }>;
  
  addAttendance: (record: Omit<AttendanceRecord, 'id' | 'recordedBy'>) => Promise<{ error?: string }>;
  updateAttendance: (recordId: string, updates: Partial<AttendanceRecord>) => Promise<{ error?: string }>;
  
  addInjury: (record: Omit<InjuryRecord, 'id' | 'recordedBy' | 'playerName' | 'playerAvatar'>) => Promise<{ error?: string }>;
  updateInjury: (recordId: string, updates: Partial<InjuryRecord>) => Promise<{ error?: string }>;
  
  addMatch: (match: Omit<MatchRecord, 'id'>) => Promise<{ error?: string; matchId?: string }>;
  updateMatch: (matchId: string, updates: Partial<MatchRecord>) => Promise<{ error?: string }>;
  
  addTrainingSession: (session: Omit<TrainingSession, 'id' | 'createdBy'>) => Promise<{ error?: string }>;
  
  addAnnouncement: (announcement: Omit<TeamAnnouncement, 'id' | 'createdBy' | 'createdAt' | 'createdByName' | 'createdByAvatar'>) => Promise<{ error?: string }>;
  updateAnnouncement: (announcementId: string, updates: Partial<TeamAnnouncement>) => Promise<{ error?: string }>;
  deleteAnnouncement: (announcementId: string) => Promise<{ error?: string }>;
}

export const [TeamManagementProvider, useTeamManagement] = createContextHook<TeamManagementState>(() => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [injuryRecords, setInjuryRecords] = useState<InjuryRecord[]>([]);
  const [matchRecords, setMatchRecords] = useState<MatchRecord[]>([]);
  const [trainingSession, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTeamMembers = useCallback(async (teamId: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          player:profiles!team_members_player_id_fkey(id, name, avatar, sport, position)
        `)
        .eq('team_id', teamId)
        .order('joined_date', { ascending: false });

      if (error) throw error;

      const formattedMembers: TeamMember[] = (data || []).map((m: any) => ({
        id: m.id,
        teamId: m.team_id,
        playerId: m.player_id,
        status: m.status,
        jerseyNumber: m.jersey_number,
        joinedDate: new Date(m.joined_date),
        position: m.position,
        role: m.role,
        playerName: m.player?.name,
        playerAvatar: m.player?.avatar,
        playerSport: m.player?.sport,
        playerPosition: m.player?.position,
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInvitations = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          team:profiles!team_invitations_team_id_fkey(id, name, avatar)
        `)
        .or(`team_id.eq.${userId},player_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvitations: TeamInvitation[] = (data || []).map((i: any) => ({
        id: i.id,
        teamId: i.team_id,
        playerId: i.player_id,
        status: i.status,
        invitedBy: i.invited_by,
        message: i.message,
        createdAt: new Date(i.created_at),
        respondedAt: i.responded_at ? new Date(i.responded_at) : undefined,
        teamName: i.team?.name,
        teamAvatar: i.team?.avatar,
      }));

      setInvitations(formattedInvitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  }, []);

  const loadAttendance = useCallback(async (teamId: string, startDate?: Date, endDate?: Date) => {
    if (!isSupabaseConfigured) return;
    
    try {
      setIsLoading(true);
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          player:profiles!attendance_records_player_id_fkey(id, name, avatar)
        `)
        .eq('team_id', teamId);

      if (startDate) {
        query = query.gte('session_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('session_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('session_date', { ascending: false });

      if (error) throw error;

      const formattedRecords: AttendanceRecord[] = (data || []).map((a: any) => ({
        id: a.id,
        teamId: a.team_id,
        playerId: a.player_id,
        sessionDate: new Date(a.session_date),
        sessionType: a.session_type,
        status: a.status,
        notes: a.notes,
        recordedBy: a.recorded_by,
        playerName: a.player?.name,
        playerAvatar: a.player?.avatar,
      }));

      setAttendanceRecords(formattedRecords);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInjuries = useCallback(async (teamId: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('injury_records')
        .select(`
          *,
          player:profiles!injury_records_player_id_fkey(id, name, avatar)
        `)
        .eq('team_id', teamId)
        .order('injury_date', { ascending: false });

      if (error) throw error;

      const formattedRecords: InjuryRecord[] = (data || []).map((i: any) => ({
        id: i.id,
        teamId: i.team_id,
        playerId: i.player_id,
        injuryType: i.injury_type,
        injuryDate: new Date(i.injury_date),
        severity: i.severity,
        status: i.status,
        expectedRecoveryDate: i.expected_recovery_date ? new Date(i.expected_recovery_date) : undefined,
        actualRecoveryDate: i.actual_recovery_date ? new Date(i.actual_recovery_date) : undefined,
        description: i.description,
        treatmentNotes: i.treatment_notes,
        recordedBy: i.recorded_by,
        playerName: i.player?.name,
        playerAvatar: i.player?.avatar,
      }));

      setInjuryRecords(formattedRecords);
    } catch (error) {
      console.error('Failed to load injuries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMatches = useCallback(async (teamId: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('match_records')
        .select('*')
        .eq('team_id', teamId)
        .order('match_date', { ascending: false });

      if (error) throw error;

      const formattedRecords: MatchRecord[] = (data || []).map((m: any) => ({
        id: m.id,
        teamId: m.team_id,
        opponentName: m.opponent_name,
        matchDate: new Date(m.match_date),
        location: m.location,
        matchType: m.match_type,
        result: m.result,
        teamScore: m.team_score,
        opponentScore: m.opponent_score,
        notes: m.notes,
      }));

      setMatchRecords(formattedRecords);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTrainingSessions = useCallback(async (teamId: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('team_id', teamId)
        .order('session_date', { ascending: false });

      if (error) throw error;

      const formattedSessions: TrainingSession[] = (data || []).map((s: any) => ({
        id: s.id,
        teamId: s.team_id,
        title: s.title,
        description: s.description,
        sessionDate: new Date(s.session_date),
        durationMinutes: s.duration_minutes,
        location: s.location,
        focusAreas: s.focus_areas,
        createdBy: s.created_by,
      }));

      setTrainingSessions(formattedSessions);
    } catch (error) {
      console.error('Failed to load training sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async (teamId: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('team_announcements')
        .select(`
          *,
          creator:profiles!team_announcements_created_by_fkey(id, name, avatar)
        `)
        .eq('team_id', teamId)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAnnouncements: TeamAnnouncement[] = (data || []).map((a: any) => ({
        id: a.id,
        teamId: a.team_id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        published: a.published,
        createdBy: a.created_by,
        createdAt: new Date(a.created_at),
        createdByName: a.creator?.name,
        createdByAvatar: a.creator?.avatar,
      }));

      setAnnouncements(formattedAnnouncements);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const invitePlayer = useCallback(async (teamId: string, playerId: string, message?: string) => {
    if (!isSupabaseConfigured || !user) return { error: 'Not configured' };
    
    try {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          player_id: playerId,
          invited_by: user.id,
          message: message,
          status: 'pending',
        });

      if (error) throw error;
      
      await loadInvitations(user.id);
      return {};
    } catch (error) {
      console.error('Failed to invite player:', error);
      return { error: 'Failed to send invitation' };
    }
  }, [user, loadInvitations]);

  const respondToInvitation = useCallback(async (invitationId: string, accept: boolean) => {
    if (!isSupabaseConfigured || !user) return { error: 'Not configured' };
    
    try {
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) return { error: 'Invitation not found' };

      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: accept ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      if (accept) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: invitation.teamId,
            player_id: invitation.playerId,
            status: 'active',
            joined_date: new Date().toISOString(),
          });

        if (memberError) throw memberError;
      }

      await loadInvitations(user.id);
      return {};
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      return { error: 'Failed to respond to invitation' };
    }
  }, [user, invitations, loadInvitations]);

  const removePlayer = useCallback(async (memberId: string) => {
    if (!isSupabaseConfigured) return { error: 'Not configured' };
    
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'removed' })
        .eq('id', memberId);

      if (error) throw error;
      
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'removed' as const } : m));
      return {};
    } catch (error) {
      console.error('Failed to remove player:', error);
      return { error: 'Failed to remove player' };
    }
  }, []);

  const updateMember = useCallback(async (memberId: string, updates: Partial<TeamMember>) => {
    if (!isSupabaseConfigured) return { error: 'Not configured' };
    
    try {
      const payload: any = {};
      if (updates.jerseyNumber !== undefined) payload.jersey_number = updates.jerseyNumber;
      if (updates.position !== undefined) payload.position = updates.position;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.status !== undefined) payload.status = updates.status;

      const { error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', memberId);

      if (error) throw error;
      
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));
      return {};
    } catch (error) {
      console.error('Failed to update member:', error);
      return { error: 'Failed to update member' };
    }
  }, []);

  const addAttendance = useCallback(async (record: Omit<AttendanceRecord, 'id' | 'recordedBy'>) => {
    if (!isSupabaseConfigured || !user) return { error: 'Not configured' };
    
    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          team_id: record.teamId,
          player_id: record.playerId,
          session_date: record.sessionDate.toISOString().split('T')[0],
          session_type: record.sessionType,
          status: record.status,
          notes: record.notes,
          recorded_by: user.id,
        });

      if (error) throw error;
      
      await loadAttendance(record.teamId);
      return {};
    } catch (error) {
      console.error('Failed to add attendance:', error);
      return { error: 'Failed to add attendance' };
    }
  }, [user, loadAttendance]);

  const updateAttendance = useCallback(async (recordId: string, updates: Partial<AttendanceRecord>) => {
    if (!isSupabaseConfigured) return { error: 'Not configured' };
    
    try {
      const payload: any = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { error } = await supabase
        .from('attendance_records')
        .update(payload)
        .eq('id', recordId);

      if (error) throw error;
      
      setAttendanceRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updates } : r));
      return {};
    } catch (error) {
      console.error('Failed to update attendance:', error);
      return { error: 'Failed to update attendance' };
    }
  }, []);

  const addInjury = useCallback(async (record: Omit<InjuryRecord, 'id' | 'recordedBy' | 'playerName' | 'playerAvatar'>) => {
    if (!isSupabaseConfigured || !user) return { error: 'Not configured' };
    
    try {
      const { error } = await supabase
        .from('injury_records')
        .insert({
          team_id: record.teamId,
          player_id: record.playerId,
          injury_type: record.injuryType,
          injury_date: record.injuryDate.toISOString().split('T')[0],
          severity: record.severity,
          status: record.status,
          expected_recovery_date: record.expectedRecoveryDate?.toISOString().split('T')[0],
          actual_recovery_date: record.actualRecoveryDate?.toISOString().split('T')[0],
          description: record.description,
          treatment_notes: record.treatmentNotes,
          recorded_by: user.id,
        });

      if (error) throw error;
      
      await loadInjuries(record.teamId);
      return {};
    } catch (error) {
      console.error('Failed to add injury:', error);
      return { error: 'Failed to add injury' };
    }
  }, [user, loadInjuries]);

  const updateInjury = useCallback(async (recordId: string, updates: Partial<InjuryRecord>) => {
    if (!isSupabaseConfigured) return { error: 'Not configured' };
    
    try {
      const payload: any = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.severity !== undefined) payload.severity = updates.severity;
      if (updates.expectedRecoveryDate !== undefined) payload.expected_recovery_date = updates.expectedRecoveryDate?.toISOString().split('T')[0];
      if (updates.actualRecoveryDate !== undefined) payload.actual_recovery_date = updates.actualRecoveryDate?.toISOString().split('T')[0];
      if (updates.treatmentNotes !== undefined) payload.treatment_notes = updates.treatmentNotes;

      const { error } = await supabase
        .from('injury_records')
        .update(payload)
        .eq('id', recordId);

      if (error) throw error;
      
      setInjuryRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updates } : r));
      return {};
    } catch (error) {
      console.error('Failed to update injury:', error);
      return { error: 'Failed to update injury' };
    }
  }, []);

  const addMatch = useCallback(async (match: Omit<MatchRecord, 'id'>) => {
    if (!isSupabaseConfigured || !user) return { error: 'Not configured' };
    
    try {
      const { data, error } = await supabase
        .from('match_records')
        .insert({
          team_id: match.teamId,
          opponent_name: match.opponentName,
          match_date: match.matchDate.toISOString(),
          location: match.location,
          match_type: match.matchType,
          result: match.result,
          team_score: match.teamScore,
          opponent_score: match.opponentScore,
          notes: match.notes,
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadMatches(match.teamId);
      return { matchId: data?.id };
    } catch (error) {
      console.error('Failed to add match:', error);
      return { error: 'Failed to add match' };
    }
  }, [user, loadMatches]);

  const updateMatch = useCallback(async (matchId: string, updates: Partial<MatchRecord>) => {
    if (!isSupabaseConfigured) return { error: 'Not configured' };
    
    try {
      const payload: any = {};
      if (updates.result !== undefined) payload.result = updates.result;
      if (updates.teamScore !== undefined) payload.team_score = updates.teamScore;
      if (updates.opponentScore !== undefined) payload.opponent_score = updates.opponentScore;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { error } = await supabase
        .from('match_records')
        .update(payload)
        .eq('id', matchId);

      if (error) throw error;
      
      setMatchRecords(prev => prev.map(m => m.id === matchId ? { ...m, ...updates } : m));
      return {};
    } catch (error) {
      console.error('Failed to update match:', error);
      return { error: 'Failed to update match' };
    }
  }, []);

  const addTrainingSession = useCallback(async (session: Omit<TrainingSession, 'id' | 'createdBy'>) => {
    if (!isSupabaseConfigured || !user) return { error: 'Not configured' };
    
    try {
      const { error } = await supabase
        .from('training_sessions')
        .insert({
          team_id: session.teamId,
          title: session.title,
          description: session.description,
          session_date: session.sessionDate.toISOString(),
          duration_minutes: session.durationMinutes,
          location: session.location,
          focus_areas: session.focusAreas,
          created_by: user.id,
        });

      if (error) throw error;
      
      await loadTrainingSessions(session.teamId);
      return {};
    } catch (error) {
      console.error('Failed to add training session:', error);
      return { error: 'Failed to add training session' };
    }
  }, [user, loadTrainingSessions]);

  const addAnnouncement = useCallback(async (announcement: Omit<TeamAnnouncement, 'id' | 'createdBy' | 'createdAt' | 'createdByName' | 'createdByAvatar'>) => {
    if (!isSupabaseConfigured || !user) return { error: 'Not configured' };
    
    try {
      const { error } = await supabase
        .from('team_announcements')
        .insert({
          team_id: announcement.teamId,
          title: announcement.title,
          content: announcement.content,
          priority: announcement.priority,
          published: announcement.published,
          created_by: user.id,
        });

      if (error) throw error;
      
      await loadAnnouncements(announcement.teamId);
      return {};
    } catch (error) {
      console.error('Failed to add announcement:', error);
      return { error: 'Failed to add announcement' };
    }
  }, [user, loadAnnouncements]);

  const updateAnnouncement = useCallback(async (announcementId: string, updates: Partial<TeamAnnouncement>) => {
    if (!isSupabaseConfigured) return { error: 'Not configured' };
    
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.content !== undefined) payload.content = updates.content;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.published !== undefined) payload.published = updates.published;

      const { error } = await supabase
        .from('team_announcements')
        .update(payload)
        .eq('id', announcementId);

      if (error) throw error;
      
      setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, ...updates } : a));
      return {};
    } catch (error) {
      console.error('Failed to update announcement:', error);
      return { error: 'Failed to update announcement' };
    }
  }, []);

  const deleteAnnouncement = useCallback(async (announcementId: string) => {
    if (!isSupabaseConfigured) return { error: 'Not configured' };
    
    try {
      const { error } = await supabase
        .from('team_announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      return {};
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      return { error: 'Failed to delete announcement' };
    }
  }, []);

  return {
    members,
    invitations,
    attendanceRecords,
    injuryRecords,
    matchRecords,
    trainingSession,
    announcements,
    isLoading,
    
    loadTeamMembers,
    loadInvitations,
    loadAttendance,
    loadInjuries,
    loadMatches,
    loadTrainingSessions,
    loadAnnouncements,
    
    invitePlayer,
    respondToInvitation,
    removePlayer,
    updateMember,
    
    addAttendance,
    updateAttendance,
    
    addInjury,
    updateInjury,
    
    addMatch,
    updateMatch,
    
    addTrainingSession,
    
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
});
