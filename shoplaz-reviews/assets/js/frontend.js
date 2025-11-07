/**
 * Frontend JavaScript for ShopLaz Reviews
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Testimonials carousel scroll
        const scrollContainer = $('#testimonials-scroll');
        const scrollLeftBtn = $('#scroll-left');
        const scrollRightBtn = $('#scroll-right');
        const cardWidth = 350 + 24; // card width + gap
        
        if (scrollLeftBtn.length && scrollRightBtn.length) {
            scrollLeftBtn.on('click', function() {
                scrollContainer.animate({
                    scrollLeft: scrollContainer.scrollLeft() - cardWidth
                }, 300);
            });
            
            scrollRightBtn.on('click', function() {
                scrollContainer.animate({
                    scrollLeft: scrollContainer.scrollLeft() + cardWidth
                }, 300);
            });
            
            // Show/hide arrows based on scroll position
            scrollContainer.on('scroll', function() {
                const scrollLeft = $(this).scrollLeft();
                const scrollWidth = $(this)[0].scrollWidth;
                const clientWidth = $(this)[0].clientWidth;
                
                scrollLeftBtn.toggle(scrollLeft > 0);
                scrollRightBtn.toggle(scrollLeft < scrollWidth - clientWidth - 10);
            });
            
            // Initial check
            scrollContainer.trigger('scroll');
        }
        
        // Handle review form submission (if form exists)
        $('#shoplaz-review-form').on('submit', function(e) {
            e.preventDefault();
            
            const form = $(this);
            const submitButton = form.find('button[type="submit"]');
            const originalText = submitButton.text();
            
            // Disable submit button
            submitButton.prop('disabled', true).text('Submitting...');
            
            // Get form data
            const formData = {
                action: 'shoplaz_submit_review',
                product_id: form.find('input[name="product_id"]').val(),
                rating: form.find('select[name="rating"]').val(),
                title: form.find('input[name="title"]').val(),
                content: form.find('textarea[name="content"]').val(),
                nonce: form.find('input[name="nonce"]').val()
            };
            
            // Submit via AJAX
            $.ajax({
                url: shoplazReviews.ajaxUrl,
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        // Show success message
                        form.before('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                        
                        // Reset form
                        form[0].reset();
                        
                        // Reload page after 2 seconds to show new review
                        setTimeout(function() {
                            location.reload();
                        }, 2000);
                    } else {
                        // Show error message
                        form.before('<div class="notice notice-error"><p>' + response.data.message + '</p></div>');
                        submitButton.prop('disabled', false).text(originalText);
                    }
                },
                error: function() {
                    form.before('<div class="notice notice-error"><p>An error occurred. Please try again.</p></div>');
                    submitButton.prop('disabled', false).text(originalText);
                }
            });
        });
    });
})(jQuery);

