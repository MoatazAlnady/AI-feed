import React from 'react';
import { cn } from '@/lib/utils';

export interface InputBaseProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function InputBase({ className, ...props }: InputBaseProps) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm transition",
        /* light */
        "bg-background border-input text-foreground placeholder:text-muted-foreground",
        /* dark */
        "dark:bg-muted dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
        className
      )}
    />
  );
}

export interface TextareaBaseProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function TextareaBase({ className, ...props }: TextareaBaseProps) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm transition min-h-[80px]",
        /* light */
        "bg-background border-input text-foreground placeholder:text-muted-foreground",
        /* dark */
        "dark:bg-muted dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
        className
      )}
    />
  );
}

export interface SelectBaseProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function SelectBase({ className, children, ...props }: SelectBaseProps) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm transition",
        /* light */
        "bg-background border-input text-foreground",
        /* dark */
        "dark:bg-muted dark:border-border dark:text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
        className
      )}
    >
      {children}
    </select>
  );
}