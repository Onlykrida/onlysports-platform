import { User, AthleteData, CoachData, ScoutData, TrainerData, TeamData, FanData } from '@/types';

export function calculateProfileCompletion(user: User): number {
  if (!user) return 0;

  let score = 0;
  
  if (user.name && user.name.trim() !== '') score += 5;
  if (user.bio && user.bio.trim() !== '') score += 5;
  if (user.avatar && user.avatar.trim() !== '') score += 5;
  if (user.locationCity) score += 5;
  if (user.locationCountry) score += 5;
  if (user.sport && user.sport.trim() !== '') score += 5;
  
  switch (user.role) {
    case 'athlete':
      score += calculateAthleteScore(user.athleteData, user);
      break;
    case 'coach':
      score += calculateCoachScore(user.coachData);
      break;
    case 'scout':
      score += calculateScoutScore(user.scoutData);
      break;
    case 'trainer':
      score += calculateTrainerScore(user.trainerData);
      break;
    case 'team':
      score += calculateTeamScore(user.teamData);
      break;
    case 'fan':
      score += calculateFanScore(user.fanData);
      break;
  }
  
  return Math.min(100, score);
}

function calculateAthleteScore(data: AthleteData | undefined, user: User): number {
  let score = 0;
  
  if (data?.dob) score += 10;
  if (data?.heightCm && data.heightCm > 0) score += 5;
  if (data?.weightKg && data.weightKg > 0) score += 5;
  if (user.position) score += 10;
  if (data?.currentTeam) score += 5;
  if (user.achievements && user.achievements.length > 0) score += 10;
  if (data?.highlightVideos && data.highlightVideos.length > 0) score += 15;
  if (data?.aspirations) score += 10;
  
  return score;
}

function calculateCoachScore(data: CoachData | undefined): number {
  let score = 0;
  
  if (data?.yearsExperience && data.yearsExperience > 0) score += 15;
  if (data?.coachingPhilosophy) score += 15;
  if (data?.certifications && data.certifications.length > 0) score += 20;
  if (data?.trainingPrograms && data.trainingPrograms.length > 0) score += 10;
  if (data?.teamHistory && data.teamHistory.length > 0) score += 10;
  
  return score;
}

function calculateScoutScore(data: ScoutData | undefined): number {
  let score = 0;
  
  if (data?.organization) score += 20;
  if (data?.regions && data.regions.length > 0) score += 15;
  if (data?.sportsInterested && data.sportsInterested.length > 0) score += 15;
  if (data?.ageGroupsRecruiting && data.ageGroupsRecruiting.length > 0) score += 10;
  if (data?.lookingFor) score += 10;
  
  return score;
}

function calculateTrainerScore(data: TrainerData | undefined): number {
  let score = 0;
  
  if (data?.certifications && data.certifications.length > 0) score += 25;
  if (data?.specialties && data.specialties.length > 0) score += 15;
  if (data?.servicesOffered && data.servicesOffered.length > 0) score += 15;
  if (data?.pricingPackages && data.pricingPackages.length > 0) score += 15;
  
  return score;
}

function calculateTeamScore(data: TeamData | undefined): number {
  let score = 0;
  
  if (data?.organizationName) score += 20;
  if (data?.organizationType) score += 10;
  if (data?.league) score += 10;
  if (data?.founded) score += 5;
  if (data?.homeVenue) score += 10;
  if (data?.adminContacts && data.adminContacts.length > 0) score += 15;
  
  return score;
}

function calculateFanScore(data: FanData | undefined): number {
  let score = 0;
  
  if (data?.favoriteSports && data.favoriteSports.length > 0) score += 25;
  if (data?.favoriteTeams && data.favoriteTeams.length > 0) score += 25;
  if (data?.favoriteAthletes && data.favoriteAthletes.length > 0) score += 20;
  
  return score;
}

export function getProfileCompletionMessage(score: number): string {
  if (score >= 90) return 'Your profile is complete!';
  if (score >= 70) return 'Almost there! Just a few more details.';
  if (score >= 50) return 'Good progress! Keep adding information.';
  if (score >= 30) return 'Getting started. Add more details to stand out.';
  return 'Complete your profile to get discovered!';
}

export function getProfileCompletionColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#3b82f6';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#ef4444';
  return '#6b7280';
}

export function getMissingProfileFields(user: User): string[] {
  const missing: string[] = [];
  
  if (!user.bio || user.bio.trim() === '') missing.push('Bio');
  if (!user.avatar || user.avatar.trim() === '') missing.push('Profile Photo');
  if (!user.locationCity) missing.push('City');
  if (!user.locationCountry) missing.push('Country');
  if (!user.sport || user.sport.trim() === '') missing.push('Sport');
  
  switch (user.role) {
    case 'athlete':
      if (!user.athleteData?.dob) missing.push('Date of Birth');
      if (!user.position) missing.push('Position');
      if (!user.athleteData?.currentTeam) missing.push('Current Team');
      if (!user.athleteData?.highlightVideos || user.athleteData.highlightVideos.length === 0) {
        missing.push('Highlight Videos');
      }
      if (!user.athleteData?.aspirations) missing.push('Career Aspirations');
      break;
      
    case 'coach':
      if (!user.coachData?.yearsExperience) missing.push('Years of Experience');
      if (!user.coachData?.coachingPhilosophy) missing.push('Coaching Philosophy');
      if (!user.coachData?.certifications || user.coachData.certifications.length === 0) {
        missing.push('Certifications');
      }
      break;
      
    case 'scout':
      if (!user.scoutData?.organization) missing.push('Organization');
      if (!user.scoutData?.regions || user.scoutData.regions.length === 0) {
        missing.push('Scouting Regions');
      }
      if (!user.scoutData?.sportsInterested || user.scoutData.sportsInterested.length === 0) {
        missing.push('Sports of Interest');
      }
      break;
      
    case 'trainer':
      if (!user.trainerData?.certifications || user.trainerData.certifications.length === 0) {
        missing.push('Certifications');
      }
      if (!user.trainerData?.specialties || user.trainerData.specialties.length === 0) {
        missing.push('Specialties');
      }
      if (!user.trainerData?.servicesOffered || user.trainerData.servicesOffered.length === 0) {
        missing.push('Services Offered');
      }
      break;
      
    case 'team':
      if (!user.teamData?.organizationName) missing.push('Organization Name');
      if (!user.teamData?.league) missing.push('League');
      if (!user.teamData?.homeVenue) missing.push('Home Venue');
      break;
      
    case 'fan':
      if (!user.fanData?.favoriteSports || user.fanData.favoriteSports.length === 0) {
        missing.push('Favorite Sports');
      }
      break;
  }
  
  return missing;
}
