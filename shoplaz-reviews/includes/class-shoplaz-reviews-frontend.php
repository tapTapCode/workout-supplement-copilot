<?php
/**
 * Frontend functionality for ShopLaz Reviews
 *
 * @package ShopLaz_Reviews
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Frontend class
 */
class ShopLaz_Reviews_Frontend {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('woocommerce_single_product_summary', array($this, 'display_reviews'), 25);
        add_action('wp_ajax_shoplaz_submit_review', array($this, 'handle_review_submission'));
        add_action('wp_ajax_nopriv_shoplaz_submit_review', array($this, 'handle_review_submission'));
        add_shortcode('shoplaz_reviews', array($this, 'reviews_shortcode'));
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_scripts() {
        wp_enqueue_style(
            'shoplaz-reviews-frontend',
            SHOPLAZ_REVIEWS_PLUGIN_URL . 'assets/css/frontend.css',
            array(),
            SHOPLAZ_REVIEWS_VERSION
        );
        
        wp_enqueue_script(
            'shoplaz-reviews-frontend',
            SHOPLAZ_REVIEWS_PLUGIN_URL . 'assets/js/frontend.js',
            array('jquery'),
            SHOPLAZ_REVIEWS_VERSION,
            true
        );
        
        wp_localize_script('shoplaz-reviews-frontend', 'shoplazReviews', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('shoplaz_reviews_nonce'),
        ));
    }
    
    /**
     * Display reviews on product page
     */
    public function display_reviews() {
        // Display reviews on any page (not just product pages)
        // This allows showing all merged reviews from WordPress, Shopee, and Lazada
        global $product;
        $product_id = $product ? $product->get_id() : 0;
        
        include SHOPLAZ_REVIEWS_PLUGIN_DIR . 'public/views/reviews-display.php';
    }
    
    /**
     * Shortcode to display reviews
     */
    public function reviews_shortcode($atts) {
        ob_start();
        include SHOPLAZ_REVIEWS_PLUGIN_DIR . 'public/views/reviews-display.php';
        return ob_get_clean();
    }
    
    /**
     * Handle review submission via AJAX
     */
    public function handle_review_submission() {
        check_ajax_referer('shoplaz_reviews_nonce', 'nonce');
        
        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        $rating = isset($_POST['rating']) ? intval($_POST['rating']) : 0;
        $title = isset($_POST['title']) ? sanitize_text_field($_POST['title']) : '';
        $content = isset($_POST['content']) ? sanitize_textarea_field($_POST['content']) : '';
        
        if (!$product_id || !$rating || !$title || !$content) {
            wp_send_json_error(array('message' => __('Please fill in all required fields.', 'shoplaz-reviews')));
        }
        
        // Validate rating
        $min_rating = get_option('shoplaz_reviews_min_rating', 1);
        $max_rating = get_option('shoplaz_reviews_max_rating', 5);
        
        if ($rating < $min_rating || $rating > $max_rating) {
            wp_send_json_error(array('message' => __('Invalid rating value.', 'shoplaz-reviews')));
        }
        
        // Save review
        global $wpdb;
        $table_name = $wpdb->prefix . 'shoplaz_reviews';
        
        $user_id = is_user_logged_in() ? get_current_user_id() : 0;
        $require_approval = get_option('shoplaz_reviews_require_approval', true);
        $status = $require_approval ? 'pending' : 'approved';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'product_id' => $product_id,
                'user_id' => $user_id,
                'rating' => $rating,
                'title' => $title,
                'content' => $content,
                'status' => $status,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ),
            array('%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            $message = $require_approval 
                ? __('Thank you! Your review is pending approval.', 'shoplaz-reviews')
                : __('Thank you! Your review has been submitted.', 'shoplaz-reviews');
            
            wp_send_json_success(array('message' => $message));
        } else {
            wp_send_json_error(array('message' => __('Error submitting review. Please try again.', 'shoplaz-reviews')));
        }
    }
}

