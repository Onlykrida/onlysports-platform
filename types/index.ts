export type UserRole =
  | 'athlete'
  | 'coach'
  | 'scout'
  | 'team'
  | 'fan'
  | 'trainer'
  | 'gym'
  | 'brand'
  | 'academy';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: string;
  verified?: boolean;
  sport?: string;
  position?: string;
  achievements?: Achievement[];
  stats?: Stats;
  createdAt: Date;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  // Role-specific fields
  roleSpecificData?: RoleSpecificData;
}

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
  // Opportunity-specific fields (if this post is an opportunity)
  isOpportunity?: boolean;
  opportunityData?: {
    type: 'tryout' | 'tournament' | 'sponsorship' | 'scholarship' | 'job' | 'camp';
    sport: string;
    location: string;
    deadline: string;
    paid: boolean;
    applicationsCount?: number;
    hasApplied?: boolean;
  };
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
  athleteSport?: string;
  athletePosition?: string;
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
  type:
    | 'follow'
    | 'like'
    | 'comment'
    | 'post'
    | 'opportunity'
    | 'message'
    | 'connection_request'
    | 'connection_accepted'
    | 'profile_view'
    | 'mention'
    | 'system'
    | 'application'
    | 'coach_verification_request';
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

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  createdAt: Date;
  senderName?: string;
  senderAvatar?: string;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSender?: string;
  unreadCount: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  userName?: string;
  userAvatar?: string;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'team';
  name: string;
  avatar?: string;
  subtitle?: string;
  verified?: boolean;
}

export interface BeepTestResult {
  id: string;
  athlete_id: string;
  conducted_by?: string;
  conductor_name?: string;
  test_mode: 'self' | 'coached' | 'manual';
  level: number;
  shuttle: number;
  vo2max: number;
  zone: 'starter' | 'building' | 'rising' | 'strong' | 'elite' | 'unstoppable';
  total_distance: number;
  total_shuttles: number;
  peak_speed: number;
  test_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type FitnessTestType =
  // existing (v1.0)
  | 'yoyo'
  | 'sprint_20m'
  | 'sprint_40m'
  | 'agility_ttest'
  | 'vertical_jump'
  // v1.5 wedge — must match supabase-v15-prereq.sql CHECK constraint
  | 'sprint_10m'
  | 'sprint_30m'
  | 'gps_time_trial'
  | 'juggling_count'
  | 'wall_volley_count'
  | 'dribble_cones_count'
  | 'spot_shooting_pct'
  | 'drag_flick_accuracy'
  | 'crossing_accuracy'
  | 'bowling_accuracy';
export type FitnessZone = 'starter' | 'building' | 'rising' | 'strong' | 'elite' | 'unstoppable';

export type VerificationTier =
  | 'self_reported'
  | 'app_measured'
  | 'coach_verified'
  | 'center_tested';

export interface FitnessTestResult {
  id: string;
  athlete_id: string;
  conducted_by?: string;
  test_type: FitnessTestType;
  test_mode: 'self' | 'coached' | 'manual';

  // Yo-Yo IR1 specific
  level?: number;
  shuttle?: number;
  vo2max?: number;
  total_distance?: number;
  total_shuttles?: number;
  peak_speed?: number;

  // Sprint specific
  sprint_time?: number;
  sprint_distance?: number;

  // Agility T-Test specific
  agility_time?: number;

  // Vertical Jump specific
  jump_height?: number;

  // Common
  zone: FitnessZone;
  test_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Verification
  verification_tier?: VerificationTier;
  video_url?: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  sensor_data?: Record<string, any>;
  attestation_count?: number;
}

export interface TestAttestation {
  id: string;
  test_result_id: string;
  attester_id: string;
  relationship: 'teammate' | 'training_partner' | 'coach_staff' | 'spectator';
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  test_result_id: string;
  athlete_id: string;
  coach_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  coach_notes?: string;
  created_at: string;
  resolved_at?: string;
}
