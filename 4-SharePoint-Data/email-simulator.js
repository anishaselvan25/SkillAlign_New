/**
 * SkillAlign - Email Simulator
 * For local testing - simulates email notifications
 * In SharePoint version, this will use real email service
 */

const EmailSimulator = {
    
    // Store sent emails for viewing
    sentEmails: [],
    
    /**
     * Send SME welcome email
     */
    sendSMEWelcomeEmail: async function(emailData) {
        const email = {
            id: this.sentEmails.length + 1,
            to: emailData.to,
            subject: 'Welcome to SkillAlign - You are now an SME!',
            body: `
                <h2>Welcome to SkillAlign!</h2>
                <p>Dear ${emailData.name},</p>
                
                <p><strong>${emailData.adminName}</strong> has added you as a Subject Matter Expert (SME) for SkillAlign Assessment Platform.</p>
                
                <h3>Your Responsibilities:</h3>
                <ul>
                    <li>Add assessment questions for assigned topics</li>
                    <li>Ensure question quality and accuracy</li>
                    <li>Mark questions as single or multiple choice</li>
                    <li>Set appropriate difficulty levels</li>
                </ul>
                
                ${emailData.topics && emailData.topics.length > 0 ? `
                <h3>Assigned Topics:</h3>
                <ul>
                    ${emailData.topics.map(t => `<li>${t}</li>`).join('')}
                </ul>
                ` : '<p>Topics will be assigned to you soon.</p>'}
                
                <h3>Login Credentials:</h3>
                <p><strong>Email:</strong> ${emailData.to}<br>
                <strong>Temporary Password:</strong> ${emailData.tempPassword}</p>
                
                <p><strong>Login URL:</strong> <a href="${emailData.loginUrl}">${emailData.loginUrl}</a></p>
                
                <p><em>Please change your password after first login.</em></p>
                
                <h3>Next Steps:</h3>
                <ol>
                    <li>Login to SkillAlign using above credentials</li>
                    <li>Navigate to SME Dashboard</li>
                    <li>Start adding questions for your assigned topics</li>
                </ol>
                
                <p>If you have any questions, please contact the administrator.</p>
                
                <p>Best regards,<br>
                SkillAlign Team</p>
            `,
            sentAt: new Date().toISOString(),
            type: 'sme_welcome',
            status: 'sent'
        };
        
        this.sentEmails.push(email);
        this._saveEmails();
        this._showNotification(email);
        
        console.log('📧 Email sent (simulated):', email.to);
        return { success: true, emailId: email.id };
    },
    
    /**
     * Send topic assignment email
     */
    sendTopicAssignmentEmail: async function(emailData) {
        const email = {
            id: this.sentEmails.length + 1,
            to: emailData.to,
            subject: 'New Topics Assigned - SkillAlign',
            body: `
                <h2>New Topics Assigned!</h2>
                <p>Dear ${emailData.name},</p>
                
                <p><strong>${emailData.adminName}</strong> has assigned new topics to you:</p>
                
                <h3>Your Assigned Topics:</h3>
                <ul>
                    ${emailData.topics.map(t => `<li>${t}</li>`).join('')}
                </ul>
                
                <h3>Action Required:</h3>
                <p>Please login to SkillAlign and add assessment questions for these topics.</p>
                
                <p><strong>Guidelines:</strong></p>
                <ul>
                    <li>Add at least 30-40 questions per topic</li>
                    <li>Include both single and multiple choice questions</li>
                    <li>Set appropriate difficulty levels (Easy, Medium, Hard)</li>
                    <li>Ensure questions are clear and accurate</li>
                </ul>
                
                <p>If you have any questions, please contact the administrator.</p>
                
                <p>Best regards,<br>
                SkillAlign Team</p>
            `,
            sentAt: new Date().toISOString(),
            type: 'topic_assignment',
            status: 'sent'
        };
        
        this.sentEmails.push(email);
        this._saveEmails();
        this._showNotification(email);
        
        console.log('📧 Email sent (simulated):', email.to);
        return { success: true, emailId: email.id };
    },
    
    /**
     * Show visual notification (for local testing)
     */
    _showNotification: function(email) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'email-notification';
        notification.innerHTML = `
            <div class="email-notification-content">
                <div class="email-notification-header">
                    <span class="email-icon">📧</span>
                    <span class="email-title">Email Sent (Simulated)</span>
                    <button class="email-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="email-notification-body">
                    <p><strong>To:</strong> ${email.to}</p>
                    <p><strong>Subject:</strong> ${email.subject}</p>
                    <button class="view-email-btn" onclick="EmailSimulator.viewEmail(${email.id})">View Email</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    },
    
    /**
     * View email in modal
     */
    viewEmail: function(emailId) {
        const email = this.sentEmails.find(e => e.id === emailId);
        if (!email) return;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'email-modal';
        modal.innerHTML = `
            <div class="email-modal-content">
                <div class="email-modal-header">
                    <h3>📧 Email Preview (Simulated)</h3>
                    <button class="email-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="email-modal-body">
                    <div class="email-meta">
                        <p><strong>To:</strong> ${email.to}</p>
                        <p><strong>Subject:</strong> ${email.subject}</p>
                        <p><strong>Sent:</strong> ${new Date(email.sentAt).toLocaleString()}</p>
                    </div>
                    <div class="email-content">
                        ${email.body}
                    </div>
                </div>
                <div class="email-modal-footer">
                    <p class="email-note">📝 Note: This is a simulated email for local testing. In production (SharePoint), real emails will be sent.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },
    
    /**
     * Save emails to localStorage
     */
    _saveEmails: function() {
        try {
            localStorage.setItem('skillalign_emails', JSON.stringify(this.sentEmails));
        } catch (error) {
            console.error('Error saving emails:', error);
        }
    },
    
    /**
     * Load emails from localStorage
     */
    loadEmails: function() {
        try {
            const emails = localStorage.getItem('skillalign_emails');
            if (emails) {
                this.sentEmails = JSON.parse(emails);
            }
        } catch (error) {
            console.error('Error loading emails:', error);
        }
    },
    
    /**
     * Get all sent emails (Admin only)
     */
    getAllEmails: function() {
        return this.sentEmails;
    },
    
    /**
     * Clear all emails
     */
    clearAllEmails: function() {
        this.sentEmails = [];
        localStorage.removeItem('skillalign_emails');
        console.log('✅ All emails cleared');
    }
};

// Load emails on initialization
document.addEventListener('DOMContentLoaded', function() {
    EmailSimulator.loadEmails();
    console.log('✅ Email simulator loaded');
});

// Add CSS for email notifications
const emailStyles = `
<style>
.email-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.email-notification-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    min-width: 350px;
    overflow: hidden;
}

.email-notification-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.email-icon {
    font-size: 24px;
}

.email-title {
    flex: 1;
    font-weight: 600;
}

.email-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.email-close:hover {
    background: rgba(255,255,255,0.2);
}

.email-notification-body {
    padding: 20px;
}

.email-notification-body p {
    margin: 8px 0;
    font-size: 14px;
    color: #374151;
}

.view-email-btn {
    margin-top: 12px;
    padding: 8px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
}

.view-email-btn:hover {
    background: #5568d3;
}

.email-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
}

.email-modal-content {
    background: white;
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.email-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.email-modal-header h3 {
    margin: 0;
    font-size: 20px;
}

.email-modal-close {
    background: none;
    border: none;
    color: white;
    font-size: 32px;
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.email-modal-close:hover {
    background: rgba(255,255,255,0.2);
}

.email-modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.email-meta {
    background: #f9fafb;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.email-meta p {
    margin: 5px 0;
    font-size: 14px;
}

.email-content {
    line-height: 1.6;
}

.email-content h2, .email-content h3 {
    color: #1f2937;
    margin-top: 20px;
}

.email-content ul, .email-content ol {
    padding-left: 20px;
}

.email-modal-footer {
    padding: 15px 20px;
    background: #fef3c7;
    border-top: 1px solid #fde68a;
}

.email-note {
    margin: 0;
    font-size: 13px;
    color: #92400e;
}
</style>
`;

// Inject styles
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', emailStyles);
}
