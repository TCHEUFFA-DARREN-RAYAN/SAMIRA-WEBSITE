        class BouncingBall {
            constructor(container, ballElement) {
                this.container = container;
                this.ball = ballElement;
                
                // Wait for container to be properly sized
                this.init();
            }
            
            init() {
                // Ensure container has dimensions
                if (this.container.offsetWidth === 0 || this.container.offsetHeight === 0) {
                    setTimeout(() => this.init(), 100);
                    return;
                }
                
                // Ball properties
                this.size = Math.random() * 10 + 10; // Random size between 10-20px
                this.ball.style.width = this.size + 'px';
                this.ball.style.height = this.size + 'px';
                
                // Random starting position (ensure it's within bounds)
                this.x = Math.random() * Math.max(0, this.container.offsetWidth - this.size);
                this.y = Math.random() * Math.max(0, this.container.offsetHeight - this.size);
                
                // Random velocity (speed and direction)
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                
                // Ensure minimum velocity
                if (Math.abs(this.vx) < 1) this.vx = this.vx > 0 ? 1 : -1;
                if (Math.abs(this.vy) < 1) this.vy = this.vy > 0 ? 1 : -1;
                
                this.colors = ['color-1', 'color-2', 'color-3'];
                
                // Set initial position
                this.updatePosition();
            }
            
            changeColor() {
                // Remove all color classes
                this.ball.classList.remove(...this.colors);
                // Add new random color class
                const randomIndex = Math.floor(Math.random() * this.colors.length);
                this.ball.classList.add(this.colors[randomIndex]);
            }
            
            updatePosition() {
                this.ball.style.left = this.x + 'px';
                this.ball.style.top = this.y + 'px';
            }
            
            update() {
                // Skip if container not ready
                if (this.container.offsetWidth === 0 || this.container.offsetHeight === 0) {
                    return;
                }
                
                // Update position
                this.x += this.vx;
                this.y += this.vy;
                
                let bounced = false;
                
                // Bounce off walls with proper bounds checking
                if (this.x <= 0) {
                    this.x = 0;
                    this.vx = Math.abs(this.vx);
                    bounced = true;
                } else if (this.x >= this.container.offsetWidth - this.size) {
                    this.x = this.container.offsetWidth - this.size;
                    this.vx = -Math.abs(this.vx);
                    bounced = true;
                }
                
                if (this.y <= 0) {
                    this.y = 0;
                    this.vy = Math.abs(this.vy);
                    bounced = true;
                } else if (this.y >= this.container.offsetHeight - this.size) {
                    this.y = this.container.offsetHeight - this.size;
                    this.vy = -Math.abs(this.vy);
                    bounced = true;
                }
                
                if (bounced) {
                    this.changeColor();
                    this.addRandomness();
                }
                
                this.updatePosition();
            }
            
            addRandomness() {
                // Add slight variation to prevent balls from getting stuck in patterns
                const variation = 0.1;
                this.vx += (Math.random() - 0.5) * variation;
                this.vy += (Math.random() - 0.5) * variation;
                
                // Maintain reasonable speed limits
                const maxSpeed = 5;
                const minSpeed = 0.5;
                
                if (Math.abs(this.vx) > maxSpeed) this.vx = this.vx > 0 ? maxSpeed : -maxSpeed;
                if (Math.abs(this.vy) > maxSpeed) this.vy = this.vy > 0 ? maxSpeed : -maxSpeed;
                if (Math.abs(this.vx) < minSpeed) this.vx = this.vx > 0 ? minSpeed : -minSpeed;
                if (Math.abs(this.vy) < minSpeed) this.vy = this.vy > 0 ? minSpeed : -minSpeed;
            }
            
            handleResize() {
                // Adjust position if out of bounds after resize
                if (this.x > this.container.offsetWidth - this.size) {
                    this.x = Math.max(0, this.container.offsetWidth - this.size);
                }
                if (this.y > this.container.offsetHeight - this.size) {
                    this.y = Math.max(0, this.container.offsetHeight - this.size);
                }
                this.updatePosition();
            }
        }
        
        // Background slideshow functionality
        class BackgroundSlideshow {
            constructor() {
                this.slides = document.querySelectorAll('.background-slide');
                this.currentSlide = 0;
                this.slideInterval = 4000; // 4 seconds per slide
                this.start();
            }
            
            start() {
                if (this.slides.length <= 1) return;
                
                setInterval(() => {
                    this.nextSlide();
                }, this.slideInterval);
            }
            
            nextSlide() {
                // Remove active class from current slide
                this.slides[this.currentSlide].classList.remove('active');
                
                // Move to next slide
                this.currentSlide = (this.currentSlide + 1) % this.slides.length;
                
                // Add active class to new slide
                this.slides[this.currentSlide].classList.add('active');
            }
        }
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.bouncing-balls-container');
            const balls = document.querySelectorAll('.bouncing-ball');
            const bouncingBalls = [];
            
            if (!container) {
                console.error('Bouncing balls container not found');
                return;
            }
            
            // Initialize background slideshow
            const slideshow = new BackgroundSlideshow();
            
            // Create bouncing ball objects
            balls.forEach((ball) => {
                bouncingBalls.push(new BouncingBall(container, ball));
            });
            
            // Animation loop
            function animate() {
                bouncingBalls.forEach(ball => ball.update());
                requestAnimationFrame(animate);
            }
            
            // Start animation after a short delay to ensure everything is loaded
            setTimeout(() => {
                animate();
            }, 100);
            
            // Handle window resize
            let resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    bouncingBalls.forEach(ball => ball.handleResize());
                }, 250);
            });
        });