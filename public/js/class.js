document.addEventListener('DOMContentLoaded', function() {
    // Register Modal Functionality
    setupRegisterModal();
    
    // Edit Modal Functionality
    setupEditModal();
});

// Toast notification functions
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-message transform transition-all duration-300 ease-in-out translate-x-full opacity-0 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`;
    
    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const iconColor = type === 'success' ? 'text-green-400' : 'text-red-400';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const icon = type === 'success' ? 
        `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>` :
        `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;
    
    toast.innerHTML = `
        <div class="flex-1 w-0 p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <div class="${iconColor}">
                        ${icon}
                    </div>
                </div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                    <p class="text-sm font-medium ${textColor}">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="${bgColor} rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onclick="removeToast(this.parentElement.parentElement.parentElement)">
                        <span class="sr-only">Close</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

function removeToast(toast) {
    if (!toast) return;
    
    toast.classList.add('translate-x-full', 'opacity-0');
    toast.classList.remove('translate-x-0', 'opacity-100');
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

function setupRegisterModal() {
    const openModalBtns = document.querySelectorAll('#open-register-btn, #open-register-btn-mobile');
    const closeModalBtn = document.getElementById('close-register-modal');
    const modal = document.getElementById('register-modal');
    
    if (!modal) return;
    
    // Function to close modal
    function closeModal() {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
    
    // Function to open modal
    function openModal() {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        modal.style.display = 'flex';
    }
    
    // Add event listeners to all open buttons
    openModalBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', openModal);
        }
    });
    
    // Close modal when clicking the close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
}

function setupEditModal() {
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const editModal = document.getElementById('edit-modal');
    
    if (!editModal) return;
    
    // Close edit modal when clicking the close button
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', function() {
            closeEditModal();
        });
    }
    
    // Close edit modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            closeEditModal();
        }
    });
}

// Function to open edit modal
function openEditModal(studentId) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Fetch all classes first
    Promise.all([
        fetch(`/api/students/${studentId}`, {
            headers: {
                'Accept': 'application/json'
            }
        }),
        fetch('/api/classes', {
            headers: {
                'Accept': 'application/json'
            }
        })
    ])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(([student, classes]) => {
        // Populate student data
        document.getElementById('firstName-edit').value = student.firstName || '';
        document.getElementById('lastName-edit').value = student.lastName || '';
        document.getElementById('gender-edit').value = student.gender || '';
        document.getElementById('dob-edit').value = student.dob || '';
        document.getElementById('contactNumber-edit').value = student.contactNumber || '';
        document.getElementById('email-edit').value = student.email || '';
        
        // Populate class dropdown
        const classSelect = document.getElementById('classId-edit');
        classSelect.innerHTML = '';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            if (cls.id === student.classId) {
                option.selected = true;
            }
            classSelect.appendChild(option);
        });

        // Update the form action with the student ID
        const form = document.getElementById('edit-student-form');
        form.action = `/api/students/${studentId}`;
        
        // Add form submission handler
        form.onsubmit = function(e) {
            e.preventDefault();
            updateStudent(studentId, form);
        };
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        showToast('Error loading student data. Please try again.', 'error');
        closeEditModal();
    });
}

// Function to close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Function to update student
function updateStudent(studentId, form) {
    const formData = new FormData(form);
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        gender: formData.get('gender'),
        dob: formData.get('dob'),
        contactNumber: formData.get('contactNumber'),
        email: formData.get('email'),
        classId: formData.get('classId')
    };
    
    fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to update student');
    })
    .then(response => {
        console.log("RESPONSE:::", response);
        
        showToast('Student updated successfully!', 'success');
        closeEditModal();
        // Reload the page to show updated data
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    })
    .catch(error => {
        console.error('Error updating student:', error);
        showToast('Error updating student. Please try again.', 'error');
    });
}
