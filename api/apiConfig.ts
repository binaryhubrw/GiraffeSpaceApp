import axios, { AxiosRequestHeaders, AxiosProgressEvent } from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import type { User, UserResult, UserApiResponse } from "@/data/users";
import { StringToBoolean } from "class-variance-authority/types";
interface UserFormData {
  [key: string]: any;
}

interface DecodedToken extends JwtPayload {
  role?: string;
}
/***** some change*** */
interface Organization {
  organizationName: string;
  organizationType: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  stateProvince: string;

}

class ApiService {

  /***** base url** */
  static BASE_URL: string = "https://giraffespacev2.onrender.com/api/v1";

  static cache: Record<string, any> = {}; // Ensure this line is present
  static lastFetch: Record<string, number> = {};

  static getHeader(data?: any): Record<string, string> {
    const token = localStorage.getItem("token");
    const isFormData =
      typeof FormData !== "undefined" && data instanceof FormData;

    return {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
    };
  }

  /** Register a new user */
  static async registerUser(formData: UserFormData): Promise<UserApiResponse> {
    // console.log("hdtdrwywywuwuwiwqq");
    try {
      // console.log("in try brock");
      const response = await axios.post(
        `${this.BASE_URL}/users/auth/register`,
        formData,
        {
          headers: this.getHeader(formData),
          withCredentials: true, // Enable credentials
        }
      );
      // console.log("hdtdrwywywuwuwiwqq");
      // console.log("response", response.data);
      return response.data;
    } catch (error) {
      console.error("Error signup:", error);
      throw error;
    }
  }

  /** Reset defaultPassword user */
  static async resetDefaultPassword(
    formData: UserFormData
  ): Promise<UserApiResponse> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/users/auth/reset`,
        formData,
        {
          headers: this.getHeader(formData),
          withCredentials: true, // Enable credentials
        }
      );
      console.log("response", response.data);
      return response.data;
    } catch (error) {
      console.error("Error Reset defaultPassword:", error);
      throw error;
    }
  }

  /** Login a registered user */
  static async loginUser(formData: UserFormData): Promise<UserApiResponse> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/users/auth/login`,
        formData,
        {
          headers: this.getHeader(formData),
          withCredentials: true, // Enable credentials
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  /** Login with default password (special endpoint) */
  static async loginUserDefaultPassword(
    formData: UserFormData
  ): Promise<{ success: boolean; token?: string; resetToken?: string }> {
    console.log("hdtdrwywywuwuwiwqq");
    try {
      console.log("in try block");
      const response = await axios.post(
        `${this.BASE_URL}/users/auth/login`,
        formData,
        {
          headers: this.getHeader(formData),
          withCredentials: true, // Enable credentials
        }
      );
      console.log("response", response.data);
      return {
        success: response.data.success,
        token: response.data.token,
        resetToken: response.data.resetToken,
      };
    } catch (error) {
      console.error("Error logging in with default password:", error);
      return { success: false };
    }
  }

  /** Get all users */
  static async getAllUser(): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/users`, {
        headers: this.getHeader(),
        withCredentials: true, // Enable credentials
      });

      return response.data;
    } catch (error) {
      console.error("Error get all user:", error);
      throw error;
    }
  }

  /** Reset defaultPassword user */
  static async forgetPassword(
    formData: UserFormData
  ): Promise<UserApiResponse> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/users/auth/forgot`,
        formData,
        {
          headers: this.getHeader(formData),
          withCredentials: true, // Enable credentials
        }
      );
      console.log("response", response.data);
      return response.data;
    } catch (error) {
      console.error("Error Reset defaultPassword:", error);
      throw error;
    }
  }

  /** Get user by ID */
  static async getUserById(userId: string): Promise<UserApiResponse> {
    try {
      const response = await axios.get(`${this.BASE_URL}/users/${userId}`, {
        headers: this.getHeader(),
        withCredentials: true, // Enable credentials
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error);
      throw error;
    }
  }

  /** Update user by ID */
  static async updateUserById(
    userId: string,
    updatedData: UserFormData
  ): Promise<UserApiResponse> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/users/${userId}`,
        updatedData,
        {
          headers: this.getHeader(updatedData),
          withCredentials: true, // Enable credentials
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${userId}:`, error);
      throw error;
    }
  }

  /** Delete user */
  static async deleteUser(userId: string): Promise<UserApiResponse> {
    try {
      const response = await axios.delete(`${this.BASE_URL}/users/${userId}`, {
        headers: this.getHeader(),
        withCredentials: true, // Enable credentials
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with ID ${userId}:`, error);
      throw error;
    }
  }

  // **** NEW: Fetch formatted payments for a manager ****
  static async getFormattedManagerPayments(managerId: string): Promise<any> {
    console.log(`getFormattedManagerPayments called for managerId: ${managerId}`);
    const cacheDuration = 10000; // 10 seconds
    const now = Date.now();

    if (
      this.cache[managerId] &&
      this.lastFetch[managerId] &&
      now - this.lastFetch[managerId] < cacheDuration
    ) {
      console.log(`Returning cached data for manager ${managerId}`);
      return this.cache[managerId];
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }
      const response = await axios.get(
        `${this.BASE_URL}/venue-bookings/payments/manager/${managerId}/formatted`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      this.cache[managerId] = response.data;
      this.lastFetch[managerId] = now;
      return response.data;
    } catch (error) {
      console.error(`Error fetching formatted manager payments for ID ${managerId}:`, error);
      throw error;
    }
  }


  //**** ORGANIZATION ROUTE *** */

  /** Add a new organization */
  static async addOrganization(orgData: any): Promise<any> {
    try {
      const requestData = { organizations: [orgData] }; // Try with organizations field

      const response = await axios.post(
        `${this.BASE_URL}/organizations/bulk`,
        requestData,
        {
          headers: this.getHeader(orgData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding organization:", error);
      throw error;
    }
  }
  static async getAllOrganization(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/organizations/all`,

        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding organization:", error);
      throw error;
    }
  }
  static async getOrganizationById(orgId: string): Promise<any> {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return {
          success: false,
          error: 'Authentication token not found'
        };
      }

      console.log('Fetching organization with ID:', orgId);
      
      // Make direct request to the single organization endpoint
      const response = await axios.get(
        `${this.BASE_URL}/organizations/${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      console.log('API Response:', response.data);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Organization not found'
      };
    } catch (error: any) {
      console.error("Error fetching organization:", error.response || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch organization'
      };
    }
  }
  static async updateOrganizationById(
    orgId: string,
    orgData: any
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/organizations/${orgId}`,
        orgData,
        {
          headers: this.getHeader(orgData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding organization:", error);
      throw error;
    }
  }

  /** get venue by organization Id */
  static async getVenueByOrganizationId(orgId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/organizations/${orgId}/venues`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching venues for organization with ID ${orgId}:`,
        error
      );
      throw error;
    }
  }

  /** Delete organization */
  static async deleteOrganization(orgId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.BASE_URL}/organizations/${orgId}`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting organization with ID ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Send a query to an organization (e.g., request more info or document)
   * @param organizationId The ID of the organization
   * @param reason The reason for the query
   */
  static async queryOrganization(organizationId: string, reason: string): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.BASE_URL}/organizations/${organizationId}/query`,
        { reason },
        {
          headers: this.getHeader({ reason }),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error querying organization with ID ${organizationId}:`, error);
      throw error;
    }
  }

  //**** RESOURCE ROUTE *** */

  /** Get all resources */
  static async getAllResource(): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/resources/find-all`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  }

  /** Add a new resource */
  static async addResource(resourceData: {
    resourceName: string;
    description: string;
    costPerUnit: number;
    quantity: number;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/resources/create-resource`,
        resourceData,
        {
          headers: this.getHeader(resourceData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding resource:", error);
      throw error;
    }
  }

  /** Get resource by ID */
  static async getResourceById(resourceId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/resources/find-one/${resourceId}`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching resource with ID ${resourceId}:`, error);
      throw error;
    }
  }

  /** Update resource by ID */
  static async updateResourceById(
    resourceId: string,
    resourceData: any
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/resources/update-resource/${resourceId}`,
        resourceData,
        {
          headers: this.getHeader(resourceData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating resource with ID ${resourceId}:`, error);
      throw error;
    }
  }

  /** Delete resource */
  static async deleteResource(resourceId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.BASE_URL}/resources/delete-resource/${resourceId}`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting resource with ID ${resourceId}:`, error);
      throw error;
    }
  }

  

  /** Add user to organization */
  static async addUserToOrganization(
    userId: string,
    orgId: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/organizations/${orgId}/users`,
        { userId },
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error adding user with ID ${userId} to organization with ID ${orgId}:`,
        error
      );
      throw error;
    }
  }





  /**** VENUES   **** */

  /** add venue to organization */

  static async addVenueToOrganization(
    orgId: string,
    venueIds: string | string[]
  ): Promise<any> {
    try {
      // Normalize to array
      const idsArray = Array.isArray(venueIds) ? venueIds : [venueIds];

      const response = await axios.post(
        `${this.BASE_URL}/organizations/${orgId}/venues`,
        { venueIds: idsArray },
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error adding venue(s) to organization with ID ${orgId}:`,
        error
      );
      throw error;
    }
  }

  /** Get all venues by organizationId */
  static async getVenuesByOrganizationId(orgId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/organizations/${orgId}/venues`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching venues for organization with ID ${orgId}:`,
        error
      );
      throw error;
    }
  }

  /** remove venue from organization */
  static async removeVenueFromOrganization(
    orgId: string,
    venueIds: string | string[]
  ): Promise<any> {
    try {
      // Normalize to array
      const idsArray = Array.isArray(venueIds) ? venueIds : [venueIds];
      const response = await axios.post(
        `${this.BASE_URL}/organizations/${orgId}/venues`,
        { venueIds: idsArray },
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error removing venue(s) from organization with ID ${orgId}:`,
        error
      );
      throw error;
    }
  }

  /** Create a new venue */
  static async createVenue(venueData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/venue/add`,
        venueData,
        {
          headers: this.getHeader(venueData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating venue:", error);
      throw error;
    }
  }
  /** Get all venues */
  static async getAllVenues(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/venue/public-venues/list`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching all venues:", error);
      throw error;
    }
  }

  /**** getAllVenueAdminOnly **** */
  static async getAllVenueAdminOnly(): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/venue/all`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all admin-only venues:", error);
      throw error;
    }
  }


  /** Get venue by ID */
  static async getVenueById(id: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/venue/${id}`, {
        headers: this.getHeader(), // Use your standard headers
        withCredentials: true, // Include credentials if needed
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching venue with ID ${id}:`, error);
      throw error;
    }
  }


 

  /** get venue by managerId*/
  static async getVenueByManagerId(managerId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/venue/managers/${managerId}/venues`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching venue with manager ID ${managerId}:`,
        error
      );
      throw error;
    }
  }

   /***** update main phote *****  */
  static async updateVenueMainPhoto(
    venueId: string,
    photoData: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.BASE_URL}/venue/${venueId}/main-photo`,
        photoData,
        {
          headers: this.getHeader(photoData),
          withCredentials: true,
          ...(onUploadProgress ? { onUploadProgress } : {}),
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating main photo for venue with ID ${venueId}:`, error);    
      throw error;
    } 
  }





  /*****Add image in garelyy *****  */
  static async addVenueGalleryImage(
    venueId: string,
    imageData: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/venue/${venueId}/photo-gallery`,
        imageData,
        {
          headers: this.getHeader(imageData),
          withCredentials: true,
          ...(onUploadProgress ? { onUploadProgress } : {}),
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding gallery image for venue with ID ${venueId}:`, error);
      throw error;
    }
  }



 /***** Remove image in garelly ***** */
 static async removeVenueGalleryImage(
  venueId: string,
  photoUrl: string
): Promise<any> {
  try {
    const response = await axios.delete(
      `${this.BASE_URL}/venue/${venueId}/photo-gallery`,
      {
        data: { photoUrl },
        headers: this.getHeader(photoUrl),
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error removing gallery image for venue with ID ${venueId}:`, error);
    throw error;
  }
}





  /** Update venue by ID */
  static async updateVenueDetailsById(venueId: string, data: any): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.BASE_URL}/venue/${venueId}`,
        {},
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating venue with ID ${venueId}:`, error);
      throw error;
    }
  }

  /** update venue manager */
  static async updateVenueManager(
    venueId: string,
    managerId: string
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/venue/updateVenueManager/${venueId}`,
        { managerId },
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating manager for venue with ID ${venueId}:`,
        error
      );
      throw error;
    }
  }

  /** Delete venue */
  static async deleteVenue(venueId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.BASE_URL}/venue/remove/${venueId}`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting venue with ID ${venueId}:`, error);
      throw error;
    }
  }

  /*add-venue-require-admin-but-manager-available */
  static async addVenueRequireAdminButManagerAvailable(
    venueData: any
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/venue/add`,
        venueData,
        {
          headers: this.getHeader(venueData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating venue:", error);
      throw error;
    }
  }

  /* get available venue with request params startDate,endDate,startTime,endTime */
  static async getAvailableVenues(
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string,
    organizationId?: string
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/venue/available-venues`,
        {
          params: {
            startDate,
            endDate,
            startTime,
            endTime,
            ...(organizationId ? { organizationId } : {}),
          },
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching available venues:", error);
      throw error;
    }
  }

  /** Aprove venue */
  static async approveVenueAdmin(venueId: string): Promise<any> {
   
  try {
    
    const token = localStorage.getItem("token");
    
    
    if (!token) {
      throw new Error("No token found. Please login again.");
    }

    const response = await axios.patch(
      `${this.BASE_URL}/venue/${venueId}/approve`,
      {}, // no request body needed
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true, // optional, use only if your backend needs cookies
      }
    );

      return response.data;
    } catch (error) {
      console.error(`Error approving venue with ID ${venueId}:`, error);
      throw error;
    }
  }


 


  /*** cancel venue */
  static async cancelVenueAproveAdmin(venueId: string, data: any): Promise<any> {
    try {
    
    const token = localStorage.getItem("token");
    
    
    if (!token) {
      throw new Error("No token found. Please login again.");
    }

    const response = await axios.patch(
      `${this.BASE_URL}/venue/${venueId}/reject`,
      data, //  request body needed
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true, // optional, use only if your backend needs cookies
      }
    );

      return response.data;
    } catch (error) {
    console.error(`Error canceling venue approval with ID ${venueId}:`, error);
      throw error;
    }
  }


  /*** add venue amenities** */

  static async addVenueAmenities(
    venueId: string,
    amenities: Array<{
      resourceName: string;
      quantity: number;
      amenitiesDescription: string;
      costPerUnit: string;
    }>
  ): Promise<any> {
    try {
      console.log("API: Sending amenities data:", JSON.stringify(amenities, null, 2));
      const response = await axios.post(
        `${this.BASE_URL}/venue/${venueId}/amenities`,
        amenities,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      console.log("API: Response received:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error adding amenities to venue with ID ${venueId}:`, error);
     
      throw error;
    }
  }


/*** update venue amenities**** */
  static async updateVenueAmenities(
    venueId: string,
    amenityId: string,
    amenityData: {
      resourceName: string;
      quantity: number;
      amenitiesDescription: string;
      costPerUnit: string;
    }
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/venue/${venueId}/amenities/${amenityId}`,
        amenityData,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating amenities for venue with ID ${venueId}:`, error);
      throw error;
    }
  }


  /**** remove venue amenity**** */
  static async removeVenueAmenity(
    venueId: string,
    amenityId: string
  ): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.BASE_URL}/venue/${venueId}/amenities/${amenityId}`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error removing amenity from venue with ID ${venueId}:`, error);
      throw error;
    }
  }


  /**** update booking condition**** */
  static async updateBookingCondition(
    bookingConditionId: string,
    venueId: string,
    conditionData: {
      descriptionCondition: string;
      notaBene: string;
      transitionTime: number;
      depositRequiredPercent: number;
      depositRequiredTime: number;
      paymentComplementTimeBeforeEvent: number;
    }
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/venue/${venueId}/booking-conditions/${bookingConditionId}`,
        conditionData,
        {
          headers: this.getHeader(conditionData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating booking condition for ID ${bookingConditionId}:`, error);
      throw error;
    }
  }


  /*** update venue variable*** */
  static async updateVenueVariable(
    venueId: string,
    variableId: string,
    variableData: {
      amount: string;
      managerId: string;
    }
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/venue/${venueId}/variables/${variableId}`,
        variableData,
        {
          headers: this.getHeader(variableData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating venue variable with ID ${variableId}:`, error);
      throw error;
    }
  }

 
  /***** update venue video tour******** */

  static async updateVenueVideoTour(
    venueId: string,
    videoData: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.BASE_URL}/venue/${venueId}/virtual-tour`,
        videoData,
        {
          headers: this.getHeader(videoData),
          withCredentials: true,
          ...(onUploadProgress ? { onUploadProgress } : {}),
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating video tour for venue with ID ${venueId}:`, error);
      throw error;
    }
  }




/********************************************** */


     /******************8 VENUE BOOKING   **************/

  /** get all booking */
  static async getAllBookingsByManager(managerId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/venue-bookings/manager/${managerId}`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all bookings by manager:", error);
      throw error;
    }
  }

  /*** get booking by bookingId**/
  static async getBookingById(bookingId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/venue-bookings/${bookingId}`,
        {
        headers: this.getHeader(),
        withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching booking with ID ${bookingId}:`, error);
      throw error;
    }
  }

  /** get booking by status**/
  static async getBookingByStatus(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/event-bookings/status/pending`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching bookings with status :`, error);
      throw error;
    }
  }

  /*****  get booking by organizationId */
  static async getBookingByOrganizationId(orgId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/venue-bookings/organization/${orgId}`,
        {
        headers: this.getHeader(),
        withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching bookings for organization with ID ${orgId}:`,
        error
      );
      throw error;
    }
  }

  /*** get booking by venueID*/

  static async getBookingByVenueId(venueId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/venue-bookings/venue/${venueId}/bookings`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching bookings for venue with ID ${venueId}:`,
        error
      );
      throw error;
    }
  }

  /*** get booking by eventId*/
  static async getBookingByEventId(eventId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/venue-bookings/event/${eventId}`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching bookings for event with ID ${eventId}:`,
        error
      );
      throw error;
    }
  }



  /***** getAllBooking**** */
  static async getAllBookings(): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/venue-bookings`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      throw error;
    }
  }

  /** Create a new venue booking */
  static async createBooking(bookingData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/venue-bookings`, bookingData, {
        headers: this.getHeader(bookingData),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  }

   /**** get  booking userId*** */
  static async getBookingByUserId(userId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/venue-bookings/user/${userId}/bookings`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching event bookings for user with ID ${userId}:`, error);
      throw error;
    }
  }


   /**** pay venue booking **** */

  static async PayVenuBooking(
    bookingId: string,
    paymentData: any
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/venue-bookings/${bookingId}/payments`,
        paymentData,
        {
          headers: this.getHeader(paymentData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error processing payment for event booking with ID ${bookingId}:`, error);
      throw error;
    } 
  }


  /**************************************** */




  /** EVENT ******* */

  static async createEvent(eventData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event`, eventData, {
        headers: this.getHeader(eventData),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  /** Get all events */
  static async getAllEvents(): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/event`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all events:", error);
      throw error;
    }
  }

  /** Update event by ID */
  static async updateEventById(eventId: string, data: any): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.BASE_URL}/event/${eventId}/private`,
        data,
        {
          headers: this.getHeader(data),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating event with ID ${eventId}:`, error);
      throw error;
    }
  }

  /** Get event by ID */
  static async getEventById(eventId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/event/${eventId}`, {
          headers: this.getHeader(),
          withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching event with ID ${eventId}:`, error);
      throw error;
    }
  }


  /**** get all pulic event ******* */
  static async getPubulishedEvents(): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/event/all`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching public events:", error);
      throw error;
    }
  }


/*****  get pubulished event by id*****  */
  static async getPubulishedEventById(eventId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/event/public/${eventId}`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      console.log("response", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching public event with ID ${eventId}:`, error);
      throw error;
    }
  }


  /***** getEventByUserId*****/
  static async getAllEventByUserId(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/event/user/${userId}`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching events for user with ID ${userId}:`, error);
      throw error;
    }
  }




  /*** aprove event booking** */
  static async approveEventBooking(eventId: string, data: any): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/event/approve/${eventId}`,
        data,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error approving event booking with ID ${eventId}:`, error);
      throw error;
    }
  }




 



  /*** cancel event booking** */
  static async cancelEventBooking(eventId: string, data: any): Promise<any> {
    try {
      const response = await axios.put(
        `${this.BASE_URL}/event/cancel/${eventId}`,
        data,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error canceling event booking with ID ${eventId}:`, error);
      throw error;
    }
  }

  /*** request event publication** */
  static async requestEventPublication(eventId: string, data: any): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.BASE_URL}/event/${eventId}/request-publish`,
        data,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error requesting publication for event with ID ${eventId}:`, error);
      throw error;
    }
  }



  /**** admin aprove event*** */
  static async approveEventAdmin(eventId: string): Promise<any> {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      const response = await axios.patch(
        `${this.BASE_URL}/event/${eventId}/approve`,
        {}, // no request body needed
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true, // optional, use only if your backend needs cookies
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error approving event with ID ${eventId}:`, error);
      throw error;
    }
  }

  /*** admin query or feedback*** */
  static async queryEventAdmin(eventId: string, data: any): Promise<any> {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      const response = await axios.patch(
        `${this.BASE_URL}/event/${eventId}/query`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true, // optional, use only if your backend needs cookies
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error querying event with ID ${eventId}:`, error);
      throw error;
    }
  }


  /** admin reject event** */
  static async rejectEventAdmin(eventId: string, data: any): Promise<any> {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      const response = await axios.patch(
        `${this.BASE_URL}/event/${eventId}/reject`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true, // optional, use only if your backend needs cookies
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error rejecting event with ID ${eventId}:`, error);
      throw error;
    }
  }


  /****** geting payment details by passing booking id**** */
  static async getPaymentDetailsByBookingId(bookingId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/venue-bookings/${bookingId}/payments`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment details for booking with ID ${bookingId}:`, error);
      throw error;
    }
  }
  



 







  /**** EVENT TICKETS*** */
  /** Create a new event ticket */
  static async createEventTicket(eventId:string,ticketData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/events/${eventId}/ticket-types`, ticketData,
        {
          headers: this.getHeader(ticketData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating event ticket:", error);
      throw error;
    }
  } 

  /**** get all ticket on event**** */
  static async getAllEventTickets(eventId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/events/${eventId}/ticket-types`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      // Handle 404 error gracefully - it means no tickets exist yet
      if (error.response?.status === 404) {
        return {
          success: true,
          data: [],
          message: "No tickets found for this event"
        };
      }
      console.error(`Error fetching tickets for event with ID ${eventId}:`, error);
      throw error;
    }
  }


  /**** get active ticket type on event *** */
  static async getActiveEventTickets(eventId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/events/${eventId}/ticket-types/active`, {
        headers: this.getHeader(),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching active tickets for event with ID ${eventId}:`, error);
      throw error;
    }
  }



  /*** purchase ticket on evente** */
  static async purchaseEventTicket( ticketData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event/tickets/purchase`, ticketData, {
        headers: this.getHeader(ticketData),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error purchasing event ticket:", error);
      throw error;
    }
  }




 /***** check and scann ticket***** */
  static async checkAndScanTicket(ticketData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event/tickets/check-in`, ticketData, {
        headers: this.getHeader(ticketData),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error checking and scanning ticket:", error);
      throw error;
    }
  }

  /**** check and scann invitation with qrcode**** */
  static async checkAndScanQrcodeInvitation(invitationData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event/free-check-in`, invitationData, {
        headers: this.getHeader(invitationData),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error checking and scanning invitation:", error);
      throw error;
    }
  }


/******* checkInvitation with invitationId*************** */
  static async checkInvitationWithInvitationID(invitationData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event/free-check-in`, invitationData, {
        headers: this.getHeader(invitationData),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error checking invitation with ID`, error);
      throw error;
    }
  }



  /***** FREE EVENTS REGISTRATION CHECKING ROUTE ****** */



  /***** register on free event***** */
  static async registerOnFreeEvent(eventId: string, registrationData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event/${eventId}/register/free`, registrationData, {
        headers: this.getHeader(registrationData),
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error registering on free event with ID ${eventId}:`, error);
      throw error;
    }
  }

 

  /**** check Inspector Access***** */
  static async checkInspectorAccess(sixDigitCode: string): Promise<any> {
    try {
      const requestBody = { sixDigitCode: sixDigitCode }
      const response = await axios.post(`${this.BASE_URL}/event/check-in-staff/validate-code`, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error checking inspector access :`, error);
      throw error;
    }
  }
 
  /*** check invitation detail with code*** */
  static async checkInvitationDetailWithInvitation(invitationData: {
    ticketCode: string;
    codeType: string;
    sixDigitCode: string;
  }): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event/free-check-in/details`, invitationData, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching invitation details for `, error);
      throw error;
    }
  }


  /***** check invitation detail with qrcode***** */
  // static async checkInvitationDetailWithQRCode(qrCodeData: string): Promise<any> {
  //   try {
  //     const response = await axios.post(`${this.BASE_URL}/event/free-check-in/details`, qrCodeData, {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       withCredentials: true,
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error fetching invitation details for QR code:`, error);
  //     throw error;
  //   }
  // }

  /***** update invitation details***** */
  static async updateInvitationDetails(registrationId: string,updateData: {
    sixDigitCode: string;
    fullName: string;
    phoneNumber: string;
    gender: string;
    address: {
      province: string;
      district: string;
      sector: string;
      country: string;
    };
  }): Promise<any> {
    try {
      const response = await axios.patch(`${this.BASE_URL}/event/registrations/free/${registrationId}`, updateData, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating invitation details:`, error);
      throw error;
    }
  }




  /******* confirm attendance*************** */
  static async confirmAttendance(attendanceData: {
    ticketCode: string;
    codeType: string;
    sixDigitCode: string;
  }): Promise<any> {
    try {
      const response = await axios.post(`${this.BASE_URL}/event/free-check-in`, attendanceData, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(`Error confirming attendance:`, error);
      throw error;
    }
  }



  // Fetch organizations for a specific user
  static async getOrganizationsByUserId(userId: string): Promise<any> {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${this.BASE_URL}/organizations/user/${userId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      // Return the full response data to handle the success/data structure
      return response.data;
    } catch (error) {
      console.error("Error fetching organizations by userId:", error);
      return { success: false, data: null };
    }
  }

   

    static async refundVenueBooking(bookingId: string, refundData: any): Promise<any> {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found.");
            }
            const response = await axios.post(
                `${this.BASE_URL}/venue-bookings/payments/${bookingId}/refund`,
                refundData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            console.error(`Error processing refund for booking ID ${bookingId}:`, error);
            throw error;
        }
    }

  static async getFreeRegistrationsByEventId(eventId: string): Promise<any> {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${this.BASE_URL}/event/${eventId}/registrations/free`;
      console.log("Making request to:", url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      
      console.log("Response received:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching free registrations for event ${eventId}:`, error);
      throw error;
    }
  }

  // NOTE: getFreeAttendanceByEventId removed as requested

  /******Add ticket check in staff****** */
  static async addTicketCheckInStaff(eventId: string, staffData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/event/${eventId}/check-in-staff`,
        staffData,
        {
          headers: this.getHeader(staffData),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding ticket check-in staff for event with ID ${eventId}:`, error);
      throw error;
    }
  }

  /**** getAllStaffByEventId**** */
  static async getAllStaffByEventId(eventId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/event/${eventId}/check-in-staff`,
        {
          headers: this.getHeader(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching check-in staff for event with ID ${eventId}:`, error);
      throw error;
    }
  }


}
export default ApiService;
