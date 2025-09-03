import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';
import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';

export interface Opportunity {
  id: string;
  teamId: string;
  title: string;
  description: string;
  type: 'tryout' | 'tournament' | 'sponsorship' | 'scholarship' | 'job' | 'camp';
  sport: string;
  location: string;
  deadline: string;
  requirements?: string[];
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  teamName?: string;
  teamAvatar?: string;
  applicationsCount?: number;
  hasApplied?: boolean;
}

export interface Application {
  id: string;
  opportunityId: string;
  athleteId: string;
  status: 'pending' | 'accepted' | 'rejected';
  coverLetter?: string;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  athleteName?: string;
  athleteAvatar?: string;
  opportunityTitle?: string;
}

interface OpportunitiesState {
  opportunities: Opportunity[];
  myApplications: Application[];
  isLoading: boolean;
  createOpportunity: (opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'teamId'>) => Promise<{ error?: string }>;
  applyToOpportunity: (opportunityId: string) => Promise<{ error?: string }>;
  updateApplicationStatus: (applicationId: string, status: Application['status']) => Promise<{ error?: string }>;
  loadOpportunities: () => Promise<void>;
  loadMyApplications: () => Promise<void>;
  refreshOpportunities: () => Promise<void>;
}

export const [OpportunitiesProvider, useOpportunities] = createContextHook<OpportunitiesState>(() => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOpportunities = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      setIsLoading(true);
      
      const { data: opportunitiesData, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          team:profiles!opportunities_team_id_fkey(name, avatar),
          applications(id, athlete_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading opportunities:', error);
        return;
      }

      const formattedOpportunities: Opportunity[] = opportunitiesData?.map((opp: any) => ({
        id: opp.id,
        teamId: opp.team_id,
        title: opp.title,
        description: opp.description,
        type: opp.type,
        sport: opp.sport,
        location: opp.location,
        deadline: opp.deadline,
        requirements: opp.requirements,
        paid: opp.paid || false,
        createdAt: new Date(opp.created_at),
        updatedAt: new Date(opp.updated_at),
        teamName: opp.team?.name,
        teamAvatar: opp.team?.avatar,
        applicationsCount: opp.applications?.length || 0,
        hasApplied: user ? opp.applications?.some((app: any) => app.athlete_id === user.id) : false,
      })) || [];

      setOpportunities(formattedOpportunities);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadMyApplications = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunities(title, team_id),
          athlete:profiles!applications_athlete_id_fkey(name, avatar)
        `)
        .eq('athlete_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading applications:', error);
        return;
      }

      const formattedApplications: Application[] = applicationsData?.map((app: any) => ({
        id: app.id,
        opportunityId: app.opportunity_id,
        athleteId: app.athlete_id,
        status: app.status,
        createdAt: new Date(app.created_at),
        updatedAt: new Date(app.updated_at || app.created_at),
        athleteName: app.athlete?.name,
        athleteAvatar: app.athlete?.avatar,
        opportunityTitle: app.opportunity?.title,
      })) || [];

      setMyApplications(formattedApplications);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }, [user]);

  const createOpportunity = useCallback(async (opportunityData: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'teamId'>) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      console.log('[Opportunities] Creating opportunity payload:', opportunityData);
      const { data: inserted, error } = await supabase
        .from('opportunities')
        .insert({
          team_id: user.id,
          title: opportunityData.title,
          description: opportunityData.description,
          type: opportunityData.type,
          sport: opportunityData.sport,
          location: opportunityData.location,
          deadline: opportunityData.deadline,
          requirements: opportunityData.requirements,
          paid: opportunityData.paid,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating opportunity:', error);
        return { error: error.message };
      }

      try {
        console.log('[Opportunities] Fetching all user ids to notify');
        const { data: usersToNotify, error: usersErr } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', user.id)
          .limit(10000);

        if (usersErr) {
          console.error('Failed to load users for notifications:', usersErr);
        } else if (usersToNotify && usersToNotify.length > 0) {
          const title = `New Opportunity: ${opportunityData.title}`;
          const message = `${user.name ?? 'A team'} posted a new ${opportunityData.type} in ${opportunityData.location}`;
          const rows = usersToNotify.map((u: { id: string }) => ({
            user_id: u.id,
            type: 'opportunity' as const,
            title,
            message,
            data: {
              opportunityId: inserted?.id,
              teamId: user.id,
              title: opportunityData.title,
            },
            read: false,
          }));
          console.log('[Opportunities] Inserting notifications for users count:', rows.length);
          const { error: notifErr } = await supabase.from('notifications').insert(rows);
          if (notifErr) {
            console.error('Failed to insert notifications:', notifErr);
          }
        }
      } catch (notifyErr) {
        console.error('Broadcast notifications failed:', notifyErr);
      }

      await loadOpportunities();
      return {};
    } catch (error) {
      console.error('Failed to create opportunity:', error);
      return { error: 'Failed to create opportunity' };
    }
  }, [user, loadOpportunities]);

  const applyToOpportunity = useCallback(async (opportunityId: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('athlete_id', user.id)
        .single();

      if (existingApplication) {
        return { error: 'You have already applied to this opportunity' };
      }

      const { error } = await supabase
        .from('applications')
        .insert({
          opportunity_id: opportunityId,
          athlete_id: user.id,
          status: 'pending',
          cover_letter: null,
        });

      if (error) {
        console.error('Error applying to opportunity:', error);
        return { error: error.message };
      }

      // Get opportunity details for notification
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('title, team_id')
        .eq('id', opportunityId)
        .single();

      if (opportunity) {
        // Notify the team/coach about the new application
        await createNotification(
          opportunity.team_id,
          'opportunity',
          'New Application',
          `${user.name} applied to your opportunity: ${opportunity.title}`,
          { opportunityId, athleteId: user.id }
        );
      }

      await loadOpportunities();
      await loadMyApplications();
      return {};
    } catch (error) {
      console.error('Failed to apply to opportunity:', error);
      return { error: 'Failed to apply to opportunity' };
    }
  }, [user, createNotification, loadOpportunities, loadMyApplications]);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: Application['status']) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated or database not configured' };
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application status:', error);
        return { error: error.message };
      }

      // Get application details for notification
      const { data: application } = await supabase
        .from('applications')
        .select(`
          athlete_id,
          opportunity:opportunities(title)
        `)
        .eq('id', applicationId)
        .single();

      if (application) {
        // Notify the athlete about status change
        const statusMessage = status === 'accepted' ? 'accepted' : 'rejected';
        await createNotification(
          application.athlete_id,
          'opportunity',
          `Application ${statusMessage}`,
          `Your application to ${application.opportunity.title} has been ${statusMessage}`,
          { applicationId, status }
        );
      }

      await loadMyApplications();
      return {};
    } catch (error) {
      console.error('Failed to update application status:', error);
      return { error: 'Failed to update application status' };
    }
  }, [user, createNotification, loadMyApplications]);

  const refreshOpportunities = useCallback(async () => {
    await loadOpportunities();
    await loadMyApplications();
  }, [loadOpportunities, loadMyApplications]);

  useEffect(() => {
    if (user) {
      loadOpportunities();
      loadMyApplications();
    }
  }, [user, loadOpportunities, loadMyApplications]);

  // Real-time updates for opportunities and applications
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('opportunities_and_applications_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, () => {
        loadOpportunities();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        loadOpportunities();
        loadMyApplications();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, loadOpportunities, loadMyApplications]);

  return useMemo(() => ({
    opportunities,
    myApplications,
    isLoading,
    createOpportunity,
    applyToOpportunity,
    updateApplicationStatus,
    loadOpportunities,
    loadMyApplications,
    refreshOpportunities,
  }), [opportunities, myApplications, isLoading, createOpportunity, applyToOpportunity, updateApplicationStatus, loadOpportunities, loadMyApplications, refreshOpportunities]);
});