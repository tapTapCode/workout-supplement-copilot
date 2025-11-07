<?php
/**
 * Plugin Name: ShopLaz Reviews
 * Plugin URI: https://github.com/tapTapCode/shoplaz-reviews
 * Description: A WordPress plugin for managing and displaying product reviews for ShopLaz.
 * Version: 1.0.0
 * Author: tapTapCode
 * Author URI: https://github.com/tapTapCode
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: shoplaz-reviews
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SHOPLAZ_REVIEWS_VERSION', '1.0.0');
define('SHOPLAZ_REVIEWS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SHOPLAZ_REVIEWS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SHOPLAZ_REVIEWS_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class
 */
class ShopLaz_Reviews {
    
    /**
     * Instance of this class
     *
     * @var ShopLaz_Reviews
     */
    private static $instance = null;
    
    /**
     * Get instance of this class
     *
     * @return ShopLaz_Reviews
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init();
    }
    
    /**
     * Initialize plugin
     */
    private function init() {
        // Load plugin text domain
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        
        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Initialize plugin components
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    /**
     * Load plugin text domain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'shoplaz-reviews',
            false,
            dirname(SHOPLAZ_REVIEWS_PLUGIN_BASENAME) . '/languages'
        );
    }
    
    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        // Load includes
        require_once SHOPLAZ_REVIEWS_PLUGIN_DIR . 'includes/class-shoplaz-reviews-admin.php';
        require_once SHOPLAZ_REVIEWS_PLUGIN_DIR . 'includes/class-shoplaz-reviews-frontend.php';
        require_once SHOPLAZ_REVIEWS_PLUGIN_DIR . 'includes/class-shoplaz-reviews-api.php';
        require_once SHOPLAZ_REVIEWS_PLUGIN_DIR . 'includes/class-shoplaz-reviews-sync.php';
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Admin hooks
        if (is_admin()) {
            $admin = new ShopLaz_Reviews_Admin();
        }
        
        // Frontend hooks
        $frontend = new ShopLaz_Reviews_Frontend();
        
        // API hooks
        $api = new ShopLaz_Reviews_API();
        
        // Scheduled sync hook
        add_action('shoplaz_reviews_sync', array($this, 'run_scheduled_sync'));
    }
    
    /**
     * Run scheduled review sync
     */
    public function run_scheduled_sync() {
        $sync = new ShopLaz_Reviews_Sync();
        $sync->sync_reviews();
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        $this->create_tables();
        
        // Set default options
        $this->set_default_options();
        
        // Schedule review sync
        if (!wp_next_scheduled('shoplaz_reviews_sync')) {
            wp_schedule_event(time(), 'hourly', 'shoplaz_reviews_sync');
        }
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled sync
        wp_clear_scheduled_hook('shoplaz_reviews_sync');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Create database tables
     */
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        $table_name = $wpdb->prefix . 'shoplaz_reviews';
        $stores_table = $wpdb->prefix . 'shoplaz_review_stores';
        
        // Reviews table
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id bigint(20) UNSIGNED DEFAULT NULL,
            user_id bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            rating decimal(2,1) NOT NULL DEFAULT 5.0,
            title varchar(255) DEFAULT NULL,
            content text NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            verified_purchase tinyint(1) NOT NULL DEFAULT 0,
            helpful_count int(11) NOT NULL DEFAULT 0,
            source varchar(50) DEFAULT 'wordpress',
            external_id varchar(255) DEFAULT NULL,
            reviewer_name varchar(255) DEFAULT NULL,
            reviewer_role varchar(100) DEFAULT NULL,
            reviewer_avatar varchar(500) DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY (id),
            KEY product_id (product_id),
            KEY user_id (user_id),
            KEY status (status),
            KEY source (source),
            KEY external_id (external_id)
        ) $charset_collate;";
        
        // Store URLs table
        $sql_stores = "CREATE TABLE IF NOT EXISTS $stores_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            platform varchar(50) NOT NULL,
            store_url varchar(500) NOT NULL,
            store_name varchar(255) DEFAULT NULL,
            is_active tinyint(1) NOT NULL DEFAULT 1,
            last_sync datetime DEFAULT NULL,
            sync_interval int(11) NOT NULL DEFAULT 3600,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY (id),
            KEY platform (platform),
            KEY is_active (is_active)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        dbDelta($sql_stores);
    }
    
    /**
     * Set default plugin options
     */
    private function set_default_options() {
        $defaults = array(
            'shoplaz_reviews_version' => SHOPLAZ_REVIEWS_VERSION,
            'shoplaz_reviews_require_approval' => true,
            'shoplaz_reviews_allow_anonymous' => false,
            'shoplaz_reviews_min_rating' => 1,
            'shoplaz_reviews_max_rating' => 5,
        );
        
        foreach ($defaults as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }
    }
}

/**
 * Initialize the plugin
 */
function shoplaz_reviews_init() {
    return ShopLaz_Reviews::get_instance();
}

// Start the plugin
shoplaz_reviews_init();

