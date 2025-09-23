// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from root directory

const REVIEWS_FILE = path.join(__dirname, 'data', 'reviews.json');

// Ensure data directory exists
async function ensureDataDirectory() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Load reviews from file
async function loadReviews() {
    try {
        const data = await fs.readFile(REVIEWS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, return empty array
        return [];
    }
}

// Save reviews to file
async function saveReviews(reviews) {
    try {
        await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    } catch (error) {
        console.error('Error saving reviews:', error);
        throw error;
    }
}

// Validate review data
function validateReview(review) {
    const errors = [];
    
    if (!review.name || review.name.trim().length === 0) {
        errors.push('Name is required');
    }
    
    if (!review.review || review.review.trim().length === 0) {
        errors.push('Review text is required');
    }
    
    if (!review.rating || review.rating < 1 || review.rating > 5) {
        errors.push('Rating must be between 1 and 5');
    }
    
    if (review.name && review.name.length > 100) {
        errors.push('Name must be less than 100 characters');
    }
    
    if (review.review && review.review.length > 1000) {
        errors.push('Review must be less than 1000 characters');
    }
    
    return errors;
}

// Sanitize input to prevent XSS
function sanitizeInput(str) {
    return str.replace(/[<>\"']/g, function(match) {
        return {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

// API Routes

// GET /api/reviews - Get all reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await loadReviews();
        // Sort by date (newest first)
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        res.status(500).json({ error: 'Failed to load reviews' });
    }
});

// POST /api/reviews - Add a new review
app.post('/api/reviews', async (req, res) => {
    try {
        const reviewData = req.body;
        
        // Validate input
        const errors = validateReview(reviewData);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        
        // Sanitize input
        const sanitizedReview = {
            id: Date.now().toString(), // Simple ID generation
            name: sanitizeInput(reviewData.name.trim()),
            review: sanitizeInput(reviewData.review.trim()),
            rating: parseInt(reviewData.rating),
            date: new Date().toISOString(),
            approved: true // For automatic approval; set to false if you want manual moderation
        };
        
        // Load existing reviews
        const reviews = await loadReviews();
        
        // Add new review
        reviews.push(sanitizedReview);
        
        // Save to file
        await saveReviews(reviews);
        
        res.status(201).json({ 
            message: 'Review added successfully', 
            review: sanitizedReview 
        });
        
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// GET /api/reviews/:id - Get a specific review
app.get('/api/reviews/:id', async (req, res) => {
    try {
        const reviews = await loadReviews();
        const review = reviews.find(r => r.id === req.params.id);
        
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        res.json(review);
    } catch (error) {
        console.error('Error loading review:', error);
        res.status(500).json({ error: 'Failed to load review' });
    }
});

// DELETE /api/reviews/:id - Delete a review (for moderation)
app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const reviews = await loadReviews();
        const reviewIndex = reviews.findIndex(r => r.id === req.params.id);
        
        if (reviewIndex === -1) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        reviews.splice(reviewIndex, 1);
        await saveReviews(reviews);
        
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// GET /api/stats - Get review statistics
app.get('/api/stats', async (req, res) => {
    try {
        const reviews = await loadReviews();
        
        const stats = {
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : 0,
            ratingDistribution: {
                5: reviews.filter(r => r.rating === 5).length,
                4: reviews.filter(r => r.rating === 4).length,
                3: reviews.filter(r => r.rating === 3).length,
                2: reviews.filter(r => r.rating === 2).length,
                1: reviews.filter(r => r.rating === 1).length
            }
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
        res.status(500).json({ error: 'Failed to load statistics' });
    }
});

// Serve your main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Initialize and start server
async function startServer() {
    try {
        await ensureDataDirectory();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Visit http://localhost:${PORT} to see your app`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;