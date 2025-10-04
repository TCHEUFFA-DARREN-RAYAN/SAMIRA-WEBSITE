class HouseReviewsCarousel {
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
            // Updated to use PHP endpoint
            const response = await fetch('/reviews.php');
            this.reviews = await response.json();
            this.renderReviews();
        } catch (error) {
            console.error('Error loading house reviews:', error);
            this.renderEmptyState();
        }
    }

    renderReviews() {
        const track = document.getElementById('houseReviewsTrack');
        const nav = document.getElementById('houseCarouselNav');
        
        if (this.reviews.length === 0) {
            this.renderEmptyState();
            return;
        }

        track.innerHTML = this.reviews.map(review => `
            <div class="house-review-card">
                <div class="house-review-content">${review.review}</div>
                <div class="house-review-author">
                    <div class="house-author-info">
                        <div class="house-author-avatar">${review.name.charAt(0).toUpperCase()}</div>
                        <div class="house-author-details">
                            <div class="house-author-name">${review.name}</div>
                            <div class="house-author-date">${new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                    </div>
                    <div class="house-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
            </div>
        `).join('');

        nav.innerHTML = this.reviews.map((_, index) => 
            `<div class="house-nav-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
        ).join('');

        this.setupNavigation();
    }

    renderEmptyState() {
        const track = document.getElementById('houseReviewsTrack');
        track.innerHTML = `
            <div class="house-empty-reviews">
                <h3>No testimonials yet</h3>
                <p>Be the first to share your threading experience with us!</p>
            </div>
        `;
        document.getElementById('houseCarouselNav').innerHTML = '';
    }

    setupEventListeners() {
        document.getElementById('addHouseReviewBtn').addEventListener('click', () => {
            document.getElementById('houseReviewModal').style.display = 'block';
        });

        document.getElementById('houseCloseModal').addEventListener('click', () => {
            document.getElementById('houseReviewModal').style.display = 'none';
        });

        document.getElementById('houseReviewModal').addEventListener('click', (e) => {
            if (e.target.id === 'houseReviewModal') {
                document.getElementById('houseReviewModal').style.display = 'none';
            }
        });

        document.querySelectorAll('.house-rating-star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.selectedRating = parseInt(e.target.dataset.rating);
                this.updateRatingDisplay();
            });

            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.highlightStars(rating);
            });
        });

        document.getElementById('houseRatingInput').addEventListener('mouseleave', () => {
            this.highlightStars(this.selectedRating);
        });

        document.getElementById('houseReviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });

        document.getElementById('housePrevBtn').addEventListener('click', () => this.prevSlide());
        document.getElementById('houseNextBtn').addEventListener('click', () => this.nextSlide());
    }

    setupTouch() {
        const track = document.getElementById('houseReviewsTrack');
        
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
        document.getElementById('houseReviewsTrack').style.cursor = 'grabbing';
    }

    drag(x) {
        if (!this.isDragging) return;
        
        this.currentX = x;
        const diff = this.currentX - this.startX;
        const track = document.getElementById('houseReviewsTrack');
        const currentTransform = -this.currentSlide * 100;
        track.style.transform = `translateX(${currentTransform + (diff / track.parentElement.offsetWidth) * 100}%)`;
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        const diff = this.currentX - this.startX;
        document.getElementById('houseReviewsTrack').style.cursor = 'grab';
        
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
        document.querySelectorAll('.house-nav-dot').forEach(dot => {
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
        const track = document.getElementById('houseReviewsTrack');
        track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }

    updateNavigation() {
        document.querySelectorAll('.house-nav-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    highlightStars(rating) {
        document.querySelectorAll('.house-rating-star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    updateRatingDisplay() {
        this.highlightStars(this.selectedRating);
    }

    async submitReview() {
        const submitBtn = document.getElementById('houseSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = {
            name: document.getElementById('houseReviewerName').value,
            review: document.getElementById('houseReviewText').value,
            rating: this.selectedRating
        };

        if (!this.selectedRating) {
            alert('Please select a rating');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Testimonial';
            return;
        }

        try {
            // Updated to use PHP endpoint
            const response = await fetch('/reviews.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('houseReviewModal').style.display = 'none';
                document.getElementById('houseReviewForm').reset();
                this.selectedRating = 0;
                this.highlightStars(0);
                await this.loadReviews();
                // Navigate to the new review (first slide since sorted by newest)
                this.currentSlide = 0;
                this.updateSlidePosition();
                this.updateNavigation();
                
                // Show success message
                alert('Testimonial submitted successfully!');
            } else {
                throw new Error(result.error || 'Failed to submit testimonial');
            }
        } catch (error) {
            console.error('Error submitting house review:', error);
            alert('Failed to submit testimonial. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Testimonial';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HouseReviewsCarousel();
});