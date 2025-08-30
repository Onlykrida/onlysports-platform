export type UserRole = 'athlete' | 'coach' | 'scout' | 'team' | 'fan' | 'trainer';

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
}

export interface Opportunity {
  id: string;
  teamId: string;
  title: string;
  description: string;
  type: 'tryout' | 'tournament' | 'sponsorship' | 'scholarship';
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
  createdAt: Date;
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
  type: 'follow' | 'like' | 'comment' | 'post' | 'opportunity' | 'message' | 'connection_request' | 'connection_accepted' | 'profile_view' | 'mention' | 'system';
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