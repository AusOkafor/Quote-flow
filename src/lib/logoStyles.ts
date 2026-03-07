/**
 * Consistent logo sizing across the app.
 * Key: fixed height, auto width, objectFit contain.
 */
export const logoStyles = {
  /** Nav header (when user logo appears) */
  nav: {
    height: '32px',
    maxWidth: '120px',
    width: 'auto',
    objectFit: 'contain' as const,
  },
  /** Public quote page header */
  publicQuote: {
    height: '48px',
    maxWidth: '180px',
    width: 'auto',
    objectFit: 'contain' as const,
  },
  /** Quote PDF output */
  pdf: {
    height: '64px',
    maxWidth: '200px',
    width: 'auto',
    objectFit: 'contain' as const,
  },
  /** Email templates (backend) */
  email: {
    height: '40px',
    maxWidth: '150px',
    width: 'auto',
    objectFit: 'contain' as const,
  },
  /** Settings preview */
  settings: {
    height: '48px',
    maxWidth: '180px',
    width: 'auto',
    objectFit: 'contain' as const,
  },
} as const;
