class ReviewsCarousel {
    constructor() {
        this.currentSlide = 0;
        this.reviews = [];
        this.selectedRating = 0;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.threshold = 100;
        
        this.init();
    }

    init() {
        this.loadReviews();
        this.setupEventListeners();
        this.setupTouch();
    }

    async loadReviews() {
        try {
            const response = await fetch('reviews.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.reviews = await response.json();
            console.log('Loaded reviews:', this.reviews);
            this.renderReviews();
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.renderEmptyState();
        }
    }

    renderReviews() {
        const track = document.getElementById('reviewsTrack');
        const nav = document.getElementById('carouselNav');
        
        if (!track || !nav) {
            console.error('Review elements not found');
            return;
        }
        
        if (this.reviews.length === 0) {
            this.renderEmptyState();
            return;
        }

        track.innerHTML = this.reviews.map(review => `
            <div class="review-card">
                <div class="review-content">"${review.review}"</div>
                <div class="review-author">
                    <div class="author-info">
                        <div class="author-avatar">${review.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="author-name">${review.name}</div>
                            <div class="author-date">${new Date(review.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
            </div>
        `).join('');

        nav.innerHTML = this.reviews.map((_, index) => 
            `<div class="nav-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
        ).join('');

        this.setupNavigation();
    }

    renderEmptyState() {
        const track = document.getElementById('reviewsTrack');
        if (track) {
            track.innerHTML = `
                <div class="empty-reviews">
                    <h3>No reviews yet</h3>
                    <p>Be the first to share your experience!</p>
                </div>
            `;
        }
        const nav = document.getElementById('carouselNav');
        if (nav) {
            nav.innerHTML = '';
        }
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addReviewBtn');
        const closeBtn = document.getElementById('closeModal');
        const modal = document.getElementById('reviewModal');
        const form = document.getElementById('reviewForm');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (modal) modal.style.display = 'block';
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'reviewModal') {
                    modal.style.display = 'none';
                }
            });
        }

        document.querySelectorAll('.rating-star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.selectedRating = parseInt(e.target.dataset.rating);
                this.updateRatingDisplay();
            });

            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.highlightStars(rating);
            });
        });

        const ratingInput = document.getElementById('ratingInput');
        if (ratingInput) {
            ratingInput.addEventListener('mouseleave', () => {
                this.highlightStars(this.selectedRating);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReview();
            });
        }

        if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
    }

    setupTouch() {
        const track = document.getElementById('reviewsTrack');
        if (!track) return;
        
        track.addEventListener('mousedown', (e) => this.startDrag(e.clientX));
        track.addEventListener('mousemove', (e) => this.drag(e.clientX));
        track.addEventListener('mouseup', () => this.endDrag());
        track.addEventListener('mouseleave', () => this.endDrag());

        track.addEventListener('touchstart', (e) => this.startDrag(e.touches[0].clientX));
        track.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.drag(e.touches[0].clientX);
        });
        track.addEventListener('touchend', () => this.endDrag());
    }

    startDrag(x) {
        this.isDragging = true;
        this.startX = x;
        this.currentX = x;
        const track = document.getElementById('reviewsTrack');
        if (track) track.style.cursor = 'grabbing';
    }

    drag(x) {
        if (!this.isDragging) return;
        
        this.currentX = x;
        const diff = this.currentX - this.startX;
        const track = document.getElementById('reviewsTrack');
        if (!track) return;
        
        const currentTransform = -this.currentSlide * 100;
        track.style.transform = `translateX(${currentTransform + (diff / track.parentElement.offsetWidth) * 100}%)`;
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        const diff = this.currentX - this.startX;
        const track = document.getElementById('reviewsTrack');
        if (track) track.style.cursor = 'grab';
        
        if (Math.abs(diff) > this.threshold) {
            if (diff > 0 && this.currentSlide > 0) {
                this.prevSlide();
            } else if (diff < 0 && this.currentSlide < this.reviews.length - 1) {
                this.nextSlide();
            } else {
                this.updateSlidePosition();
            }
        } else {
            this.updateSlidePosition();
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                this.currentSlide = parseInt(e.target.dataset.slide);
                this.updateSlidePosition();
                this.updateNavigation();
            });
        });
    }

    nextSlide() {
        if (this.currentSlide < this.reviews.length - 1) {
            this.currentSlide++;
            this.updateSlidePosition();
            this.updateNavigation();
        }
    }

    prevSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateSlidePosition();
            this.updateNavigation();
        }
    }

    updateSlidePosition() {
        const track = document.getElementById('reviewsTrack');
        if (track) {
            track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        }
    }

    updateNavigation() {
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    highlightStars(rating) {
        document.querySelectorAll('.rating-star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    updateRatingDisplay() {
        this.highlightStars(this.selectedRating);
    }

    async submitReview() {
        const submitBtn = document.getElementById('submitBtn');
        const nameInput = document.getElementById('reviewerName');
        const textInput = document.getElementById('reviewText');
        
        if (!submitBtn || !nameInput || !textInput) {
            console.error('Form elements not found');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = {
            name: nameInput.value.trim(),
            review: textInput.value.trim(),
            rating: this.selectedRating
        };

        // Client-side validation
        if (!formData.name) {
            alert('Please enter your name');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
            return;
        }

        if (!formData.review) {
            alert('Please enter your review');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
            return;
        }

        if (!this.selectedRating) {
            alert('Please select a rating');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
            return;
        }

        try {
            console.log('Submitting review:', formData);
            
            const response = await fetch('reviews.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                const modal = document.getElementById('reviewModal');
                const form = document.getElementById('reviewForm');
                
                if (modal) modal.style.display = 'none';
                if (form) form.reset();
                
                this.selectedRating = 0;
                this.highlightStars(0);
                
                await this.loadReviews();
                
                this.currentSlide = 0;
                this.updateSlidePosition();
                this.updateNavigation();
                
                alert('Review submitted successfully!');
            } else {
                throw new Error(result.error || result.errors?.join(', ') || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Reviews Carousel');
    new ReviewsCarousel();
});