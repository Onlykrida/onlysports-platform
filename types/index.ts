export type UserRole = 'athlete' | 'coach' | 'scout' | 'team' | 'fan' | 'trainer';
export type ProfileVisibility = 'public' | 'scouts-only' | 'private';
export type Gender = 'male' | 'female' | 'other';
export type PreferredSide = 'left' | 'right' | 'both';
export type TrainingFrequency = 'daily' | 'weekly' | 'occasional' | 'rare';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  
  // Enhanced location fields
  location?: string;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  locationGeo?: { lat: number; lng: number };
  
  // Verification
  verified?: boolean;
  verifiedAt?: Date;
  verifiedMetadata?: Record<string, any>;
  
  // Profile metadata
  profileCompletionScore?: number;
  publicVisibility?: ProfileVisibility;
  lastActiveAt?: Date;
  
  // Core sport fields
  sport?: string;
  position?: string;
  achievements?: Achievement[];
  stats?: Stats;
  
  // Social
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  
  // Documents
  resumeUrl?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  
  // Role-specific data (new structured approach)
  athleteData?: AthleteData;
  coachData?: CoachData;
  scoutData?: ScoutData;
  trainerData?: TrainerData;
  teamData?: TeamData;
  fanData?: FanData;
  
  // Legacy (for backwards compatibility)
  roleSpecificData?: RoleSpecificData;
}

export interface Certification {
  id: string;
  name: string;
  organization: string;
  date: string;
  fileUrl?: string;
}

export interface HighlightVideo {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  uploadedAt: Date;
}

export interface InjuryRecord {
  id: string;
  injury: string;
  date: string;
  recoveryTime?: string;
  status?: 'recovered' | 'recovering' | 'chronic';
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  date: string;
  rating?: number;
}

export interface PricingPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
}

export interface AdminContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export interface TrialOpportunity {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
}

// ATHLETE specific data
export interface AthleteData {
  dob?: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  currentTeam?: string;
  preferredFoot?: PreferredSide;
  dominantHand?: PreferredSide;
  dominantStyle?: string[];
  highlightVideos?: HighlightVideo[];
  injuryHistory?: InjuryRecord[];
  trainingFrequency?: TrainingFrequency;
  aspirations?: string;
  consentContactScouts?: boolean;
  careerHistory?: CareerEntry[];
}

// COACH specific data
export interface CoachData {
  sportsCoached?: string[];
  yearsExperience?: number;
  certifications?: Certification[];
  availability?: string;
  trainingPrograms?: TrainingProgram[];
  testimonials?: Testimonial[];
  coachingPhilosophy?: string;
  teamHistory?: string[];
}

// SCOUT specific data
export interface ScoutData {
  organization: string;
  regions?: string[];
  sportsInterested?: string[];
  ageGroupsRecruiting?: string[];
  positionPreferences?: string[];
  savedFilters?: Record<string, any>;
  preferredContactMethod?: string;
  scoutingRegions?: string[];
  athleteLevels?: string[];
  lookingFor?: string;
}

// TRAINER specific data
export interface TrainerData {
  certifications?: Certification[];
  specialties?: string[];
  servicesOffered?: string[];
  pricingPackages?: PricingPackage[];
  availabilityCalendar?: Record<string, any>;
  facilityPhotos?: string[];
}

// TEAM specific data
export interface TeamData {
  organizationName?: string;
  organizationType?: string;
  league?: string;
  founded?: string;
  homeVenue?: string;
  rosterInfo?: Record<string, any>;
  trialsOpportunities?: TrialOpportunity[];
  facilitiesPhotos?: string[];
  adminContacts?: AdminContact[];
}

// FAN specific data
export interface FanData {
  favoriteSports?: string[];
  favoriteTeams?: string[];
  favoriteAthletes?: string[];
  notificationPreferences?: Record<string, boolean>;
}

// Legacy compatibility
export interface RoleSpecificData {
  // Athlete specific
  height?: string;
  weight?: string;
  dateOfBirth?: string;
  careerGoals?: string;
  currentTeam?: string;
  
  // Scout specific
  organization?: string;
  scoutingRegions?: string[];
  athleteLevels?: string[];
  lookingFor?: string;
  
  // Coach specific
  experience?: string;
  philosophy?: string;
  teamHistory?: string[];
  
  // Trainer specific
  specialties?: string[];
  certifications?: string[];
  
  // Team specific
  league?: string;
  founded?: string;
  homeVenue?: string;
}

export interface AthleteProfile extends User {
  sport: string;
  position: string;
  height?: string;
  weight?: string;
  dateOfBirth?: string;
  achievements: Achievement[];
  stats: Stats;
  highlights: Video[];
  careerHistory: CareerEntry[];
  followers: number;
  following: number;
  endorsements: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon?: string;
}

export interface Stats {
  [key: string]: string | number;
}

export interface Video {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  uploadedAt: Date;
}

export interface CareerEntry {
  id: string;
  team: string;
  position: string;
  startDate: string;
  endDate?: string;
  achievements?: string[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  createdAt: Date;
  opportunityId?: string;
}

export interface Opportunity {
  id: string;
  teamId: string;
  title: string;
  description: string;
  category: 'tryouts' | 'tournaments' | 'sponsorships' | 'scholarships' | 'contracts';
  type: ('paid' | 'unpaid' | 'local' | 'national' | 'short-term' | 'long-term')[];
  sport?: string;
  location: string;
  deadline: string;
  requirements?: string;
  compensation?: string;
  duration?: string;
  ageRange?: string;
  skillLevel?: string;
  contactInfo: string;
  additionalInfo?: string;
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

export interface TeamProfile {
  id: string;
  name: string;
  sport: string;
  league?: string;
  location: string;
  logo: string;
  coverImage?: string;
  description: string;
  founded?: string;
  achievements: Achievement[];
  roster: AthleteProfile[];
  followers: number;
  verified: boolean;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'like' | 'comment' | 'post' | 'opportunity' | 'message' | 'connection_request' | 'connection_accepted' | 'profile_view' | 'mention' | 'system' | 'application';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  postId?: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
  senderName?: string;
  senderAvatar?: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'team';
  name: string;
  avatar?: string;
  subtitle?: string;
  verified?: boolean;
}