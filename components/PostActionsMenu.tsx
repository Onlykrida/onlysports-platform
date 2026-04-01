import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import { PencilLine, Trash2, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PostActionsMenu({ visible, onClose, onEdit, onDelete }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} testID="post-actions-backdrop">
        <View style={styles.sheet} testID="post-actions-menu">
          <View style={styles.headerRow}>
            <Text style={styles.title}>Post actions</Text>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn} testID="post-actions-close">
              <X size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onEdit} style={styles.row} testID="post-actions-edit">
            <PencilLine size={20} color={theme.colors.text} />
            <Text style={styles.rowText}>Edit post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={[styles.row, styles.destructive]}
            testID="post-actions-delete"
          >
            <Trash2 size={20} color={theme.colors.danger} />
            <Text style={[styles.rowText, styles.destructiveText]}>Delete post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  iconBtn: {
    padding: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  rowText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  destructive: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  destructiveText: {
    color: theme.colors.danger,
    fontWeight: theme.fontWeight.bold,
  },
});
