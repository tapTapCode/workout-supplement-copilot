<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package ShopLaz_Reviews
 */

// If uninstall not called from WordPress, then exit.
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Check if user has permission to uninstall
if (!current_user_can('activate_plugins')) {
    return;
}

// Delete plugin options
delete_option('shoplaz_reviews_version');
delete_option('shoplaz_reviews_require_approval');
delete_option('shoplaz_reviews_allow_anonymous');
delete_option('shoplaz_reviews_min_rating');
delete_option('shoplaz_reviews_max_rating');

// Delete Shopee API options
delete_option('shoplaz_shopee_partner_id');
delete_option('shoplaz_shopee_partner_key');
delete_option('shoplaz_shopee_shop_id');
delete_option('shoplaz_shopee_access_token');
delete_option('shoplaz_shopee_region');

// Delete Lazada API options
delete_option('shoplaz_lazada_app_key');
delete_option('shoplaz_lazada_app_secret');
delete_option('shoplaz_lazada_access_token');
delete_option('shoplaz_lazada_user_id');
delete_option('shoplaz_lazada_region');

// Delete database tables
global $wpdb;

$reviews_table = $wpdb->prefix . 'shoplaz_reviews';
$stores_table = $wpdb->prefix . 'shoplaz_review_stores';

$wpdb->query("DROP TABLE IF EXISTS $reviews_table");
$wpdb->query("DROP TABLE IF EXISTS $stores_table");

// Clear scheduled events
wp_clear_scheduled_hook('shoplaz_reviews_sync');

