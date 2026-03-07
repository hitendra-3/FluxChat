'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

function AvatarRoot({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  )
}

export interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  userId?: string;
  username?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
}

function Avatar({ userId, username, avatar, size = 'md', className, ...props }: AvatarProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const fallbackText = username ? username.slice(0, 2).toUpperCase() : '??';

  return (
    <AvatarRoot className={cn(sizeClass, className)} {...props}>
      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar || userId || username || 'default'}`} alt={username || 'avatar'} />
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </AvatarRoot>
  )
}

export { Avatar, AvatarRoot as AvatarPrimitive, AvatarImage, AvatarFallback }
