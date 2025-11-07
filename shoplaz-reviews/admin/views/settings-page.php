<?php
/**
 * Settings page view
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
    
    <form method="post" action="options.php">
        <?php settings_fields('shoplaz_reviews_settings'); ?>
        
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="shoplaz_reviews_require_approval">
                        <?php _e('Require Approval', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="checkbox" 
                           id="shoplaz_reviews_require_approval" 
                           name="shoplaz_reviews_require_approval" 
                           value="1" 
                           <?php checked(get_option('shoplaz_reviews_require_approval', true)); ?> />
                    <p class="description">
                        <?php _e('Reviews must be approved before being displayed.', 'shoplaz-reviews'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_reviews_allow_anonymous">
                        <?php _e('Allow Anonymous Reviews', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="checkbox" 
                           id="shoplaz_reviews_allow_anonymous" 
                           name="shoplaz_reviews_allow_anonymous" 
                           value="1" 
                           <?php checked(get_option('shoplaz_reviews_allow_anonymous', false)); ?> />
                    <p class="description">
                        <?php _e('Allow non-logged-in users to submit reviews.', 'shoplaz-reviews'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_reviews_min_rating">
                        <?php _e('Minimum Rating', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="number" 
                           id="shoplaz_reviews_min_rating" 
                           name="shoplaz_reviews_min_rating" 
                           value="<?php echo esc_attr(get_option('shoplaz_reviews_min_rating', 1)); ?>" 
                           min="1" 
                           max="5" />
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_reviews_max_rating">
                        <?php _e('Maximum Rating', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="number" 
                           id="shoplaz_reviews_max_rating" 
                           name="shoplaz_reviews_max_rating" 
                           value="<?php echo esc_attr(get_option('shoplaz_reviews_max_rating', 5)); ?>" 
                           min="1" 
                           max="5" />
                </td>
            </tr>
        </table>
        
        <h2><?php _e('Shopee API Configuration', 'shoplaz-reviews'); ?></h2>
        <p class="description">
            <?php _e('Configure your Shopee Open Platform API credentials to fetch reviews automatically.', 'shoplaz-reviews'); ?>
            <a href="https://open.shopee.com/" target="_blank"><?php _e('Get API credentials', 'shoplaz-reviews'); ?></a>
        </p>
        
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="shoplaz_shopee_partner_id">
                        <?php _e('Partner ID', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="text" 
                           id="shoplaz_shopee_partner_id" 
                           name="shoplaz_shopee_partner_id" 
                           value="<?php echo esc_attr(get_option('shoplaz_shopee_partner_id', '')); ?>" 
                           class="regular-text" />
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_shopee_partner_key">
                        <?php _e('Partner Key', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="password" 
                           id="shoplaz_shopee_partner_key" 
                           name="shoplaz_shopee_partner_key" 
                           value="<?php echo esc_attr(get_option('shoplaz_shopee_partner_key', '')); ?>" 
                           class="regular-text" />
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_shopee_shop_id">
                        <?php _e('Shop ID', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="text" 
                           id="shoplaz_shopee_shop_id" 
                           name="shoplaz_shopee_shop_id" 
                           value="<?php echo esc_attr(get_option('shoplaz_shopee_shop_id', '')); ?>" 
                           class="regular-text" />
                    <p class="description">
                        <?php _e('Your Shopee shop ID (optional, can be extracted from store URL)', 'shoplaz-reviews'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_shopee_access_token">
                        <?php _e('Access Token', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="password" 
                           id="shoplaz_shopee_access_token" 
                           name="shoplaz_shopee_access_token" 
                           value="<?php echo esc_attr(get_option('shoplaz_shopee_access_token', '')); ?>" 
                           class="regular-text" />
                    <p class="description">
                        <?php _e('OAuth access token (required for authenticated endpoints)', 'shoplaz-reviews'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_shopee_region">
                        <?php _e('Region', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <select id="shoplaz_shopee_region" name="shoplaz_shopee_region">
                        <option value="sg" <?php selected(get_option('shoplaz_shopee_region', 'sg'), 'sg'); ?>>Singapore</option>
                        <option value="my" <?php selected(get_option('shoplaz_shopee_region', 'sg'), 'my'); ?>>Malaysia</option>
                        <option value="ph" <?php selected(get_option('shoplaz_shopee_region', 'sg'), 'ph'); ?>>Philippines</option>
                        <option value="th" <?php selected(get_option('shoplaz_shopee_region', 'sg'), 'th'); ?>>Thailand</option>
                        <option value="vn" <?php selected(get_option('shoplaz_shopee_region', 'sg'), 'vn'); ?>>Vietnam</option>
                        <option value="id" <?php selected(get_option('shoplaz_shopee_region', 'sg'), 'id'); ?>>Indonesia</option>
                        <option value="tw" <?php selected(get_option('shoplaz_shopee_region', 'sg'), 'tw'); ?>>Taiwan</option>
                    </select>
                </td>
            </tr>
        </table>
        
        <h2><?php _e('Lazada API Configuration', 'shoplaz-reviews'); ?></h2>
        <p class="description">
            <?php _e('Configure your Lazada Open Platform API credentials to fetch reviews automatically.', 'shoplaz-reviews'); ?>
            <a href="https://open.lazada.com/apps/doc/api" target="_blank"><?php _e('Get API credentials', 'shoplaz-reviews'); ?></a>
        </p>
        
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="shoplaz_lazada_app_key">
                        <?php _e('App Key', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="text" 
                           id="shoplaz_lazada_app_key" 
                           name="shoplaz_lazada_app_key" 
                           value="<?php echo esc_attr(get_option('shoplaz_lazada_app_key', '')); ?>" 
                           class="regular-text" />
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_lazada_app_secret">
                        <?php _e('App Secret', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="password" 
                           id="shoplaz_lazada_app_secret" 
                           name="shoplaz_lazada_app_secret" 
                           value="<?php echo esc_attr(get_option('shoplaz_lazada_app_secret', '')); ?>" 
                           class="regular-text" />
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_lazada_access_token">
                        <?php _e('Access Token', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="password" 
                           id="shoplaz_lazada_access_token" 
                           name="shoplaz_lazada_access_token" 
                           value="<?php echo esc_attr(get_option('shoplaz_lazada_access_token', '')); ?>" 
                           class="regular-text" />
                    <p class="description">
                        <?php _e('OAuth access token (required for authenticated endpoints)', 'shoplaz-reviews'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_lazada_user_id">
                        <?php _e('User ID', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <input type="text" 
                           id="shoplaz_lazada_user_id" 
                           name="shoplaz_lazada_user_id" 
                           value="<?php echo esc_attr(get_option('shoplaz_lazada_user_id', '')); ?>" 
                           class="regular-text" />
                    <p class="description">
                        <?php _e('Your Lazada seller user ID (optional, can be extracted from store URL)', 'shoplaz-reviews'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="shoplaz_lazada_region">
                        <?php _e('Region', 'shoplaz-reviews'); ?>
                    </label>
                </th>
                <td>
                    <select id="shoplaz_lazada_region" name="shoplaz_lazada_region">
                        <option value="sg" <?php selected(get_option('shoplaz_lazada_region', 'sg'), 'sg'); ?>>Singapore</option>
                        <option value="my" <?php selected(get_option('shoplaz_lazada_region', 'sg'), 'my'); ?>>Malaysia</option>
                        <option value="ph" <?php selected(get_option('shoplaz_lazada_region', 'sg'), 'ph'); ?>>Philippines</option>
                        <option value="th" <?php selected(get_option('shoplaz_lazada_region', 'sg'), 'th'); ?>>Thailand</option>
                        <option value="vn" <?php selected(get_option('shoplaz_lazada_region', 'sg'), 'vn'); ?>>Vietnam</option>
                        <option value="id" <?php selected(get_option('shoplaz_lazada_region', 'sg'), 'id'); ?>>Indonesia</option>
                    </select>
                </td>
            </tr>
        </table>
        
        <?php submit_button(); ?>
    </form>
</div>

