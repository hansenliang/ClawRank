import type { ReactNode } from 'react';

type TextBoxVariant = 'block' | 'inline';

type TextBoxProps = {
  children: ReactNode;
  variant?: TextBoxVariant;
  className?: string;
};

export function TextBox({ children, variant = 'block', className }: TextBoxProps) {
  const baseClass = variant === 'inline' ? 'inline-code' : 'codeblock';
  const mergedClassName = className ? `${baseClass} ${className}` : baseClass;

  if (variant === 'inline') {
    return <code className={mergedClassName}>{children}</code>;
  }

  return <div className={mergedClassName}>{children}</div>;
}
