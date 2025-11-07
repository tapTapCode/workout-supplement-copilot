<?php
/**
 * Admin page view
 *
 * @package ShopLaz_Reviews
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="shoplaz-reviews-admin">
        <h2><?php _e('Reviews Management', 'shoplaz-reviews'); ?></h2>
        
        <p><?php _e('Manage product reviews for ShopLaz.', 'shoplaz-reviews'); ?></p>
        
        <!-- Reviews list will go here -->
        <div id="shoplaz-reviews-list">
            <p><?php _e('Reviews management interface coming soon...', 'shoplaz-reviews'); ?></p>
        </div>
    </div>
</div>

