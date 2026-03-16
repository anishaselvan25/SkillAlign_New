/**
 * SkillAlign - SharePoint Production Configuration
 * Update SHAREPOINT_SITE_URL with your actual SharePoint site URL
 */

// ⚠️ IMPORTANT: CHANGE THIS TO YOUR SHAREPOINT SITE URL!
const SHAREPOINT_SITE_URL = 'https://yourcompany.sharepoint.com/sites/SkillAlign';

// SharePoint Configuration
const SHAREPOINT_CONFIG = {
    siteUrl: SHAREPOINT_SITE_URL,
    
    // SharePoint List Names (must match exactly!)
    lists: {
        topics: 'SkillAlign_Topics',
        questions: 'SkillAlign_Questions',
        users: 'SkillAlign_Users',
        assessments: 'SkillAlign_Assessments'
    },
    
    // Application Settings
    app: {
        name: 'SkillAlign',
        version: '1.0.0',
        questionsPerAssessment: 30,  // 30 questions per test
        passingScore: 60,             // 60% to pass
        sessionTimeout: 24 * 60 * 60 * 1000  // 24 hours
    }
};

/**
 * SharePoint REST API Helper
 * Handles all SharePoint API calls
 */
const SharePointAPI = {
    
    /**
     * Get request digest for write operations
     */
    getRequestDigest: async function() {
        try {
            const response = await fetch(`${SHAREPOINT_CONFIG.siteUrl}/_api/contextinfo`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.d.GetContextWebInformation.FormDigestValue;
        } catch (error) {
            console.error('Error getting request digest:', error);
            return null;
        }
    },
    
    /**
     * Get items from SharePoint list
     */
    getListItems: async function(listName, filter = null, select = null, orderBy = null, top = null) {
        try {
            let url = `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
            
            const params = [];
            if (select) params.push(`$select=${select}`);
            if (filter) params.push(`$filter=${filter}`);
            if (orderBy) params.push(`$orderby=${orderBy}`);
            if (top) params.push(`$top=${top}`);
            
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return { data: data.d.results, error: null };
            
        } catch (error) {
            console.error(`Error getting items from ${listName}:`, error);
            return { data: null, error: error.message };
        }
    },
    
    /**
     * Add item to SharePoint list
     */
    addListItem: async function(listName, itemData) {
        try {
            const digest = await this.getRequestDigest();
            if (!digest) {
                throw new Error('Failed to get request digest');
            }
            
            // Get list item type
            const listItemType = `SP.Data.${listName.replace(/_/g, '_x005f_')}ListItem`;
            
            const response = await fetch(
                `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': digest
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        __metadata: { type: listItemType },
                        ...itemData
                    })
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
            }
            
            const data = await response.json();
            return { data: data.d, error: null };
            
        } catch (error) {
            console.error(`Error adding item to ${listName}:`, error);
            return { data: null, error: error.message };
        }
    },
    
    /**
     * Update item in SharePoint list
     */
    updateListItem: async function(listName, itemId, itemData) {
        try {
            const digest = await this.getRequestDigest();
            if (!digest) {
                throw new Error('Failed to get request digest');
            }
            
            const listItemType = `SP.Data.${listName.replace(/_/g, '_x005f_')}ListItem`;
            
            const response = await fetch(
                `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': digest,
                        'X-HTTP-Method': 'MERGE',
                        'IF-MATCH': '*'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        __metadata: { type: listItemType },
                        ...itemData
                    })
                }
            );
            
            if (!response.ok && response.status !== 204) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return { data: { success: true }, error: null };
            
        } catch (error) {
            console.error(`Error updating item in ${listName}:`, error);
            return { data: null, error: error.message };
        }
    },
    
    /**
     * Delete item from SharePoint list
     */
    deleteListItem: async function(listName, itemId) {
        try {
            const digest = await this.getRequestDigest();
            if (!digest) {
                throw new Error('Failed to get request digest');
            }
            
            const response = await fetch(
                `${SHAREPOINT_CONFIG.siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'X-RequestDigest': digest,
                        'X-HTTP-Method': 'DELETE',
                        'IF-MATCH': '*'
                    },
                    credentials: 'include'
                }
            );
            
            if (!response.ok && response.status !== 204) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return { data: { success: true }, error: null };
            
        } catch (error) {
            console.error(`Error deleting item from ${listName}:`, error);
            return { data: null, error: error.message };
        }
    }
};

console.log('✅ SharePoint configuration loaded');
console.log('📍 Site URL:', SHAREPOINT_CONFIG.siteUrl);
console.log('📊 Questions per assessment:', SHAREPOINT_CONFIG.app.questionsPerAssessment);
