'use client';

import { useState } from 'react';
import Image from 'next/image';

interface RemoteImageProps {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallbackClassName?: string;
  fallbackIconClassName?: string;
}

export function RemoteImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
  fallbackClassName,
  fallbackIconClassName,
}: RemoteImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={fallbackClassName || 'flex items-center justify-center h-full w-full bg-gradient-to-br from-brand-50 to-brand-100 dark:from-slate-700 dark:to-slate-800'}>
        <span className={fallbackIconClassName || 'text-4xl'}>📰</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}