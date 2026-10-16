export interface ProfileLink {
  readonly label: string;
  readonly href: string;
}

export const profile = {
  name: 'Rudolf J',
  domain: 'rudolfjs.id.au',
  links: [
    { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=ExTefW8AAAAJ&hl=en' },
    { label: 'ORCID', href: 'https://orcid.org/0000-0001-5129-5601' },
    { label: 'GitHub', href: 'https://github.com/rudolfjs' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rudolfj/' },
    { label: 'Bluesky', href: 'https://bsky.app/profile/rudolfj.bsky.social' },
    { label: 'Email', href: 'mailto:r.schnetler@uq.edu.au' },
  ],
} as const satisfies {
  name: string;
  domain: string;
  links: readonly ProfileLink[];
};
