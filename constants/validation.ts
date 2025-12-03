import { z } from 'zod';

export const emailSchema = z.string().email({ message: 'Invalid email address' });
export const passwordSchema = z.string().min(6, { message: 'Password must be at least 6 characters' });
export const nameSchema = z.string().min(1, { message: 'Name is required' });

export const athleteDataSchema = z.object({
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().min(50, { message: 'Height must be at least 50cm' }).max(300, { message: 'Height must be at most 300cm' }).optional(),
  weightKg: z.number().min(20, { message: 'Weight must be at least 20kg' }).max(300, { message: 'Weight must be at most 300kg' }).optional(),
  currentTeam: z.string().optional(),
  preferredFoot: z.enum(['left', 'right', 'both']).optional(),
  dominantHand: z.enum(['left', 'right', 'both']).optional(),
  dominantStyle: z.array(z.string()).optional(),
  highlightVideos: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    title: z.string(),
    thumbnail: z.string().url().optional(),
    duration: z.string().optional(),
    uploadedAt: z.date(),
  })).optional(),
  injuryHistory: z.array(z.object({
    id: z.string(),
    injury: z.string(),
    date: z.string(),
    recoveryTime: z.string().optional(),
    status: z.enum(['recovered', 'recovering', 'chronic']).optional(),
  })).optional(),
  trainingFrequency: z.enum(['daily', 'weekly', 'occasional', 'rare']).optional(),
  aspirations: z.string().optional(),
  consentContactScouts: z.boolean().optional(),
  careerHistory: z.array(z.object({
    id: z.string(),
    team: z.string(),
    position: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    achievements: z.array(z.string()).optional(),
  })).optional(),
});

export const coachDataSchema = z.object({
  sportsCoached: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0, { message: 'Years of experience must be positive' }).optional(),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    organization: z.string(),
    date: z.string(),
    fileUrl: z.string().url().optional(),
  })).optional(),
  availability: z.string().optional(),
  trainingPrograms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    duration: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
  })).optional(),
  testimonials: z.array(z.object({
    id: z.string(),
    name: z.string(),
    text: z.string(),
    date: z.string(),
    rating: z.number().min(1, { message: 'Rating must be at least 1' }).max(5, { message: 'Rating must be at most 5' }).optional(),
  })).optional(),
  coachingPhilosophy: z.string().optional(),
  teamHistory: z.array(z.string()).optional(),
});

export const scoutDataSchema = z.object({
  organization: z.string().min(1, { message: 'Organization is required' }),
  regions: z.array(z.string()).optional(),
  sportsInterested: z.array(z.string()).optional(),
  ageGroupsRecruiting: z.array(z.string()).optional(),
  positionPreferences: z.array(z.string()).optional(),
  savedFilters: z.record(z.string(), z.any()).optional(),
  preferredContactMethod: z.string().optional(),
  scoutingRegions: z.array(z.string()).optional(),
  athleteLevels: z.array(z.string()).optional(),
  lookingFor: z.string().optional(),
});

export const trainerDataSchema = z.object({
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    organization: z.string(),
    date: z.string(),
    fileUrl: z.string().url().optional(),
  })).optional(),
  specialties: z.array(z.string()).optional(),
  servicesOffered: z.array(z.string()).optional(),
  pricingPackages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.number().min(0, { message: 'Price must be positive' }),
    duration: z.string(),
  })).optional(),
  availabilityCalendar: z.record(z.string(), z.any()).optional(),
  facilityPhotos: z.array(z.string().url()).optional(),
});

export const teamDataSchema = z.object({
  organizationName: z.string().optional(),
  organizationType: z.string().optional(),
  league: z.string().optional(),
  founded: z.string().optional(),
  homeVenue: z.string().optional(),
  rosterInfo: z.record(z.string(), z.any()).optional(),
  trialsOpportunities: z.array(z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    location: z.string(),
    description: z.string().optional(),
  })).optional(),
  facilitiesPhotos: z.array(z.string().url()).optional(),
  adminContacts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  })).optional(),
});

export const fanDataSchema = z.object({
  favoriteSports: z.array(z.string()).optional(),
  favoriteTeams: z.array(z.string()).optional(),
  favoriteAthletes: z.array(z.string()).optional(),
  notificationPreferences: z.record(z.string(), z.boolean()).optional(),
});

export const baseProfileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  bio: z.string().optional(),
  avatar: z.string().optional(),
  sport: z.string().optional(),
  position: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCountry: z.string().optional(),
  publicVisibility: z.enum(['public', 'scouts-only', 'private']).optional(),
});

export const athleteSignupSchema = baseProfileSchema.extend({
  password: passwordSchema,
  sport: z.string().min(1, { message: 'Sport is required' }),
  position: z.string().min(1, { message: 'Position is required' }),
  bio: z.string().min(1, { message: 'Bio is required' }),
  athleteData: athleteDataSchema.optional(),
});

export const coachSignupSchema = baseProfileSchema.extend({
  password: passwordSchema,
  sport: z.string().min(1, { message: 'Sport is required' }),
  bio: z.string().min(1, { message: 'Bio is required' }),
  coachData: coachDataSchema.optional(),
});

export const scoutSignupSchema = baseProfileSchema.extend({
  password: passwordSchema,
  bio: z.string().min(1, { message: 'Bio is required' }),
  scoutData: scoutDataSchema,
});

export const trainerSignupSchema = baseProfileSchema.extend({
  password: passwordSchema,
  bio: z.string().min(1, { message: 'Bio is required' }),
  trainerData: trainerDataSchema.optional(),
});

export const teamSignupSchema = baseProfileSchema.extend({
  password: passwordSchema,
  bio: z.string().min(1, { message: 'Bio is required' }),
  teamData: teamDataSchema.optional(),
});

export const fanSignupSchema = baseProfileSchema.extend({
  password: passwordSchema,
  fanData: fanDataSchema.optional(),
});
