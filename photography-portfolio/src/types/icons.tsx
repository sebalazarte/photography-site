import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

export const OriginIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M6 4l5.5 13 1.5-5 5 1.8L6 4z" fill="currentColor" stroke="none" />
    <path d="M13 12l4 4" />
  </svg>
);

export const TargetIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
  </svg>
);

export const AssignIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M9 12.5l2 2 4-4.5" />
  </svg>
);

export const TrashIcon = ({ width = 18, height = 18, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M5 7h14M10 11v6M14 11v6M7 7l1 12h8l1-12M9 7V5h6v2" />
  </svg>
);

export const SendHomeIcon = ({ width = 18, height = 18, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
    strokeLinecap="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5z" />
  </svg>
);

export const BroomIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 15l6 6" />
    <path d="M4 14l8-8 3 3-8 8H4z" />
    <path d="M15 5l4-4" />
  </svg>
);

export const ReorderIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M7 7h10M7 12h10M7 17h10" />
    <path d="M5 7l-2 2 2 2M19 17l2-2-2-2" />
  </svg>
);

export const EditIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 17.5V21h3.5L20 7.5l-3.5-3.5L3 17.5z" />
    <path d="M15.5 4.5l4 4" />
  </svg>
);

export const SparklesIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13 10.8 9.2 7 8l3.8-1.2z" />
    <path d="M5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8z" />
    <path d="M18 14l.9 2.5L22 17l-3.1.5L18 20l-.9-2.5L14 17l3.1-.5z" />
  </svg>
);

export const PhotoSwapIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 7h10l4 4v10H4z" />
    <path d="M4 15l3-3 2 2 3-3 4 4" />
    <path d="M16 7V3H6" />
    <path d="M10 3L6 7" />
  </svg>
);

export const PhotoRemoveIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 7h10l4 4v10H4z" />
    <path d="M4 15l3-3 2 2 3-3 4 4" />
    <path d="M8 8l8 8" />
  </svg>
);

export const SelectPhotosIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 15l3-3 2 2 3-3 4 4" />
    <path d="M7 8h4" />
  </svg>
);

export const FolderAddIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
    <path d="M12 10v6" />
    <path d="M9 13h6" />
  </svg>
);

export const RefreshIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-3.5-7.2" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const PersonAddIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21c0-3.314 2.686-6 6-6" />
    <path d="M15 11h6" />
    <path d="M18 8v6" />
  </svg>
);

export const HomeIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 12l8-7 8 7" />
    <path d="M5 11v9h4v-5h6v5h4v-9" />
  </svg>
);

export const GalleryIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
    <path d="M7 15l3-3 2 2 3-3 4 4" />
  </svg>
);

export const UsersIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M9 7a4 4 0 1 1 6 3.465" />
    <path d="M3 21c0-3.314 2.686-6 6-6h6" />
    <path d="M16 15c2.5 0 5 1.5 5 4" />
    <path d="M13 10a4 4 0 0 1-6 3" />
  </svg>
);

export const SiteDataIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.1l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V1a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .69.28 1.35.77 1.83.49.48 1.14.77 1.83.77H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const PasswordIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 12l2-2 2 2 2-2 2 2" />
    <path d="M14 7a4 4 0 1 1 6 3" />
    <path d="M12 12l3 3" />
    <path d="M11 17l4 4 4-4" />
  </svg>
);

export const LogoutIcon = ({ width = 16, height = 16, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M11 12h10" />
  </svg>
);

export const SuccessIcon = ({ width = 18, height = 18, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const ErrorIcon = ({ width = 18, height = 18, ...props }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
