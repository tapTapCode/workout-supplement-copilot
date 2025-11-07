<?php
/**
 * Store URLs management page
 *
 * @package ShopLaz_Reviews
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;
$stores_table = $wpdb->prefix . 'shoplaz_review_stores';
$stores = $wpdb->get_results("SELECT * FROM $stores_table ORDER BY created_at DESC");
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="shoplaz-reviews-admin">
        <h2><?php _e('Manage Store URLs', 'shoplaz-reviews'); ?></h2>
        <p><?php _e('Add Shopee and Lazada store URLs to automatically sync reviews.', 'shoplaz-reviews'); ?></p>
        
        <!-- Add Store Form -->
        <div class="shoplaz-add-store-form" style="background: #fff; padding: 1.5em; margin: 1em 0; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
            <h3><?php _e('Add New Store', 'shoplaz-reviews'); ?></h3>
            <form id="shoplaz-store-form">
                <input type="hidden" name="store_id" id="store_id" value="0">
                <input type="hidden" name="nonce" value="<?php echo wp_create_nonce('shoplaz_reviews_admin_nonce'); ?>">
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="platform"><?php _e('Platform', 'shoplaz-reviews'); ?> *</label>
                        </th>
                        <td>
                            <select name="platform" id="platform" required>
                                <option value=""><?php _e('Select platform', 'shoplaz-reviews'); ?></option>
                                <option value="shopee"><?php _e('Shopee', 'shoplaz-reviews'); ?></option>
                                <option value="lazada"><?php _e('Lazada', 'shoplaz-reviews'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="store_name"><?php _e('Store Name', 'shoplaz-reviews'); ?></label>
                        </th>
                        <td>
                            <input type="text" name="store_name" id="store_name" class="regular-text" placeholder="<?php _e('Optional store name', 'shoplaz-reviews'); ?>">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="store_url"><?php _e('Store URL', 'shoplaz-reviews'); ?> *</label>
                        </th>
                        <td>
                            <input type="url" name="store_url" id="store_url" class="regular-text" required placeholder="https://shopee.sg/shop/... or https://www.lazada.sg/shop/...">
                            <p class="description">
                                <?php _e('Enter the full URL of your Shopee or Lazada store page.', 'shoplaz-reviews'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button type="submit" class="button button-primary"><?php _e('Save Store', 'shoplaz-reviews'); ?></button>
                    <button type="button" class="button" id="cancel-edit" style="display:none;"><?php _e('Cancel', 'shoplaz-reviews'); ?></button>
                </p>
            </form>
        </div>
        
        <!-- Stores List -->
        <div class="shoplaz-stores-list" style="background: #fff; padding: 1.5em; margin: 1em 0; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
            <h3><?php _e('Configured Stores', 'shoplaz-reviews'); ?></h3>
            
            <?php if (empty($stores)): ?>
                <p><?php _e('No stores configured yet.', 'shoplaz-reviews'); ?></p>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th><?php _e('Platform', 'shoplaz-reviews'); ?></th>
                            <th><?php _e('Store Name', 'shoplaz-reviews'); ?></th>
                            <th><?php _e('URL', 'shoplaz-reviews'); ?></th>
                            <th><?php _e('Status', 'shoplaz-reviews'); ?></th>
                            <th><?php _e('Last Sync', 'shoplaz-reviews'); ?></th>
                            <th><?php _e('Actions', 'shoplaz-reviews'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($stores as $store): ?>
                            <tr>
                                <td>
                                    <strong><?php echo esc_html(ucfirst($store->platform)); ?></strong>
                                </td>
                                <td><?php echo esc_html($store->store_name ?: '-'); ?></td>
                                <td>
                                    <a href="<?php echo esc_url($store->store_url); ?>" target="_blank">
                                        <?php echo esc_html($store->store_url); ?>
                                    </a>
                                </td>
                                <td>
                                    <?php if ($store->is_active): ?>
                                        <span style="color: green;"><?php _e('Active', 'shoplaz-reviews'); ?></span>
                                    <?php else: ?>
                                        <span style="color: red;"><?php _e('Inactive', 'shoplaz-reviews'); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php echo $store->last_sync ? date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($store->last_sync)) : __('Never', 'shoplaz-reviews'); ?>
                                </td>
                                <td>
                                    <button class="button edit-store" data-store-id="<?php echo $store->id; ?>" data-platform="<?php echo esc_attr($store->platform); ?>" data-store-name="<?php echo esc_attr($store->store_name); ?>" data-store-url="<?php echo esc_attr($store->store_url); ?>">
                                        <?php _e('Edit', 'shoplaz-reviews'); ?>
                                    </button>
                                    <button class="button delete-store" data-store-id="<?php echo $store->id; ?>">
                                        <?php _e('Delete', 'shoplaz-reviews'); ?>
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        
        <!-- Sync Button -->
        <div style="margin-top: 1em;">
            <button id="sync-reviews-btn" class="button button-primary button-large">
                <?php _e('Sync Reviews Now', 'shoplaz-reviews'); ?>
            </button>
            <p class="description">
                <?php _e('Manually trigger a review sync from all active stores.', 'shoplaz-reviews'); ?>
            </p>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // Handle form submission
    $('#shoplaz-store-form').on('submit', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const button = form.find('button[type="submit"]');
        const originalText = button.text();
        
        button.prop('disabled', true).text('Saving...');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'shoplaz_save_store',
                nonce: form.find('input[name="nonce"]').val(),
                platform: $('#platform').val(),
                store_url: $('#store_url').val(),
                store_name: $('#store_name').val(),
                store_id: $('#store_id').val()
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data.message);
                    location.reload();
                } else {
                    alert(response.data.message);
                    button.prop('disabled', false).text(originalText);
                }
            },
            error: function() {
                alert('An error occurred. Please try again.');
                button.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // Handle edit
    $('.edit-store').on('click', function() {
        $('#store_id').val($(this).data('store-id'));
        $('#platform').val($(this).data('platform'));
        $('#store_name').val($(this).data('store-name'));
        $('#store_url').val($(this).data('store-url'));
        $('#cancel-edit').show();
        $('html, body').animate({ scrollTop: $('.shoplaz-add-store-form').offset().top }, 500);
    });
    
    $('#cancel-edit').on('click', function() {
        $('#store_id').val('0');
        $('#platform').val('');
        $('#store_name').val('');
        $('#store_url').val('');
        $(this).hide();
    });
    
    // Handle delete
    $('.delete-store').on('click', function() {
        if (!confirm('Are you sure you want to delete this store?')) {
            return;
        }
        
        const storeId = $(this).data('store-id');
        const button = $(this);
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'shoplaz_delete_store',
                nonce: '<?php echo wp_create_nonce('shoplaz_reviews_admin_nonce'); ?>',
                store_id: storeId
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data.message);
                    location.reload();
                } else {
                    alert(response.data.message);
                }
            }
        });
    });
    
    // Handle sync
    $('#sync-reviews-btn').on('click', function() {
        if (!confirm('This will sync reviews from all active stores. Continue?')) {
            return;
        }
        
        const button = $(this);
        const originalText = button.text();
        
        button.prop('disabled', true).text('Syncing...');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'shoplaz_sync_reviews',
                nonce: '<?php echo wp_create_nonce('shoplaz_reviews_admin_nonce'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data.message);
                } else {
                    alert(response.data.message);
                }
                button.prop('disabled', false).text(originalText);
            },
            error: function() {
                alert('An error occurred during sync.');
                button.prop('disabled', false).text(originalText);
            }
        });
    });
});
</script>

