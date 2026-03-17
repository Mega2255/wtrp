// register.js

let currentStep = 1;
const totalSteps = 4;
let formData = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupAccountTypeSelection();
    setupNavigation();
});

// Setup account type selection
function setupAccountTypeSelection() {
    const accountTypeOptions = document.querySelectorAll('.account-type-option');
    accountTypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            accountTypeOptions.forEach(opt => opt.classList.remove('border-red-500', 'bg-red-50'));
            this.classList.add('border-red-500', 'bg-red-50');
            document.getElementById('accountType').value = this.dataset.value;
        });
    });
}

// Setup navigation
function setupNavigation() {
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const form = document.getElementById('registration-form');

    nextBtn.addEventListener('click', function() {
        if (validateCurrentStep()) {
            saveStepData();
            nextStep();
        }
    });

    prevBtn.addEventListener('click', function() {
        previousStep();
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateCurrentStep()) {
            saveStepData();
            submitForm();
        }
    });
}

// Validate current step
function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
    
    let isValid = true;
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-red-500');
            isValid = false;
        } else {
            input.classList.remove('border-red-500');
        }
    });

    // Additional validation for step 2 (email validation)
    if (currentStep === 2) {
        const email = document.getElementById('email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            document.getElementById('email').classList.add('border-red-500');
            return false;
        }
    }

    // Additional validation for step 3
    if (currentStep === 3) {
        const accountType = document.getElementById('accountType').value;
        if (!accountType) {
            alert('Please select an account type');
            return false;
        }
        
        const pin = document.getElementById('pin').value;
        if (!/^\d{4}$/.test(pin)) {
            alert('PIN must be exactly 4 digits');
            document.getElementById('pin').classList.add('border-red-500');
            return false;
        }
    }

    // Additional validation for step 4
    if (currentStep === 4) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            document.getElementById('confirmPassword').classList.add('border-red-500');
            return false;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            document.getElementById('password').classList.add('border-red-500');
            return false;
        }
        
        const terms = document.getElementById('terms').checked;
        if (!terms) {
            alert('You must agree to the Terms of Service and Privacy Policy');
            return false;
        }
    }

    if (!isValid) {
        alert('Please fill in all required fields');
    }

    return isValid;
}

// Save step data
function saveStepData() {
    if (currentStep === 1) {
        formData.firstName = document.getElementById('firstName').value;
        formData.middleName = document.getElementById('middleName').value;
        formData.lastName = document.getElementById('lastName').value;
        formData.username = document.getElementById('username').value;
    } else if (currentStep === 2) {
        formData.email = document.getElementById('email').value;
        formData.phone = document.getElementById('phone').value;
        formData.country = document.getElementById('country').value;
    } else if (currentStep === 3) {
        formData.accountType = document.getElementById('accountType').value;
        formData.currency = document.getElementById('currency').value;
        formData.pin = document.getElementById('pin').value;
    } else if (currentStep === 4) {
        formData.password = document.getElementById('password').value;
    }
}

// Next step
function nextStep() {
    if (currentStep < totalSteps) {
        document.getElementById(`step-${currentStep}`).classList.add('hidden');
        currentStep++;
        document.getElementById(`step-${currentStep}`).classList.remove('hidden');
        updateProgress();
        updateButtons();
        window.scrollTo(0, 0); // Scroll to top when moving to next step
    }
}

// Previous step
function previousStep() {
    if (currentStep > 1) {
        document.getElementById(`step-${currentStep}`).classList.add('hidden');
        currentStep--;
        document.getElementById(`step-${currentStep}`).classList.remove('hidden');
        updateProgress();
        updateButtons();
        window.scrollTo(0, 0); // Scroll to top when moving to previous step
    }
}

// Update progress
function updateProgress() {
    document.getElementById('current-step').textContent = currentStep;
    
    // Update progress bars
    for (let i = 1; i <= totalSteps; i++) {
        const bar = document.getElementById(`step-bar-${i}`);
        const label = document.getElementById(`step-label-${i}`);
        
        if (i < currentStep) {
            bar.className = 'flex-1 h-1 step-indicator step-completed';
            label.className = 'text-red-700 font-medium text-xs md:text-sm';
        } else if (i === currentStep) {
            bar.className = 'flex-1 h-1 step-indicator step-active';
            label.className = 'text-red-700 font-medium text-xs md:text-sm';
        } else {
            bar.className = 'flex-1 h-1 step-indicator step-inactive';
            label.className = 'text-gray-400 text-xs md:text-sm';
        }
    }
}

// Update buttons
function updateButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (currentStep === 1) {
        prevBtn.classList.add('hidden');
    } else {
        prevBtn.classList.remove('hidden');
    }

    if (currentStep === totalSteps) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// Generate random account number
function generateAccountNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return 'ACC' + timestamp + random;
}

// Submit form
function submitForm() {
    // Show loading state
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';
    submitBtn.disabled = true;

    const accountNumber = generateAccountNumber();
    const fullName = `${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''} ${formData.lastName}`;
    
    const userData = {
        fullName: fullName,
        firstName: formData.firstName,
        middleName: formData.middleName || '',
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        accountNumber: accountNumber,
        accountType: formData.accountType,
        currency: formData.currency,
        pin: formData.pin,
        password: formData.password,
        balance: 0.00,
        status: 'pending',
        createdAt: Date.now(),
        createdBy: 'self-registration'
    };

    // Save to Firebase
    database.ref('users/' + accountNumber).set(userData)
        .then(() => {
            // Show success modal
            document.getElementById('account-number-display').textContent = accountNumber;
            document.getElementById('success-modal').classList.remove('hidden');
            document.getElementById('success-modal').classList.add('flex');
            
            // Reset form
            document.getElementById('registration-form').reset();
            currentStep = 1;
            updateProgress();
            updateButtons();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Clear form data
            formData = {};
        })
        .catch((error) => {
            alert('Error creating account: ' + error.message);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Toggle PIN/Password visibility
function togglePinVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + '-eye');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Close modal
function closeModal() {
    document.getElementById('success-modal').classList.add('hidden');
    document.getElementById('success-modal').classList.remove('flex');
    
    // Redirect to login page or refresh registration
    // window.location.href = 'login.html'; // Uncomment if you have a login page
    
    // Or stay on registration page
    window.location.reload();
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        if (!nextBtn.classList.contains('hidden')) {
            nextBtn.click();
        } else if (!submitBtn.classList.contains('hidden')) {
            submitBtn.click();
        }
    }
});

// Prevent form submission on Enter key in input fields
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextBtn = document.getElementById('next-btn');
            const submitBtn = document.getElementById('submit-btn');
            
            if (!nextBtn.classList.contains('hidden')) {
                nextBtn.click();
            } else if (!submitBtn.classList.contains('hidden')) {
                submitBtn.click();
            }
        }
    });
});