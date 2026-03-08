export const messages = {
  // ─── TOASTS ───────────────────────────────────────────────
  toast: {
    // Quotes
    quoteCreated: 'Quote created successfully.',
    quoteUpdated: 'Quote updated successfully.',
    quoteDeleted: 'Quote deleted.',
    quoteSent: 'Quote sent successfully.',
    quoteDuplicated: 'Quote duplicated.',
    duplicatedAs: (quoteNumber: string) => `📋 Duplicated as ${quoteNumber}`,
    failedToDuplicate: 'Failed to duplicate',
    quoteDeletedShort: '🗑 Quote deleted',
    failedToDelete: 'Failed to delete quote',
    linkCopiedSuccess: '✅ Link copied to clipboard!',
    sentVia: (channel: string) => `✅ Sent via ${channel}`,
    markedAsPaid: '✓ Marked as paid',
    failedToMarkPaid: 'Failed to mark as paid',
    csvDownloading: '⬇ CSV downloading…',
    exportFailed: 'Export failed',
    templateSaved: '📄 Template saved!',
    linkCopied: 'Link copied to clipboard.',
    quoteAccepted: 'Quote accepted.',

    // Payments
    paymentReceived: 'Payment received successfully.',
    paymentFailed: 'Payment could not be processed. Please try again.',

    // Account & Settings
    profileUpdated: 'Profile updated successfully.',
    passwordChanged: 'Password changed successfully.',
    logoUploaded: 'Logo uploaded successfully.',
    settingsSaved: 'Settings saved.',

    // Team
    memberInvited: 'Team member invited successfully.',
    memberRemoved: 'Team member removed.',

    // Billing
    paymentSuccess: 'Payment successful! Your plan has been updated.',
    upgradedToPro: 'Your account has been upgraded to Pro.',
    upgradedToBusiness: 'Your account has been upgraded to Business.',
    subscriptionCancelled: 'Your subscription has been cancelled.',
    billingPortalFailed: 'Could not open billing portal',
    subscribeFirst: 'Subscribe to a plan first.',
    checkoutFailed: 'Could not start checkout',
    billingNotConfigured: 'Billing is not configured yet. Contact support to upgrade.',

    // Errors
    genericError: 'Something went wrong. Please try again.',
    networkError: 'Unable to connect. Please check your connection.',
    unauthorised: 'You are not authorised to perform this action.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    failedToSend: 'Failed to send',

    // PDF
    pdfGenerating: 'Generating PDF, please wait...',
    pdfReady: 'Your PDF is ready.',
    pdfFailed: 'Failed to generate PDF. Please try again.',

    // WhatsApp
    whatsappOpened: 'WhatsApp opened with your quote message.',
    paymentSuccessThankYou: 'Payment successful! Thank you.',
    quoteAcceptedNotify: '🎉 Quote accepted! The freelancer has been notified.',
    couldNotAccept: 'Could not accept quote. It may have already been accepted or expired.',
    signToAccept: 'Please type your full name to sign and accept this quote.',
  },

  // ─── FORM VALIDATION ──────────────────────────────────────
  validation: {
    required: 'This field is required.',
    invalidEmail: 'Please enter a valid email address.',
    invalidPhone: 'Please enter a valid phone number.',
    phoneRequiredWhatsApp: 'A phone number is required to send via WhatsApp.',
    quoteItemRequired: 'Please add at least one line item to the quote.',
    clientNameRequired: 'Client name is required.',
    clientEmailRequired: 'Client email is required.',
    titleRequired: 'Quote title is required.',
    amountInvalid: 'Please enter a valid amount.',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordMismatch: 'Passwords do not match.',
  },

  // ─── EMPTY STATES ─────────────────────────────────────────
  empty: {
    quotes: 'You have not created any quotes yet.',
    quotesSubtext: 'Create your first quote to get started.',
    noQuotesYet: 'No quotes yet.',
    noResults: 'No results for that search.',
    createOne: 'Create one',
    clients: 'No clients found.',
    payments: 'No payments recorded yet.',
    messages: 'No messages yet.',
    team: 'You have not added any team members.',
    notifications: 'You are all caught up.',
  },

  // ─── CONFIRM DIALOGS ──────────────────────────────────────
  confirm: {
    deleteQuote: 'Are you sure you want to delete this quote? This action cannot be undone.',
    cancelQuote: 'Are you sure you want to cancel this quote?',
    removeMember: 'Are you sure you want to remove this team member?',
    cancelSub: 'Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.',
  },

  // ─── LOADING STATES ───────────────────────────────────────
  loading: {
    default: 'Loading...',
    loadingQuote: 'Loading quote…',
    loadingQuotes: 'Loading quotes…',
    sending: 'Sending…',
    saving: 'Saving…',
    processing: 'Processing…',
    generatingPDF: 'Generating PDF…',
    redirecting: 'Redirecting…',
    uploading: 'Uploading…',
    opening: 'Opening…',
    accepting: 'Accepting…',
  },

  // ─── FREE TIER ────────────────────────────────────────────
  freeTier: {
    limitReached: 'You have reached the free tier limit of 3 quotes per month.',
    limitReachedTitle: 'Quote limit reached',
    limitReachedDesc: (limit: number) =>
      `You've used all ${limit} quotes included in your free plan this month. Creating or duplicating quotes is not available until next month, or you can upgrade now for unlimited quotes.`,
    proFeatureTitle: 'Pro feature',
    proFeatureDesc: 'View tracking and custom branding require a Pro plan. Upgrade to unlock these features.',
    goToSettings: 'Go to Settings',
    close: 'Close',
    upgradePrompt: 'Upgrade to Pro for unlimited quotes and advanced features.',
    ctaButton: 'Upgrade to Pro',
    quotesUsed: (used: number, limit: number) => `You've used ${used} of ${limit} quotes this month · No credit card required`,
  },

  // ─── SEND MODAL ────────────────────────────────────────────
  sendModal: {
    title: 'Send Quote',
    sub: 'Choose how to deliver this quote to your client.',
    emailLabel: 'Recipient Email',
    emailPlaceholder: 'client@example.com',
    whatsappLabel: 'WhatsApp Number',
    whatsappPlaceholder: '+1 (876) 555-0100',
    linkDescription: 'A shareable link will be generated and copied to your clipboard. Your client can open it in any browser — no sign-in required.',
    cancel: 'Cancel',
    sendVia: (channel: string) => `Send via ${channel} →`,
    link: 'Link',
    email: 'Email',
    whatsapp: 'WhatsApp',
  },

  // ─── WHATSAPP MESSAGE TEMPLATE ────────────────────────────
  whatsapp: {
    quoteMessage: (params: {
      clientName: string;
      quoteTitle: string;
      total: string;
      expiryDate: string;
      quoteURL: string;
    }) =>
      `Hi ${params.clientName},\n\n` +
      `I've sent you a quote for *${params.quoteTitle}*.\n\n` +
      `Total: *${params.total}*\n` +
      `Valid until: ${params.expiryDate}\n\n` +
      `View and accept your quote here:\n${params.quoteURL}\n\n` +
      `Let me know if you have any questions.`,
  },

  // ─── EMAIL SUBJECTS ───────────────────────────────────────
  email: {
    quoteSubject: (quoteNumber: string) => `Your Quote — ${quoteNumber}`,
    receiptSubject: (quoteNumber: string) => `Payment Receipt — ${quoteNumber}`,
    paymentNotification: (clientName: string) => `Payment Received from ${clientName}`,
    teamInvite: (businessName: string) => `You have been invited to join ${businessName} on QuoteFlow`,
  },

  // ─── PUBLIC QUOTE PAGE ────────────────────────────────────
  publicQuote: {
    acceptButton: 'Accept Quote',
    acceptedStatus: 'Quote Accepted',
    acceptedBanner: 'You have accepted this quote. The freelancer has been notified.',
    signaturePrompt: 'Sign your name to accept this quote.',
    signaturePlaceholder: 'e.g. Simone Richards',
    declineButton: 'Request Changes',
    payDepositButton: (amount: string) => `Pay Deposit — ${amount}`,
    payBalanceButton: (amount: string) => `Pay Balance — ${amount}`,
    payFullButton: (amount: string) => `Pay in Full — ${amount}`,
    depositPaidStatus: 'Deposit Paid',
    fullyPaidStatus: 'Fully Paid',
    paymentComplete: 'Payment complete',
    paymentThankYou: (amount: string, business: string) =>
      `Thank you. Your payment of ${amount} has been received by ${business}.`,
    balanceDue: (amount: string) => `Pay the remaining balance of ${amount} when work is complete.`,
    expiredStatus: 'This quote has expired.',
    expiredMessage: (date: string, business: string) =>
      `This quote expired on ${date}. Contact ${business} for a refreshed quote.`,
    downloadPDF: 'Download PDF',
    messagePlaceholder: 'Send a message or ask a question…',
    yourNamePlaceholder: 'Your name',
    sendMessage: 'Send Message',
    questionsNotes: 'Questions & Notes',
    requestChanges: 'Request Changes',
    changeRequestPrompt: 'Describe the changes you would like',
    changeRequestPlaceholder: 'e.g. Can we reduce the price for the logo design? Or extend the timeline by 1 week?',
    sendRequest: 'Send Request',
    messageSent: 'Message sent. The freelancer will be notified.',
    changeRequestSent: 'Change request sent. The freelancer will be notified and can update the quote.',
    couldNotSend: 'Could not send message. Please try again.',
    couldNotRequest: 'Could not send request. Please try again.',
    invalidLink: 'This quote link is invalid or has expired.',
    payManually: (business: string) =>
      `Prefer to pay by bank transfer or cash? Ask ${business} to mark as paid once received.`,
    paymentLinkFailed: 'Payment link failed. Please try again or pay manually.',
    payDepositOnly: 'Pay deposit only',
    payFullAmount: 'Pay full amount',
    acceptedTimeToPay: '✓ Quote accepted! Time to pay.',
    howMuchToPay: 'How much would you like to pay now?',
    payWithStripe: 'Pay with Stripe →',
    payWithPayPal: 'Pay with PayPal →',
    payWithWiPay: (currency: string) => `Pay with WiPay (${currency}) →`,
    payBalanceWithStripe: 'Pay balance with Stripe →',
    payBalanceWithPayPal: 'Pay balance with PayPal →',
    payBalanceWithWiPay: (currency: string) => `Pay balance with WiPay (${currency}) →`,
    signLabel: 'Sign with your full name',
    acceptButtonWithCheck: '✓ Accept this Quote',
    validFor: (days: number) => `Valid for ${days} days`,
    signedBy: (name: string) => `Signed by ${name}`,
  },

  // ─── BILLING PANEL ────────────────────────────────────────
  billing: {
    title: 'Billing',
    sub: 'Manage your plan and payment method.',
    currentPlan: 'Current Plan',
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    businessFeatures: 'Everything in Pro + Team, API, White-label',
    proFeatures: 'Unlimited quotes · Full features',
    freeFeatures: ['3 quotes/month', 'Basic templates', 'WhatsApp sharing'],
    proFeatureList: ['Unlimited quotes', 'Priority support', 'Custom branding'],
    businessFeatureList: ['Everything in Pro', 'Team members (5)', 'API access', 'White-label'],
    manageBilling: 'Manage subscription & payment method',
    upgradePro: 'Upgrade to Pro — $15/month',
    upgradeBusiness: 'Upgrade to Business — $39/month',
    upgradeProDesc: 'Unlimited quotes, custom branding, view tracking, and more.',
    upgradeBusinessDesc: 'Team members and white-label quotes.',
    upgradeMonthly: 'Upgrade Monthly',
    upgradeAnnual: 'Upgrade Annual (save 20%)',
    securePayment: 'Secure payment via Stripe. Cancel anytime.',
    whiteLabelEnabled: 'White-label quotes enabled — QuoteFlow branding is hidden from your clients.',
    whiteLabelUpgrade: 'Upgrade to Business to remove QuoteFlow branding from your quotes, emails and PDFs.',
  },

  // ─── QUOTES PAGE ──────────────────────────────────────────
  quotesPage: {
    title: 'All Quotes',
    exportCsv: '↓ Export CSV',
    newQuote: '+ New Quote',
    searchPlaceholder: 'Search quotes or clients…',
  },

  // ─── CREATE QUOTE PAGE ─────────────────────────────────────
  createQuote: {
    editTitle: 'Edit Quote',
    newTitle: 'New Quote',
    cancel: 'Cancel',
    saveDraft: 'Save Draft',
    draftSaved: 'Draft saved',
    loadingQuote: 'Loading quote…',
    onlyDraftEditable: 'Only draft quotes can be edited.',
    quoteNotFound: 'Quote not found.',
    quoteUpdated: '✅ Quote updated!',
    quoteCreated: '✅ Quote created!',
    failedToSave: 'Failed to save quote',
    linkCopied: '🔗 Link copied!',
    quoteSentEmail: '✅ Quote sent via email!',
    failedToSend: 'Failed to send quote.',
    resendPrompt: (name: string) => `Quote updated. Re-send to ${name}?`,
    sendViaEmail: '📧 Send via Email',
    copyLink: '🔗 Copy Link',
    done: 'Done',
    steps: ['Client Info', 'Line Items', 'Terms & Notes', 'Review & Send'] as const,
    whoIsQuoteFor: 'Who is this quote for?',
    selectClientOrEnter: 'Select an existing client or enter details manually.',
    startFromTemplate: 'Start from Template',
    selectClient: 'Select Client',
    chooseClient: '— Choose client —',
    quoteTitle: 'Quote Title / Project',
    quoteTitlePlaceholder: 'Brand Identity Design — March 2026',
    currency: 'Currency',
    validityDays: 'Validity (days)',
    nextAddServices: 'Next: Add Services →',
    whatServices: 'What services are you quoting?',
    addLineItems: 'Add each service or deliverable as a line item.',
    back: '← Back',
    nextTerms: 'Next: Terms & Notes →',
    termsTitle: 'Terms & conditions',
    termsSub: 'Set payment terms, delivery, and extra options.',
    depositRequired: 'Deposit Required',
    paymentMethod: 'Payment Method',
    deliveryTimeline: 'Delivery Timeline',
    revisions: 'Revisions',
    notesScope: 'Notes / Scope',
    notesPlaceholder: 'Files delivered via Google Drive upon final payment.',
    gctExempt: 'GCT Exempt',
    gctExemptSub: 'No tax applied to this quote',
    requireSignature: 'Require Signature',
    requireSignatureSub: 'Client must sign to accept',
    trackViews: 'Track Views',
    trackViewsSub: (isPro: boolean) => (isPro ? 'Get notified when client opens' : 'Pro feature — Upgrade to enable'),
    sendReminder: 'Send Reminder',
    sendReminderSub: 'Auto-remind 3 days before expiry',
    nextReview: 'Next: Review & Send →',
    reviewSave: 'Review & Save',
    reviewSend: 'Review & Send',
    reviewChanges: 'Review your changes and save.',
    everythingLooksGood: 'Everything looks good? Send your quote.',
    quoteSummary: 'Quote Summary',
    client: 'Client',
    project: 'Project',
    subtotal: 'Subtotal',
    total: 'Total',
    deposit: 'Deposit',
    validForLabel: 'Valid For',
    days: 'days',
    saveChanges: 'Save Changes ✓',
    createQuote: 'Create Quote ✓',
    creating: 'Creating…',
    saving: 'Saving…',
  },
};
