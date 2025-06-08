'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/session/utils.ts';

interface QuestionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default QuestionCard; 