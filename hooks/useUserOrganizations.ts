import { useState, useEffect, useCallback } from 'react'
import ApiService from '@/api/apiConfig'
import { useAuth } from '@/contexts/auth-context'

interface Organization {
  organizationId: string;
  organizationName: string;
  description: string;
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  stateProvince?: string | null;
  organizationType?: string | null;
  supportingDocuments?: string[];
  logo?: string | null;
  cancellationReason?: string | null;
  status?: string;
  isEnabled?: boolean;
  members?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  users?: any[];
}

interface UseUserOrganizationsReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserOrganizations = (): UseUserOrganizationsReturn => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Get userId from auth context
  const userId = user?.userId

  const fetchUserOrganizations = useCallback(async () => {
    if (!userId) {
      setOrganizations([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // First, display the user ID
      console.log("🔍 Current Logged-in User ID:", userId)
      
      // Use the correct API method to get organizations by user ID
      const response = await ApiService.getOrganizationsByUserId(userId)
      console.log("📋 Organization of current logged-in user:", response)
      
             // Handle the new response format with success and data fields
       if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
         const responseData = response.data;
         console.log("Response data type:", typeof responseData, "Is array:", Array.isArray(responseData))
         
         // If response.data is an array, handle multiple organizations
         if (Array.isArray(responseData)) {
           const filteredOrgs = responseData.filter((org: any) => org.organizationName !== 'Independent');
           setOrganizations(filteredOrgs)
           console.log("Multiple organizations assigned to user:", filteredOrgs)
         } 
         // If response.data is a single organization object (this is your case)
         else if (typeof responseData === 'object' && responseData !== null) {
           const org = responseData as any;
           console.log("Single organization found:", org.organizationName)
           
           if (org.organizationName !== 'Independent') {
             setOrganizations([org])
             console.log("✅ Single organization assigned to user:", org)
           } else {
             setOrganizations([])
             console.log("❌ Organization is Independent, not including in list")
           }
         } else {
           setOrganizations([])
           setError('Invalid organization data format')
           console.log("❌ Invalid organization data format")
         }
       } else {
         setOrganizations([])
         setError('No organizations found for this user.')
         console.log("❌ No organizations found or invalid response format")
       }
    } catch (error) {
      setOrganizations([])
      setError('Failed to fetch user organizations')
      console.error('Error fetching user organizations:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUserOrganizations()
    } else {
      // Clear organizations when user is not logged in
      setOrganizations([])
      setError(null)
    }
  }, [userId, fetchUserOrganizations])

  const refetch = async () => {
    await fetchUserOrganizations()
  }

  return {
    organizations,
    loading,
    error,
    refetch
  }
}