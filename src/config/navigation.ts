export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Our Work', href: '/projects', emphasis: true },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const

export const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Projects', href: '/admin/projects', icon: 'FolderKanban' },
  { label: 'Categories', href: '/admin/categories', icon: 'Tags' },
  { label: 'Services', href: '/admin/services', icon: 'Wrench' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: 'Quote' },
  { label: 'Enquiries', href: '/admin/enquiries', icon: 'Inbox' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
] as const

export const PROJECT_TYPES = ['Residential', 'Commercial', 'Industrial', 'Other'] as const
