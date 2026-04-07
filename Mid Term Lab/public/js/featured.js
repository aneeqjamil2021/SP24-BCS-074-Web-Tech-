$(document).ready(function () {

    /* =========================================================
       1. AJAX — fetch 4 products from FakeStore API
       ========================================================= */
    $.ajax({
        url: 'https://fakestoreapi.com/products?limit=4',
        method: 'GET',
        dataType: 'json',
        timeout: 8000,

        success: function (products) {
            renderFeaturedProducts(products);
        },

        error: function () {
            $('#featured-products').hide();
            $('#featured-error').show();
        }
    });

    /* =========================================================
       2. DOM Manipulation — build and inject product cards
       ========================================================= */
    function renderFeaturedProducts(products) {
        var $container = $('#featured-products');
        $container.empty(); // clear skeleton cards

        $.each(products, function (index, product) {
            // Generate a fake "old price" ~20-40% higher than current
            var discount   = (Math.random() * 0.2 + 0.2).toFixed(2);
            var oldPrice   = (product.price / (1 - discount)).toFixed(2);
            var starsHtml  = buildStars(product.rating.rate);
            // Truncate long titles for the card
            var shortTitle = product.title.length > 60
                ? product.title.substring(0, 57) + '…'
                : product.title;

            var $card = $(
                '<div class="product featured-product" ' +
                    'data-id="'    + product.id          + '" ' +
                    'data-title="' + escAttr(product.title)       + '" ' +
                    'data-desc="'  + escAttr(product.description) + '" ' +
                    'data-price="' + product.price        + '" ' +
                    'data-img="'   + escAttr(product.image)       + '" ' +
                    'data-cat="'   + escAttr(product.category)    + '" ' +
                    'data-rate="'  + product.rating.rate  + '" ' +
                    'data-count="' + product.rating.count + '">' +

                    '<div class="product-img-box">' +
                        '<span class="heart-icon">♡</span>' +
                        '<img src="' + escAttr(product.image) + '" alt="' + escAttr(shortTitle) + '" loading="lazy">' +
                        '<button class="btn-quick-view">Quick View</button>' +
                    '</div>' +

                    '<div class="product-info">' +
                        '<p class="product-title">' + escHtml(shortTitle) + '</p>' +
                        '<div class="product-rating-row">' +
                            '<span class="stars">' + starsHtml + '</span>' +
                            '<span class="rating-count">(' + product.rating.count + ')</span>' +
                        '</div>' +
                        '<div class="price-container">' +
                            '<span class="current-price">$' + product.price.toFixed(2) + '</span>' +
                            '<span class="old-price">$' + oldPrice + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );

            $container.append($card);
        });
    }

    /* =========================================================
       3. Quick View modal — open on button click
       ========================================================= */
    // Event delegation — works for dynamically injected cards
    $('#featured-products').on('click', '.btn-quick-view', function (e) {
        e.stopPropagation();
        var $card = $(this).closest('.product');

        $('#modal-img').attr('src', $card.data('img')).attr('alt', $card.data('title'));
        $('#modal-title').text($card.data('title'));
        $('#modal-desc').text($card.data('desc'));
        $('#modal-price').text('$' + parseFloat($card.data('price')).toFixed(2));
        $('#modal-category').text(capitalise($card.data('cat')));
        $('#modal-stars').html(buildStars($card.data('rate')));
        $('#modal-rating-count').text($card.data('rate') + ' / 5  (' + $card.data('count') + ' reviews)');

        openModal();
    });

    // Close via × button
    $('#modal-close').on('click', closeModal);

    // Close by clicking the dark backdrop
    $('#quick-view-modal').on('click', function (e) {
        if ($(e.target).is('#quick-view-modal')) closeModal();
    });

    // Close with Escape key
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    function openModal() {
        $('#quick-view-modal').addClass('active');
        $('body').addClass('modal-open');
    }

    function closeModal() {
        $('#quick-view-modal').removeClass('active');
        $('body').removeClass('modal-open');
    }

    /* =========================================================
       Helpers
       ========================================================= */
    function buildStars(rate) {
        var full  = Math.floor(rate);
        var half  = (rate - full) >= 0.4 ? 1 : 0;
        var empty = 5 - full - half;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    }

    function capitalise(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    // Prevent XSS when building HTML strings
    function escHtml(str) {
        return $('<div>').text(String(str)).html();
    }

    function escAttr(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
});
