$(document).ready(function() {
    // Бургер-меню
    $('#burgerBtn').click(function() {
        $(this).toggleClass('active');
        $('#navMenu').toggleClass('active');
    });

    // Закрытие меню при клике на ссылку
    $('.nav-list a').click(function() {
        $('#burgerBtn').removeClass('active');
        $('#navMenu').removeClass('active');
    });

    // Инициализация Owl Carousel ТОЛЬКО для главной страницы
    if ($('#developerCarousel').length) {
        $('#developerCarousel').owlCarousel({
            loop: true,
            margin: 20,
            nav: false,
            dots: true,
            autoplay: true,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            center: true,
            items: 3,
            responsive: {
                0: {
                    items: 1,
                    center: false
                },
                600: {
                    items: 2,
                    center: true
                },
                1000: {
                    items: 3,
                    center: true
                }
            }
        });
    }

    // УПРАВЛЕНИЕ С КЛАВИАТУРЫ (для карусели на главной)
    $(document).keydown(function(e) {
        if ($('#developerCarousel').length) {
            if (e.keyCode === 37) { // Левая стрелка
                $('#developerCarousel').trigger('prev.owl.carousel');
                e.preventDefault();
            }
            else if (e.keyCode === 39) { // Правая стрелка
                $('#developerCarousel').trigger('next.owl.carousel');
                e.preventDefault();
            }
        }
    });
});