<?php
/**
 * REST API functionality for ShopLaz Reviews
 *
 * @package ShopLaz_Reviews
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * API class
 */
class ShopLaz_Reviews_API {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        register_rest_route('shoplaz-reviews/v1', '/reviews', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_reviews'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('shoplaz-reviews/v1', '/reviews', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_review'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('shoplaz-reviews/v1', '/reviews/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_review'),
            'permission_callback' => '__return_true',
        ));
    }
    
    /**
     * Get reviews
     */
    public function get_reviews($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'shoplaz_reviews';
        
        $product_id = $request->get_param('product_id');
        $status = $request->get_param('status') ?: 'approved';
        $per_page = $request->get_param('per_page') ?: 10;
        $page = $request->get_param('page') ?: 1;
        
        $where = array("status = '{$status}'");
        $where_values = array();
        
        if ($product_id) {
            $where[] = 'product_id = %d';
            $where_values[] = $product_id;
        }
        
        $where_clause = !empty($where_values) 
            ? $wpdb->prepare(implode(' AND ', $where), $where_values)
            : implode(' AND ', $where);
        
        $offset = ($page - 1) * $per_page;
        
        $reviews = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE $where_clause ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $per_page,
            $offset
        ));
        
        $total = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE $where_clause");
        
        return new WP_REST_Response(array(
            'reviews' => $reviews,
            'total' => (int) $total,
            'pages' => ceil($total / $per_page),
            'page' => (int) $page,
        ), 200);
    }
    
    /**
     * Get single review
     */
    public function get_review($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'shoplaz_reviews';
        
        $id = $request->get_param('id');
        $review = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $id
        ));
        
        if (!$review) {
            return new WP_Error('not_found', __('Review not found.', 'shoplaz-reviews'), array('status' => 404));
        }
        
        return new WP_REST_Response($review, 200);
    }
    
    /**
     * Create review
     */
    public function create_review($request) {
        $product_id = $request->get_param('product_id');
        $rating = $request->get_param('rating');
        $title = $request->get_param('title');
        $content = $request->get_param('content');
        
        if (!$product_id || !$rating || !$title || !$content) {
            return new WP_Error('missing_fields', __('Missing required fields.', 'shoplaz-reviews'), array('status' => 400));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'shoplaz_reviews';
        
        $user_id = get_current_user_id();
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
            $review_id = $wpdb->insert_id;
            $review = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $review_id));
            return new WP_REST_Response($review, 201);
        } else {
            return new WP_Error('insert_failed', __('Failed to create review.', 'shoplaz-reviews'), array('status' => 500));
        }
    }
}

