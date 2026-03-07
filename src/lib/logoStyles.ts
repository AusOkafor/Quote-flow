/**
 * Consistent logo sizing across the app.
 * Key: fixed height, auto width, objectFit contain.
 */
export const logoStyles = {
  /** Nav header (when user logo appears) */
  nav: {
    height: '36px',
    maxWidth: '140px',
    width: 'auto',
    objectFit: 'contain' as const,
    display: 'block' as const,
  },
  /** Public quote page header */
  publicQuote: {
    height: '90px',
    maxWidth: '260px',
    width: 'auto',
    objectFit: 'contain' as const,
    display: 'block' as const,
  },
  /** Quote PDF output */
  pdf: {
    height: '100px',
    maxWidth: '280px',
    width: 'auto',
    objectFit: 'contain' as const,
    display: 'block' as const,
  },
  /** Email templates (backend) */
  email: {
    height: '40px',
    maxWidth: '150px',
    width: 'auto',
    objectFit: 'contain' as const,
    display: 'block' as const,
  },
  /** Settings preview */
  settings: {
    height: '48px',
    maxWidth: '180px',
    width: 'auto',
    objectFit: 'contain' as const,
    display: 'block' as const,
  },
} as const;
