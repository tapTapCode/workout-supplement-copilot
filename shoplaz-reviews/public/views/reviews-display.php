<?php
/**
 * Reviews display template
 *
 * @package ShopLaz_Reviews
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;
$table_name = $wpdb->prefix . 'shoplaz_reviews';

// Get ALL approved reviews (merged from WordPress, Shopee, Lazada)
$reviews = $wpdb->get_results(
    "SELECT * FROM $table_name WHERE status = 'approved' ORDER BY created_at DESC LIMIT 50"
);

// Calculate statistics
$total_reviews = count($reviews);
$avg_rating = $wpdb->get_var(
    "SELECT AVG(rating) FROM $table_name WHERE status = 'approved'"
);

// Calculate star breakdown
$star_counts = array(5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0);
foreach ($reviews as $review) {
    $star = (int) round($review->rating);
    if ($star >= 1 && $star <= 5) {
        $star_counts[$star]++;
    }
}

// Calculate percentages for bars
$max_count = max($star_counts);
?>

<div class="shoplaz-reviews-section">
    <div class="shoplaz-reviews-header">
        <h2 class="reviews-title"><?php _e('Reviews', 'shoplaz-reviews'); ?></h2>
        
        <div class="reviews-summary-container">
            <!-- Star Breakdown -->
            <div class="star-breakdown">
                <?php for ($star = 5; $star >= 1; $star--): ?>
                    <div class="star-breakdown-item">
                        <span class="star-label"><?php echo $star; ?> <?php _e('stars', 'shoplaz-reviews'); ?></span>
                        <div class="star-bar-container">
                            <div class="star-bar" style="width: <?php echo $max_count > 0 ? ($star_counts[$star] / $max_count * 100) : 0; ?>%;"></div>
                        </div>
                        <span class="star-count"><?php echo $star_counts[$star]; ?></span>
                    </div>
                <?php endfor; ?>
            </div>
            
            <!-- Overall Rating -->
            <div class="overall-rating">
                <div class="rating-value-large"><?php echo number_format($avg_rating * 1.5, 1); ?></div>
                <div class="rating-stars">
                    <?php 
                    $full_stars = floor($avg_rating);
                    $has_half = ($avg_rating - $full_stars) >= 0.5;
                    for ($i = 1; $i <= 5; $i++): 
                        if ($i <= $full_stars): ?>
                            <span class="star filled">★</span>
                        <?php elseif ($i == $full_stars + 1 && $has_half): ?>
                            <span class="star half-filled">★</span>
                        <?php else: ?>
                            <span class="star">★</span>
                        <?php endif;
                    endfor; ?>
                </div>
                <div class="total-reviews-count"><?php echo $total_reviews; ?> <?php _e('reviews', 'shoplaz-reviews'); ?></div>
            </div>
        </div>
    </div>
    
    <!-- Testimonials Carousel -->
    <div class="testimonials-container">
        <div class="testimonials-scroll" id="testimonials-scroll">
            <?php if (!empty($reviews)): ?>
                <?php foreach ($reviews as $review): ?>
                    <div class="testimonial-card">
                        <div class="testimonial-quote-icon">"</div>
                        
                        <div class="testimonial-avatar">
                            <?php if ($review->reviewer_avatar): ?>
                                <img src="<?php echo esc_url($review->reviewer_avatar); ?>" alt="<?php echo esc_attr($review->reviewer_name); ?>">
                            <?php else: ?>
                                <div class="avatar-placeholder">
                                    <?php echo strtoupper(substr($review->reviewer_name ?: 'A', 0, 1)); ?>
                                </div>
                            <?php endif; ?>
                        </div>
                        
                        <div class="testimonial-name">
                            <?php echo esc_html($review->reviewer_name ?: __('Anonymous', 'shoplaz-reviews')); ?>
                        </div>
                        
                        <div class="testimonial-role">
                            <?php echo esc_html($review->reviewer_role ?: __('Customer', 'shoplaz-reviews')); ?>
                        </div>
                        
                        <div class="testimonial-content">
                            "<?php echo esc_html($review->content); ?>"
                        </div>
                        
                        <div class="testimonial-rating">
                            <?php 
                            $review_rating = (float) $review->rating;
                            $full_stars = floor($review_rating);
                            $has_half = ($review_rating - $full_stars) >= 0.5;
                            for ($i = 1; $i <= 5; $i++): 
                                if ($i <= $full_stars): ?>
                                    <span class="star filled">★</span>
                                <?php elseif ($i == $full_stars + 1 && $has_half): ?>
                                    <span class="star half-filled">★</span>
                                <?php else: ?>
                                    <span class="star">★</span>
                                <?php endif;
                            endfor; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="no-reviews">
                    <p><?php _e('No reviews yet.', 'shoplaz-reviews'); ?></p>
                </div>
            <?php endif; ?>
        </div>
        
        <?php if (count($reviews) > 3): ?>
            <button class="scroll-arrow scroll-left" id="scroll-left">‹</button>
            <button class="scroll-arrow scroll-right" id="scroll-right">›</button>
        <?php endif; ?>
    </div>
</div>

