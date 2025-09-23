class ReviewsCarousel {
    constructor() {
        this.currentSlide = 0;
        this.reviews = [];
        this.selectedRating = 0;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.threshold = 100; // Minimum distance for swipe
        
        this.init();
    }

    init() {
        this.loadReviews();
        this.setupEventListeners();
        this.setupTouch();
    }

    async loadReviews() {
        try {
            const response = await fetch('/api/reviews');
            this.reviews = await response.json();
            this.renderReviews();
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.renderEmptyState();
        }
    }

    renderReviews() {
        const track = document.getElementById('reviewsTrack');
        const nav = document.getElementById('carouselNav');
        
        if (this.reviews.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Render review cards
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

        // Render navigation dots
        nav.innerHTML = this.reviews.map((_, index) => 
            `<div class="nav-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
        ).join('');

        this.setupNavigation();
    }

    renderEmptyState() {
        const track = document.getElementById('reviewsTrack');
        track.innerHTML = `
            <div class="empty-reviews">
                <h3>No reviews yet</h3>
                <p>Be the first to share your experience!</p>
            </div>
        `;
        document.getElementById('carouselNav').innerHTML = '';
    }

    setupEventListeners() {
        // Add review button
        document.getElementById('addReviewBtn').addEventListener('click', () => {
            document.getElementById('reviewModal').style.display = 'block';
        });

        // Close modal
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('reviewModal').style.display = 'none';
        });

        // Modal background click
        document.getElementById('reviewModal').addEventListener('click', (e) => {
            if (e.target.id === 'reviewModal') {
                document.getElementById('reviewModal').style.display = 'none';
            }
        });

        // Rating stars
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

        document.getElementById('ratingInput').addEventListener('mouseleave', () => {
            this.highlightStars(this.selectedRating);
        });

        // Form submission
        document.getElementById('reviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });

        // Arrow navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.prevSlide());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());
    }

    setupTouch() {
        const track = document.getElementById('reviewsTrack');
        
        // Mouse events
        track.addEventListener('mousedown', (e) => this.startDrag(e.clientX));
        track.addEventListener('mousemove', (e) => this.drag(e.clientX));
        track.addEventListener('mouseup', () => this.endDrag());
        track.addEventListener('mouseleave', () => this.endDrag());

        // Touch events
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
        document.getElementById('reviewsTrack').style.cursor = 'grabbing';
    }

    drag(x) {
        if (!this.isDragging) return;
        
        this.currentX = x;
        const diff = this.currentX - this.startX;
        const track = document.getElementById('reviewsTrack');
        const currentTransform = -this.currentSlide * 100;
        track.style.transform = `translateX(${currentTransform + (diff / track.parentElement.offsetWidth) * 100}%)`;
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        const diff = this.currentX - this.startX;
        document.getElementById('reviewsTrack').style.cursor = 'grab';
        
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
        track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
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
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = {
            name: document.getElementById('reviewerName').value,
            review: document.getElementById('reviewText').value,
            rating: this.selectedRating
        };

        if (!this.selectedRating) {
            alert('Please select a rating');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
            return;
        }

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                document.getElementById('reviewModal').style.display = 'none';
                document.getElementById('reviewForm').reset();
                this.selectedRating = 0;
                this.highlightStars(0);
                await this.loadReviews();
                // Navigate to the new review (last slide)
                this.currentSlide = this.reviews.length - 1;
                this.updateSlidePosition();
                this.updateNavigation();
            } else {
                throw new Error('Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    }
}

// Initialize the carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReviewsCarousel();
});