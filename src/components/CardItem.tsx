import type { HTMLAttributes, ReactNode } from 'react';

interface CardItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: ReactNode;
}

export const CardItem: React.FunctionComponent<CardItemProps> = ({ label, children, ...rest }) => {
  return (
    <div {...rest}>
      <span className="block font-mono text-muted">{label}</span>
      {children}
    </div>
  );
};
