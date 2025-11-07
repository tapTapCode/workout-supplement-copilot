<?php
/**
 * Shopee Open Platform API Client
 *
 * @package ShopLaz_Reviews
 * @see https://open.shopee.com/documents/v2/v2.product.get_category?module=89&type=1
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shopee API Client class
 */
class ShopLaz_Shopee_API {
    
    private $partner_id;
    private $partner_key;
    private $shop_id;
    private $base_url;
    private $access_token;
    
    /**
     * Constructor
     */
    public function __construct($partner_id = null, $partner_key = null, $shop_id = null, $access_token = null) {
        $this->partner_id = $partner_id ?: get_option('shoplaz_shopee_partner_id', '');
        $this->partner_key = $partner_key ?: get_option('shoplaz_shopee_partner_key', '');
        $this->shop_id = $shop_id ?: get_option('shoplaz_shopee_shop_id', '');
        $this->access_token = $access_token ?: get_option('shoplaz_shopee_access_token', '');
        
        // Determine base URL based on region (default: Singapore)
        $region = get_option('shoplaz_shopee_region', 'sg');
        $this->base_url = 'https://partner.shopeemobile.com/api/v2';
        
        // Alternative base URLs for different regions:
        // 'https://partner.shopeemobile.com/api/v2' (Singapore)
        // 'https://partner.shopeemobile.com/api/v2' (Malaysia)
        // etc.
    }
    
    /**
     * Generate API signature
     * 
     * @param string $path API path
     * @param int $timestamp Timestamp
     * @param array $params Request parameters
     * @return string Signature
     */
    private function generate_signature($path, $timestamp, $params = array()) {
        $base_string = $this->partner_id . $path . $timestamp . $this->access_token;
        
        // Add parameters to base string if provided
        if (!empty($params)) {
            ksort($params);
            $query_string = http_build_query($params);
            $base_string .= $query_string;
        }
        
        return hash_hmac('sha256', $base_string, $this->partner_key);
    }
    
    /**
     * Make API request
     * 
     * @param string $path API endpoint path
     * @param array $params Request parameters
     * @param string $method HTTP method (GET or POST)
     * @return array|WP_Error API response
     */
    public function request($path, $params = array(), $method = 'GET') {
        if (empty($this->partner_id) || empty($this->partner_key)) {
            return new WP_Error('missing_credentials', __('Shopee API credentials not configured.', 'shoplaz-reviews'));
        }
        
        $timestamp = time();
        $signature = $this->generate_signature($path, $timestamp, $params);
        
        // Build request URL
        $url = $this->base_url . $path;
        
        // Add required parameters
        $request_params = array_merge($params, array(
            'partner_id' => $this->partner_id,
            'timestamp' => $timestamp,
            'sign' => $signature,
        ));
        
        // Add shop_id and access_token if available
        if (!empty($this->shop_id)) {
            $request_params['shop_id'] = $this->shop_id;
        }
        if (!empty($this->access_token)) {
            $request_params['access_token'] = $this->access_token;
        }
        
        // Make HTTP request
        $args = array(
            'method' => $method,
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
        );
        
        if ($method === 'GET') {
            $url = add_query_arg($request_params, $url);
            $response = wp_remote_get($url, $args);
        } else {
            $args['body'] = json_encode($request_params);
            $response = wp_remote_post($url, $args);
        }
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Check for API errors
        if (isset($data['error']) && !empty($data['error'])) {
            return new WP_Error('shopee_api_error', $data['error'], $data);
        }
        
        return $data;
    }
    
    /**
     * Get shop information
     * 
     * @return array|WP_Error Shop information
     */
    public function get_shop_info() {
        return $this->request('/shop/get_shop_info');
    }
    
    /**
     * Get product list
     * 
     * @param int $page_size Number of items per page
     * @param int $page_no Page number
     * @return array|WP_Error Product list
     */
    public function get_product_list($page_size = 100, $page_no = 1) {
        return $this->request('/product/get_item_list', array(
            'page_size' => $page_size,
            'page_no' => $page_no,
        ));
    }
    
    /**
     * Get product base info
     * 
     * @param array $item_id_list List of item IDs
     * @return array|WP_Error Product information
     */
    public function get_item_base_info($item_id_list) {
        return $this->request('/product/get_item_base_info', array(
            'item_id_list' => implode(',', $item_id_list),
        ));
    }
    
    /**
     * Get product reviews/ratings
     * 
     * Note: Shopee Open Platform API doesn't have a direct "get reviews" endpoint.
     * This method attempts to get rating information from product details.
     * For actual reviews, you may need to use web scraping or Shopee's internal APIs.
     * 
     * @param int $item_id Product item ID
     * @return array|WP_Error Reviews/ratings data
     */
    public function get_item_ratings($item_id) {
        // Get item base info which includes rating information
        $item_info = $this->get_item_base_info(array($item_id));
        
        if (is_wp_error($item_info)) {
            return $item_info;
        }
        
        // Extract rating information if available
        if (isset($item_info['response']['item_list'][0])) {
            $item = $item_info['response']['item_list'][0];
            return array(
                'item_id' => $item_id,
                'rating_star' => isset($item['item_rating']['rating_star']) ? $item['item_rating']['rating_star'] : 0,
                'rating_count' => isset($item['item_rating']['rating_count']) ? $item['item_rating']['rating_count'] : array(),
            );
        }
        
        return new WP_Error('no_data', __('No rating data found for this product.', 'shoplaz-reviews'));
    }
    
    /**
     * Parse shop ID from store URL
     * 
     * @param string $store_url Shopee store URL
     * @return int|false Shop ID or false on failure
     */
    public static function parse_shop_id_from_url($store_url) {
        // Shopee store URLs typically look like:
        // https://shopee.sg/shop/12345678
        // https://shopee.sg/shop/username-12345678
        
        $pattern = '/shopee\.(sg|my|ph|th|vn|id|tw|br|mx|co|cl|pl|es|ar|co\.uk|fr|de|it|nl|at|be|cz|dk|fi|gr|hu|ie|no|pt|ro|se|ch|tr)\/shop\/(\d+)/i';
        
        if (preg_match($pattern, $store_url, $matches)) {
            return intval($matches[2]);
        }
        
        return false;
    }
    
    /**
     * Fetch reviews using web scraping (fallback method)
     * 
     * Since Shopee Open Platform API doesn't provide direct review access,
     * this method can be used to scrape reviews from product pages.
     * 
     * @param string $product_url Product URL
     * @return array Reviews array
     */
    public function fetch_reviews_via_scraping($product_url) {
        // This would require implementing web scraping
        // Note: Web scraping may violate Shopee's Terms of Service
        // Consider using official APIs or third-party services instead
        
        $response = wp_remote_get($product_url, array(
            'timeout' => 30,
            'headers' => array(
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ),
        ));
        
        if (is_wp_error($response)) {
            return array();
        }
        
        $body = wp_remote_retrieve_body($response);
        
        // Parse reviews from HTML (this is a simplified example)
        // In production, you'd need proper HTML parsing with DOMDocument or similar
        $reviews = array();
        
        // Extract reviews using regex (not recommended for production)
        // Better to use DOMDocument or a proper HTML parser
        preg_match_all('/"rating_star":(\d+),.*?"comment":"([^"]+)",.*?"username":"([^"]+)"/', $body, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $index => $match) {
            $reviews[] = array(
                'external_id' => 'shopee_' . md5($product_url . $index),
                'rating' => floatval($match[1]),
                'content' => stripslashes($match[2]),
                'reviewer_name' => stripslashes($match[3]),
                'reviewer_role' => 'Customer',
                'created_at' => current_time('mysql'),
            );
        }
        
        return $reviews;
    }
}

