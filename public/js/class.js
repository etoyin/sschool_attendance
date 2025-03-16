document.addEventListener('DOMContentLoaded', function() {
    // Register Modal Functionality
    setupRegisterModal();
    
    // Edit Modal Functionality
    setupEditModal();
});

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

    // Fetch student data and populate the form
    fetch(`/api/students/${studentId}`)
        .then(response => response.json())
        .then(student => {
            document.getElementById('firstName-edit').value = student.firstName;
            document.getElementById('lastName-edit').value = student.lastName;
            document.getElementById('gender-edit').value = student.gender;
            document.getElementById('dob-edit').value = student.dob;
            document.getElementById('contactNumber-edit').value = student.contactNumber;
            document.getElementById('email-edit').value = student.email;

            // Update the form action with the student ID
            const form = document.getElementById('edit-student-form');
            form.action = `/api/students/${studentId}`;
        })
        .catch(error => console.error('Error fetching student data:', error));
}

// Function to close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    modal.style.display = 'none';
}
