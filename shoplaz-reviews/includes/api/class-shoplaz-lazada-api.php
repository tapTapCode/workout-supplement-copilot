<?php
/**
 * Lazada Open Platform API Client
 *
 * @package ShopLaz_Reviews
 * @see https://open.lazada.com/apps/doc/api
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Lazada API Client class
 */
class ShopLaz_Lazada_API {
    
    private $app_key;
    private $app_secret;
    private $access_token;
    private $user_id;
    private $base_url;
    private $api_version = '1.0';
    
    /**
     * Constructor
     */
    public function __construct($app_key = null, $app_secret = null, $access_token = null, $user_id = null) {
        $this->app_key = $app_key ?: get_option('shoplaz_lazada_app_key', '');
        $this->app_secret = $app_secret ?: get_option('shoplaz_lazada_app_secret', '');
        $this->access_token = $access_token ?: get_option('shoplaz_lazada_access_token', '');
        $this->user_id = $user_id ?: get_option('shoplaz_lazada_user_id', '');
        
        // Determine base URL based on region (default: Singapore)
        $region = get_option('shoplaz_lazada_region', 'sg');
        $this->base_url = $this->get_api_url($region);
    }
    
    /**
     * Get API URL based on region
     * 
     * @param string $region Region code
     * @return string API base URL
     */
    private function get_api_url($region) {
        $urls = array(
            'sg' => 'https://api.lazada.sg/rest',
            'my' => 'https://api.lazada.com.my/rest',
            'ph' => 'https://api.lazada.com.ph/rest',
            'th' => 'https://api.lazada.co.th/rest',
            'vn' => 'https://api.lazada.vn/rest',
            'id' => 'https://api.lazada.co.id/rest',
        );
        
        return isset($urls[$region]) ? $urls[$region] : $urls['sg'];
    }
    
    /**
     * Generate API signature
     * 
     * @param array $params Request parameters
     * @return string Signature
     */
    private function generate_signature($params) {
        // Sort parameters
        ksort($params);
        
        // Build query string
        $query_string = '';
        foreach ($params as $key => $value) {
            if ($key !== 'sign' && $key !== 'sign_method') {
                $query_string .= $key . $value;
            }
        }
        
        // Add app secret
        $query_string = $this->app_secret . $query_string;
        
        // Generate signature
        return strtoupper(md5($query_string));
    }
    
    /**
     * Make API request
     * 
     * @param string $method API method name
     * @param array $params Request parameters
     * @param string $http_method HTTP method (GET or POST)
     * @return array|WP_Error API response
     */
    public function request($method, $params = array(), $http_method = 'GET') {
        if (empty($this->app_key) || empty($this->app_secret)) {
            return new WP_Error('missing_credentials', __('Lazada API credentials not configured.', 'shoplaz-reviews'));
        }
        
        // Build base parameters
        $request_params = array_merge($params, array(
            'app_key' => $this->app_key,
            'access_token' => $this->access_token,
            'timestamp' => time() . '000', // Milliseconds
            'sign_method' => 'md5',
            'format' => 'JSON',
        ));
        
        // Add method
        $request_params['method'] = $method;
        
        // Generate signature
        $signature = $this->generate_signature($request_params);
        $request_params['sign'] = $signature;
        
        // Build request URL
        $url = $this->base_url;
        
        // Make HTTP request
        $args = array(
            'method' => $http_method,
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/x-www-form-urlencoded',
            ),
        );
        
        if ($http_method === 'GET') {
            $url = add_query_arg($request_params, $url);
            $response = wp_remote_get($url, $args);
        } else {
            $args['body'] = $request_params;
            $response = wp_remote_post($url, $args);
        }
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Check for API errors
        if (isset($data['code']) && $data['code'] !== '0') {
            $error_msg = isset($data['message']) ? $data['message'] : __('Lazada API error', 'shoplaz-reviews');
            return new WP_Error('lazada_api_error', $error_msg, $data);
        }
        
        return $data;
    }
    
    /**
     * Get seller information
     * 
     * @return array|WP_Error Seller information
     */
    public function get_seller() {
        return $this->request('seller/get');
    }
    
    /**
     * Get product list
     * 
     * @param int $offset Offset
     * @param int $limit Limit
     * @param string $status Product status (active, inactive, deleted, image-missing)
     * @return array|WP_Error Product list
     */
    public function get_products($offset = 0, $limit = 100, $status = 'active') {
        return $this->request('products/get', array(
            'offset' => $offset,
            'limit' => $limit,
            'filter' => $status,
        ));
    }
    
    /**
     * Get product item
     * 
     * @param int $item_id Product item ID
     * @return array|WP_Error Product information
     */
    public function get_product($item_id) {
        return $this->request('product/get', array(
            'item_id' => $item_id,
        ));
    }
    
    /**
     * Get product reviews/ratings
     * 
     * Lazada API endpoint: /review/list
     * 
     * @param int $item_id Product item ID
     * @param int $page_size Number of reviews per page
     * @param int $current_page Page number
     * @return array|WP_Error Reviews data
     */
    public function get_reviews($item_id, $page_size = 20, $current_page = 1) {
        return $this->request('review/list', array(
            'item_id' => $item_id,
            'page_size' => $page_size,
            'current_page' => $current_page,
        ));
    }
    
    /**
     * Get all reviews for a product (paginated)
     * 
     * @param int $item_id Product item ID
     * @param int $max_pages Maximum pages to fetch
     * @return array All reviews
     */
    public function get_all_reviews($item_id, $max_pages = 10) {
        $all_reviews = array();
        $current_page = 1;
        
        while ($current_page <= $max_pages) {
            $response = $this->get_reviews($item_id, 20, $current_page);
            
            if (is_wp_error($response)) {
                break;
            }
            
            if (isset($response['data']['reviews']) && !empty($response['data']['reviews'])) {
                $all_reviews = array_merge($all_reviews, $response['data']['reviews']);
                
                // Check if there are more pages
                if (isset($response['data']['total']) && count($all_reviews) >= $response['data']['total']) {
                    break;
                }
                
                $current_page++;
            } else {
                break;
            }
        }
        
        return $all_reviews;
    }
    
    /**
     * Parse seller ID from store URL
     * 
     * @param string $store_url Lazada store URL
     * @return int|false Seller ID or false on failure
     */
    public static function parse_seller_id_from_url($store_url) {
        // Lazada store URLs typically look like:
        // https://www.lazada.sg/shop/12345678
        // https://www.lazada.sg/shop/username
        
        $pattern = '/lazada\.(sg|my|ph|th|vn|id)\/shop\/(\d+)/i';
        
        if (preg_match($pattern, $store_url, $matches)) {
            return intval($matches[2]);
        }
        
        return false;
    }
    
    /**
     * Get all products from seller and their reviews
     * 
     * @param int $seller_id Seller ID (optional, uses configured user_id if not provided)
     * @return array Products with reviews
     */
    public function get_products_with_reviews($seller_id = null) {
        $seller_id = $seller_id ?: $this->user_id;
        
        if (empty($seller_id)) {
            return array();
        }
        
        $all_reviews = array();
        $offset = 0;
        $limit = 100;
        
        // Get all products
        do {
            $products_response = $this->get_products($offset, $limit);
            
            if (is_wp_error($products_response)) {
                break;
            }
            
            if (!isset($products_response['data']['products']) || empty($products_response['data']['products'])) {
                break;
            }
            
            $products = $products_response['data']['products'];
            
            // Get reviews for each product
            foreach ($products as $product) {
                if (isset($product['item_id'])) {
                    $item_id = $product['item_id'];
                    $reviews = $this->get_all_reviews($item_id, 5); // Max 5 pages per product
                    
                    foreach ($reviews as $review) {
                        $all_reviews[] = array(
                            'external_id' => 'lazada_' . $item_id . '_' . (isset($review['review_id']) ? $review['review_id'] : uniqid()),
                            'rating' => isset($review['rating']) ? floatval($review['rating']) : 5.0,
                            'content' => isset($review['review_content']) ? $review['review_content'] : '',
                            'title' => isset($review['review_title']) ? $review['review_title'] : '',
                            'reviewer_name' => isset($review['buyer_name']) ? $review['buyer_name'] : __('Lazada Customer', 'shoplaz-reviews'),
                            'reviewer_role' => 'Customer',
                            'reviewer_avatar' => isset($review['buyer_avatar']) ? $review['buyer_avatar'] : '',
                            'created_at' => isset($review['created_time']) ? date('Y-m-d H:i:s', $review['created_time']) : current_time('mysql'),
                        );
                    }
                }
            }
            
            // Check if there are more products
            if (count($products) < $limit) {
                break;
            }
            
            $offset += $limit;
        } while (true);
        
        return $all_reviews;
    }
}

