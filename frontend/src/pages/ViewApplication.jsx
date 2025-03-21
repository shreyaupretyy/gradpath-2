import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ViewApplication = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUser] = useState('shreyaupretyy');
  const [currentDateTime] = useState('2025-03-21 12:17:55');
  const [fileErrors, setFileErrors] = useState({});
  const [fileLoading, setFileLoading] = useState({
    transcript: false,
    cv: false,
    photo: false
  });
  
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        // Use the endpoint that accepts application ID
        const response = await axios.get(`/api/get-application/${id}`);
        setApplication(response.data);
        setLoading(false);
      } catch (error) {
        setError('Error fetching application: ' + (error.response?.data?.message || 'Unknown error'));
        setLoading(false);
      }
    };
    
    fetchApplication();
  }, [id]);

  // Extract filename from file path
  const getFileName = (filePath) => {
    if (!filePath) return '';
    
    // Handle both forward and backward slashes
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  // Check if value is a complete URL
  const isUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  // Get file URL correctly formatted for download/view
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    
    // If it's already a complete URL, use it as is
    if (isUrl(filePath)) return filePath;
    
    // If it's just a filename, use the /uploads path
    const fileName = getFileName(filePath);
    return `/uploads/${fileName}`;
  };

  // Handle file download with proper error handling
  const handleFileDownload = async (filePath, fileType) => {
    if (!filePath) return;
    
    setFileLoading(prev => ({ ...prev, [fileType]: true }));
    setFileErrors(prev => ({ ...prev, [fileType]: null }));
    
    try {
      const fileUrl = getFileUrl(filePath);
      
      // Try to fetch the file
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download file (${response.status})`);
      }
      
      // Convert to blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFileName(filePath);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error downloading ${fileType}:`, error);
      setFileErrors(prev => ({
        ...prev,
        [fileType]: "This file couldn't be accessed. This is likely due to how file paths are stored in the database."
      }));
    } finally {
      setFileLoading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  // Handle file viewing with proper error handling
  const handleFileView = async (filePath, fileType) => {
    if (!filePath) return;
    
    setFileLoading(prev => ({ ...prev, [fileType]: true }));
    setFileErrors(prev => ({ ...prev, [fileType]: null }));
    
    try {
      const fileUrl = getFileUrl(filePath);
      
      // Try to check if file exists first
      const response = await fetch(fileUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`File not found (${response.status})`);
      }
      
      // Open in new tab
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error(`Error viewing ${fileType}:`, error);
      setFileErrors(prev => ({
        ...prev,
        [fileType]: "This file couldn't be accessed. This is likely due to how file paths are stored in the database."
      }));
    } finally {
      setFileLoading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  // Get gender display
  const getGenderDisplay = (gender) => {
    switch(gender) {
      case 'Male':
        return { icon: 'bi-gender-male', color: '#0d6efd', bgColor: '#e6f0ff', text: 'Male' };
      case 'Female':
        return { icon: 'bi-gender-female', color: '#d63384', bgColor: '#fce8f3', text: 'Female' };
      case 'Other':
        return { icon: 'bi-gender-ambiguous', color: '#6c757d', bgColor: '#f0f0f0', text: 'Other' };
      default:
        return { icon: 'bi-question-circle', color: '#6c757d', bgColor: '#f0f0f0', text: 'Unknown' };
    }
  };

  // Get percentage display
  const getPercentageDisplay = (percentage) => {
    const numericPercentage = parseFloat(percentage);
    
    if (isNaN(numericPercentage)) {
      return { color: '#6c757d', bgColor: '#f0f0f0', textColor: '#6c757d', text: 'N/A' };
    }
    
    if (numericPercentage >= 90) {
      return { color: '#198754', bgColor: '#e8f6f0', textColor: '#198754', text: 'Excellent' };
    } else if (numericPercentage >= 80) {
      return { color: '#20c997', bgColor: '#e6fbf6', textColor: '#198754', text: 'Very Good' };
    } else if (numericPercentage >= 70) {
      return { color: '#0d6efd', bgColor: '#e6f0ff', textColor: '#0d6efd', text: 'Good' };
    } else if (numericPercentage >= 60) {
      return { color: '#ffc107', bgColor: '#fff8e5', textColor: '#997404', text: 'Average' };
    } else {
      return { color: '#dc3545', bgColor: '#f8d7da', textColor: '#dc3545', text: 'Below Avg' };
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = () => {
    setShowDeleteDialog(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  // Handle delete application
  const handleDeleteApplication = () => {
    setApplication(prev => ({ ...prev, deleting: true }));
    
    // Call delete API endpoint
    axios.delete(`/api/delete-application/${id}`)
      .then(() => {
        // Redirect to dashboard after successful deletion
        window.location.href = '/admin/dashboard';
      })
      .catch(error => {
        setError(`Error deleting application: ${error.response?.data?.message || 'Unknown error'}`);
        setApplication(prev => ({ ...prev, deleting: false }));
        setShowDeleteDialog(false);
        setTimeout(() => setError(''), 3000);
      });
  };

  // Generate PDF report
  const generateReport = () => {
    if (!application) return;
    
    setApplication(prev => ({ ...prev, generatingReport: true }));
    
    setTimeout(() => {
      try {
        // Create a new jsPDF instance
        const doc = new jsPDF();
        
        // Add title and styling
        doc.setFontSize(20);
        doc.setTextColor(13, 110, 253); // Main blue color
        doc.text('Student Application Report', 105, 15, { align: 'center' });
        doc.setDrawColor(13, 110, 253);
        doc.line(20, 20, 190, 20);
        
        // Add student info
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Report generated: ${currentDateTime}`, 20, 30);
        doc.text(`Student: ${application.first_name || ''} ${application.last_name || ''}`, 20, 40);
        doc.text(`Contact: ${application.contact_number || ''}`, 20, 50);
        if (application.email) {
          doc.text(`Email: ${application.email}`, 20, 60);
        }
        
        // Add academic details
        doc.setFontSize(14);
        doc.setTextColor(13, 110, 253);
        doc.text('Academic Details', 20, 75);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Final Percentage:', 30, 85);
        doc.text(`${application.final_percentage || 'N/A'}%`, 130, 85);
        
        doc.text('Tentative Ranking:', 30, 95);
        doc.text(application.tentative_ranking || 'N/A', 130, 95);
        
        doc.text('English Proficiency:', 30, 105);
        doc.text(application.english_proficiency || 'N/A', 130, 105);
        
        doc.text('Preferred Programs:', 30, 115);
        const programLines = doc.splitTextToSize(application.preferred_programs || 'N/A', 70);
        doc.text(programLines, 130, 115);
        
        // Calculate next Y position based on the number of lines in programs
        let yPosition = 115 + (programLines.length * 7) + 15;
        
        // Add strengths and weaknesses
        doc.setFontSize(14);
        doc.setTextColor(13, 110, 253);
        doc.text('Strengths & Weaknesses', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Strengths:', 20, yPosition);
        
        // Handle multiline text
        const strengthLines = doc.splitTextToSize(application.strong_points || 'N/A', 160);
        doc.text(strengthLines, 30, yPosition + 7);
        
        yPosition += (strengthLines.length * 7) + 15;
        doc.text('Weaknesses:', 20, yPosition);
        
        const weaknessLines = doc.splitTextToSize(application.weak_points || 'N/A', 160);
        doc.text(weaknessLines, 30, yPosition + 7);
        
        // Add footer
        yPosition = 270;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated by: ${currentUser}`, 20, yPosition);
        doc.text(`Generated on: ${currentDateTime}`, 20, yPosition + 7);
        
        // Save the PDF with the correct filename format
        const fileName = `${application.first_name || 'unknown'}_${application.last_name || 'unknown'}_report.pdf`;
        doc.save(fileName);
        
        setApplication(prev => ({ ...prev, generatingReport: false }));
      } catch (error) {
        setError(`Error generating report: ${error.message || 'Unknown error'}`);
        setApplication(prev => ({ ...prev, generatingReport: false }));
        setTimeout(() => setError(''), 3000);
      }
    }, 1000);
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{
        background: '#f8f9fa'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading application data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4 px-4 px-md-5">
        <div className="alert alert-danger py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(220, 53, 69, 0.1)'
        }}>
          <i className="bi bi-exclamation-circle me-2"></i>{error}
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container-fluid py-4 px-4 px-md-5">
        <div className="alert alert-info py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(13, 202, 240, 0.1)'
        }}>
          <i className="bi bi-info-circle me-2"></i>Application not found.
        </div>
      </div>
    );
  }

  const genderDisplay = application.gender ? getGenderDisplay(application.gender) : getGenderDisplay('');
  const percentageDisplay = getPercentageDisplay(application.final_percentage);

  return (
    <div className="container-fluid py-4 px-4 px-md-5">
      {/* Page header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3 fw-light mb-0" style={{ letterSpacing: '-0.5px' }}>
            Application <span className="fw-bold">Details</span>
          </h1>
          <p className="text-muted">View and manage applicant information</p>
        </div>
      </div>
      
      {/* Error alert */}
      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(220, 53, 69, 0.1)'
        }}>
          <i className="bi bi-exclamation-circle me-2"></i>{error}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="d-flex justify-content-end mb-4">
        <Link to="/admin/dashboard" className="btn btn-sm me-2" style={{
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          color: '#6c757d',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          padding: '0.5rem 1rem'
        }}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </Link>
        <Link to={`/admin/edit-application/${id}`} className="btn btn-sm" style={{
          backgroundColor: 'rgba(255, 193, 7, 0.1)', 
          color: '#ffc107',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          padding: '0.5rem 1rem'
        }}>
          <i className="bi bi-pencil me-2"></i>
          Edit Application
        </Link>
      </div>

      {/* Applicant Summary Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-person-badge-fill text-primary me-2"></i>
            <h3 className="h5 mb-0">Applicant Summary</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="d-flex">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                  <i className="bi bi-person fs-4 text-primary"></i>
                </div>
                <div>
                  <h4 className="h5 mb-1">{application.first_name} {application.middle_name ? `${application.middle_name} ` : ''}{application.last_name}</h4>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <div className="d-inline-block px-2 py-1 rounded" style={{ backgroundColor: genderDisplay.bgColor }}>
                      <i className={`bi ${genderDisplay.icon} me-1`} style={{ color: genderDisplay.color }}></i>
                      <span style={{ color: genderDisplay.color }}>{genderDisplay.text}</span>
                    </div>
                    
                    <div className="d-inline-block px-2 py-1 rounded" style={{ backgroundColor: percentageDisplay.bgColor }}>
                      <span style={{ color: percentageDisplay.color, fontWeight: 'bold' }}>
                        {application.final_percentage}%
                      </span>
                      <span className="ms-1" style={{ color: percentageDisplay.textColor, fontSize: '0.8rem' }}>
                        ({percentageDisplay.text})
                      </span>
                    </div>
                    
                    {application.tentative_ranking && (
                      <div className="d-inline-block px-2 py-1 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                        <i className="bi bi-trophy me-1 text-primary"></i>
                        <span className="text-primary">{application.tentative_ranking}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mt-3 mt-md-0">
              <div className="d-flex">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                  <i className="bi bi-telephone fs-4 text-success"></i>
                </div>
                <div>
                  <h5 className="card-title mb-1">Contact Information</h5>
                  <p className="mb-1">{application.contact_number}</p>
                  {application.email && <p className="mb-0 text-primary">{application.email}</p>}
                </div>
              </div>
            </div>
          </div>
          
          <hr className="my-4" style={{ opacity: '0.1' }} />
          
          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Application ID</div>
              <div className="fw-bold">#{application.id}</div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Submission Date</div>
              <div className="fw-bold">{new Date(application.created_at).toLocaleDateString()}</div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Gender</div>
              <div className="fw-bold">{application.gender}</div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="small text-muted mb-1">Availability</div>
              <div className="fw-bold">{application.availability_to_start || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Details Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-mortarboard-fill text-primary me-2"></i>
            <h3 className="h5 mb-0">Academic Details</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                    <i className="bi bi-graph-up text-primary"></i>
                  </div>
                  <h5 className="mb-0">Performance</h5>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="small text-muted mb-1">Final Percentage</div>
                    <div className="fw-bold d-flex align-items-center">
                      <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                        <div className="progress-bar" role="progressbar" style={{ 
                          width: `${Math.min(application.final_percentage, 100)}%`, 
                          backgroundColor: percentageDisplay.color 
                        }}></div>
                      </div>
                      <span>{application.final_percentage}%</span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="small text-muted mb-1">Tentative Ranking</div>
                    <div className="fw-bold">{application.tentative_ranking}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                    <i className="bi bi-translate text-success"></i>
                  </div>
                  <h5 className="mb-0">Skills & Proficiency</h5>
                </div>
                
                <div className="mb-3">
                  <div className="small text-muted mb-1">English Proficiency</div>
                  <div className="fw-bold">{application.english_proficiency || 'Not specified'}</div>
                </div>
                
                <div className="mb-0">
                  <div className="small text-muted mb-1">Preferred Programs</div>
                  <div className="fw-bold">{application.preferred_programs || 'Not specified'}</div>
                </div>
              </div>
            </div>
            
            <div className="col-12">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-laptop text-primary me-2"></i>
                  <h5 className="mb-0">Final Year Project</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.final_year_project || 'No final year project specified'}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-journal-code text-primary me-2"></i>
                  <h5 className="mb-0">Other Projects</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.other_projects || 'No other projects mentioned'}
                </div>
              </div>
              
              <div className="mb-0">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-file-text text-primary me-2"></i>
                  <h5 className="mb-0">Publications</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.publications || 'No publications mentioned'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-clipboard-check text-primary me-2"></i>
            <h3 className="h5 mb-0">Strengths & Weaknesses</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                    <i className="bi bi-check-circle text-success"></i>
                  </div>
                  <h5 className="mb-0">Strong Points</h5>
                </div>
                <div>{application.strong_points || 'No strong points specified'}</div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ backgroundColor: 'rgba(220, 53, 69, 0.05)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-2 me-2" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                    <i className="bi bi-exclamation-triangle text-danger"></i>
                  </div>
                  <h5 className="mb-0">Weak Points</h5>
                </div>
                <div>{application.weak_points || 'No weak points specified'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle text-primary me-2"></i>
            <h3 className="h5 mb-0">Additional Information</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-activity text-primary me-2"></i>
                  <h5 className="mb-0">Extracurricular Activities & Awards</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.extracurricular || 'No extracurricular activities mentioned'}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-briefcase text-primary me-2"></i>
                  <h5 className="mb-0">Professional Experience</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.professional_experience || 'No professional experience mentioned'}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-people text-primary me-2"></i>
                  <h5 className="mb-0">Leadership Experience</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.leadership_experience || 'No leadership experience mentioned'}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-patch-check text-primary me-2"></i>
                  <h5 className="mb-0">Additional Certifications</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.additional_certifications || 'No additional certifications mentioned'}
                </div>
              </div>
            </div>
            
            <div className="col-12">
              <div className="mb-0">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-file-earmark-text text-primary me-2"></i>
                  <h5 className="mb-0">Statement of Purpose</h5>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                  {application.statement_of_purpose || 'No statement of purpose provided'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research & References */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-search text-primary me-2"></i>
            <h3 className="h5 mb-0">Research & References</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-book text-primary me-2"></i>
                <h5 className="mb-0">Intended Research Areas</h5>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                {application.intended_research_areas || 'No specific research areas mentioned'}
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-person-lines-fill text-primary me-2"></i>
                <h5 className="mb-0">References</h5>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
                {application.references || 'No references provided'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header py-3 bg-white border-bottom">
          <div className="d-flex align-items-center">
            <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
            <h3 className="h5 mb-0">Uploaded Files</h3>
          </div>
        </div>
        <div className="card-body p-0">
          
          <div className="table-responsive">
            <table className="table mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '30%' }} className="ps-4">Document Type</th>
                  <th style={{ width: '40%' }}>Filename</th>
                  <th style={{ width: '30%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="ps-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-file-earmark-text text-primary me-2"></i>
                      <span>Academic Transcript</span>
                    </div>
                  </td>
                  <td>
                    {application.transcript ? getFileName(application.transcript) : 'Not uploaded'}
                    {fileErrors.transcript && (
                      <div className="small text-danger mt-1">{fileErrors.transcript}</div>
                    )}
                  </td>
                  <td>
                    {application.transcript && (
                      <button 
                        onClick={() => handleFileDownload(application.transcript, 'transcript')}
                        className="btn btn-sm btn-outline-primary me-2"
                        disabled={fileLoading.transcript}
                      >
                        {fileLoading.transcript ? (
                          <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Loading...</>
                        ) : (
                          <><i className="bi bi-download me-1"></i> Download</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="ps-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-file-earmark-person text-success me-2"></i>
                      <span>Curriculum Vitae</span>
                    </div>
                  </td>
                  <td>
                    {application.cv ? getFileName(application.cv) : 'Not uploaded'}
                    {fileErrors.cv && (
                      <div className="small text-danger mt-1">{fileErrors.cv}</div>
                    )}
                  </td>
                  <td>
                    {application.cv && (
                      <button 
                        onClick={() => handleFileDownload(application.cv, 'cv')}
                        className="btn btn-sm btn-outline-primary"
                        disabled={fileLoading.cv}
                      >
                        {fileLoading.cv ? (
                          <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Loading...</>
                        ) : (
                          <><i className="bi bi-download me-1"></i> Download</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="ps-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-image text-warning me-2"></i>
                      <span>Photo</span>
                    </div>
                  </td>
                  <td>
                    {application.photo ? getFileName(application.photo) : 'Not uploaded'}
                    {fileErrors.photo && (
                      <div className="small text-danger mt-1">{fileErrors.photo}</div>
                    )}
                  </td>
                  <td>
                    {application.photo && (
                      <>
                        <button 
                          onClick={() => handleFileDownload(application.photo, 'photo')}
                          className="btn btn-sm btn-outline-primary me-2"
                          disabled={fileLoading.photo}
                        >
                          {fileLoading.photo ? (
                            <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Loading...</>
                          ) : (
                            <><i className="bi bi-download me-1"></i> Download</>
                          )}
                        </button>
                        <button 
                          onClick={() => handleFileView(application.photo, 'photo')}
                          className="btn btn-sm btn-outline-secondary"
                          disabled={fileLoading.photo}
                        >
                          <i className="bi bi-eye me-1"></i> View
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Footer actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          className="btn btn-sm"
          style={{ 
            backgroundColor: 'rgba(220, 53, 69, 0.1)', 
            color: '#dc3545',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '0.5rem 1rem'
          }}
          onClick={openDeleteDialog}
        >
          <i className="bi bi-trash me-2"></i>
          Delete Application
        </button>
        
        <div>
          <button 
            className="btn btn-sm me-2" 
            style={{ 
              backgroundColor: 'rgba(25, 135, 84, 0.1)', 
              color: '#198754',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              padding: '0.5rem 1rem'
            }}
            onClick={generateReport}
            disabled={application.generatingReport}
          >
            {application.generatingReport ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-text me-2"></i>
                Generate Report
              </>
            )}
          </button>
          
          <Link to={`/admin/edit-application/${id}`} className="btn btn-sm" style={{
            backgroundColor: 'rgba(13, 110, 253, 0.1)', 
            color: '#0d6efd',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '0.5rem 1rem'
          }}>
            <i className="bi bi-pencil me-2"></i>
            Edit Application
          </Link>
        </div>
      </div>

      
      {/* Delete Confirmation Modal */}
      {showDeleteDialog && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                  Confirm Deletion
                </h5>
                <button type="button" className="btn-close" onClick={closeDeleteDialog}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: 'rgba(220, 53, 69, 0.1)' 
                  }}>
                    <i className="bi bi-trash fs-1 text-danger"></i>
                  </div>
                  <h4>Are you sure?</h4>
                  <p className="text-muted">
                    You are about to delete the application for <strong>{application.first_name} {application.last_name}</strong>. 
                    This action cannot be undone.
                  </p>
                </div>
                
                <div className="alert alert-warning p-2">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    All data associated with this application will be permanently removed from the system.
                  </small>
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none' }}>
                <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteDialog}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDeleteApplication}
                  disabled={application.deleting}
                >
                  {application.deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-1"></i> Delete Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplication;