// Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('show');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('nav') && !event.target.closest('.mobile-menu-btn')) {
            if (navMenu && navMenu.classList.contains('show')) {
                navMenu.classList.remove('show');
            }
        }
    });
    
    // Gallery Model
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryModal = document.querySelector('.gallery-modal');
    const modalImage = document.querySelector('.gallery-modal-content img');
    const modalDesc = document.querySelector('.gallery-modal-desc');
    const modalClose = document.querySelector('.gallery-modal-close');
    
    if (galleryItems.length && galleryModal && modalImage && modalDesc && modalClose) {
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                const imgSrc = this.querySelector('img').getAttribute('src');
                const imgDesc = this.querySelector('.gallery-item-overlay').innerHTML;
                
                modalImage.setAttribute('src', imgSrc);
                modalDesc.innerHTML = imgDesc;
                galleryModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });
        
        modalClose.addEventListener('click', function() {
            galleryModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        galleryModal.addEventListener('click', function(event) {
            if (event.target === galleryModal) {
                galleryModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Active Navigation Link
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        }
    });


// Form Validation
function validateForm() {
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');
    let isValid = true;
    
    if (name && name.value.trim() === '') {
        alert('Please enter your name');
        name.focus();
        isValid = false;
    }
    
    if (email && email.value.trim() === '') {
        alert('Please enter your email');
        email.focus();
        isValid = false;
    } else if (email && !validateEmail(email.value)) {
        alert('Please enter a valid email address');
        email.focus();
        isValid = false;
    }
    
    if (message && message.value.trim() === '') {
        alert('Please enter your message');
        message.focus();
        isValid = false;
    }
    
    return isValid;
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
