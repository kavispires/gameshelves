import { HTMLAttributes, ReactNode } from 'react';

interface CardItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: ReactNode;
}

export const CardItem: React.FunctionComponent<CardItemProps> = ({ label, children, ...rest }) => {
  return (
    <div {...rest}>
      <span className="card-item-label">{label}</span>
      {children}
    </div>
  );
};
