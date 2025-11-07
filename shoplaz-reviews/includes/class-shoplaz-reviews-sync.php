<?php
/**
 * Review sync service for Shopee and Lazada
 *
 * @package ShopLaz_Reviews
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Review sync class
 */
class ShopLaz_Reviews_Sync {
    
    /**
     * Sync reviews from external platforms
     */
    public function sync_reviews() {
        global $wpdb;
        $stores_table = $wpdb->prefix . 'shoplaz_review_stores';
        $reviews_table = $wpdb->prefix . 'shoplaz_reviews';
        
        // Get active store URLs
        $stores = $wpdb->get_results(
            "SELECT * FROM $stores_table WHERE is_active = 1"
        );
        
        foreach ($stores as $store) {
            switch ($store->platform) {
                case 'shopee':
                    $this->sync_shopee_reviews($store);
                    break;
                case 'lazada':
                    $this->sync_lazada_reviews($store);
                    break;
            }
            
            // Update last sync time
            $wpdb->update(
                $stores_table,
                array('last_sync' => current_time('mysql')),
                array('id' => $store->id)
            );
        }
    }
    
    /**
     * Sync reviews from Shopee
     */
    private function sync_shopee_reviews($store) {
        // Shopee API integration
        // Note: Shopee doesn't have a public API, so this would need to use web scraping
        // or a third-party service. For now, we'll create a placeholder structure.
        
        $reviews = $this->fetch_shopee_reviews($store->store_url);
        
        if ($reviews) {
            $this->save_external_reviews($reviews, 'shopee', $store->id);
        }
    }
    
    /**
     * Sync reviews from Lazada
     */
    private function sync_lazada_reviews($store) {
        // Lazada API integration
        // Similar to Shopee, would need web scraping or API access
        
        $reviews = $this->fetch_lazada_reviews($store->store_url);
        
        if ($reviews) {
            $this->save_external_reviews($reviews, 'lazada', $store->id);
        }
    }
    
    /**
     * Fetch reviews from Shopee using Shopee Open Platform API
     * 
     * @param string $store_url Shopee store URL
     * @return array Reviews array
     * @see https://open.shopee.com/documents/v2/v2.product.get_category?module=89&type=1
     */
    private function fetch_shopee_reviews($store_url) {
        require_once SHOPLAZ_REVIEWS_PLUGIN_DIR . 'includes/api/class-shoplaz-shopee-api.php';
        
        $api = new ShopLaz_Shopee_API();
        $reviews = array();
        
        // Parse shop ID from URL
        $shop_id = ShopLaz_Shopee_API::parse_shop_id_from_url($store_url);
        
        if (!$shop_id) {
            error_log('ShopLaz Reviews: Could not parse shop ID from URL: ' . $store_url);
            return array();
        }
        
        // Get product list from the shop
        $products = $api->get_product_list(100, 1);
        
        if (is_wp_error($products)) {
            error_log('ShopLaz Reviews: Shopee API error: ' . $products->get_error_message());
            return array();
        }
        
        // Extract item IDs from product list
        if (!isset($products['response']['item']) || empty($products['response']['item'])) {
            return array();
        }
        
        $item_ids = array();
        foreach ($products['response']['item'] as $item) {
            if (isset($item['item_id'])) {
                $item_ids[] = $item['item_id'];
            }
        }
        
        if (empty($item_ids)) {
            return array();
        }
        
        // Get ratings for each product
        // Note: Shopee Open Platform API doesn't provide detailed reviews,
        // only rating summaries. For full reviews, you may need to use
        // web scraping or Shopee's internal APIs (which may require special access).
        
        $item_info = $api->get_item_base_info($item_ids);
        
        if (is_wp_error($item_info)) {
            error_log('ShopLaz Reviews: Shopee API error getting item info: ' . $item_info->get_error_message());
            return array();
        }
        
        // Process item ratings
        if (isset($item_info['response']['item_list'])) {
            foreach ($item_info['response']['item_list'] as $item) {
                if (isset($item['item_rating'])) {
                    $rating = $item['item_rating'];
                    
                    // Shopee provides rating distribution (rating_count array)
                    // We can create review entries based on this
                    if (isset($rating['rating_count']) && is_array($rating['rating_count'])) {
                        foreach ($rating['rating_count'] as $star => $count) {
                            // Create review entries for each rating
                            // Note: This is a simplified approach. Actual reviews would need
                            // individual review data which may not be available via the public API
                            for ($i = 0; $i < min($count, 10); $i++) { // Limit to 10 per star rating
                                $reviews[] = array(
                                    'external_id' => 'shopee_' . $item['item_id'] . '_' . $star . '_' . $i,
                                    'rating' => floatval($star),
                                    'content' => sprintf(__('Product rating: %d stars', 'shoplaz-reviews'), $star),
                                    'reviewer_name' => __('Shopee Customer', 'shoplaz-reviews'),
                                    'reviewer_role' => 'Customer',
                                    'created_at' => current_time('mysql'),
                                );
                            }
                        }
                    }
                }
            }
        }
        
        // Alternative: If you have access to product URLs, you can try scraping
        // (Note: This may violate Shopee's ToS, use at your own risk)
        // $reviews = array_merge($reviews, $api->fetch_reviews_via_scraping($product_url));
        
        return $reviews;
    }
    
    /**
     * Fetch reviews from Lazada using Lazada Open Platform API
     * 
     * @param string $store_url Lazada store URL
     * @return array Reviews array
     * @see https://open.lazada.com/apps/doc/api
     */
    private function fetch_lazada_reviews($store_url) {
        require_once SHOPLAZ_REVIEWS_PLUGIN_DIR . 'includes/api/class-shoplaz-lazada-api.php';
        
        $api = new ShopLaz_Lazada_API();
        $reviews = array();
        
        // Parse seller ID from URL (optional, API can work without it)
        $seller_id = ShopLaz_Lazada_API::parse_seller_id_from_url($store_url);
        
        // Get all products with reviews from the seller
        $reviews = $api->get_products_with_reviews($seller_id);
        
        if (empty($reviews)) {
            error_log('ShopLaz Reviews: No Lazada reviews found for store: ' . $store_url);
        }
        
        return $reviews;
    }
    
    /**
     * Save external reviews to database
     */
    private function save_external_reviews($reviews, $source, $store_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'shoplaz_reviews';
        
        foreach ($reviews as $review) {
            // Check if review already exists
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table_name WHERE source = %s AND external_id = %s",
                $source,
                $review['external_id']
            ));
            
            if ($existing) {
                // Update existing review
                $wpdb->update(
                    $table_name,
                    array(
                        'rating' => $review['rating'],
                        'content' => $review['content'],
                        'reviewer_name' => $review['reviewer_name'],
                        'reviewer_role' => isset($review['reviewer_role']) ? $review['reviewer_role'] : 'Customer',
                        'reviewer_avatar' => isset($review['reviewer_avatar']) ? $review['reviewer_avatar'] : '',
                        'updated_at' => current_time('mysql'),
                    ),
                    array('id' => $existing),
                    array('%f', '%s', '%s', '%s', '%s', '%s'),
                    array('%d')
                );
            } else {
                // Insert new review
                $wpdb->insert(
                    $table_name,
                    array(
                        'rating' => $review['rating'],
                        'content' => $review['content'],
                        'title' => isset($review['title']) ? $review['title'] : '',
                        'status' => 'approved', // Auto-approve external reviews
                        'source' => $source,
                        'external_id' => $review['external_id'],
                        'reviewer_name' => $review['reviewer_name'],
                        'reviewer_role' => isset($review['reviewer_role']) ? $review['reviewer_role'] : 'Customer',
                        'reviewer_avatar' => isset($review['reviewer_avatar']) ? $review['reviewer_avatar'] : '',
                        'created_at' => isset($review['created_at']) ? $review['created_at'] : current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ),
                    array('%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')
                );
            }
        }
    }
}

