import { ThemedText, ThemedView } from 'components/base';
import React, { createContext, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import type { IButton, IEmptyContent, IEmptyContextValue, IEmptyDescription, IEmptyHeader, IEmptyMedia, IEmptyProps, IEmptyTitle } from './types';

const EmptyContext = createContext<IEmptyContextValue | undefined>(undefined);

// ==================== EMPTY COMPONENT ====================

export const Empty: React.FC<IEmptyProps> = ({ children, variant = 'default', style }) => {
  const contextValue = useMemo<IEmptyContextValue>(
    () => ({
      variant,
    }),
    [variant],
  );

  return (
    <EmptyContext.Provider value={contextValue}>
      <ThemedView
        backgroundColor='transparent'
        borderRadius={16}
        padding={48}
        alignItems='center'
        justifyContent='center'
        minHeight={400}
        borderWidth={variant === 'outline' ? 2 : undefined}
        borderColor={variant === 'outline' ? '#333333' : undefined}
        borderStyle={variant === 'outline' ? 'dashed' : undefined}
        style={style}>
        {children}
      </ThemedView>
    </EmptyContext.Provider>
  );
};

// ==================== EMPTY HEADER ====================

export const EmptyHeader: React.FC<IEmptyHeader> = ({ children, style }) => {
  return (
    <ThemedView alignItems='center' justifyContent='center' width='100%' style={style}>
      {children}
    </ThemedView>
  );
};

// ==================== EMPTY MEDIA ====================

export const EmptyMedia: React.FC<IEmptyMedia> = ({ children, variant = 'icon', style }) => {
  return (
    <ThemedView
      marginBottom={32}
      alignItems='center'
      justifyContent='center'
      width={variant === 'icon' ? 96 : undefined}
      height={variant === 'icon' ? 96 : undefined}
      borderRadius={variant === 'icon' ? 24 : undefined}
      backgroundColor={variant === 'icon' ? '#1a1a1a' : undefined}
      style={style}>
      {children}
    </ThemedView>
  );
};

// ==================== EMPTY TITLE ====================

export const EmptyTitle: React.FC<IEmptyTitle> = ({ children, style }) => {
  return (
    <ThemedText fontSize={28} fontWeight='600' color='#ffffff' marginBottom={16} textAlign='center' style={style}>
      {children}
    </ThemedText>
  );
};

// ==================== EMPTY DESCRIPTION ====================

export const EmptyDescription: React.FC<IEmptyDescription> = ({ children, style }) => {
  return (
    <ThemedText fontSize={16} color='#999999' textAlign='center' lineHeight={24} paddingHorizontal={20} style={style}>
      {children}
    </ThemedText>
  );
};

// ==================== EMPTY CONTENT ====================

export const EmptyContent: React.FC<IEmptyContent> = ({ children, style }) => {
  return (
    <ThemedView marginTop={32} alignItems='center' justifyContent='center' style={style}>
      {children}
    </ThemedView>
  );
};

// ==================== BUTTON COMPONENT ====================

export const EmptyButton: React.FC<IButton> = ({ children, variant = 'default', size = 'md', onPress, style }) => {
  const getPaddingHorizontal = () => {
    if (size === 'sm') return 16;
    if (size === 'md') return 24;
    if (size === 'lg') return 32;
    return 24;
  };

  const getPaddingVertical = () => {
    if (size === 'sm') return 8;
    if (size === 'md') return 12;
    if (size === 'lg') return 16;
    return 12;
  };

  const getFontSize = () => {
    if (size === 'sm') return 12;
    return 14;
  };

  return (
    <TouchableOpacity
      style={[
        {
          paddingHorizontal: getPaddingHorizontal(),
          paddingVertical: getPaddingVertical(),
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variant === 'outline' ? 'transparent' : '#ffffff',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? '#333333' : undefined,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {typeof children === 'string' ? (
        <ThemedText fontSize={getFontSize()} fontWeight='500' color={variant === 'outline' ? '#ffffff' : '#000000'}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};
