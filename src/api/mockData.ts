import {
  User,
  AdminUser,
  Enquiry,
  AboutUs,
  DashboardStats,
  AdminStats,
  EnquiryStats,
  PrivacyPolicy
} from './types';

// Mock User Data
export const mockUser: User = {
  id: '1',
  username: 'admin',
  email: 'admin@gmail.com',
  role: 'super_admin',
  profilePic: '/logo.svg',
  firstName: 'Admin',
  lastName: 'User',
  phone: '+1234567890',
  location: 'New York, USA',
  isActive: true,
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock Admin Users
export const mockAdmins: AdminUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@gmail.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'super_admin',
    phone: '+1234567890',
    location: 'New York, USA',
    bio: 'System Administrator',
    profilePic: '/logo.svg',
    isActive: true,
    twoFactorEnabled: false,
    permissions: ['all'],
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'manager',
    email: 'manager@example.com',
    firstName: 'John',
    lastName: 'Manager',
    role: 'admin',
    phone: '+1234567891',
    location: 'Los Angeles, USA',
    bio: 'Content Manager',
    profilePic: '/logo.svg',
    isActive: true,
    twoFactorEnabled: true,
    permissions: ['products', 'content'],
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Mock Products (using the Product type from productService)
export const mockProducts: Array<{
  _id: string;
  name: string;
  category: string;
  status: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  images: string[];
  isPublished: boolean;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
}> = [
    {
      _id: '1',
      name: 'Product 1',
      category: 'Category A',
      status: 'active',
      shortDescription: 'Short description for Product 1',
      fullDescription: 'This is a full description for Product 1. It includes all the details about the product.',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      images: ['/placeholder.svg'],
      isPublished: true,
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      name: 'Product 2',
      category: 'Category B',
      status: 'active',
      shortDescription: 'Short description for Product 2',
      fullDescription: 'This is a full description for Product 2. It includes all the details about the product.',
      features: ['Feature A', 'Feature B'],
      images: ['/placeholder.svg'],
      isPublished: true,
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '3',
      name: 'Product 3',
      category: 'Category A',
      status: 'inactive',
      shortDescription: 'Short description for Product 3',
      fullDescription: 'This is a full description for Product 3. It includes all the details about the product.',
      features: ['Feature X', 'Feature Y', 'Feature Z'],
      images: ['/placeholder.svg'],
      isPublished: false,
      lastModified: new Date(Date.now() - 172800000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

// Mock Enquiries
export const mockEnquiries: Enquiry[] = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    subject: 'Product Inquiry',
    inquiryCategory: 'Product',
    message: 'I would like to know more about your products.',
    status: 'new',
    isStarred: false,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    subject: 'Support Request',
    inquiryCategory: 'Support',
    message: 'I need help with my order.',
    status: 'in-progress',
    isStarred: true,
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0',
    adminNotes: 'Customer needs assistance with shipping.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    fullName: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '+1234567892',
    subject: 'General Question',
    inquiryCategory: 'General',
    message: 'What are your business hours?',
    status: 'replied',
    isStarred: false,
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0',
    repliedAt: new Date(Date.now() - 7200000).toISOString(),
    replies: [
      {
        adminName: 'Admin User',
        adminEmail: 'admin@gmail.com',
        replyMessage: 'Our business hours are Monday to Friday, 9 AM to 5 PM.',
        repliedAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Mock About Us
export const mockAboutUs: AboutUs = {
  _id: '1',
  mainTitle: 'About Our Company',
  mainDescription: 'We are a leading company in our industry, dedicated to providing the best products and services.',
  mainImage: '/placeholder.svg',
  sections: [
    {
      _id: '1',
      title: 'Our Mission',
      content: 'To provide exceptional products and services that exceed customer expectations.',
      image: '/placeholder.svg',
      order: 1,
    },
    {
      _id: '2',
      title: 'Our Vision',
      content: 'To be the most trusted and innovative company in our industry.',
      image: '/placeholder.svg',
      order: 2,
    },
  ],
  teamMembers: [
    {
      _id: '1',
      name: 'John Doe',
      position: 'CEO',
      bio: 'John has over 20 years of experience in the industry.',
      email: 'john@example.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
      image: '/placeholder.svg',
      order: 1,
    },
    {
      _id: '2',
      name: 'Jane Smith',
      position: 'CTO',
      bio: 'Jane is a technology expert with a passion for innovation.',
      email: 'jane@example.com',
      linkedin: 'https://linkedin.com/in/janesmith',
      image: '/placeholder.svg',
      order: 2,
    },
  ],
};

// Mock Dashboard Data (matching DashboardData structure)
export const mockDashboardData = {
  stats: {
    totalPages: 6,
    totalProducts: 3,
    publishedProducts: 2,
    draftProducts: 1,
    totalEnquiries: 25,
    newEnquiriesThisWeek: 8,
    activeUsers: 1234,
    userGrowthThisMonth: 8,
  },
  productStats: {
    total: 3,
    published: 2,
    draft: 1,
    archived: 0,
  },
  recentActivity: [
    {
      action: 'Product Created',
      page: 'Product 1',
      time: new Date().toISOString(),
      type: 'edit',
    },
    {
      action: 'Enquiry Replied',
      page: 'Enquiry #2',
      time: new Date(Date.now() - 3600000).toISOString(),
      type: 'reply',
    },
    {
      action: 'Campaign Started',
      page: 'Welcome Campaign',
      time: new Date(Date.now() - 7200000).toISOString(),
      type: 'campaign',
    },
  ],
  recentProducts: {
    products: [
      {
        _id: '1',
        name: 'Product 1',
        status: 'active',
        isPublished: true,
        updatedAt: new Date().toISOString(),
      },
      {
        _id: '2',
        name: 'Product 2',
        status: 'active',
        isPublished: true,
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    count: 2,
  },
  systemHealth: {
    database: {
      status: 'healthy',
      message: 'Database connected',
    },
    products: {
      status: 'healthy',
      message: '3 products, 2 published',
      total: 3,
      published: 2,
    },
    pages: {
      status: 'healthy',
      message: '3 pages configured, 3 FAQs',
      pages: 3,
      faqs: 3,
    },
    overall: true,
  },
};

// Mock Admin Status
export const mockAdminStats: AdminStats = {
  total: 2,
  superAdmins: 1,
  admins: 1,
  active: 2,
  inactive: 0,
  online: 1,
};

// Mock Enquiry Status
export const mockEnquiryStats: EnquiryStats = {
  total: 25,
  new: 5,
  inProgress: 8,
  replied: 10,
  closed: 2,
  starred: 3,
};

// Mock Privacy Policy
export const mockPrivacyPolicy: PrivacyPolicy = {
  _id: '1',
  title: 'Privacy Policy',
  policyDescription: 'This is our privacy policy. We are committed to protecting your personal information and privacy.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock FAQs (using the FAQ type from faqService)
export const mockFAQs: Array<{
  _id: string;
  question: string;
  answer: string;
  status: 'Draft' | 'Published';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}> = [
    {
      _id: '1',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy on all products.',
      status: 'Published',
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      question: 'How do I track my order?',
      answer: 'You can track your order using the tracking number provided in your confirmation email.',
      status: 'Published',
      isPublished: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '3',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards and bank transfers.',
      status: 'Published',
      isPublished: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

// Helper function to simulate delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate ID
export const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper function to paginate array
export const paginate = <T>(array: T[], page: number = 1, limit: number = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = array.slice(startIndex, endIndex);
  const totalPages = Math.ceil(array.length / limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Helper function to filter array
export const filterArray = <T>(array: T[], filters: Record<string, any>) => {
  return array.filter(item => {
    return Object.keys(filters).every(key => {
      const filterValue = filters[key];
      if (filterValue === undefined || filterValue === null || filterValue === '') {
        return true;
      }

      const itemValue = (item as any)[key];
      if (typeof filterValue === 'string') {
        return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
      }
      return itemValue === filterValue;
    });
  });
};

// Mock Status Status
export const allStatus = [
  { name: "All Status", value: "all" },
  { name: "Rejected", value: "reject" },
  { name: "Resolved", value: "resolved" },
  { name: "Closed", value: "closed" },
];

// Mock Category Status
export const allCategories = [
  { name: "All Categories", value: "all" },
  { name: "Casual dating", value: "Casual dating" },
  { name: "Serious relationship", value: "Serious relationship" },
  { name: "Marriage", value: "Marriage" },
  { name: "Friendship", value: "Friendship" },
  { name: "Partnership", value: "Partnership" },
  { name: "Other", value: "Other" },
];

// Mock Old/New Status
export const oldNewQue = [
  { name: "Newest First", value: "desc" },
  { name: "Oldest First", value: "asc" },
];

export const statusList = [
  { name: "All Statuses", value: "all" },
  { name: "Active", value: "active" },
  { name: "Paused", value: "paused" },
  { name: "Deleted", value: "deleted" },
  { name: "Pending", value: "pending" },
  { name: "Mobile Verification Pending", value: "mobile_verification_pending" },
  { name: "Mobile Verified", value: "mobile_verified" },
  { name: "Basic Info Collected", value: "basic_info_collected" },
  { name: "Email Verified", value: "email_verified" },
  { name: "Face Verified", value: "face_verified" },
  { name: "Completed", value: "completed" },
];

export const genderList = [
  { name: "All Genders", value: "all" },
  { name: "Male", value: "m" },
  { name: "Female", value: "f" },
  { name: "Other", value: "o" },
];

// Table Configuration
export const tableConfig = [
  { label: "Name", sortKey: "firstName" },
  { label: "Status", sortKey: "accountCurrentStatus" },
  { label: "Contact No.", sortKey: "phone" },
  { label: "Email", sortKey: "email" },
  { label: "Account Status", sortKey: "accountStatusName" },
  { label: "Gender", sortKey: "gender" },
  { label: "Paused", sortKey: "isAccountPaused" },
  { label: "Actions", sortKey: null },
];

export const faceStatusList = [
  { name: "All statuses", value: "all" },
  { name: "Success", value: "Success" },
  { name: "Failed", value: "Failed" },
  { name: "Processing", value: "Processing" },
];

export const roleList = [
  { name: "All Roles", value: "all" },
  { name: "Admin", value: "admin" },
  { name: "Super Admin", value: "super_admin" },
];

export const activeList = [
  { name: "All Status", value: "all" },
  { name: "Active", value: "active" },
  { name: "Inactive", value: "inactive" },
];

export const faceVerifyList = [
  "ID", 
  "User",
  "Status",
  "Retry Count",
  "Overall Score",
  "Confidence",
  "Created Date",
  "Actions",
];
