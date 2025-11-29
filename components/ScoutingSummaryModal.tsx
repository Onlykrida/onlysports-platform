import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { X, Download, Share2, FileText, Award, TrendingUp, AlertCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { User } from '@/types';
import { generateText } from '@rork-ai/toolkit-sdk';

interface ScoutingSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  user: User;
}

export function ScoutingSummaryModal({ visible, onClose, user }: ScoutingSummaryModalProps) {
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const generateSummary = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const statsJson = user.stats ? JSON.stringify(user.stats, null, 2) : 'No stats available';
      const achievementsText = user.achievements && user.achievements.length > 0
        ? user.achievements.map(a => `${a.title} - ${a.description} (${a.date})`).join('\n')
        : 'No achievements recorded';

      const position = user.position || 'Not specified';
      const age = user.roleSpecificData?.dateOfBirth 
        ? new Date().getFullYear() - new Date(user.roleSpecificData.dateOfBirth).getFullYear()
        : 'Not specified';

      let prompt = '';

      switch (user.role) {
        case 'athlete':
          prompt = `You are a professional sports evaluator. Create a concise 4-6 line assessment suitable for coaches and scouts.

Athlete Profile:
Name: ${user.name}
Age: ${age}
Location: ${user.location || 'Not specified'}
Sport: ${user.sport || 'Not specified'}
Position: ${position}

Stats: ${statsJson}
Achievements: ${achievementsText}

Output: Write a single paragraph (4-6 lines) in an objective tone. Include:
- 1-2 key strengths based on stats and achievements
- 1 specific area for improvement
- Best-fit level recommendation (U18/U21/Pro/College)
- Keep it factual, professional, and concise`;
          break;

        case 'scout':
          const scoutData = user.roleSpecificData || {};
          prompt = `You are a sports recruitment director. Create a concise 4-6 line professional assessment.

Scout Profile:
Name: ${user.name}
Organization: ${scoutData.organization || 'Not specified'}
Location: ${user.location || 'Not specified'}
Sport Focus: ${user.sport || 'Not specified'}
Scouting Regions: ${scoutData.scoutingRegions?.join(', ') || 'Not specified'}
Target Athlete Levels: ${scoutData.athleteLevels?.join(', ') || 'Not specified'}

Bio: ${user.bio || 'Not available'}

Output: Write a single paragraph (4-6 lines) in an objective tone. Include:
- Main scouting expertise and focus areas
- Geographic reach and target markets
- Professional strengths and specializations
- Keep it factual, professional, and concise`;
          break;

        case 'coach':
          const coachData = user.roleSpecificData || {};
          prompt = `You are a sports recruitment evaluator. Create a concise 4-6 line professional assessment.

Coach Profile:
Name: ${user.name}
Location: ${user.location || 'Not specified'}
Sport: ${user.sport || 'Not specified'}
Experience: ${coachData.experience || 'Not specified'}
Philosophy: ${coachData.philosophy || 'Not specified'}
Team History: ${coachData.teamHistory?.join(', ') || 'Not specified'}

Achievements: ${achievementsText}

Output: Write a single paragraph (4-6 lines) in an objective tone. Include:
- Coaching style and philosophy
- Track record and notable achievements
- Best-fit level (Youth/High School/College/Professional)
- Keep it factual, professional, and concise`;
          break;

        case 'trainer':
          const trainerData = user.roleSpecificData || {};
          prompt = `You are a sports performance evaluator. Create a concise 4-6 line professional assessment.

Trainer Profile:
Name: ${user.name}
Location: ${user.location || 'Not specified'}
Sport Focus: ${user.sport || 'Not specified'}
Specialties: ${trainerData.specialties?.join(', ') || 'Not specified'}
Certifications: ${trainerData.certifications?.join(', ') || 'Not specified'}

Achievements: ${achievementsText}

Output: Write a single paragraph (4-6 lines) in an objective tone. Include:
- Training specialization and expertise
- Professional certifications and qualifications
- Ideal client type and experience level
- Keep it factual, professional, and concise`;
          break;

        default:
          prompt = `Create a concise 4-6 line professional assessment for ${user.name}, a ${user.role} in ${user.sport || 'sports'}. Location: ${user.location || 'Not specified'}. Bio: ${user.bio || 'Not available'}. Keep it factual and professional.`;
      }

      const generatedSummary = await generateText(prompt);
      setSummary(generatedSummary);
    } catch (err) {
      console.error('Error generating scouting summary:', err);
      setError('Failed to generate scouting summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (visible && !summary && !isGenerating) {
      generateSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleShare = async () => {
    if (!summary) return;

    const shareText = `SCOUTING REPORT
━━━━━━━━━━━━━━━━━━
Player: ${user.name}
Role: ${user.role}
Sport: ${user.sport || 'N/A'}
Location: ${user.location || 'N/A'}

${summary}

━━━━━━━━━━━━━━━━━━
Generated by OnlySports`;

    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(shareText);
        alert('Scouting report copied to clipboard!');
      } else {
        await Share.share({
          message: shareText,
          title: `Scouting Report - ${user.name}`,
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleRegenerate = () => {
    setSummary('');
    setError('');
    generateSummary();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FileText size={24} color={theme.colors.primary} />
            <Text style={styles.headerTitle}>Scouting Report</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Document Header */}
          <View style={styles.documentHeader}>
            <View style={styles.documentTitleContainer}>
              <Award size={20} color={theme.colors.primary} />
              <Text style={styles.documentTitle}>
                {user.role === 'athlete' ? 'PROFESSIONAL SCOUTING SUMMARY' : 
                 user.role === 'scout' ? 'SCOUT PROFESSIONAL PROFILE' :
                 user.role === 'coach' ? 'COACH PROFESSIONAL ASSESSMENT' :
                 user.role === 'trainer' ? 'TRAINER PROFESSIONAL PROFILE' :
                 'PROFESSIONAL SUMMARY'}
              </Text>
            </View>
            <View style={styles.documentMeta}>
              <Text style={styles.documentMetaText}>
                Report Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={styles.documentMetaText}>Generated by OnlySports AI</Text>
            </View>
          </View>

          {/* Profile Info Card */}
          <View style={styles.playerInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sport:</Text>
              <Text style={styles.infoValue}>{user.sport || 'Not specified'}</Text>
            </View>
            {user.role === 'athlete' && user.position && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position:</Text>
                <Text style={styles.infoValue}>{user.position}</Text>
              </View>
            )}
            {user.role === 'scout' && user.roleSpecificData?.organization && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Organization:</Text>
                <Text style={styles.infoValue}>{user.roleSpecificData.organization}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{user.location || 'Not specified'}</Text>
            </View>
          </View>

          {/* Summary Section */}
          <View style={styles.summarySection}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={18} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                {user.role === 'athlete' ? 'SCOUTING ASSESSMENT' : 'PROFESSIONAL ASSESSMENT'}
              </Text>
            </View>

            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Analyzing player profile...</Text>
                <Text style={styles.loadingSubtext}>Generating professional assessment</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={32} color={theme.colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={handleRegenerate} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : summary ? (
              <View style={styles.summaryContent}>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
            ) : null}
          </View>

          {/* Stats Summary */}
          {user.stats && Object.keys(user.stats).length > 0 && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>KEY STATISTICS</Text>
              <View style={styles.statsGrid}>
                {Object.entries(user.stats).map(([key, value]) => (
                  <View key={key} style={styles.statItem}>
                    <Text style={styles.statLabel}>{key}</Text>
                    <Text style={styles.statValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Achievements */}
          {user.achievements && user.achievements.length > 0 && (
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionTitle}>NOTABLE ACHIEVEMENTS</Text>
              {user.achievements.slice(0, 5).map((achievement, index) => (
                <View key={achievement.id || index} style={styles.achievementItem}>
                  <Text style={styles.achievementBullet}>•</Text>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDate}>{achievement.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This report is generated using AI analysis and should be used as a supplementary tool.
              {user.role === 'athlete' && ' Final evaluations should include in-person assessment.'}
            </Text>
            <Text style={styles.footerConfidential}>
              CONFIDENTIAL • FOR PROFESSIONAL USE ONLY
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {!isGenerating && summary && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRegenerate}
            >
              <Download size={20} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Regenerate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={handleShare}
            >
              <Share2 size={20} color={theme.colors.white} />
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>Share Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  documentHeader: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  documentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  documentTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  documentMeta: {
    gap: 4,
  },
  documentMetaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  playerInfoCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium as '500',
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold as '600',
  },
  summarySection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium as '500',
  },
  loadingSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as '600',
  },
  summaryContent: {
    paddingVertical: theme.spacing.sm,
  },
  summaryText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  statsSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold as '700',
    marginTop: theme.spacing.xs,
  },
  achievementsSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  achievementItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  achievementBullet: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    marginTop: 2,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium as '500',
  },
  achievementDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerConfidential: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: theme.fontWeight.bold as '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as '600',
    color: theme.colors.primary,
  },
  primaryActionButtonText: {
    color: theme.colors.white,
  },
});
