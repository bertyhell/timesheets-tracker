import React, { type FC, type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

const PageHeader: FC<PageHeaderProps> = ({ title, description, children }: PageHeaderProps) => {
  return (
    <div className="m-page-header">
      <div className="flex flex-col max-w-screen-md">
        <h2>{title}</h2>
        {description && (
          <p className="text-gray-500" style={{ fontSize: '0.9em' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
