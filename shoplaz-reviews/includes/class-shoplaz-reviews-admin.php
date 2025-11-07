<?php
/**
 * Admin functionality for ShopLaz Reviews
 *
 * @package ShopLaz_Reviews
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin class
 */
class ShopLaz_Reviews_Admin {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_shoplaz_save_store', array($this, 'handle_save_store'));
        add_action('wp_ajax_shoplaz_delete_store', array($this, 'handle_delete_store'));
        add_action('wp_ajax_shoplaz_sync_reviews', array($this, 'handle_sync_reviews'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('ShopLaz Reviews', 'shoplaz-reviews'),
            __('Reviews', 'shoplaz-reviews'),
            'manage_options',
            'shoplaz-reviews',
            array($this, 'render_admin_page'),
            'dashicons-star-filled',
            30
        );
        
        add_submenu_page(
            'shoplaz-reviews',
            __('All Reviews', 'shoplaz-reviews'),
            __('All Reviews', 'shoplaz-reviews'),
            'manage_options',
            'shoplaz-reviews',
            array($this, 'render_admin_page')
        );
        
        add_submenu_page(
            'shoplaz-reviews',
            __('Store URLs', 'shoplaz-reviews'),
            __('Store URLs', 'shoplaz-reviews'),
            'manage_options',
            'shoplaz-reviews-stores',
            array($this, 'render_stores_page')
        );
        
        add_submenu_page(
            'shoplaz-reviews',
            __('Settings', 'shoplaz-reviews'),
            __('Settings', 'shoplaz-reviews'),
            'manage_options',
            'shoplaz-reviews-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('shoplaz_reviews_settings', 'shoplaz_reviews_require_approval');
        register_setting('shoplaz_reviews_settings', 'shoplaz_reviews_allow_anonymous');
        register_setting('shoplaz_reviews_settings', 'shoplaz_reviews_min_rating');
        register_setting('shoplaz_reviews_settings', 'shoplaz_reviews_max_rating');
        
        // Shopee API credentials
        register_setting('shoplaz_reviews_settings', 'shoplaz_shopee_partner_id');
        register_setting('shoplaz_reviews_settings', 'shoplaz_shopee_partner_key');
        register_setting('shoplaz_reviews_settings', 'shoplaz_shopee_shop_id');
        register_setting('shoplaz_reviews_settings', 'shoplaz_shopee_access_token');
        register_setting('shoplaz_reviews_settings', 'shoplaz_shopee_region');
        
        // Lazada API credentials
        register_setting('shoplaz_reviews_settings', 'shoplaz_lazada_app_key');
        register_setting('shoplaz_reviews_settings', 'shoplaz_lazada_app_secret');
        register_setting('shoplaz_reviews_settings', 'shoplaz_lazada_access_token');
        register_setting('shoplaz_reviews_settings', 'shoplaz_lazada_user_id');
        register_setting('shoplaz_reviews_settings', 'shoplaz_lazada_region');
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'shoplaz-reviews') === false) {
            return;
        }
        
        wp_enqueue_style(
            'shoplaz-reviews-admin',
            SHOPLAZ_REVIEWS_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            SHOPLAZ_REVIEWS_VERSION
        );
        
        wp_enqueue_script(
            'shoplaz-reviews-admin',
            SHOPLAZ_REVIEWS_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            SHOPLAZ_REVIEWS_VERSION,
            true
        );
    }
    
    /**
     * Render admin page
     */
    public function render_admin_page() {
        include SHOPLAZ_REVIEWS_PLUGIN_DIR . 'admin/views/admin-page.php';
    }
    
    /**
     * Render stores page
     */
    public function render_stores_page() {
        include SHOPLAZ_REVIEWS_PLUGIN_DIR . 'admin/views/stores-page.php';
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        include SHOPLAZ_REVIEWS_PLUGIN_DIR . 'admin/views/settings-page.php';
    }
    
    /**
     * Handle save store AJAX
     */
    public function handle_save_store() {
        check_ajax_referer('shoplaz_reviews_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Unauthorized', 'shoplaz-reviews')));
        }
        
        global $wpdb;
        $stores_table = $wpdb->prefix . 'shoplaz_review_stores';
        
        $platform = sanitize_text_field($_POST['platform']);
        $store_url = esc_url_raw($_POST['store_url']);
        $store_name = sanitize_text_field($_POST['store_name']);
        $store_id = isset($_POST['store_id']) ? intval($_POST['store_id']) : 0;
        
        if (!$platform || !$store_url) {
            wp_send_json_error(array('message' => __('Platform and URL are required.', 'shoplaz-reviews')));
        }
        
        $data = array(
            'platform' => $platform,
            'store_url' => $store_url,
            'store_name' => $store_name,
            'updated_at' => current_time('mysql'),
        );
        
        if ($store_id > 0) {
            // Update existing
            $wpdb->update(
                $stores_table,
                $data,
                array('id' => $store_id),
                array('%s', '%s', '%s', '%s'),
                array('%d')
            );
            $message = __('Store updated successfully.', 'shoplaz-reviews');
        } else {
            // Insert new
            $data['created_at'] = current_time('mysql');
            $wpdb->insert(
                $stores_table,
                $data,
                array('%s', '%s', '%s', '%s', '%s')
            );
            $message = __('Store added successfully.', 'shoplaz-reviews');
        }
        
        wp_send_json_success(array('message' => $message));
    }
    
    /**
     * Handle delete store AJAX
     */
    public function handle_delete_store() {
        check_ajax_referer('shoplaz_reviews_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Unauthorized', 'shoplaz-reviews')));
        }
        
        global $wpdb;
        $stores_table = $wpdb->prefix . 'shoplaz_review_stores';
        
        $store_id = intval($_POST['store_id']);
        
        $wpdb->delete($stores_table, array('id' => $store_id), array('%d'));
        
        wp_send_json_success(array('message' => __('Store deleted successfully.', 'shoplaz-reviews')));
    }
    
    /**
     * Handle sync reviews AJAX
     */
    public function handle_sync_reviews() {
        check_ajax_referer('shoplaz_reviews_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Unauthorized', 'shoplaz-reviews')));
        }
        
        require_once SHOPLAZ_REVIEWS_PLUGIN_DIR . 'includes/class-shoplaz-reviews-sync.php';
        
        $sync = new ShopLaz_Reviews_Sync();
        $sync->sync_reviews();
        
        wp_send_json_success(array('message' => __('Reviews synced successfully.', 'shoplaz-reviews')));
    }
}

