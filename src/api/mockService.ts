import { ApiResponse } from './types';
import { API_CONFIG } from './config';
import {
  mockUser,
  mockAdmins,
  mockProducts,
  mockEnquiries,
  mockAboutUs,
  mockSiteSettings,
  mockDashboardData,
  mockAdminStats,
  mockEnquiryStats,
  mockPrivacyPolicy,
  mockFAQs,
  delay,
  generateId,
  paginate,
  filterArray,
} from './mockData';

// Check if we should use mock data.
// Default: false (use real backend). Enable by setting VITE_USE_MOCK_DATA=true in `.env`.
const USE_MOCK_DATA = (import.meta.env.VITE_USE_MOCK_DATA ?? 'false') === 'true';

export const shouldUseMockData = (): boolean => {
  return USE_MOCK_DATA;
};

export const getMockResponse = async <T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  params?: any
): Promise<ApiResponse<T> | null> => {
  if (!shouldUseMockData()) {
    return null;
  }

  // Normalize endpoint and extract query params
  let normalizedEndpoint = endpoint.replace(API_CONFIG.BASE_URL, '').replace(/^\/admin/, '');
  const urlParts = normalizedEndpoint.split('?');
  normalizedEndpoint = urlParts[0];
  
  // Never return mock data for roles, permissions, admin management, and auth endpoints - always use real APIs
  // Keep mock service for user/profile endpoints for testing
  const skipMockEndpoints = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/change-password',
    '/permissions',
    '/roles',
    '/admins',
    '/admin-management',
    '/roles/assign',
    '/permissions/assign',
    '/roles/create',
    '/permissions/create',
    '/roles/permissions',
    '/admins/',
  ];
  
  // Don't skip if it's an admin-profile endpoint - keep mock for testing
  // Check if it's a profile endpoint (with or without query params)
  const isAdminProfileEndpoint = normalizedEndpoint.includes('/admin-profile') || 
                                  normalizedEndpoint === '/admin-profile' ||
                                  normalizedEndpoint.startsWith('/admin-profile');
  
  const shouldSkip = !isAdminProfileEndpoint && skipMockEndpoints.some(skipEndpoint => 
    normalizedEndpoint.includes(skipEndpoint) || endpoint.includes(skipEndpoint)
  );
  
  if (shouldSkip) {
    return null; // Force real API call for roles, permissions, and admin management (but not admin-profile)
  }

  // Simulate network delay
  await delay(300);
  
  // Parse query parameters
  const queryParams: Record<string, string> = {};
  if (urlParts[1]) {
    urlParts[1].split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }
  
  // Merge with provided params
  const finalParams = { ...queryParams, ...params };
  
  // Convert string numbers to numbers
  if (finalParams.page) finalParams.page = parseInt(finalParams.page as string) || 1;
  if (finalParams.limit) finalParams.limit = parseInt(finalParams.limit as string) || 10;

  // Auth endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.AUTH.LOGIN) {
    if (method === 'POST') {
      const { email, password } = body || {};
      if (email === 'admin@gmail.com' && password === 'Admin@123') {
        return {
          success: true,
          data: {
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
            user: {
              id: mockUser.id,
              username: mockUser.username,
              email: mockUser.email,
              role: mockUser.role,
              profilePic: mockUser.profilePic,
              fullName: `${mockUser.firstName} ${mockUser.lastName}`,
              phone: mockUser.phone,
              address: mockUser.location,
            },
            requiresOTP: false,
          } as any,
          message: 'Login successful',
        };
      } else {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }
    }
  }

  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.AUTH.REFRESH) {
    return {
      success: true,
      data: {
        accessToken: 'mock-access-token-' + Date.now(),
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          profilePic: mockUser.profilePic,
          fullName: `${mockUser.firstName} ${mockUser.lastName}`,
          phone: mockUser.phone,
          address: mockUser.location,
        },
      } as any,
    };
  }

  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.AUTH.LOGOUT) {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.AUTH.VERIFY_2FA) {
    return {
      success: true,
      data: {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          profilePic: mockUser.profilePic,
          fullName: `${mockUser.firstName} ${mockUser.lastName}`,
          phone: mockUser.phone,
          address: mockUser.location,
        },
      } as any,
    };
  }

  // Admin Profile endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.ADMIN_PROFILE.PROFILE) {
    if (method === 'GET') {
      return {
        success: true,
        data: mockUser as any,
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      return {
        success: true,
        data: { ...mockUser, ...body } as any,
        message: 'Profile updated successfully',
      };
    }
  }

  // Products endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.PRODUCTS.LIST) {
    if (method === 'GET') {
      let filteredProducts = [...mockProducts];
      
      if (finalParams?.search) {
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(finalParams.search.toLowerCase()) ||
          p.shortDescription.toLowerCase().includes(finalParams.search.toLowerCase()) ||
          p.fullDescription.toLowerCase().includes(finalParams.search.toLowerCase())
        );
      }
      
      if (finalParams?.status) {
        filteredProducts = filteredProducts.filter(p => p.status === finalParams.status);
      }
      
      const result = paginate(filteredProducts, finalParams?.page || 1, finalParams?.limit || 10);
      return {
        success: true,
        data: {
          products: result.data,
          pagination: result.pagination,
        } as any,
      };
    }
    if (method === 'POST') {
      const newProduct = {
        _id: generateId(),
        ...body,
        status: body.status || 'active',
        isPublished: body.isPublished !== undefined ? body.isPublished : true,
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockProducts.push(newProduct);
      return {
        success: true,
        data: newProduct as any,
        message: 'Product created successfully',
      };
    }
  }

  if (normalizedEndpoint.match(/^\/products\/[^/]+$/)) {
    const id = normalizedEndpoint.split('/')[2];
    if (method === 'GET') {
      const product = mockProducts.find(p => p._id === id);
      if (product) {
        return {
          success: true,
          data: product as any,
        };
      }
    }
    if (method === 'PUT' || method === 'PATCH') {
      const index = mockProducts.findIndex(p => p._id === id);
      if (index !== -1) {
        mockProducts[index] = { 
          ...mockProducts[index], 
          ...body, 
          lastModified: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        };
        return {
          success: true,
          data: mockProducts[index] as any,
          message: 'Product updated successfully',
        };
      }
    }
    if (method === 'DELETE') {
      const index = mockProducts.findIndex(p => p._id === id);
      if (index !== -1) {
        mockProducts.splice(index, 1);
        return {
          success: true,
          message: 'Product deleted successfully',
        };
      }
    }
  }

  // Enquiries endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.ENQUIRIES.LIST) {
    if (method === 'GET') {
      let filteredEnquiries = [...mockEnquiries];
      
      if (finalParams?.search) {
        filteredEnquiries = filteredEnquiries.filter(e =>
          e.fullName.toLowerCase().includes(finalParams.search.toLowerCase()) ||
          e.email.toLowerCase().includes(finalParams.search.toLowerCase()) ||
          e.subject.toLowerCase().includes(finalParams.search.toLowerCase())
        );
      }
      
      if (finalParams?.status) {
        filteredEnquiries = filteredEnquiries.filter(e => e.status === finalParams.status);
      }
      
      const result = paginate(filteredEnquiries, finalParams?.page || 1, finalParams?.limit || 10);
      return {
        success: true,
        data: {
          enquiries: result.data,
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages,
          hasNextPage: result.pagination.hasNextPage,
          hasPrevPage: result.pagination.hasPrevPage,
        } as any,
      };
    }
    if (method === 'POST') {
      const newEnquiry = {
        id: generateId(),
        ...body,
        status: 'new',
        isStarred: false,
        ipAddress: '192.168.1.1',
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockEnquiries.push(newEnquiry);
      return {
        success: true,
        data: newEnquiry as any,
        message: 'Enquiry created successfully',
      };
    }
  }

  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.ENQUIRIES.STATS) {
    return {
      success: true,
      data: mockEnquiryStats as any,
    };
  }

  if (normalizedEndpoint.match(/^\/enquiries\/[^/]+$/)) {
    const id = normalizedEndpoint.split('/')[2];
    if (method === 'GET') {
      const enquiry = mockEnquiries.find(e => e.id === id);
      if (enquiry) {
        return {
          success: true,
          data: enquiry as any,
        };
      }
    }
    if (method === 'PUT' || method === 'PATCH') {
      const index = mockEnquiries.findIndex(e => e.id === id);
      if (index !== -1) {
        mockEnquiries[index] = { ...mockEnquiries[index], ...body, updatedAt: new Date().toISOString() };
        return {
          success: true,
          data: mockEnquiries[index] as any,
          message: 'Enquiry updated successfully',
        };
      }
    }
    if (method === 'DELETE') {
      const index = mockEnquiries.findIndex(e => e.id === id);
      if (index !== -1) {
        mockEnquiries.splice(index, 1);
        return {
          success: true,
          message: 'Enquiry deleted successfully',
        };
      }
    }
  }

  if (normalizedEndpoint.match(/^\/enquiries\/[^/]+\/reply$/)) {
    const id = normalizedEndpoint.split('/')[2];
    const index = mockEnquiries.findIndex(e => e.id === id);
    if (index !== -1) {
      const reply = {
        adminName: 'Admin User',
        adminEmail: 'admin@gmail.com',
        replyMessage: body.replyMessage,
        repliedAt: new Date().toISOString(),
      };
      mockEnquiries[index] = {
        ...mockEnquiries[index],
        status: 'replied',
        repliedAt: new Date().toISOString(),
        replies: [...(mockEnquiries[index].replies || []), reply],
      };
      return {
        success: true,
        message: 'Reply sent successfully',
      };
    }
  }

  // About Us endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.CONTENT.ABOUT_US) {
    if (method === 'GET') {
      return {
        success: true,
        data: mockAboutUs as any,
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      return {
        success: true,
        data: { ...mockAboutUs, ...body } as any,
        message: 'About Us updated successfully',
      };
    }
  }

  // Site Settings endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.SITE_SETTINGS.GET) {
    if (method === 'GET') {
      return {
        success: true,
        data: mockSiteSettings as any,
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      return {
        success: true,
        data: { ...mockSiteSettings, ...body, updatedAt: new Date().toISOString() } as any,
        message: 'Site settings updated successfully',
      };
    }
  }

  // Dashboard endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.DASHBOARD.MAIN) {
    return {
      success: true,
      data: mockDashboardData as any,
    };
  }
  
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.DASHBOARD.STATS) {
    return {
      success: true,
      data: mockDashboardData.stats as any,
    };
  }
  
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVITY) {
    return {
      success: true,
      data: mockDashboardData.recentActivity as any,
    };
  }

  // Admin Management endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.LIST) {
    if (method === 'GET') {
      const result = paginate(mockAdmins, finalParams?.page || 1, finalParams?.limit || 10);
      return {
        success: true,
        data: {
          data: result.data,
          pagination: result.pagination,
        } as any,
      };
    }
    if (method === 'POST') {
      const newAdmin = {
        id: generateId(),
        ...body,
        isActive: true,
        twoFactorEnabled: false,
        permissions: body.permissions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockAdmins.push(newAdmin);
      return {
        success: true,
        data: newAdmin as any,
        message: 'Admin created successfully',
      };
    }
  }

  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT.STATS) {
    return {
      success: true,
      data: mockAdminStats as any,
    };
  }

  if (normalizedEndpoint.match(/^\/admin-management\/[^/]+$/)) {
    const id = normalizedEndpoint.split('/')[2];
    if (method === 'GET') {
      const admin = mockAdmins.find(a => a.id === id);
      if (admin) {
        return {
          success: true,
          data: admin as any,
        };
      }
    }
    if (method === 'PUT' || method === 'PATCH') {
      const index = mockAdmins.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAdmins[index] = { ...mockAdmins[index], ...body, updatedAt: new Date().toISOString() };
        return {
          success: true,
          data: mockAdmins[index] as any,
          message: 'Admin updated successfully',
        };
      }
    }
    if (method === 'DELETE') {
      const index = mockAdmins.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAdmins.splice(index, 1);
        return {
          success: true,
          message: 'Admin deleted successfully',
        };
      }
    }
  }

  // Privacy Policy endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.CONTENT.PRIVACY_POLICY) {
    if (method === 'GET') {
      return {
        success: true,
        data: mockPrivacyPolicy as any,
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      return {
        success: true,
        data: { ...mockPrivacyPolicy, ...body, updatedAt: new Date().toISOString() } as any,
        message: 'Privacy policy updated successfully',
      };
    }
  }

  // FAQ endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.FAQS.LIST) {
    if (method === 'GET') {
      let filteredFAQs = [...mockFAQs];
      
      if (finalParams?.search) {
        filteredFAQs = filteredFAQs.filter(f =>
          f.question.toLowerCase().includes(finalParams.search.toLowerCase()) ||
          f.answer.toLowerCase().includes(finalParams.search.toLowerCase())
        );
      }
      
      const result = paginate(filteredFAQs, finalParams?.page || 1, finalParams?.limit || 10);
      return {
        success: true,
        data: {
          faqs: result.data,
          pagination: result.pagination,
        } as any,
      };
    }
    if (method === 'POST') {
      const newFAQ = {
        _id: generateId(),
        ...body,
        status: body.status || 'Published',
        isPublished: body.isPublished !== undefined ? body.isPublished : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockFAQs.push(newFAQ);
      return {
        success: true,
        data: newFAQ as any,
        message: 'FAQ created successfully',
      };
    }
  }

  if (normalizedEndpoint.match(/^\/faqs\/[^/]+$/)) {
    const id = normalizedEndpoint.split('/')[2];
    if (method === 'GET') {
      const faq = mockFAQs.find(f => f._id === id);
      if (faq) {
        return {
          success: true,
          data: faq as any,
        };
      }
    }
    if (method === 'PUT' || method === 'PATCH') {
      const index = mockFAQs.findIndex(f => f._id === id);
      if (index !== -1) {
        mockFAQs[index] = { ...mockFAQs[index], ...body, updatedAt: new Date().toISOString() };
        return {
          success: true,
          data: mockFAQs[index] as any,
          message: 'FAQ updated successfully',
        };
      }
    }
    if (method === 'DELETE') {
      const index = mockFAQs.findIndex(f => f._id === id);
      if (index !== -1) {
        mockFAQs.splice(index, 1);
        return {
          success: true,
          message: 'FAQ deleted successfully',
        };
      }
    }
  }

  if (normalizedEndpoint.match(/^\/faqs\/[^/]+\/status$/)) {
    const id = normalizedEndpoint.split('/')[2];
    const index = mockFAQs.findIndex(f => f._id === id);
    if (index !== -1) {
      mockFAQs[index] = { 
        ...mockFAQs[index], 
        status: body.status,
        isPublished: body.isPublished,
        updatedAt: new Date().toISOString() 
      };
      return {
        success: true,
        data: mockFAQs[index] as any,
        message: 'FAQ status updated successfully',
      };
    }
  }

  // Contact form endpoint
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.CONTACT.SUBMIT) {
    const newEnquiry = {
      id: generateId(),
      ...body,
      status: 'new',
      isStarred: false,
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockEnquiries.push(newEnquiry);
    return {
      success: true,
      message: 'Contact form submitted successfully',
    };
  }

  // Index Page endpoints
  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.INDEX_PAGE.MAIN) {
    if (method === 'GET') {
      return {
        success: true,
        data: {
          pageTitle: 'Welcome to Rhubaia',
          sections: [],
        } as any,
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      return {
        success: true,
        data: body as any,
        message: 'Index page updated successfully',
      };
    }
  }

  if (normalizedEndpoint === API_CONFIG.ENDPOINTS.INDEX_PAGE.SECTIONS) {
    if (method === 'GET') {
      return {
        success: true,
        data: [] as any,
      };
    }
    if (method === 'POST') {
      const newSection = {
        _id: generateId(),
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: newSection as any,
        message: 'Section created successfully',
      };
    }
  }

  if (normalizedEndpoint.match(/^\/index-page\/sections\/[^/]+$/)) {
    const id = normalizedEndpoint.split('/')[3];
    if (method === 'GET') {
      return {
        success: true,
        data: {
          _id: id,
          name: 'Sample Section',
          description: 'Sample description',
          content: {
            title: 'Sample Title',
            subtitle: 'Sample Subtitle',
            description: 'Sample description',
            buttonText: 'Learn More',
            buttonLink: '/',
          },
          isActive: true,
          order: 1,
        } as any,
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      return {
        success: true,
        data: { _id: id, ...body } as any,
        message: 'Section updated successfully',
      };
    }
    if (method === 'DELETE') {
      return {
        success: true,
        message: 'Section deleted successfully',
      };
    }
  }

  // Default: return null to indicate mock data not available, use real API
  return null;
};

