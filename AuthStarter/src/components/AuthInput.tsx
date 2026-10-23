
import React from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';

type Props = TextInputProps & {
  label?: string;
};

export default function AuthInput({ label, ...props }: Props) {
  return (
    <TextInput
      {...props}
      accessibilityLabel={label ?? props.placeholder}
      style={[styles.input, props.style]}
      placeholderTextColor="#7b8494"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d8deea',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#172033',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
});
