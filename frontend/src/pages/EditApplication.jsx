import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser] = useState('shreyaupretyy');
  const [currentDateTime] = useState('2025-03-21 11:21:21');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axios.get(`/api/get-application/${id}`);
        setFormData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error details:", error);
        setError('Failed to fetch application data: ' + (error.response?.data?.message || 'Unknown error'));
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Create a copy of the data and ensure proper value types
      const applicationData = { ...formData };
      
      // Ensure numeric values are numbers, not strings
      if (applicationData.final_percentage) {
        applicationData.final_percentage = parseFloat(applicationData.final_percentage);
      }
      
      // Remove any fields that shouldn't be sent in the update
      delete applicationData.created_at;
      delete applicationData.updated_at;
      
      const response = await axios.put(`/api/update-application/${id}`, applicationData);
      setSuccess('Application updated successfully');
      window.scrollTo(0, 0);
      setTimeout(() => navigate(`/admin/application/${id}`), 1500);
    } catch (error) {
      console.error("Update error details:", error);
      setError('Failed to update application: ' + (error.response?.data?.message || 'Server error, please try again'));
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/application/${id}`);
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

  if (error && !formData.id) {
    return (
      <div className="container-fluid py-4 px-4 px-md-5">
        <div className="alert alert-danger py-3 px-4 mb-4" style={{
          borderRadius: '12px',
          fontSize: '1rem',
          border: 'none',
          backgroundColor: 'rgba(220, 53, 69, 0.1)'
        }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-3 me-3"></i>
            <div>
              <h5 className="mb-1">Error Loading Application</h5>
              <p className="mb-3">{error}</p>
              <Link 
                to="/admin/dashboard" 
                className="btn"
                style={{
                  backgroundColor: 'rgba(108, 117, 125, 0.1)',
                  color: '#6c757d',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  padding: '0.5rem 1rem'
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-4 px-md-5">
      {/* Page header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3 fw-light mb-0" style={{ letterSpacing: '-0.5px' }}>
            Edit <span className="fw-bold">Application</span>
          </h1>
          <p className="text-muted">Update applicant information and details</p>
        </div>
      </div>
      
      {/* Action buttons at top */}
      <div className="d-flex justify-content-end mb-4">
        <Link to={`/admin/application/${id}`} className="btn btn-sm me-2" style={{
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          color: '#6c757d',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          padding: '0.5rem 1rem'
        }}>
          <i className="bi bi-x-lg me-2"></i>
          Cancel
        </Link>
        <button 
          className="btn btn-sm"
          style={{
            backgroundColor: 'rgba(13, 110, 253, 0.1)', 
            color: '#0d6efd',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '0.5rem 1rem'
          }}
          form="application-form"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>
              Save Changes
            </>
          )}
        </button>
      </div>
      
      {/* Error and success alerts */}
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
      
      {success && (
        <div className="alert alert-success py-2 px-3 mb-4" style={{
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: 'none',
          backgroundColor: 'rgba(25, 135, 84, 0.1)'
        }}>
          <i className="bi bi-check-circle me-2"></i>{success}
        </div>
      )}
      
      <form id="application-form" onSubmit={handleSubmit}>
        {/* Personal Details Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-fill text-primary me-2"></i>
              <h3 className="h5 mb-0">Personal Details</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name || ''}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="first_name">First Name <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="middle_name"
                    name="middle_name"
                    placeholder="Middle Name"
                    value={formData.middle_name || ''}
                    onChange={handleChange}
                  />
                  <label htmlFor="middle_name">Middle Name</label>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name || ''}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="last_name">Last Name <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="tel"
                    className="form-control"
                    id="contact_number"
                    name="contact_number"
                    placeholder="Contact Number"
                    value={formData.contact_number || ''}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="contact_number">Contact Number <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <label htmlFor="gender">Gender <span className="text-danger">*</span></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Academic Details Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-mortarboard-fill text-primary me-2"></i>
              <h3 className="h5 mb-0">Academic Details</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="final_percentage"
                    name="final_percentage"
                    placeholder="Final Percentage"
                    value={formData.final_percentage || ''}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="final_percentage">Final Percentage Score <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="tentative_ranking"
                    name="tentative_ranking"
                    value={formData.tentative_ranking || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Top 5%">Top 5%</option>
                    <option value="Top 10%">Top 10%</option>
                    <option value="Top 20%">Top 20%</option>
                    <option value="Top 30%">Top 30%</option>
                    <option value="Top 40%">Top 40%</option>
                  </select>
                  <label htmlFor="tentative_ranking">Tentative Ranking <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-12">
                <label htmlFor="final_year_project" className="form-label">
                  Final Year Project Details <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="final_year_project"
                  name="final_year_project"
                  rows="4"
                  value={formData.final_year_project || ''}
                  onChange={handleChange}
                  required
                  minLength="50"
                  style={{ borderRadius: '8px' }}
                ></textarea>
                <div className="form-text">Provide a detailed description of your final year project (min 50 characters)</div>
              </div>
              
              <div className="col-12">
                <label htmlFor="other_projects" className="form-label">
                  Other Notable Research or Project Work
                </label>
                <textarea
                  className="form-control"
                  id="other_projects"
                  name="other_projects"
                  rows="3"
                  value={formData.other_projects || ''}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                ></textarea>
              </div>
              
              <div className="col-12">
                <label htmlFor="publications" className="form-label">
                  Publications
                </label>
                <textarea
                  className="form-control"
                  id="publications"
                  name="publications"
                  rows="3"
                  value={formData.publications || ''}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                ></textarea>
                <div className="form-text">List any academic or research publications you have authored</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Strengths & Weaknesses Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-clipboard-check text-primary me-2"></i>
              <h3 className="h5 mb-0">Strengths & Weaknesses</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="strong_points" className="form-label">
                  Strong Points <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="strong_points"
                  name="strong_points"
                  rows="4"
                  value={formData.strong_points || ''}
                  onChange={handleChange}
                  required
                  style={{ 
                    borderRadius: '8px',
                    borderColor: '#d1e7dd',
                    backgroundColor: 'rgba(25, 135, 84, 0.03)'
                  }}
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="weak_points" className="form-label">
                  Weak Points <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="weak_points"
                  name="weak_points"
                  rows="4"
                  value={formData.weak_points || ''}
                  onChange={handleChange}
                  required
                  style={{ 
                    borderRadius: '8px',
                    borderColor: '#f8d7da',
                    backgroundColor: 'rgba(220, 53, 69, 0.03)'
                  }}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Information Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle text-primary me-2"></i>
              <h3 className="h5 mb-0">Additional Information</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="extracurricular" className="form-label">
                  Notable Extracurricular Activities and Awards
                </label>
                <textarea
                  className="form-control"
                  id="extracurricular"
                  name="extracurricular"
                  rows="3"
                  value={formData.extracurricular || ''}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="professional_experience" className="form-label">
                  Professional Experience
                </label>
                <textarea
                  className="form-control"
                  id="professional_experience"
                  name="professional_experience"
                  rows="3"
                  value={formData.professional_experience || ''}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="leadership_experience" className="form-label">
                  Leadership Experience <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="leadership_experience"
                  name="leadership_experience"
                  rows="3"
                  value={formData.leadership_experience || ''}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="additional_certifications" className="form-label">
                  Additional Certifications
                </label>
                <textarea
                  className="form-control"
                  id="additional_certifications"
                  name="additional_certifications"
                  rows="3"
                  value={formData.additional_certifications || ''}
                  onChange={handleChange}
                  style={{ borderRadius: '8px' }}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        {/* Academic Preferences Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-bookmark-star text-primary me-2"></i>
              <h3 className="h5 mb-0">Academic Preferences</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="preferred_programs" className="form-label">
                  Preferred Programs <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="preferred_programs"
                  name="preferred_programs"
                  rows="3"
                  value={formData.preferred_programs || ''}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="intended_research_areas" className="form-label">
                  Intended Research Areas <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="intended_research_areas"
                  name="intended_research_areas"
                  rows="3"
                  value={formData.intended_research_areas || ''}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                ></textarea>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="english_proficiency"
                    name="english_proficiency"
                    value={formData.english_proficiency || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your proficiency level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Native/Fluent">Native/Fluent</option>
                  </select>
                  <label htmlFor="english_proficiency">English Proficiency <span className="text-danger">*</span></label>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="date"
                    className="form-control"
                    id="availability_to_start"
                    name="availability_to_start"
                    value={formData.availability_to_start || ''}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="availability_to_start">Availability to Start <span className="text-danger">*</span></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statement of Purpose Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-file-earmark-text text-primary me-2"></i>
              <h3 className="h5 mb-0">Statement of Purpose</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="mb-2">
                  <span className="badge bg-primary">Required</span>
                  <span className="badge bg-light text-dark ms-2">Min 100 characters</span>
                </div>
                <textarea
                  className="form-control"
                  id="statement_of_purpose"
                  name="statement_of_purpose"
                  rows="6"
                  value={formData.statement_of_purpose || ''}
                  onChange={handleChange}
                  required
                  minLength="100"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    padding: '12px 15px'
                  }}
                ></textarea>
                <div className="form-text">
                  Explain your motivation for applying, your academic interests, and your career goals.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* References Section */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header py-3 bg-white border-bottom">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-lines-fill text-primary me-2"></i>
              <h3 className="h5 mb-0">References</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="references" className="form-label">
                  Academic or Professional References <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="references"
                  name="references"
                  rows="4"
                  value={formData.references || ''}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px' }}
                ></textarea>
                <div className="form-text">
                  Provide names and contact information of your references
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Buttons */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button 
            type="button" 
            className="btn"
            style={{ 
              backgroundColor: 'rgba(220, 53, 69, 0.1)', 
              color: '#dc3545',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              padding: '0.75rem 1.5rem'
            }}
            onClick={handleCancel}
          >
            <i className="bi bi-x-lg me-2"></i>
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn"
            style={{ 
              backgroundColor: 'rgba(13, 110, 253, 0.1)', 
              color: '#0d6efd',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              padding: '0.75rem 1.5rem'
            }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
      
    </div>
  );
};

export default EditApplication;