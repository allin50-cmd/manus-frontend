import { HTMLAttributes } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`} {...props}>{children}</div>;
}
export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pb-3 ${className}`} {...props}>{children}</div>;
}
export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-lg font-semibold text-[#1A1A1A] ${className}`} {...props}>{children}</h3>;
}
export function CardDescription({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`} {...props}>{children}</p>;
}
export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>;
}
