import React from 'react';
import {Text as RNText, TextProps} from 'react-native';
import {fonts} from '../theme/fonts';

interface CustomTextProps extends TextProps {
  bold?: boolean;
  medium?: boolean;
  semiBold?: boolean;
  extraBold?: boolean;
}

export const Text: React.FC<CustomTextProps> = ({
  style,
  bold,
  medium,
  semiBold,
  extraBold,
  ...props
}) => {
  const fontFamily = extraBold
    ? fonts.extraBold
    : bold
    ? fonts.bold
    : semiBold
    ? fonts.semiBold
    : medium
    ? fonts.medium
    : fonts.regular;

  return (
    <RNText 
      style={[{fontFamily}, style]} 
      {...props}
    />
  );
};