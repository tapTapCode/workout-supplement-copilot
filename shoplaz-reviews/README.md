# ShopLaz Reviews WordPress Plugin

A WordPress plugin for managing and displaying product reviews for ShopLaz.

## Features

- ✅ **Modern Review Display** - Beautiful layout with star breakdown and horizontal testimonial cards
- ✅ **Multi-Platform Integration** - Merge reviews from WordPress, Shopee, and Lazada
- ✅ **Store URL Management** - Admin page to add and manage Shopee/Lazada store URLs
- ✅ **Automatic Review Sync** - Scheduled hourly sync of reviews from external platforms
- ✅ **Star Rating System** - 1-5 star ratings with visual breakdown
- ✅ **Review Approval Workflow** - Approve/reject reviews before display
- ✅ **REST API Endpoints** - Full API for review management
- ✅ **WooCommerce Integration** - Display reviews on product pages
- ✅ **Shortcode Support** - Display reviews anywhere with `[shoplaz_reviews]`
- ✅ **AJAX Review Submission** - Submit reviews without page reload

## Installation

1. **Download or clone the plugin:**
   ```bash
   git clone https://github.com/tapTapCode/shoplaz-reviews.git
   ```

2. **Install to WordPress:**
   - Copy the `shoplaz-reviews` folder to your WordPress `wp-content/plugins/` directory
   - Or upload via WordPress admin: Plugins → Add New → Upload Plugin

3. **Activate the plugin:**
   - Go to WordPress admin → Plugins
   - Find "ShopLaz Reviews" and click "Activate"

## Configuration

1. Go to **Reviews → Settings** in WordPress admin
2. Configure the following options:
   - **Require Approval**: Reviews must be approved before display
   - **Allow Anonymous Reviews**: Allow non-logged-in users to submit reviews
   - **Minimum Rating**: Minimum star rating (default: 1)
   - **Maximum Rating**: Maximum star rating (default: 5)

## Usage

### Display Reviews

Reviews can be displayed in multiple ways:

1. **WooCommerce Product Pages** - Automatically displayed below product summary
2. **Shortcode** - Use `[shoplaz_reviews]` anywhere on your site
3. **Template Function** - Call `do_action('woocommerce_single_product_summary')` in your theme

### Configure Store URLs

1. Go to **Reviews → Store URLs** in WordPress admin
2. Click "Add New Store"
3. Select platform (Shopee or Lazada)
4. Enter your store URL
5. Click "Save Store"
6. Click "Sync Reviews Now" to fetch reviews immediately

Reviews will automatically sync every hour from all active stores.

### Submit Reviews

Users can submit reviews via:
- Frontend form on product pages
- REST API endpoint: `POST /wp-json/shoplaz-reviews/v1/reviews`

### REST API Endpoints

#### Get Reviews
```
GET /wp-json/shoplaz-reviews/v1/reviews?product_id=123&status=approved&per_page=10&page=1
```

#### Get Single Review
```
GET /wp-json/shoplaz-reviews/v1/reviews/{id}
```

#### Create Review
```
POST /wp-json/shoplaz-reviews/v1/reviews
Content-Type: application/json

{
  "product_id": 123,
  "rating": 5,
  "title": "Great product!",
  "content": "I love this product..."
}
```

## Database Schema

The plugin creates two tables:

### `wp_shoplaz_reviews` Table

- `id` - Review ID (primary key)
- `product_id` - Product ID (nullable for external reviews)
- `user_id` - User ID (0 for anonymous/external)
- `rating` - Star rating (1.0-5.0, decimal)
- `title` - Review title (nullable)
- `content` - Review content
- `status` - Review status (pending, approved, rejected)
- `verified_purchase` - Whether reviewer purchased the product
- `helpful_count` - Number of helpful votes
- `source` - Review source (wordpress, shopee, lazada)
- `external_id` - External review ID for deduplication
- `reviewer_name` - Reviewer's name
- `reviewer_role` - Reviewer's role (Customer, Developer, etc.)
- `reviewer_avatar` - Reviewer's avatar URL
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### `wp_shoplaz_review_stores` Table

- `id` - Store ID (primary key)
- `platform` - Platform name (shopee, lazada)
- `store_url` - Store URL
- `store_name` - Store name (optional)
- `is_active` - Whether store is active
- `last_sync` - Last sync timestamp
- `sync_interval` - Sync interval in seconds (default: 3600)
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

## Development

### File Structure

```
shoplaz-reviews/
├── shoplaz-reviews.php          # Main plugin file
├── uninstall.php                 # Uninstall handler
├── LICENSE                       # MIT License
├── CHANGELOG.md                  # Version history
├── README.md                     # This file
├── .gitignore                    # Git ignore rules
├── includes/                     # Core classes
│   ├── class-shoplaz-reviews-admin.php
│   ├── class-shoplaz-reviews-frontend.php
│   ├── class-shoplaz-reviews-api.php
│   ├── class-shoplaz-reviews-sync.php
│   └── api/                      # API client classes
│       ├── class-shoplaz-shopee-api.php
│       └── class-shoplaz-lazada-api.php
├── admin/                        # Admin interface
│   └── views/
│       ├── admin-page.php
│       ├── settings-page.php
│       └── stores-page.php
├── public/                       # Frontend templates
│   └── views/
│       └── reviews-display.php
├── assets/                       # CSS and JavaScript
│   ├── css/
│   │   ├── admin.css
│   │   └── frontend.css
│   └── js/
│       ├── admin.js
│       └── frontend.js
└── languages/                    # Translation files
    └── shoplaz-reviews.pot       # Translation template
```

### Hooks and Filters

#### Actions
- `shoplaz_reviews_before_display` - Before displaying reviews
- `shoplaz_reviews_after_display` - After displaying reviews
- `shoplaz_reviews_before_submit` - Before submitting review
- `shoplaz_reviews_after_submit` - After submitting review

#### Filters
- `shoplaz_reviews_query_args` - Modify review query arguments
- `shoplaz_reviews_display_args` - Modify review display arguments

## Requirements

- WordPress 5.8+
- PHP 7.4+
- WooCommerce (optional, for product integration)

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub:
https://github.com/tapTapCode/shoplaz-reviews/issues

## Changelog

### 1.0.0
- Initial release
- Basic review management
- REST API endpoints
- WooCommerce integration
- Admin dashboard

