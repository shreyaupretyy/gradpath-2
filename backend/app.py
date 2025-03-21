import os
import logging
from datetime import datetime
from io import BytesIO

from flask import Flask, request, jsonify, session, send_file, abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'yoursecretkey'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///applicants.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS

# Create upload folder if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Initialize database
db = SQLAlchemy(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

#############################################
# Database Models
#############################################
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship('Application', backref='user', lazy=True, cascade="all, delete-orphan")


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Personal Details
    first_name = db.Column(db.String(100))
    middle_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    contact_number = db.Column(db.String(20))
    gender = db.Column(db.String(10))
    # Academic & Additional Details
    final_percentage = db.Column(db.Float)
    tentative_ranking = db.Column(db.String(20))
    final_year_project = db.Column(db.Text)
    other_projects = db.Column(db.Text)
    publications = db.Column(db.Text)
    extracurricular = db.Column(db.Text)
    professional_experience = db.Column(db.Text)
    strong_points = db.Column(db.Text)
    weak_points = db.Column(db.Text)
    transcript = db.Column(db.String(200))
    cv = db.Column(db.String(200))
    photo = db.Column(db.String(200))
    preferred_programs = db.Column(db.Text)
    references = db.Column(db.Text)
    statement_of_purpose = db.Column(db.Text)
    intended_research_areas = db.Column(db.Text)
    english_proficiency = db.Column(db.String(50))
    leadership_experience = db.Column(db.Text)
    availability_to_start = db.Column(db.String(50))
    additional_certifications = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

#############################################
# Helper Functions
#############################################
def application_to_dict(application):
    """Return application dictionary without the created_at and updated_at fields."""
    return {
        'id': application.id,
        'user_id': application.user_id,
        'first_name': application.first_name,
        'middle_name': application.middle_name,
        'last_name': application.last_name,
        'contact_number': application.contact_number,
        'gender': application.gender,
        'final_percentage': application.final_percentage,
        'tentative_ranking': application.tentative_ranking,
        'final_year_project': application.final_year_project,
        'other_projects': application.other_projects,
        'publications': application.publications,
        'extracurricular': application.extracurricular,
        'professional_experience': application.professional_experience,
        'strong_points': application.strong_points,
        'weak_points': application.weak_points,
        'transcript': application.transcript,
        'cv': application.cv,
        'photo': application.photo,
        'preferred_programs': application.preferred_programs,
        'references': application.references,
        'statement_of_purpose': application.statement_of_purpose,
        'intended_research_areas': application.intended_research_areas,
        'english_proficiency': application.english_proficiency,
        'leadership_experience': application.leadership_experience,
        'availability_to_start': application.availability_to_start,
        'additional_certifications': application.additional_certifications
    }

#############################################
# Endpoints
#############################################

@app.before_first_request
def create_initial_users():
    """Create initial admin, student and demo users if they don't exist."""
    try:
        db.create_all()
        # Create default admin user if not exists
        admin_user = User.query.filter_by(email='admin@example.com').first()
        if not admin_user:
            admin_password = generate_password_hash('admin123', method='sha256')
            admin = User(
                email='admin@example.com',
                password=admin_password,
                is_admin=True,
                created_at=datetime.strptime('2025-03-05 19:32:42', '%Y-%m-%d %H:%M:%S')
            )
            db.session.add(admin)
            logger.info("Created admin user: admin@example.com")

        # Create example student user if not exists
        student_user = User.query.filter_by(email='student@example.com').first()
        if not student_user:
            student_password = generate_password_hash('student123', method='sha256')
            student = User(
                email='student@example.com',
                password=student_password,
                is_admin=False,
                created_at=datetime.strptime('2025-03-05 19:32:42', '%Y-%m-%d %H:%M:%S')
            )
            db.session.add(student)
            db.session.commit()

            student_app = Application(
                user_id=student.id,
                first_name='Test',
                last_name='Student',
                contact_number='1234567890',
                gender='Other',
                created_at=datetime.strptime('2025-03-05 19:32:42', '%Y-%m-%d %H:%M:%S'),
                updated_at=datetime.strptime('2025-03-05 19:32:42', '%Y-%m-%d %H:%M:%S')
            )
            db.session.add(student_app)
            logger.info("Created student user: student@example.com")

        # Create demo admin user for shreyaupretyy if not exists
        shreya_user = User.query.filter_by(email='shreya@example.com').first()
        if not shreya_user:
            shreya_password = generate_password_hash('password123', method='sha256')
            shreya = User(
                email='shreya@example.com',
                password=shreya_password,
                is_admin=True,
                created_at=datetime.strptime('2025-03-05 19:32:42', '%Y-%m-%d %H:%M:%S')
            )
            db.session.add(shreya)
            logger.info("Created user: shreya@example.com (shreyaupretyy)")

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating initial users: {str(e)}")

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    logger.debug(f"Register request received with data: {data}")

    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        logger.warning(f"User already exists: {data['email']}")
        return jsonify({'message': 'User already exists'}), 400

    try:
        hashed_password = generate_password_hash(data['password'], method='sha256')
        new_user = User(
            email=data['email'],
            password=hashed_password,
            is_admin=data.get('is_admin', False),
            created_at=datetime.strptime('2025-03-05 19:30:39', '%Y-%m-%d %H:%M:%S')
        )
        db.session.add(new_user)
        db.session.commit()
        logger.info(f"User created successfully: {data['email']}")
        return jsonify({'message': 'User created successfully', 'user_id': new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating user: {str(e)}")
        return jsonify({'message': f'Failed to create user: {str(e)}'}), 500

@app.route('/api/admin/create-user', methods=['POST'])
def admin_create_student():
    logger.debug("Admin create student request received")
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to create student")
        return jsonify({'message': 'Unauthorized'}), 401

    data = request.json
    if User.query.filter_by(email=data['email']).first():
        logger.warning(f"User already exists: {data['email']}")
        return jsonify({'message': 'User already exists'}), 400

    import random, string
    random_password = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
    try:
        hashed_password = generate_password_hash(random_password, method='sha256')
        new_user = User(
            email=data['email'],
            password=hashed_password,
            is_admin=False,
            created_at=datetime.utcnow()
        )
        db.session.add(new_user)
        db.session.commit()

        new_application = Application(
            user_id=new_user.id,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            contact_number=data.get('contact_number', ''),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(new_application)
        db.session.commit()

        logger.info(f"Student created successfully: {data['email']}")
        return jsonify({
            'message': 'Student created successfully',
            'user_id': new_user.id,
            'application_id': new_application.id,
            'temp_password': random_password
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating student: {str(e)}")
        return jsonify({'message': f'Failed to create student: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    logger.debug(f"Login attempt for: {data['email']}")
    try:
        user = User.query.filter_by(email=data['email']).first()
        if not user or not check_password_hash(user.password, data['password']):
            logger.warning(f"Invalid credentials for: {data['email']}")
            return jsonify({'message': 'Invalid credentials'}), 401

        session.clear()
        session['user_id'] = user.id
        session['is_admin'] = user.is_admin
        logger.info(f"Login successful for: {data['email']}, admin: {user.is_admin}")
        return jsonify({
            'message': 'Login successful',
            'user_id': user.id,
            'is_admin': user.is_admin
        }), 200
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'message': f'Login error: {str(e)}'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    logger.debug(f"Logout request for user_id: {session.get('user_id')}")
    session.pop('user_id', None)
    session.pop('is_admin', None)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    logger.debug(f"Check auth request: user_id in session: {'user_id' in session}")
    if 'user_id' in session:
        logger.info(f"User authenticated: {session['user_id']}, is_admin: {session.get('is_admin', False)}")
        return jsonify({
            'authenticated': True,
            'user_id': session['user_id'],
            'is_admin': session.get('is_admin', False)
        }), 200
    logger.warning("User not authenticated")
    return jsonify({'authenticated': False}), 401

@app.route('/api/submit-application', methods=['POST'])
def submit_application():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    user_id = session['user_id']
    data = request.json
    current_time = datetime.strptime('2025-03-05 19:30:39', '%Y-%m-%d %H:%M:%S')

    existing_application = Application.query.filter_by(user_id=user_id).first()
    if existing_application:
        for key, value in data.items():
            if hasattr(existing_application, key):
                setattr(existing_application, key, value)
        existing_application.updated_at = current_time
        db.session.commit()
        return jsonify({'message': 'Application updated successfully'}), 200

    new_application = Application(
        user_id=user_id,
        first_name=data.get('first_name'),
        middle_name=data.get('middle_name'),
        last_name=data.get('last_name'),
        contact_number=data.get('contact_number'),
        gender=data.get('gender'),
        final_percentage=data.get('final_percentage'),
        tentative_ranking=data.get('tentative_ranking'),
        final_year_project=data.get('final_year_project'),
        other_projects=data.get('other_projects'),
        publications=data.get('publications'),
        extracurricular=data.get('extracurricular'),
        professional_experience=data.get('professional_experience'),
        strong_points=data.get('strong_points'),
        weak_points=data.get('weak_points'),
        transcript=data.get('transcript'),
        cv=data.get('cv'),
        photo=data.get('photo'),
        preferred_programs=data.get('preferred_programs'),
        references=data.get('references'),
        statement_of_purpose=data.get('statement_of_purpose'),
        intended_research_areas=data.get('intended_research_areas'),
        english_proficiency=data.get('english_proficiency'),
        leadership_experience=data.get('leadership_experience'),
        availability_to_start=data.get('availability_to_start'),
        additional_certifications=data.get('additional_certifications'),
        created_at=current_time,
        updated_at=current_time
    )
    db.session.add(new_application)
    db.session.commit()
    return jsonify({'message': 'Application submitted successfully'}), 201

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['file']
    file_type = request.form.get('type')
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    filename = secure_filename(f"{session['user_id']}_{file_type}_{file.filename}")
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    application = Application.query.filter_by(user_id=session['user_id']).first()
    if application:
        if file_type == 'transcript':
            application.transcript = file_path
        elif file_type == 'cv':
            application.cv = file_path
        elif file_type == 'photo':
            application.photo = file_path
        application.updated_at = datetime.strptime('2025-03-05 19:32:42', '%Y-%m-%d %H:%M:%S')
        db.session.commit()
    return jsonify({'message': 'File uploaded successfully', 'path': file_path}), 200

@app.route('/api/get-application', methods=['GET'])
def get_application():
    if 'user_id' not in session:
        logger.warning("Unauthorized attempt to get application")
        return jsonify({'message': 'Unauthorized'}), 401

    user_id = request.args.get('user_id', session['user_id'])
    logger.debug(f"Get application request for user_id: {user_id}")
    if str(user_id) != str(session['user_id']) and not session.get('is_admin', False):
        logger.warning(f"Unauthorized attempt to view another user's application: {user_id}")
        return jsonify({'message': 'Unauthorized'}), 401

    application = Application.query.filter_by(user_id=user_id).first()
    if not application:
        logger.warning(f"Application not found for user_id: {user_id}")
        return jsonify({'message': 'Application not found'}), 404

    logger.info(f"Application data retrieved for user_id: {user_id}")
    return jsonify(application_to_dict(application)), 200

@app.route('/uploads/<path:filename>', methods=['GET'])
def serve_file(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        normalized_path = os.path.normpath(file_path)
        if not normalized_path.startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
            logger.warning(f"Attempted directory traversal attack: {filename}")
            abort(403)
        if not os.path.isfile(normalized_path):
            logger.warning(f"File not found: {normalized_path}")
            abort(404)
        return send_file(normalized_path, as_attachment=True)
    except Exception as e:
        logger.error(f"Error serving file {filename}: {str(e)}")
        abort(500)

@app.route('/api/generate-report/<int:application_id>', methods=['GET'])
def generate_report(application_id):
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to generate report")
        return jsonify({'message': 'Unauthorized'}), 401
    try:
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'message': 'Application not found'}), 404

        buffer = BytesIO()
        report_text = f"""
Application Report
-----------------
Name: {application.first_name} {application.last_name}
Contact: {application.contact_number}
Gender: {application.gender}
Final Percentage: {application.final_percentage}%
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        buffer.write(report_text.encode())
        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='text/plain',
            as_attachment=True,
            download_name=f"{application.first_name.lower()}_{application.last_name.lower()}_report.txt"
        )
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        return jsonify({'message': f'Error generating report: {str(e)}'}), 500

@app.route('/api/get-application/<int:application_id>', methods=['GET'])
def get_application_by_id(application_id):
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to get application by ID")
        return jsonify({'message': 'Unauthorized'}), 401

    logger.debug(f"Get application request by ID: {application_id}")
    application = Application.query.get(application_id)
    if not application:
        logger.warning(f"Application not found for ID: {application_id}")
        return jsonify({'message': 'Application not found'}), 404

    logger.info(f"Application data retrieved for ID: {application_id}")
    return jsonify(application_to_dict(application)), 200

@app.route('/api/get-all-applications', methods=['GET'])
def get_all_applications():
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to get all applications")
        return jsonify({'message': 'Unauthorized'}), 401

    logger.debug("Get all applications request")
    applications = Application.query.all()
    applications_data = []
    for application in applications:
        user = User.query.get(application.user_id)
        applications_data.append({
            'id': application.id,
            'user_id': application.user_id,
            'email': user.email if user else 'Unknown',
            'first_name': application.first_name,
            'last_name': application.last_name,
            'contact_number': application.contact_number,
            'gender': application.gender,
            'final_percentage': application.final_percentage,
        })
    logger.info(f"Retrieved {len(applications_data)} applications")
    return jsonify(applications_data), 200

@app.route('/api/update-application/<int:application_id>', methods=['PUT'])
def update_application(application_id):
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to update application")
        return jsonify({'message': 'Unauthorized'}), 401

    logger.debug(f"Update application request for ID: {application_id}")
    application = Application.query.get(application_id)
    if not application:
        logger.warning(f"Application not found for ID: {application_id}")
        return jsonify({'message': 'Application not found'}), 404

    data = request.json
    for key, value in data.items():
        if hasattr(application, key) and key not in ['id', 'user_id', 'created_at', 'updated_at']:
            if key == 'final_percentage' and value is not None:
                try:
                    setattr(application, key, float(value))
                except (ValueError, TypeError):
                    logger.warning(f"Failed to convert final_percentage value: {value}")
                    pass
            else:
                setattr(application, key, value)
    application.updated_at = datetime.strptime('2025-03-05 19:32:42', '%Y-%m-%d %H:%M:%S')
    try:
        db.session.commit()
        logger.info(f"Application updated successfully: {application_id}")
        return jsonify({'message': 'Application updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to update application: {str(e)}")
        return jsonify({'message': f'Failed to update application: {str(e)}'}), 500

@app.route('/api/delete-application/<int:application_id>', methods=['DELETE'])
def delete_application(application_id):
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to delete application")
        return jsonify({'message': 'Unauthorized'}), 401

    logger.debug(f"Delete application request for ID: {application_id}")
    application = Application.query.get(application_id)
    if not application:
        logger.warning(f"Application not found for ID: {application_id}")
        return jsonify({'message': 'Application not found'}), 404

    try:
        db.session.delete(application)
        db.session.commit()
        logger.info(f"Application deleted successfully: {application_id}")
        return jsonify({'message': 'Application deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete application: {str(e)}")
        return jsonify({'message': f'Failed to delete application: {str(e)}'}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to get all users")
        return jsonify({'message': 'Unauthorized'}), 401

    logger.debug("Get all users request")
    users = User.query.filter(User.is_admin == False).all()
    users_data = []
    for user in users:
        application = Application.query.filter_by(user_id=user.id).first()
        users_data.append({
            'id': user.id,
            'email': user.email,
            'has_application': application is not None,
            'application_id': application.id if application else None,
            'first_name': application.first_name if application else '',
            'last_name': application.last_name if application else ''
        })
    logger.info(f"Retrieved {len(users_data)} users")
    return jsonify(users_data), 200

@app.route('/api/admin/delete-user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to delete user")
        return jsonify({'message': 'Unauthorized'}), 401

    user = User.query.get(user_id)
    if not user:
        logger.warning(f"User not found for deletion: {user_id}")
        return jsonify({'message': 'User not found'}), 404
    try:
        db.session.delete(user)
        db.session.commit()
        logger.info(f"User deleted successfully: {user.email}")
        return jsonify({'message': f'User {user.email} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete user: {str(e)}")
        return jsonify({'message': f'Failed to delete user: {str(e)}'}), 500

@app.route('/api/admin/reset-password/<int:user_id>', methods=['POST'])
def reset_user_password(user_id):
    if 'user_id' not in session or not session.get('is_admin', False):
        logger.warning("Unauthorized attempt to reset password")
        return jsonify({'message': 'Unauthorized'}), 401

    logger.debug(f"Reset password request for user_id: {user_id}")
    user = User.query.get(user_id)
    if not user:
        logger.warning(f"User not found for ID: {user_id}")
        return jsonify({'message': 'User not found'}), 404

    import random, string
    random_password = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
    user.password = generate_password_hash(random_password, method='sha256')
    db.session.commit()
    logger.info(f"Password reset successfully for user_id: {user_id}")
    return jsonify({
        'message': 'Password reset successfully',
        'temp_password': random_password
    }), 200

@app.route('/api/debug/current-user', methods=['GET'])
def debug_current_user():
    logger.debug("Debug current user request")
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'user_id': user.id,
                'email': user.email,
                'is_admin': user.is_admin
            }), 200
    return jsonify({'message': 'No user logged in'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)