import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Save, X, Camera, Plus, Trash2, FileText, Upload } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Achievement } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const SPORTS = [
  'Football', 'Basketball', 'Soccer', 'Baseball', 'Tennis', 'Golf',
  'Swimming', 'Track & Field', 'Volleyball', 'Hockey', 'Wrestling',
  'Boxing', 'MMA', 'Cricket', 'Rugby', 'Other'
];

const POSITIONS = {
  Football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Cornerback', 'Safety', 'Kicker', 'Punter'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker'],
  Baseball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field'],
  Tennis: ['Singles', 'Doubles'],
  Other: ['Player', 'Athlete']
};

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    sport: user?.sport || '',
    position: user?.position || '',
    achievements: user?.achievements || [],
    stats: user?.stats || {},
    avatar: user?.avatar || '',
    coverPhoto: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200',
    roleSpecificData: user?.roleSpecificData || {},
    resumeUrl: user?.resumeUrl || '',
  });
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    date: '',
    icon: '🏆'
  });

  const [newStat, setNewStat] = useState({ key: '', value: '' });
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [showAddStat, setShowAddStat] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Please log in to edit your profile</Text>
      </SafeAreaView>
    );
  }

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking profile image:', error);
      Alert.alert('Error', 'Failed to pick profile image');
    }
  };

  const pickCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, coverPhoto: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking cover image:', error);
      Alert.alert('Error', 'Failed to pick cover image');
    }
  };

  const pickResume = async () => {
    try {
      setIsUploadingResume(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        console.log('Selected resume file:', file.name, file.uri);
        setFormData(prev => ({ ...prev, resumeUrl: file.uri }));
        setResumeFileName(file.name);
        Alert.alert('Success', 'Resume selected. Save your profile to upload it.');
      }
    } catch (error) {
      console.error('Error picking resume:', error);
      Alert.alert('Error', 'Failed to select resume. Please try again.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const removeResume = () => {
    Alert.alert(
      'Remove Resume',
      'Are you sure you want to remove your resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({ ...prev, resumeUrl: '' }));
            setResumeFileName('');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile({
        ...formData,
        resumeUrl: formData.resumeUrl,
        roleSpecificData: formData.roleSpecificData
      });
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const addAchievement = () => {
    if (!newAchievement.title.trim()) {
      Alert.alert('Error', 'Please enter an achievement title');
      return;
    }

    const achievement: Achievement = {
      id: Date.now().toString(),
      title: newAchievement.title,
      description: newAchievement.description,
      date: newAchievement.date || new Date().toLocaleDateString(),
      icon: newAchievement.icon
    };

    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievement]
    }));

    setNewAchievement({ title: '', description: '', date: '', icon: '🏆' });
    setShowAddAchievement(false);
  };

  const removeAchievement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter(a => a.id !== id)
    }));
  };

  const addStat = () => {
    if (!newStat.key.trim() || !newStat.value.trim()) {
      Alert.alert('Error', 'Please enter both stat name and value');
      return;
    }

    setFormData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [newStat.key]: newStat.value
      }
    }));

    setNewStat({ key: '', value: '' });
    setShowAddStat(false);
  };

  const removeStat = (key: string) => {
    const newStats = { ...formData.stats };
    delete newStats[key];
    setFormData(prev => ({ ...prev, stats: newStats }));
  };

  const updateRoleSpecificData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      roleSpecificData: {
        ...prev.roleSpecificData,
        [key]: value
      }
    }));
  };

  const renderRoleSpecificFields = () => {
    if (!user?.role) return null;

    switch (user.role) {
      case 'athlete':
        return (
          <>
            <Input
              label="Height"
              value={formData.roleSpecificData?.height || ''}
              onChangeText={(text) => updateRoleSpecificData('height', text)}
              placeholder="e.g., 180 cm"
            />
            <Input
              label="Weight"
              value={formData.roleSpecificData?.weight || ''}
              onChangeText={(text) => updateRoleSpecificData('weight', text)}
              placeholder="e.g., 75 kg"
            />
            <Input
              label="Date of Birth"
              value={formData.roleSpecificData?.dateOfBirth || ''}
              onChangeText={(text) => updateRoleSpecificData('dateOfBirth', text)}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="Career Goals"
              value={formData.roleSpecificData?.careerGoals || ''}
              onChangeText={(text) => updateRoleSpecificData('careerGoals', text)}
              placeholder="Your athletic aspirations"
              multiline
            />
            <Input
              label="Current Team/Club"
              value={formData.roleSpecificData?.currentTeam || ''}
              onChangeText={(text) => updateRoleSpecificData('currentTeam', text)}
              placeholder="e.g., Mumbai FC Academy"
            />
          </>
        );
      case 'scout':
        return (
          <>
            <Input
              label="Organization"
              value={formData.roleSpecificData?.organization || ''}
              onChangeText={(text) => updateRoleSpecificData('organization', text)}
              placeholder="Team/Agency/Club name"
            />
            <Input
              label="Scouting Regions"
              value={formData.roleSpecificData?.scoutingRegions?.join(', ') || ''}
              onChangeText={(text) => updateRoleSpecificData('scoutingRegions', text.split(',').map(r => r.trim()))}
              placeholder="e.g., South Asia, Europe"
            />
            <Input
              label="Athlete Levels"
              value={formData.roleSpecificData?.athleteLevels?.join(', ') || ''}
              onChangeText={(text) => updateRoleSpecificData('athleteLevels', text.split(',').map(l => l.trim()))}
              placeholder="e.g., High School, College"
            />
            <Input
              label="What You're Looking For"
              value={formData.roleSpecificData?.lookingFor || ''}
              onChangeText={(text) => updateRoleSpecificData('lookingFor', text)}
              placeholder="Describe ideal athlete qualities"
              multiline
            />
          </>
        );
      case 'coach':
        return (
          <>
            <Input
              label="Years of Experience"
              value={formData.roleSpecificData?.experience || ''}
              onChangeText={(text) => updateRoleSpecificData('experience', text)}
              placeholder="e.g., 8 years"
            />
            <Input
              label="Coaching Philosophy"
              value={formData.roleSpecificData?.philosophy || ''}
              onChangeText={(text) => updateRoleSpecificData('philosophy', text)}
              placeholder="Your coaching approach"
              multiline
            />
            <Input
              label="Team History"
              value={formData.roleSpecificData?.teamHistory?.join(', ') || ''}
              onChangeText={(text) => updateRoleSpecificData('teamHistory', text.split(',').map(t => t.trim()))}
              placeholder="Previous teams coached"
            />
          </>
        );
      case 'trainer':
        return (
          <>
            <Input
              label="Specialties"
              value={formData.roleSpecificData?.specialties?.join(', ') || ''}
              onChangeText={(text) => updateRoleSpecificData('specialties', text.split(',').map(s => s.trim()))}
              placeholder="e.g., Strength Training, Conditioning"
            />
            <Input
              label="Certifications"
              value={formData.roleSpecificData?.certifications?.join(', ') || ''}
              onChangeText={(text) => updateRoleSpecificData('certifications', text.split(',').map(c => c.trim()))}
              placeholder="e.g., ACE, NSCA, ACSM"
            />
          </>
        );
      default:
        return null;
    }
  };

  const availablePositions = formData.sport ? (POSITIONS[formData.sport as keyof typeof POSITIONS] || POSITIONS.Other) : POSITIONS.Other;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Edit Profile',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={isLoading}>
              <Save size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Photo Section */}
        <View style={styles.coverSection}>
          <TouchableOpacity onPress={pickCoverImage} style={styles.coverImageContainer}>
            <Image 
              source={{ uri: formData.coverPhoto }} 
              style={styles.coverImage} 
            />
            <View style={styles.coverImageOverlay}>
              <Camera size={20} color={theme.colors.white} />
              <Text style={styles.coverImageText}>Change Cover Photo</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: formData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' 
              }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.cameraButton} onPress={pickProfileImage}>
              <Camera size={16} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarText}>Tap to change profile photo</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Input
            label="Name"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter your name"
          />
          
          <Input
            label="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
          
          <Input
            label="Location"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="City, State/Country"
          />
        </View>

        {/* Role-Specific Fields */}
        {user?.role && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Information</Text>
            {renderRoleSpecificFields()}
          </View>
        )}

        {/* Sport & Position */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sport Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sport</Text>
            <TouchableOpacity 
              style={styles.picker}
              onPress={() => setShowSportPicker(!showSportPicker)}
            >
              <Text style={[styles.pickerText, !formData.sport && styles.placeholderText]}>
                {formData.sport || 'Select your sport'}
              </Text>
            </TouchableOpacity>
            
            {showSportPicker && (
              <View style={styles.pickerOptions}>
                {SPORTS.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, sport, position: '' }));
                      setShowSportPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{sport}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {formData.sport && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Position</Text>
              <TouchableOpacity 
                style={styles.picker}
                onPress={() => setShowPositionPicker(!showPositionPicker)}
              >
                <Text style={[styles.pickerText, !formData.position && styles.placeholderText]}>
                  {formData.position || 'Select your position'}
                </Text>
              </TouchableOpacity>
              
              {showPositionPicker && (
                <View style={styles.pickerOptions}>
                  {availablePositions.map((position) => (
                    <TouchableOpacity
                      key={position}
                      style={styles.pickerOption}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, position }));
                        setShowPositionPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{position}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddAchievement(true)}
            >
              <Plus size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {formData.achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>{achievement.date}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeAchievement(achievement.id)}
              >
                <Trash2 size={16} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {showAddAchievement && (
            <View style={styles.addForm}>
              <Input
                label="Achievement Title"
                value={newAchievement.title}
                onChangeText={(text) => setNewAchievement(prev => ({ ...prev, title: text }))}
                placeholder="e.g., State Championship Winner"
              />
              <Input
                label="Description"
                value={newAchievement.description}
                onChangeText={(text) => setNewAchievement(prev => ({ ...prev, description: text }))}
                placeholder="Brief description"
              />
              <Input
                label="Date"
                value={newAchievement.date}
                onChangeText={(text) => setNewAchievement(prev => ({ ...prev, date: text }))}
                placeholder="MM/DD/YYYY"
              />
              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowAddAchievement(false);
                    setNewAchievement({ title: '', description: '', date: '', icon: '🏆' });
                  }}
                  variant="ghost"
                  style={styles.actionButton}
                />
                <Button
                  title="Add"
                  onPress={addAchievement}
                  style={styles.actionButton}
                />
              </View>
            </View>
          )}
        </View>

        {/* CV/Resume Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CV / Resume</Text>
          <Text style={styles.sectionSubtitle}>Upload your resume as a PDF file</Text>
          
          {formData.resumeUrl ? (
            <View style={styles.resumeContainer}>
              <View style={styles.resumeInfo}>
                <FileText size={24} color={theme.colors.primary} />
                <View style={styles.resumeDetails}>
                  <Text style={styles.resumeFileName} numberOfLines={1}>
                    {resumeFileName || 'Resume.pdf'}
                  </Text>
                  <Text style={styles.resumeStatus}>PDF Document</Text>
                </View>
              </View>
              <View style={styles.resumeActions}>
                <TouchableOpacity 
                  style={styles.resumeActionButton}
                  onPress={pickResume}
                >
                  <Upload size={18} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.resumeActionButton}
                  onPress={removeResume}
                >
                  <Trash2 size={18} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadResumeButton}
              onPress={pickResume}
              disabled={isUploadingResume}
            >
              <Upload size={20} color={theme.colors.primary} />
              <Text style={styles.uploadResumeText}>
                {isUploadingResume ? 'Selecting...' : 'Upload Resume (PDF)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddStat(true)}
            >
              <Plus size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {Object.entries(formData.stats).map(([key, value]) => (
              <View key={key} style={styles.statCard}>
                <TouchableOpacity 
                  style={styles.statRemoveButton}
                  onPress={() => removeStat(key)}
                >
                  <X size={12} color={theme.colors.danger} />
                </TouchableOpacity>
                <Text style={styles.statCardValue}>{String(value)}</Text>
                <Text style={styles.statCardLabel}>{key}</Text>
              </View>
            ))}
          </View>

          {showAddStat && (
            <View style={styles.addForm}>
              <Input
                label="Stat Name"
                value={newStat.key}
                onChangeText={(text) => setNewStat(prev => ({ ...prev, key: text }))}
                placeholder="e.g., Goals, Points, Wins"
              />
              <Input
                label="Value"
                value={newStat.value}
                onChangeText={(text) => setNewStat(prev => ({ ...prev, value: text }))}
                placeholder="e.g., 25, 1250, 15"
              />
              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowAddStat(false);
                    setNewStat({ key: '', value: '' });
                  }}
                  variant="ghost"
                  style={styles.actionButton}
                />
                <Button
                  title="Add"
                  onPress={addStat}
                  style={styles.actionButton}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
    backgroundColor: '#000000',
  },
  avatarSection: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginTop: -50,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
    borderWidth: 3,
    borderColor: '#000000',
  },
  avatarText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  picker: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  pickerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  pickerOptions: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.xs,
    maxHeight: 200,
  },
  pickerOption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerOptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  achievementDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  achievementDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  addForm: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    position: 'relative',
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statRemoveButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    padding: 2,
  },
  statCardValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  statCardLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  coverSection: {
    marginBottom: 0,
  },
  coverImageContainer: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 150,
  },
  coverImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  coverImageText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  resumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  resumeDetails: {
    flex: 1,
  },
  resumeFileName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  resumeStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  resumeActionButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  uploadResumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  uploadResumeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
});